import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  logger.warn('JWT_SECRET not set. Using insecure default for development only.');
}
const JWT_SECRET_VALUE = JWT_SECRET || 'dev-secret-do-not-use-in-production';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALUE);
    req.user = decoded;
    next();
  } catch (err) {
    logger.error('JWT verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function generateToken(phone) {
  return jwt.sign({ phone }, JWT_SECRET_VALUE, { expiresIn: '30d' });
}
