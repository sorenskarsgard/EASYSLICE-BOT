/**
 * EasySlice.AI Customer Service Chat Widget
 * Drop this script on your site and it will add a floating chat button and panel.
 *
 * Usage:
 *   <script src="https://your-api-host.com/widget/chat-widget.js" data-api-url="https://your-api-host.com"></script>
 */
(function () {
  const script = document.currentScript;
  const API_URL = (script && script.getAttribute('data-api-url')) || '';

  if (!API_URL) {
    console.warn('EasySlice chat widget: data-api-url is required.');
    return;
  }

  const container = document.createElement('div');
  container.id = 'easyslice-chat-root';
  container.innerHTML = `
    <style>
      #easyslice-chat-root {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
      }
      #easyslice-chat-toggle {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: transform 0.2s;
      }
      #easyslice-chat-toggle:hover { transform: scale(1.05); }
      #easyslice-chat-panel {
        display: none;
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 480px;
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        flex-direction: column;
        overflow: hidden;
      }
      #easyslice-chat-panel.open { display: flex; }
      #easyslice-chat-header {
        padding: 16px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        font-weight: 600;
        font-size: 15px;
      }
      #easyslice-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f8fafc;
      }
      #easyslice-chat-messages .msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
      }
      #easyslice-chat-messages .msg.user {
        align-self: flex-end;
        background: #6366f1;
        color: white;
      }
      #easyslice-chat-messages .msg.bot {
        align-self: flex-start;
        background: white;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      #easyslice-chat-messages .msg.thinking {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
      }
      #easyslice-chat-messages .msg.thinking .thinking-dots {
        display: flex;
        gap: 4px;
      }
      #easyslice-chat-messages .msg.thinking .thinking-dots span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #6366f1;
        animation: thinking-bounce 0.6s ease-in-out infinite;
      }
      #easyslice-chat-messages .msg.thinking .thinking-dots span:nth-child(2) { animation-delay: 0.1s; }
      #easyslice-chat-messages .msg.thinking .thinking-dots span:nth-child(3) { animation-delay: 0.2s; }
      @keyframes thinking-bounce {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.6; }
        40% { transform: scale(1); opacity: 1; }
      }
      #easyslice-chat-input-wrap {
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        background: #fff;
      }
      #easyslice-chat-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        font-size: 14px;
        box-sizing: border-box;
      }
      #easyslice-chat-input:focus {
        outline: none;
        border-color: #6366f1;
      }
      #easyslice-chat-send {
        margin-top: 8px;
        width: 100%;
        padding: 10px;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
      }
      #easyslice-chat-send:hover { background: #4f46e5; }
      #easyslice-chat-send:disabled { opacity: 0.6; cursor: not-allowed; }
    </style>
    <button id="easyslice-chat-toggle" aria-label="Open chat">💬</button>
    <div id="easyslice-chat-panel">
      <div id="easyslice-chat-header">EasySlice.AI Support</div>
      <div id="easyslice-chat-messages"></div>
      <div id="easyslice-chat-input-wrap">
        <input id="easyslice-chat-input" type="text" placeholder="Ask anything about EasySlice..." />
        <button id="easyslice-chat-send">Send</button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const toggle = document.getElementById('easyslice-chat-toggle');
  const panel = document.getElementById('easyslice-chat-panel');
  const messagesEl = document.getElementById('easyslice-chat-messages');
  const input = document.getElementById('easyslice-chat-input');
  const sendBtn = document.getElementById('easyslice-chat-send');

  let conversation = [];

  function addMessage(role, content) {
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
    div.textContent = content;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addThinkingMessage() {
    const div = document.createElement('div');
    div.className = 'msg bot thinking';
    div.id = 'easyslice-chat-thinking';
    div.innerHTML = '<span class="thinking-dots"><span></span><span></span><span></span></span><span>Thinking...</span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function removeThinkingMessage() {
    const el = document.getElementById('easyslice-chat-thinking');
    if (el) el.remove();
  }

  function setLoading(loading) {
    sendBtn.disabled = loading;
    sendBtn.textContent = loading ? '...' : 'Send';
  }

  toggle.addEventListener('click', function () {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });

  async function send() {
    const text = (input.value || '').trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);
    conversation.push({ role: 'user', content: text });
    setLoading(true);
    addThinkingMessage();

    try {
      const res = await fetch(API_URL.replace(/\/$/, '') + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation }),
      });
      const data = await res.json();
      removeThinkingMessage();

      if (!res.ok) {
        addMessage('bot', data.message || 'Sorry, something went wrong. Please try again.');
        return;
      }

      conversation.push({ role: 'assistant', content: data.reply });
      addMessage('bot', data.reply);
    } catch (e) {
      removeThinkingMessage();
      addMessage('bot', 'Unable to reach support. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') send();
  });
})();
