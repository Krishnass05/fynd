import { run } from '@/lib/server/http';
import { actor, listMessages, sendMessage } from '@/lib/server/service';

export const GET = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId }) => listMessages(actor(userId), id));
};
export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => sendMessage(actor(userId), id, body));
};
