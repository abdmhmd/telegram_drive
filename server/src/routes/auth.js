import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendCode, verifyCode, verify2FA, getAccounts, login, logout } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/send-code', authLimiter, sendCode);
router.post('/verify-code', authLimiter, verifyCode);
router.post('/verify-2fa', authLimiter, verify2FA);
router.post('/login', authLimiter, login);
router.get('/accounts', authMiddleware, getAccounts);
router.post('/logout', authMiddleware, logout);

export default router;
