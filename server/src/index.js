import './loadEnv.js';
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
import { query, initializeDatabase, testDatabaseConnection } from './config/database.js';
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
const PORT = parseInt(process.env.EXPOSE_PORT || process.env.PORT, 10) || 3000;
const HOST = '0.0.0.0';

const isProduction = process.env.NODE_ENV === 'production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || (isProduction ? 'https://telegram-drive.netlify.app' : '*');

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.options('*', cors());
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
  const sessions = await query('SELECT * FROM sessions');
  for (const session of sessions) {
    try {
      await telegramService.loadSession(session.user_phone, session.session_string, session.api_id, session.api_hash);
      logger.info(`Session loadedd   for ${session.user_phone}`);
    } catch (err) {
      logger.warn(`Failed to load session for ${session.user_phone}: ${err.message}`);
    }
  }
  logger.info(`Loaded ${sessions.length} session(s)`);
}

async function waitForDatabase(attempts = 5, delayMs = 5000) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const connected = await testDatabaseConnection();
    if (connected) return true;
    logger.error(`Database connection attempt ${attempt}/${attempts} failed. Retrying in ${delayMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  logger.error('Fatal: Cannot connect to database after multiple attempts. Exiting.');
  return false;
}

async function start() {
  logger.info('Starting server...');

  const connected = await waitForDatabase();
  if (!connected) {
    process.exit(1);
  }

  await initializeDatabase();
  await loadSessions();

  app.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`);
  });
}

start();
