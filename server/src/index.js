import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import folderRoutes from './routes/folders.js';
import shareRoutes from './routes/shares.js';
import db from './config/database.js';
import logger from './config/logger.js';
import telegramService from './services/telegram.js';

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/shares', shareRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function loadSessions() {
  const sessions = db.prepare('SELECT * FROM sessions').all();
  for (const session of sessions) {
    try {
      await telegramService.loadSession(session.user_phone, session.session_string, session.api_id, session.api_hash);
      logger.info(`Session loaded for ${session.user_phone}`);
    } catch (err) {
      logger.warn(`Failed to load session for ${session.user_phone}: ${err.message}`);
    }
  }
  logger.info(`Loaded ${sessions.length} session(s)`);
}

app.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  try {
    await loadSessions();
  } catch (err) {
    logger.error('Failed to load sessions:', err.message);
  }
});
