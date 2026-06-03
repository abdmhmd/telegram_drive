import { Router } from 'express';
import { accessShareLink } from '../controllers/fileController.js';

const router = Router();

router.get('/:token', accessShareLink);

export default router;
