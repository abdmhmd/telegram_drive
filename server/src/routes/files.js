import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/auth.js';
import { listItems, uploadFile, downloadFile, previewFile, deleteItem, updateItem, createShareLink, accessShareLink } from '../controllers/fileController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
});

const router = Router();

router.get('/', authMiddleware, listItems);
router.post('/upload', authMiddleware, upload.single('file'), uploadFile);
router.get('/download/:fileId', authMiddleware, downloadFile);
router.get('/preview/:fileId', authMiddleware, previewFile);
router.delete('/:fileId', authMiddleware, deleteItem);
router.put('/:fileId', authMiddleware, updateItem);
router.post('/:fileId/share', authMiddleware, createShareLink);

export default router;
