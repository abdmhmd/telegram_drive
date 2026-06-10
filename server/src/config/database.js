import mysql from 'mysql2/promise';
import logger from './logger.js';

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'telegram_drive',
  DB_PORT = '3306',
  DB_SSL = 'true',
} = process.env;

const sslEnabled = DB_SSL === 'true';
const ssl = sslEnabled ? {} : undefined;

logger.info('Configuring database connection pool');
logger.info(`  Host: ${DB_HOST}`);
logger.info(`  Port: ${DB_PORT}`);
logger.info(`  Database: ${DB_NAME}`);
logger.info(`  User: ${DB_USER}`);
logger.info(`  SSL: ${sslEnabled ? 'enabled' : 'disabled'}`);

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: parseInt(DB_PORT, 10),
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

logger.info('Connection pool created');

export async function testDatabaseConnection() {
  logger.info('Testing database connection...');
  try {
    const conn = await pool.getConnection();
    logger.info('  Acquired connection from pool');
    const [rows] = await conn.query('SELECT 1 AS result');
    conn.release();
    logger.info(`  Test query successful: SELECT 1 => ${rows[0]?.result}`);
    logger.info('Database connection successful');
    return true;
  } catch (err) {
    logger.error('Database connection FAILED');
    logger.error(`  Error code: ${err.code || 'N/A'}`);
    logger.error(`  Error message: ${err.message}`);
    logger.error(`  Error stack: ${err.stack}`);
    return false;
  }
}

export async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function get(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows[0] ?? null;
}

export async function run(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return result;
}

export async function transaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function initializeDatabase() {
  logger.info('Initializing database schema...');
  const schema = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_phone VARCHAR(20) NOT NULL UNIQUE,
      session_string LONGTEXT NOT NULL,
      api_id INT NOT NULL,
      api_hash VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      telegram_message_id INT,
      telegram_document_id VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      size BIGINT DEFAULT 0,
      mime_type VARCHAR(255) DEFAULT 'application/octet-stream',
      is_folder TINYINT(1) DEFAULT 0,
      parent_id INT,
      owner_phone VARCHAR(20) NOT NULL,
      access_hash VARCHAR(255),
      file_reference TEXT,
      dc_id INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_items_parent (parent_id),
      INDEX idx_items_owner (owner_phone),
      FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE SET NULL
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS shares (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id INT NOT NULL,
      token VARCHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await pool.query(stmt);
  }

  logger.info('MySQL schema initialized successfully');
}

export default { query, get, run, transaction, initializeDatabase, testDatabaseConnection, pool };
