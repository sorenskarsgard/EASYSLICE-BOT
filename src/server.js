import '../env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { chat } from './chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());
app.use('/widget', express.static(path.join(__dirname, '..', 'widget')));

// Demo page to view the chatbot (open http://localhost:3001 in browser)
const demoHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>EasySlice Chat</title></head>
<body style="margin:0;min-height:100vh;background:#f1f5f9;">
  <script src="/widget/chat-widget.js" data-api-url="http://localhost:${PORT}"></script>
</body>
</html>`;
app.get('/', (req, res) => {
  res.type('html').send(demoHtml);
});

// Health check (no API key needed)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'easyslice-chatbot' });
});

// Chat endpoint for customer service
app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: 'Chat unavailable',
        message: 'OpenAI API key is not configured.',
      });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Body must include "messages" (array of { role, content }).',
      });
    }

    const reply = await chat(messages);
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    const status = err.status === 401 ? 401 : err.status === 429 ? 503 : 500;
    const isQuota = err.status === 429 || err.status === 402;
    const message = isQuota
      ? "Support chat is temporarily unavailable. Please email us at easyslice.ai/contact and we'll get back to you soon."
      : (err.message || 'Something went wrong. Please try again.');
    res.status(status).json({
      error: 'Chat failed',
      message,
    });
  }
});

app.listen(PORT, () => {
  const hasKey = !!process.env.OPENAI_API_KEY?.trim();
  console.log(`EasySlice chatbot API running at http://localhost:${PORT}`);
  console.log(hasKey ? 'OpenAI API key: loaded' : 'Warning: OPENAI_API_KEY not set. /api/chat will return 503.');
});
