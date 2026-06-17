import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function generateShareToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function maskPhone(phone) {
  if (!phone) return '';
  const cleaned = String(phone).replace(/[^\d+]/g, '');
  const last4 = cleaned.slice(-4);
  const prefix = cleaned.startsWith('+') ? '+' : '';
  return `${prefix}**${last4}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
