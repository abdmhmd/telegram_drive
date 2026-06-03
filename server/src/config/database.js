import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/database.sqlite');
const DB_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_phone TEXT UNIQUE NOT NULL,
    session_string TEXT NOT NULL,
    api_id INTEGER NOT NULL,
    api_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_message_id INTEGER,
    telegram_document_id TEXT,
    name TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'application/octet-stream',
    is_folder INTEGER DEFAULT 0,
    parent_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
    owner_phone TEXT NOT NULL,
    access_hash TEXT,
    file_reference TEXT,
    dc_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_id);
  CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_phone);
  CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
`);

logger.info('Database initialized successfully');

export default db;
