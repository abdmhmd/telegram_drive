import telegramService from '../services/telegram.js';
import db from '../config/database.js';
import { generateToken } from '../middleware/auth.js';
import logger from '../config/logger.js';

export async function sendCode(req, res, next) {
  try {
    const { api_id, api_hash, phone } = req.body;
    if (!api_id || !api_hash || !phone) {
      return res.status(400).json({ error: 'api_id, api_hash, and phone are required' });
    }

    await telegramService.sendCode(phone, api_id, api_hash);
    res.json({ success: true, message: 'Verification code sent' });
  } catch (err) {
    logger.error('sendCode error:', err);
    if (err.errorMessage === 'PHONE_NUMBER_INVALID') {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    if (err.errorMessage === 'API_ID_INVALID') {
      return res.status(400).json({ error: 'Invalid API ID or API Hash' });
    }
    next(err);
  }
}

export async function verifyCode(req, res, next) {
  try {
    const { phone, code, password } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'phone and code are required' });
    }

    const result = await telegramService.verifyCode(phone, code);
    if (result.needPassword) {
      return res.json({ needPassword: true, phone });
    }

    const { sessionString, apiId, apiHash } = result;
    const existingSession = db.prepare('SELECT id FROM sessions WHERE user_phone = ?').get(phone);
    if (existingSession) {
      db.prepare('UPDATE sessions SET session_string = ?, api_id = ?, api_hash = ? WHERE user_phone = ?')
        .run(sessionString, apiId, apiHash, phone);
    } else {
      db.prepare('INSERT INTO sessions (user_phone, session_string, api_id, api_hash) VALUES (?, ?, ?, ?)')
        .run(phone, sessionString, apiId, apiHash);
    }

    const token = generateToken(phone);
    res.json({ success: true, token, phone });
  } catch (err) {
    logger.error('verifyCode error:', err);
    if (err.errorMessage === 'PHONE_CODE_INVALID') {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    if (err.errorMessage === 'PHONE_CODE_EXPIRED') {
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }
    next(err);
  }
}

export async function verify2FA(req, res, next) {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'phone and password are required' });
    }

    const result = await telegramService.verify2FA(phone, password);
    const { sessionString, apiId, apiHash } = result;

    const existingSession = db.prepare('SELECT id FROM sessions WHERE user_phone = ?').get(phone);
    if (existingSession) {
      db.prepare('UPDATE sessions SET session_string = ?, api_id = ?, api_hash = ? WHERE user_phone = ?')
        .run(sessionString, apiId, apiHash, phone);
    } else {
      db.prepare('INSERT INTO sessions (user_phone, session_string, api_id, api_hash) VALUES (?, ?, ?, ?)')
        .run(phone, sessionString, apiId, apiHash);
    }

    const token = generateToken(phone);
    res.json({ success: true, token, phone });
  } catch (err) {
    logger.error('verify2FA error:', err);
    if (err.errorMessage === 'PASSWORD_HASH_INVALID') {
      return res.status(400).json({ error: 'Invalid 2FA password' });
    }
    next(err);
  }
}

export async function getAccounts(req, res, next) {
  try {
    const accounts = db.prepare('SELECT user_phone, created_at FROM sessions ORDER BY created_at DESC').all();
    res.json({ accounts });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { phone } = req.body;
    const session = db.prepare('SELECT * FROM sessions WHERE user_phone = ?').get(phone);
    if (!session) {
      return res.status(404).json({ error: 'Account not found. Please set up first.' });
    }

    await telegramService.loadSession(phone, session.session_string, session.api_id, session.api_hash);
    const token = generateToken(phone);
    res.json({ success: true, token, phone });
  } catch (err) {
    logger.error('login error:', err);
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    db.prepare('DELETE FROM sessions WHERE user_phone = ?').run(req.user.phone);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}
