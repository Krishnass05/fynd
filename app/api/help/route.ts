import { run } from '@/lib/server/http';
import { bad } from '@/lib/server/errors';
import { answer } from '@/lib/engine/helpbot';
import { ask } from '@/lib/engine/aihelp';

// The Help assistant. The keyword answer is always worked out; if an AI key is set, a model writes the reply from the
// site guide instead (and only from the guide). If the model is off, slow or busy, the keyword answer is returned.
// A small limit keeps the free AI quota from being used up: 20 AI answers a minute for the whole site.
let windowStart = 0;
let used = 0;
const allowAi = () => {
  const now = Date.now();
  if (now - windowStart > 60_000) { windowStart = now; used = 0; }
  used += 1;
  return used <= 20;
};

// The AI check can take a few seconds, so allow the function more time on the host.
export const maxDuration = 30;

export const POST = (req: Request) => run(req, async ({ body }) => {
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) throw bad('Type a question');
  if (question.length > 300) throw bad('Keep the question under 300 characters');
  const role = body.role === 'client' || body.role === 'freelancer' ? body.role : undefined;
  const rules = answer(question, role);
  const ai = allowAi() ? await ask(question, role, { env: process.env }) : null;
  return { text: ai ?? rules.text, links: rules.links, topics: rules.topics, source: ai ? 'ai' : 'rules' };
});
