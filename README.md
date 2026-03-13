# EasySlice.AI Customer Service Chatbot

A customer service chatbot that knows EasySlice.AI in depth and can be integrated into [easyslice.ai](https://www.easyslice.ai) (or any front-end) via API or embeddable widget.

## What’s included

- **Knowledge base** – Product overview, FAQ, troubleshooting, account and privacy (in `knowledge-base/`). Editable so the bot stays accurate.
- **Chat API** – `POST /api/chat` with conversation history; uses the knowledge base as context for an LLM.
- **Embeddable widget** – One script tag to add a floating chat button and panel on your site.

## Quick start

### 1. Install and configure

```bash
cd easyslice-chatbot
npm install
```

Create a `.env` file:

```env
PORT=3001
OPENAI_API_KEY=sk-...          # Required for chat
OPENAI_MODEL=gpt-4o-mini      # Optional; default is gpt-4o-mini
```

### 2. Run the API

```bash
npm run dev
```

The API runs at `http://localhost:3001`. Use `npm start` in production.

### 3. Test the API

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Why did I not get clips after connecting?"}]}'
```

You should get a JSON response with a `reply` that uses the knowledge base (e.g. warming up accounts, new uploads, etc.).

## Integrating into EasySlice.AI

### Option A: Embed the widget

Host the API (e.g. on Railway, Render, or your own server) and add this to your site (e.g. layout or footer):

```html
<script
  src="https://YOUR-CHATBOT-API-URL/widget/chat-widget.js"
  data-api-url="https://YOUR-CHATBOT-API-URL"
></script>
```

Replace `YOUR-CHATBOT-API-URL` with your deployed API base URL. The widget adds a floating button and chat panel that talk to your `/api/chat` endpoint.

### Option B: Use the API from your app

From your front-end (e.g. Next.js, React, or plain JS), call the chatbot like this:

```js
const response = await fetch('https://YOUR-CHATBOT-API-URL/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'How many clips do I get per video?' }
    ]
  })
});
const { reply } = await response.json();
```

Keep the full `messages` array in your state and append each user message and the returned `reply` so the bot has conversation history.

### Option C: Proxy through your backend

If you prefer not to expose the chatbot URL or want to add auth:

1. Add a route on your EasySlice backend (e.g. `POST /api/support/chat`).
2. That route forwards the body to `https://YOUR-CHATBOT-API-URL/api/chat` and returns the JSON.
3. Your front-end calls only your backend.

## Updating what the bot knows

Edit the markdown files in `knowledge-base/`:

- `product-overview.md` – What EasySlice is, how it works, platforms.
- `faq-and-troubleshooting.md` – FAQ answers and troubleshooting steps.
- `account-and-privacy.md` – Sign up, sign in, password reset, privacy summary.

Restart the API after changes so the new content is loaded. For zero-downtime updates, you can add a small “reload knowledge” admin endpoint that re-reads these files if you need it later.

## Environment variables

| Variable         | Required | Description                          |
|------------------|----------|--------------------------------------|
| `PORT`           | No       | Server port (default `3001`)         |
| `OPENAI_API_KEY` | Yes      | OpenAI API key for chat              |
| `OPENAI_MODEL`   | No       | Model name (default `gpt-4o-mini`)   |

## Project structure

```
easyslice-chatbot/
├── knowledge-base/       # Bot context (edit these)
│   ├── product-overview.md
│   ├── faq-and-troubleshooting.md
│   └── account-and-privacy.md
├── src/
│   ├── server.js         # Express app and /api/chat
│   ├── chat.js           # LLM + system prompt
│   └── loadKnowledge.js  # Loads knowledge-base/*.md
├── widget/
│   └── chat-widget.js    # Embeddable script for the site
├── package.json
├── .env                  # You create this
└── README.md
```

## CORS and deployment

The server uses `cors({ origin: true })`, so any origin can call it. For production, restrict this to your EasySlice domain(s) if you prefer, e.g.:

```js
app.use(cors({ origin: ['https://www.easyslice.ai', 'https://easyslice.ai'] }));
```

Serve `widget/chat-widget.js` from your API host (e.g. `app.use(express.static('widget'))` or map `/widget/chat-widget.js` to the file) so the script tag can load it.
