import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createFolder } from '../controllers/folderController.js';

const router = Router();

router.post('/', authMiddleware, createFolder);

export default router;
