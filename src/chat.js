import OpenAI from 'openai';
import { loadKnowledgeBase } from './loadKnowledge.js';

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const KNOWLEDGE = loadKnowledgeBase();

const SYSTEM_PROMPT = `You are the official EasySlice.AI customer service chatbot. You have in-depth knowledge of the product and help users with questions, troubleshooting, and guidance.

## Your knowledge base (use this to answer accurately)

${KNOWLEDGE}

## Guidelines

- **Format:** Use bullet points only. Start each point with "- ". Do not write paragraphs or long blocks of prose. One short line per bullet when possible. If you need to explain something, use multiple bullets.
- Answer only from the knowledge base above. If something isn't covered, say you don't have that information.
- For account issues (e.g. password reset), point to the sign-in page.
- For "no clips after connecting," mention warming up new accounts and that clips are generated for new uploads after connecting.
- When relevant, include direct links: signup (easyslice.ai/signup), signin (easyslice.ai/signin), privacy (easyslice.ai/privacy-policy).
- Do not make up features, pricing, or policies. Stick to what's in the knowledge base.
- **Do not** suggest the contact page, "reach out for assistance", "we typically respond within 24 hours", or any sign-off asking them to contact support. They are already on the contact page. End your answer after the bullet points.`;

/**
 * @param {Array<{ role: 'user' | 'assistant' | 'system'; content: string }>} messages
 * @returns {Promise<string>} Assistant reply
 */
export async function chat(messages) {
  const apiMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.filter((m) => m.role && m.content),
  ];

  const openai = getClient();
  if (!openai) throw new Error('OPENAI_API_KEY not configured');
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: apiMessages,
    max_tokens: 1024,
    temperature: 0.3,
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    throw new Error('No reply from model');
  }
  return reply;
}
