import '../env.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { chat } from './chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// CORS: use ALLOWED_ORIGINS in production (comma-separated), else allow all (e.g. local dev)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : null;
app.use(cors({ origin: allowedOrigins ?? true, credentials: true }));

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

// Health check: reports if the service and OpenAI key are ready (no key value exposed)
app.get('/health', (req, res) => {
  const hasKey = !!process.env.OPENAI_API_KEY?.trim();
  res.json({
    status: hasKey ? 'ok' : 'degraded',
    service: 'easyslice-chatbot',
    chat_ready: hasKey,
  });
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
    const statusCode = err.status ?? err.statusCode ?? 500;
    console.error('Chat error:', statusCode, err.message || err);
    const status = statusCode === 401 ? 401 : statusCode === 429 || statusCode === 402 ? 503 : 500;
    const isQuota = statusCode === 429 || statusCode === 402;
    const message = isQuota
      ? "Support chat is temporarily unavailable. Please try again later or email us."
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
