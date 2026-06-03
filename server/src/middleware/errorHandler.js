import logger from '../config/logger.js';

export function errorHandler(err, req, res, _next) {
  logger.error('Unhandled error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 2GB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  const status = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
}
