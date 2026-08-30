-- ============================================================================
-- Telegram Drive — Complete Database Schema
-- Target: MySQL 5.7+ / MariaDB 10.2+ / TiDB (Serverless or Dedicated)
-- Charset/collation: utf8mb4 / utf8mb4_unicode_ci (full Unicode)
--
-- HOW TO USE:
--   1. Create the database (once):        CREATE DATABASE IF NOT EXISTS telegram_drive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   2. Select it:                          USE telegram_drive;
--   3. Paste THIS whole script into the SQL editor and execute it.
--      The script is re-runnable: it DROPs existing tables first.
--
-- The backend does NOT require any seed data. All inserts happen at
-- runtime via the app (sessions, items, shares are created dynamically).
-- There are no "settings"/"user roles" tables — authentication is per
-- Telegram phone number stored in `sessions`.
-- ============================================================================

-- Optional: reset the whole schema (comment out if you already ran it once and
-- want to keep data). Order matters: children/parents are dropped before parents.
DROP TABLE IF EXISTS file_embeddings;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS sessions;

-- ----------------------------------------------------------------------------
-- sessions — Telegram account logins saved on the server.
--   One row per connected phone number. Holds the serialized Telegram session
--   so the server can act on behalf of the user (upload/download from "me").
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    id            INT NOT NULL AUTO_INCREMENT,
    user_phone    VARCHAR(20)  NOT NULL COMMENT 'Telegram phone number, e.g. +1234567890 (unique per account)',
    session_string LONGTEXT    NOT NULL COMMENT 'Serialized GramJS StringSession',
    api_id        INT          NOT NULL COMMENT 'Telegram API ID of the account that created this session',
    api_hash      VARCHAR(255) NOT NULL COMMENT 'Telegram API hash of the account',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sessions_phone (user_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- items — the file/folder tree ("drive").
--   A row is either a FILE (is_folder=0) or a FOLDER (is_folder=1).
--   Folders nest via self-referencing parent_id (ON DELETE SET NULL).
--   Files reference a Telegram "Saved Messages" document for download.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
    id                   INT NOT NULL AUTO_INCREMENT,
    telegram_message_id  INT                COMMENT 'Message id of the uploaded document in Saved Messages',
    telegram_document_id VARCHAR(255)       COMMENT 'Telegram document id (decrypted)',
    name                 VARCHAR(255) NOT NULL COMMENT 'File or folder name',
    size                 BIGINT NOT NULL DEFAULT 0 COMMENT 'File size in bytes (0 for folders)',
    mime_type            VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
    is_folder            TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '0 = file, 1 = folder',
    parent_id            INT NULL   COMMENT 'Parent folder id; NULL = root level. Self-referencing.',
    owner_phone          VARCHAR(20)  NOT NULL COMMENT 'Which Telegram account owns this item',
    access_hash          VARCHAR(255) COMMENT 'Telegram access_hash needed to re-download',
    file_reference       TEXT         COMMENT 'Telegram file_reference (base64) for re-download',
    dc_id                INT          COMMENT 'Telegram datacenter id (optional)',
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_items_parent (parent_id),
    KEY idx_items_owner  (owner_phone),
    KEY idx_items_owner_parent (owner_phone, parent_id),
    CONSTRAINT fk_items_parent FOREIGN KEY (parent_id)
        REFERENCES items (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- shares — public download links ("shareable").
--   Each row links a token (part of the URL) to a file item.
--   expires_at may be NULL (never expires). Delete with the item (CASCADE).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shares (
    id         INT NOT NULL AUTO_INCREMENT,
    item_id    INT NOT NULL COMMENT 'The file being shared',
    token      VARCHAR(64)  NOT NULL COMMENT 'Random URL token (hex), unique',
    expires_at DATETIME     NULL COMMENT 'Expiry; NULL = never expires',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_shares_token (token),
    KEY idx_shares_item (item_id),
    CONSTRAINT fk_shares_item FOREIGN KEY (item_id)
        REFERENCES items (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- file_embeddings — OPTIONAL table used by the data-migration script
--   (server/scripts/migrate-*-to-mysql.js) for vector search chunks.
--   NOT required by the running app — include only if you migrated from the
--   old SQLite DB that had embeddings. Safe to skip for a fresh install.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS file_embeddings (
    id           INT NOT NULL AUTO_INCREMENT,
    item_id      INT NOT NULL COMMENT 'The file this embedding belongs to',
    model        VARCHAR(64)  NOT NULL DEFAULT 'text-embedding-ada-002' COMMENT 'Embedding model name',
    embedding    JSON         NOT NULL COMMENT 'Numeric vector (valid JSON array)',
    chunk_index  INT          NOT NULL DEFAULT 0,
    chunk_text   TEXT         NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_fe_item  (item_id),
    KEY idx_fe_model (model),
    CONSTRAINT fk_fe_item FOREIGN KEY (item_id)
        REFERENCES items (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- OPTIONAL VALIDATION — run after executing the CREATE statements.
--   Should return 4 rows (table names) if everything was created.
-- ============================================================================
-- SHOW TABLES;
-- SELECT table_name, table_collation FROM information_schema.tables
--   WHERE table_schema = DATABASE() ORDER BY table_name;
