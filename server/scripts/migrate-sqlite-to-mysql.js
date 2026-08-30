/**
 * migrate-sqlite-to-mysql.js
 *
 * Reads an old SQLite database (using sql.js — pure JS, no native build tools)
 * and migrates all data into the MySQL database.
 *
 * USAGE:
 *   1. Place your old database.sqlite at the path from DATABASE_PATH env var
 *      or at the default:  server/data/database.sqlite
 *   2. Ensure .env has DB_* vars pointing to a running MySQL server
 *   3. cd server && node scripts/migrate-sqlite-to-mysql.js
 *
 * The script is IDEMPOTENT — safe to re-run if something fails mid-way.
 */

import 'dotenv/config';
import initSqlJs from 'sql.js';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SQLITE_PATH =
  process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'telegram_drive',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  charset: 'utf8mb4',
};

let ssl = undefined;
if (process.env.DB_SSL === 'true') {
  ssl = { rejectUnauthorized: true };
  if (process.env.DB_CA_PATH) {
    try {
      ssl.ca = fs.readFileSync(process.env.DB_CA_PATH);
    } catch (err) {
      console.warn(`Failed to read CA file at ${process.env.DB_CA_PATH}: ${err.message}`);
    }
  } else if ((process.env.DB_HOST || '').endsWith('.tidbcloud.com')) {
    console.warn('DB_CA_PATH is not set for TiDB Cloud. Falling back to non-strict TLS so the migration can run.');
    ssl = { rejectUnauthorized: false };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function elapsed(start) {
  const sec = ((Date.now() - start) / 1000).toFixed(1);
  return `${sec}s`;
}

// ---------------------------------------------------------------------------
// Step 1 — Load SQLite
// ---------------------------------------------------------------------------

function loadSQLite() {
  if (!fs.existsSync(SQLITE_PATH)) {
    console.log(`\n  SQLite file not found at: ${SQLITE_PATH}`);
    console.log('  Nothing to migrate. Exiting.');
    process.exit(0);
  }

  const buffer = fs.readFileSync(SQLITE_PATH);
  const size = fs.statSync(SQLITE_PATH).size;
  console.log(`\n  SQLite file     : ${SQLITE_PATH} (${formatBytes(size)})`);
  return buffer;
}

// ---------------------------------------------------------------------------
// Step 2 — Connect to MySQL
// ---------------------------------------------------------------------------

async function connectMySQL() {
  const pool = mysql.createPool({ ...DB_CONFIG, ssl, waitForConnections: true, connectionLimit: 5 });

  const [rows] = await pool.query('SELECT 1 AS ok');
  console.log(`  MySQL server    : ${rows[0].ok === 1 ? 'connected' : 'FAILED'}`);

  // Show existing tables
  const [tables] = await pool.query("SHOW TABLES");
  const names = tables.map(r => Object.values(r)[0]);
  console.log(`  MySQL tables    : ${names.length ? names.join(', ') : '(none — will be created)'}`);

  return pool;
}

// ---------------------------------------------------------------------------
// Step 3 — Ensure MySQL schema (idempotent)
// ---------------------------------------------------------------------------

async function ensureMySQLSchema(pool) {
  const { initializeDatabase } = await import('../src/config/database.js');
  await initializeDatabase();
  console.log(`  MySQL schema    : ready\n`);
}

// ---------------------------------------------------------------------------
// Step 4 — Read all rows from a SQLite table
// ---------------------------------------------------------------------------

function readTable(db, tableName) {
  const stmt = db.prepare(`SELECT * FROM "${tableName}"`);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function tableExists(sqlite, name) {
  const stmt = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?");
  stmt.bind([name]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}

// ---------------------------------------------------------------------------
// Step 5 — Migrate sessions
// ---------------------------------------------------------------------------

async function migrateSessions(pool, rows) {
  if (rows.length === 0) {
    console.log(`  sessions        : 0 rows (skipping)`);
    return 0;
  }

  let inserted = 0;
  for (const row of rows) {
    await pool.query(
      `INSERT INTO sessions (id, user_phone, session_string, api_id, api_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_phone = VALUES(user_phone)`,
      [row.id, row.user_phone, row.session_string, row.api_id, row.api_hash, row.created_at]
    );
    inserted++;
  }

  const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
  await pool.query('ALTER TABLE sessions AUTO_INCREMENT = ?', [maxId + 1]);
  console.log(`  sessions        : ${plural(inserted, 'row')} migrated`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Step 6 — Migrate items (parents before children)
// ---------------------------------------------------------------------------

async function migrateItems(pool, rows) {
  if (rows.length === 0) {
    console.log(`  items           : 0 rows (skipping)`);
    return 0;
  }

  // Order: root items first, then children whose parent is already added
  const added = new Set();
  const ordered = [];
  let remaining = [...rows];

  while (remaining.length > 0) {
    const batch = remaining.filter(
      r => r.parent_id === null || r.parent_id === undefined || added.has(r.parent_id)
    );
    if (batch.length === 0) {
      // circular reference or orphan — append remaining as-is
      ordered.push(...remaining);
      break;
    }
    for (const r of batch) {
      ordered.push(r);
      added.add(r.id);
    }
    remaining = remaining.filter(r => !added.has(r.id));
  }

  let inserted = 0;
  for (const row of ordered) {
    await pool.query(
      `INSERT INTO items
         (id, telegram_message_id, telegram_document_id, name, size, mime_type,
          is_folder, parent_id, owner_phone, access_hash, file_reference,
          dc_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [
        row.id,
        row.telegram_message_id ?? null,
        row.telegram_document_id ?? null,
        row.name,
        row.size ?? 0,
        row.mime_type ?? 'application/octet-stream',
        row.is_folder ?? 0,
        row.parent_id ?? null,
        row.owner_phone,
        row.access_hash ?? null,
        row.file_reference ?? null,
        row.dc_id ?? null,
        row.created_at,
        row.updated_at,
      ]
    );
    inserted++;
  }

  const maxId = ordered.reduce((m, r) => Math.max(m, r.id), 0);
  await pool.query('ALTER TABLE items AUTO_INCREMENT = ?', [maxId + 1]);
  console.log(`  items           : ${plural(inserted, 'row')} migrated`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Step 7 — Migrate shares
// ---------------------------------------------------------------------------

async function migrateShares(pool, rows) {
  if (rows.length === 0) {
    console.log(`  shares          : 0 rows (skipping)`);
    return 0;
  }

  let inserted = 0;
  for (const row of rows) {
    await pool.query(
      `INSERT INTO shares (id, item_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE token = VALUES(token)`,
      [row.id, row.item_id, row.token, row.expires_at ?? null, row.created_at]
    );
    inserted++;
  }

  const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
  await pool.query('ALTER TABLE shares AUTO_INCREMENT = ?', [maxId + 1]);
  console.log(`  shares          : ${plural(inserted, 'row')} migrated`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Step 8 — Migrate file_embeddings (optional)
// ---------------------------------------------------------------------------

async function migrateEmbeddings(pool, rows) {
  if (rows.length === 0) {
    console.log(`  file_embeddings : 0 rows (skipping)`);
    return 0;
  }

  // Ensure MySQL table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS file_embeddings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id INT NOT NULL,
      model VARCHAR(64) NOT NULL DEFAULT 'text-embedding-ada-002',
      embedding JSON NOT NULL,
      chunk_index INT DEFAULT 0,
      chunk_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      INDEX idx_fe_item (item_id),
      INDEX idx_fe_model (model)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  let inserted = 0;
  for (const row of rows) {
    const embedding =
      typeof row.embedding === 'string' ? row.embedding : JSON.stringify(row.embedding);

    await pool.query(
      `INSERT INTO file_embeddings
         (id, item_id, model, embedding, chunk_index, chunk_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE model = VALUES(model)`,
      [
        row.id,
        row.item_id,
        row.model || 'text-embedding-ada-002',
        embedding,
        row.chunk_index ?? 0,
        row.chunk_text ?? null,
        row.created_at,
      ]
    );
    inserted++;
  }

  const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
  await pool.query('ALTER TABLE file_embeddings AUTO_INCREMENT = ?', [maxId + 1]);
  console.log(`  file_embeddings : ${plural(inserted, 'row')} migrated`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Step 9 — Verification
// ---------------------------------------------------------------------------

async function verify(pool, expected) {
  console.log(`\n  ── Verification ──`);

  const tables = ['sessions', 'items', 'shares', 'file_embeddings'];
  let allMatch = true;

  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
      const count = Number(rows[0].cnt);
      const expectedCount = expected[table] ?? 0;
      const match = count === expectedCount;
      const symbol = match ? '✓' : '✗';
      console.log(`  ${symbol} ${table.padEnd(18)} ${count} row${count === 1 ? '' : 's'}`);
      if (!match) {
        console.log(`      (expected ${expectedCount})`);
        allMatch = false;
      }
    } catch {
      console.log(`  - ${table.padEnd(18)} does not exist in MySQL`);
      if (expected[table] > 0) allMatch = false;
    }
  }

  console.log('');
  if (allMatch) {
    console.log(`  ✓ All counts match. Migration successful!`);
  } else {
    console.log(`  ⚠ Some counts differ — review above.`);
  }

  return allMatch;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const T_START = Date.now();

  console.log('');
  console.log(`  ╔══════════════════════════════════════════╗`);
  console.log(`  ║   SQLite → MySQL  (using sql.js)        ║`);
  console.log(`  ╚══════════════════════════════════════════╝`);

  // ---- 1. Read SQLite file into memory ----
  const sqliteBuffer = loadSQLite();

  // ---- 2. Open with sql.js ----
  const SQL = await initSqlJs();
  const sqlite = new SQL.Database(new Uint8Array(sqliteBuffer));

  // ---- 3. List available tables ----
  const tablesRaw = sqlite.exec(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  const tableNames = tablesRaw[0]?.values.map(v => v[0]) ?? [];
  console.log(`  SQLite tables   : ${tableNames.join(', ') || '(none)'}`);

  if (tableNames.length === 0) {
    console.log('\n  No tables found in SQLite. Nothing to do.\n');
    sqlite.close();
    process.exit(0);
  }

  // ---- 4. Connect to MySQL ----
  const pool = await connectMySQL();
  await ensureMySQLSchema(pool);

  // ---- 5. Migrate each table in dependency order ----
  const expected = {};

  try {
    expected.sessions = await migrateSessions(pool, readTable(sqlite, 'sessions'));
    expected.items = await migrateItems(pool, readTable(sqlite, 'items'));
    expected.shares = await migrateShares(pool, readTable(sqlite, 'shares'));

    if (tableExists(sqlite, 'file_embeddings')) {
      expected.file_embeddings = await migrateEmbeddings(
        pool,
        readTable(sqlite, 'file_embeddings')
      );
    } else {
      expected.file_embeddings = 0;
      console.log(`  file_embeddings : table not found in SQLite (skipping)`);
    }

    // ---- 6. Verify ----
    const ok = await verify(pool, expected);

    console.log(`  Total time      : ${elapsed(T_START)}`);
    console.log('');

    if (ok) {
      console.log(`  ── Next steps ──`);
      console.log(`  1. Backup the old SQLite file:`);
      console.log(`     Copy-Item "${SQLITE_PATH}" "${SQLITE_PATH}.backup"`);
      console.log(`  2. Delete the old SQLite file:`);
      console.log(`     Remove-Item "${SQLITE_PATH}"`);
      console.log(`     Remove-Item "${SQLITE_PATH}-shm"  (if exists)`);
      console.log(`     Remove-Item "${SQLITE_PATH}-wal"  (if exists)`);
      console.log(`  3. (Optional) Uninstall sql.js:`);
      console.log(`     npm uninstall sql.js`);
      console.log(`  4. Restart the backend:`);
      console.log(`     npm run dev`);
      console.log('');
    }
  } catch (err) {
    console.error(`\n  ✗ Migration FAILED at ${elapsed(T_START)}`);
    console.error(`    ${err.message}`);
    console.error(`    The script is idempotent — fix the issue and re-run.`);
    process.exit(1);
  } finally {
    sqlite.close();
    await pool.end();
  }
}

main();
