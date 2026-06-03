import fileManager from '../services/fileManager.js';

export async function createFolder(req, res, next) {
  try {
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = await fileManager.createFolder(name.trim(), parent_id || null, req.user.phone);
    res.status(201).json({ item: folder });
  } catch (err) {
    next(err);
  }
}
