import { run } from '@/lib/server/http';
import { actor, reviewSow } from '@/lib/server/service';

// Sign-off of the first SOW. Freelancer: { action: approve, rows? } or { action: send_back, note }.
// Client: { action: confirm } or { action: send_back, note }. Returns the whole project.
export const POST = async (req: Request, c: { params: Promise<{ id: string; docId: string }> }) => {
  const { id, docId } = await c.params;
  return run(req, ({ userId, body }) => reviewSow(actor(userId), id, docId, body));
};
