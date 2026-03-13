/**
 * Load .env from project root before any other modules run.
 * Import this first in server.js so OPENAI_API_KEY is available everywhere.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
