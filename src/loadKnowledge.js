import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge-base');

/**
 * Load all markdown files from the knowledge base and concatenate into one string.
 * Used as context for the customer service chatbot.
 */
export function loadKnowledgeBase() {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith('.md'));
  const parts = [];

  for (const file of files.sort()) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    parts.push(`## Source: ${file}\n\n${content}`);
  }

  return parts.join('\n\n---\n\n');
}
