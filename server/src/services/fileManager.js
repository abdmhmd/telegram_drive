import db from '../config/database.js';
import logger from '../config/logger.js';
import telegramService from './telegram.js';
import fs from 'fs';

class FileManager {
  async getItems(parentId, ownerPhone) {
    if (parentId === 'root' || !parentId) {
      return db.prepare(
        'SELECT * FROM items WHERE owner_phone = ? AND parent_id IS NULL ORDER BY is_folder DESC, name ASC'
      ).all(ownerPhone);
    }
    return db.prepare(
      'SELECT * FROM items WHERE owner_phone = ? AND parent_id = ? ORDER BY is_folder DESC, name ASC'
    ).all(ownerPhone, parentId);
  }

  async getItem(itemId) {
    return db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  }

  async getItemByMessageId(messageId, ownerPhone) {
    return db.prepare(
      'SELECT * FROM items WHERE telegram_message_id = ? AND owner_phone = ?'
    ).get(messageId, ownerPhone);
  }

  async createFolder(name, parentId, ownerPhone) {
    const result = db.prepare(
      'INSERT INTO items (name, is_folder, parent_id, owner_phone) VALUES (?, 1, ?, ?)'
    ).run(name, parentId || null, ownerPhone);
    return db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  }

  async createFile(ownerPhone, name, size, mimeType, parentId, telegramData) {
    const result = db.prepare(
      `INSERT INTO items (telegram_message_id, telegram_document_id, name, size, mime_type, 
        parent_id, owner_phone, access_hash, file_reference, dc_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      telegramData.telegramMessageId,
      telegramData.documentId,
      name,
      size,
      mimeType,
      parentId || null,
      ownerPhone,
      telegramData.accessHash,
      telegramData.fileReference,
      telegramData.dcId
    );
    return db.prepare('SELECT * FROM items WHERE id = ?').get(result.lastInsertRowid);
  }

  async renameItem(itemId, newName) {
    db.prepare("UPDATE items SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(newName, itemId);
    return db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  }

  async moveItem(itemId, newParentId) {
    db.prepare("UPDATE items SET parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(newParentId || null, itemId);
    return db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  }

  async deleteItem(itemId) {
    const item = await this.getItem(itemId);
    if (!item) throw new Error('Item not found');

    if (item.is_folder) {
      const children = db.prepare('SELECT * FROM items WHERE parent_id = ?').all(itemId);
      for (const child of children) {
        await this.deleteItem(child.id);
      }
    }

    if (!item.is_folder && item.telegram_message_id) {
      try {
        await telegramService.deleteFile(item.owner_phone, item.telegram_message_id);
      } catch (err) {
        logger.error(`Failed to delete Telegram message ${item.telegram_message_id}:`, err.message);
      }
    }

    db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
    return { deleted: true };
  }

  async getBreadcrumbs(itemId) {
    const crumbs = [];
    let current = await this.getItem(itemId);
    while (current) {
      crumbs.unshift({ id: current.id, name: current.name });
      if (current.parent_id) {
        current = await this.getItem(current.parent_id);
      } else {
        current = null;
      }
    }
    crumbs.unshift({ id: 'root', name: 'Root' });
    return crumbs;
  }

  async uploadFile(ownerPhone, tempPath, originalName, mimeType, fileSize, parentId, progressCb) {
    const telegramData = await telegramService.uploadFile(
      ownerPhone, tempPath, originalName, mimeType, fileSize, progressCb
    );

    const item = await this.createFile(
      ownerPhone, originalName, fileSize, mimeType, parentId, telegramData
    );

    try {
      fs.unlinkSync(tempPath);
    } catch (err) {
      logger.warn(`Failed to delete temp file ${tempPath}:`, err.message);
    }

    return item;
  }

  async getStorageStats(ownerPhone) {
    const stats = db.prepare(
      'SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as total_size FROM items WHERE owner_phone = ? AND is_folder = 0'
    ).get(ownerPhone);
    const folders = db.prepare(
      'SELECT COUNT(*) as count FROM items WHERE owner_phone = ? AND is_folder = 1'
    ).get(ownerPhone);
    return {
      files: stats.count,
      folders: folders.count,
      usedSpace: stats.total_size,
    };
  }
}

export default new FileManager();
