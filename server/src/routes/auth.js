import { Router } from 'express';
import { sendCode, verifyCode, verify2FA, getAccounts, login, logout } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/send-code', sendCode);
router.post('/verify-code', verifyCode);
router.post('/verify-2fa', verify2FA);
router.post('/login', login);
router.get('/accounts', getAccounts);
router.post('/logout', authMiddleware, logout);

export default router;
