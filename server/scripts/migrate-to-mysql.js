/**
 * migrate-to-mysql.js — SQLite → MySQL data migration
 *
 * Reads all data from the old SQLite database and inserts it
 * into the MySQL database, preserving IDs and foreign-key order.
 *
 * Usage:
 *   1. cd server
 *   2. npm install --save-dev better-sqlite3     # temporary
 *   3. Set DB_* env vars in .env                 # (already done)
 *   4. node scripts/migrate-to-mysql.js
 *   5. npm uninstall better-sqlite3              # cleanup
 *
 * Safety: re-runnable (INSERT … ON DUPLICATE KEY). Backs up nothing
 * automatically — manually copy data/database.sqlite before running.
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQLITE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');

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

// ---------------------------------------------------------------------------
// Step 1 — Open SQLite
// ---------------------------------------------------------------------------

function openSQLite() {
  if (!fs.existsSync(SQLITE_PATH)) {
    console.log(`No SQLite database found at: ${SQLITE_PATH}`);
    console.log('Nothing to migrate. Exiting.');
    process.exit(0);
  }

  const db = new Database(SQLITE_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF'); // disable FK enforcement during read
  const size = fs.statSync(SQLITE_PATH).size;
  console.log(`\n  SQLite database : ${SQLITE_PATH} (${formatBytes(size)})`);
  return db;
}

// ---------------------------------------------------------------------------
// Step 2 — Connect to MySQL
// ---------------------------------------------------------------------------

async function connectMySQL() {
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

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'telegram_drive',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    charset: 'utf8mb4',
    ssl,
    waitForConnections: true,
    connectionLimit: 5,
  });

  // Quick connectivity check
  const [rows] = await pool.query('SELECT 1 AS ok');
  console.log(`  MySQL server    : ${rows[0].ok ? 'connected' : 'FAILED'}`);
  console.log(`  MySQL database  : ${process.env.DB_NAME || 'telegram_drive'}\n`);

  return pool;
}

// ---------------------------------------------------------------------------
// Step 3 — Ensure MySQL tables exist (idempotent)
// ---------------------------------------------------------------------------

async function ensureSchema(pool) {
  const { initializeDatabase } = await import('../src/config/database.js');
  await initializeDatabase();
  console.log('  MySQL schema    : ready\n');
}

// ---------------------------------------------------------------------------
// Step 4 — Migrate sessions
// ---------------------------------------------------------------------------

async function migrateSessions(sqlite, pool) {
  const rows = sqlite.prepare('SELECT * FROM sessions').all();
  if (rows.length === 0) {
    console.log('  sessions        : 0 rows (skipping)');
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
// Step 5 — Migrate items (insert parents first, then children)
// ---------------------------------------------------------------------------

async function migrateItems(sqlite, pool) {
  const all = sqlite.prepare('SELECT * FROM items ORDER BY parent_id IS NULL DESC, id ASC').all();
  if (all.length === 0) {
    console.log('  items           : 0 rows (skipping)');
    return 0;
  }

  // Build a dependency-safe order: items with no parent first, then children
  const byParent = {};
  const orphans = [];
  for (const row of all) {
    if (row.parent_id === null) {
      orphans.push(row);
    } else {
      (byParent[row.parent_id] ||= []).push(row);
    }
  }

  const ordered = [...orphans];
  const added = new Set(ordered.map(r => r.id));
  let prevLen = 0;
  while (ordered.length < all.length && ordered.length > prevLen) {
    prevLen = ordered.length;
    for (const row of all) {
      if (!added.has(row.id) && (row.parent_id === null || added.has(row.parent_id))) {
        ordered.push(row);
        added.add(row.id);
      }
    }
  }
  // Append anything still missing (e.g., circular refs) at the end
  for (const row of all) {
    if (!added.has(row.id)) {
      ordered.push(row);
      added.add(row.id);
    }
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
        row.id, row.telegram_message_id, row.telegram_document_id,
        row.name, row.size ?? 0, row.mime_type ?? 'application/octet-stream',
        row.is_folder ?? 0, row.parent_id, row.owner_phone,
        row.access_hash, row.file_reference, row.dc_id,
        row.created_at, row.updated_at,
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
// Step 6 — Migrate shares
// ---------------------------------------------------------------------------

async function migrateShares(sqlite, pool) {
  const rows = sqlite.prepare('SELECT * FROM shares').all();
  if (rows.length === 0) {
    console.log('  shares          : 0 rows (skipping)');
    return 0;
  }

  let inserted = 0;
  for (const row of rows) {
    await pool.query(
      `INSERT INTO shares (id, item_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE token = VALUES(token)`,
      [row.id, row.item_id, row.token, row.expires_at, row.created_at]
    );
    inserted++;
  }

  const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
  await pool.query('ALTER TABLE shares AUTO_INCREMENT = ?', [maxId + 1]);
  console.log(`  shares          : ${plural(inserted, 'row')} migrated`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Step 7 — Migrate file_embeddings (optional table)
// ---------------------------------------------------------------------------

async function migrateEmbeddings(sqlite, pool) {
  // Check if the table exists in SQLite
  const tableInfo = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='file_embeddings'")
    .get();

  if (!tableInfo) {
    console.log('  file_embeddings : table not found in SQLite (skipping)');
    return 0;
  }

  const rows = sqlite.prepare('SELECT * FROM file_embeddings').all();
  if (rows.length === 0) {
    console.log('  file_embeddings : 0 rows (skipping)');
    return 0;
  }

  // Ensure the table exists in MySQL
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
    let embedding = row.embedding;

    // SQLite might store the embedding as a string (JSON) or as binary.
    // If it's already a string, use it directly; otherwise stringify.
    if (typeof embedding !== 'string') {
      embedding = JSON.stringify(embedding);
    }

    await pool.query(
      `INSERT INTO file_embeddings
         (id, item_id, model, embedding, chunk_index, chunk_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE model = VALUES(model)`,
      [row.id, row.item_id, row.model || 'text-embedding-ada-002',
       embedding, row.chunk_index ?? 0, row.chunk_text ?? null, row.created_at]
    );
    inserted++;
  }

  const maxId = rows.reduce((m, r) => Math.max(m, r.id), 0);
  await pool.query('ALTER TABLE file_embeddings AUTO_INCREMENT = ?', [maxId + 1]);
  console.log(`  file_embeddings : ${plural(inserted, 'row')} migrated`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Step 8 — Verification
// ---------------------------------------------------------------------------

async function verify(pool, expected) {
  console.log('\n  ── Verification ──');

  const tables = ['sessions', 'items', 'shares', 'file_embeddings'];
  let ok = true;

  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${table}\``);
      const count = Number(rows[0].cnt);
      const expectedCount = expected[table] ?? 0;
      const match = count === expectedCount;
      const symbol = match ? '✓' : '✗';
      const detail = match
        ? `${count} ${match ? '' : `(expected ${expectedCount})`}`
        : `${count} (expected ${expectedCount})`;
      console.log(`  ${symbol} ${table.padEnd(18)} ${detail}`);
      if (!match) ok = false;
    } catch {
      console.log(`  - ${table.padEnd(18)} table does not exist in MySQL`);
    }
  }

  console.log('');
  if (ok) {
    console.log('  ✓ All row counts match. Migration successful!');
  } else {
    console.log('  ⚠ Some counts differ — review the table above.');
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║     SQLite → MySQL Migration Script      ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');

  const sqlite = openSQLite();
  const pool = await connectMySQL();

  try {
    await ensureSchema(pool);

    const expected = {};
    expected.sessions = await migrateSessions(sqlite, pool);
    expected.items = await migrateItems(sqlite, pool);
    expected.shares = await migrateShares(sqlite, pool);
    expected.file_embeddings = await migrateEmbeddings(sqlite, pool);

    await verify(pool, expected);

    console.log('  Done. You can now delete the .sqlite files:');
    console.log(`    Remove-Item "${SQLITE_PATH}"`);
    console.log(`    Remove-Item "${SQLITE_PATH}-shm"`);
    console.log(`    Remove-Item "${SQLITE_PATH}-wal"`);
    console.log('');
    console.log('  Then uninstall the temporary package:');
    console.log('    npm uninstall better-sqlite3');
    console.log('');
  } catch (err) {
    console.error('\n  ✗ Migration FAILED:', err.message);
    console.error('    The MySQL connection and schema are intact; you may');
    console.error('    fix the issue and re-run (script is idempotent).');
    process.exit(1);
  } finally {
    sqlite.close();
    await pool.end();
  }
}

main();
