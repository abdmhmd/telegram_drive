import { query, get, run } from '../config/database.js';
import logger from '../config/logger.js';
import telegramService from './telegram.js';
import fs from 'fs';

class FileManager {
  async getItems(parentId, ownerPhone) {
    if (parentId === 'root' || !parentId) {
      return await query(
        'SELECT * FROM items WHERE owner_phone = ? AND parent_id IS NULL ORDER BY is_folder DESC, name ASC',
        [ownerPhone]
      );
    }
    return await query(
      'SELECT * FROM items WHERE owner_phone = ? AND parent_id = ? ORDER BY is_folder DESC, name ASC',
      [ownerPhone, parentId]
    );
  }

  async getItem(itemId, ownerPhone = null) {
    if (ownerPhone) {
      return await get('SELECT * FROM items WHERE id = ? AND owner_phone = ?', [itemId, ownerPhone]);
    }
    return await get('SELECT * FROM items WHERE id = ?', [itemId]);
  }

  async getItemByMessageId(messageId, ownerPhone) {
    return await get(
      'SELECT * FROM items WHERE telegram_message_id = ? AND owner_phone = ?',
      [messageId, ownerPhone]
    );
  }

  async createFolder(name, parentId, ownerPhone) {
    const result = await run(
      'INSERT INTO items (name, is_folder, parent_id, owner_phone) VALUES (?, 1, ?, ?)',
      [name, parentId || null, ownerPhone]
    );
    return await get('SELECT * FROM items WHERE id = ?', [result.insertId]);
  }

  async createFile(ownerPhone, name, size, mimeType, parentId, telegramData) {
    const result = await run(
      `INSERT INTO items (telegram_message_id, telegram_document_id, name, size, mime_type, 
        parent_id, owner_phone, access_hash, file_reference, dc_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        telegramData.telegramMessageId,
        telegramData.documentId,
        name,
        size,
        mimeType,
        parentId || null,
        ownerPhone,
        telegramData.accessHash,
        telegramData.fileReference,
        telegramData.dcId,
      ]
    );
    return await get('SELECT * FROM items WHERE id = ?', [result.insertId]);
  }

  async renameItem(itemId, newName) {
    await run(
      'UPDATE items SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newName, itemId]
    );
    return await get('SELECT * FROM items WHERE id = ?', [itemId]);
  }

  async moveItem(itemId, newParentId) {
    await run(
      'UPDATE items SET parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newParentId || null, itemId]
    );
    return await get('SELECT * FROM items WHERE id = ?', [itemId]);
  }

  async deleteItem(itemId) {
    const item = await this.getItem(itemId);
    if (!item) throw new Error('Item not found');

    if (item.is_folder) {
      const children = await query('SELECT * FROM items WHERE parent_id = ?', [itemId]);
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

    await run('DELETE FROM items WHERE id = ?', [itemId]);
    return { deleted: true };
  }

  async getBreadcrumbs(itemId, ownerPhone = null) {
    const crumbs = [];
    let current = await this.getItem(itemId, ownerPhone);
    while (current) {
      crumbs.unshift({ id: current.id, name: current.name });
      if (current.parent_id) {
        current = await this.getItem(current.parent_id, ownerPhone);
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
    const stats = await get(
      'SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as total_size FROM items WHERE owner_phone = ? AND is_folder = 0',
      [ownerPhone]
    );
    const folders = await get(
      'SELECT COUNT(*) as count FROM items WHERE owner_phone = ? AND is_folder = 1',
      [ownerPhone]
    );
    return {
      files: Number(stats.count),
      folders: Number(folders.count),
      usedSpace: Number(stats.total_size),
    };
  }
}

export default new FileManager();
