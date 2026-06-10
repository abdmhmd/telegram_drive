import fs from 'fs';
import fileManager from '../services/fileManager.js';
import telegramService from '../services/telegram.js';
import { get, run } from '../config/database.js';
import logger from '../config/logger.js';
import { generateShareToken } from '../utils/helpers.js';

export async function listItems(req, res, next) {
  try {
    const parentId = req.query.parent_id || null;
    const items = await fileManager.getItems(parentId, req.user.phone);
    const breadcrumbs = parentId ? await fileManager.getBreadcrumbs(parentId) : [{ id: 'root', name: 'Root' }];
    const stats = await fileManager.getStorageStats(req.user.phone);
    res.json({ items, breadcrumbs, stats });
  } catch (err) {
    next(err);
  }
}

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const parentId = req.body.parent_id || null;
    const tempPath = req.file.path;
    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;
    const fileSize = req.file.size;

    const item = await fileManager.uploadFile(
      req.user.phone, tempPath, originalName, mimeType, fileSize, parentId,
      (bytes, total) => {
        logger.debug(`Upload progress: ${bytes}/${total}`);
      }
    );

    res.status(201).json({ item });
  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    next(err);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const item = await fileManager.getItem(req.params.fileId);
    if (!item || item.is_folder) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = item.mime_type || 'application/octet-stream';
    const fileName = encodeURIComponent(item.name);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', item.size);
    res.setHeader('Accept-Ranges', 'bytes');

    const stream = await telegramService.downloadFileStream(item.owner_phone, item.telegram_message_id);
    stream.pipe(res);
    stream.on('error', (err) => {
      logger.error('Download stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function previewFile(req, res, next) {
  try {
    const item = await fileManager.getItem(req.params.fileId);
    if (!item || item.is_folder) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = item.mime_type || 'application/octet-stream';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.name)}"`);
    res.setHeader('Content-Length', item.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const stream = await telegramService.downloadFileStream(item.owner_phone, item.telegram_message_id);
    stream.pipe(res);
    stream.on('error', (err) => {
      logger.error('Preview stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Preview failed' });
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const item = await fileManager.getItem(req.params.fileId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    const result = await fileManager.deleteItem(req.params.fileId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req, res, next) {
  try {
    const item = await fileManager.getItem(req.params.fileId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const { name, parent_id } = req.body;
    let updated;

    if (name !== undefined) {
      updated = await fileManager.renameItem(req.params.fileId, name);
    }
    if (parent_id !== undefined) {
      updated = await fileManager.moveItem(req.params.fileId, parent_id);
    }

    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
}

export async function createShareLink(req, res, next) {
  try {
    const item = await fileManager.getItem(req.params.fileId);
    if (!item || item.is_folder) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { expires_in_hours } = req.body;
    const token = generateShareToken();
    let expiresAt = null;
    if (expires_in_hours) {
      expiresAt = new Date(Date.now() + expires_in_hours * 3600000).toISOString();
    }

    await run(
      'INSERT INTO shares (item_id, token, expires_at) VALUES (?, ?, ?)',
      [item.id, token, expiresAt]
    );

    const shareUrl = `${req.protocol}://${req.get('host')}/api/shares/${token}`;
    res.status(201).json({ token, url: shareUrl, expires_at: expiresAt });
  } catch (err) {
    next(err);
  }
}

export async function accessShareLink(req, res, next) {
  try {
    const share = await get('SELECT * FROM shares WHERE token = ?', [req.params.token]);
    if (!share) {
      return res.status(404).json({ error: 'Share link not found' });
    }
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      await run('DELETE FROM shares WHERE id = ?', [share.id]);
      return res.status(410).json({ error: 'Share link has expired' });
    }

    const item = await fileManager.getItem(share.item_id);
    if (!item) {
      return res.status(404).json({ error: 'Shared file not found' });
    }

    const mimeType = item.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.name)}"`);
    res.setHeader('Content-Length', item.size);

    const stream = await telegramService.downloadFileStream(item.owner_phone, item.telegram_message_id);
    stream.pipe(res);
    stream.on('error', (err) => {
      logger.error('Share download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (err) {
    next(err);
  }
}
