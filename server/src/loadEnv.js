import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (result.error) {
  // .env is optional — env vars may be injected by the deployment platform.
  console.warn('[loadEnv] No .env file found. Relying on process environment variables.');
}
