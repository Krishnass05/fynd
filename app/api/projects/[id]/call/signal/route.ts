import { run } from '@/lib/server/http';
import { actor, sendCallSignal } from '@/lib/server/service';

// Exchange offer / answer / ICE / hangup / reject between the two project members.
export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => sendCallSignal(actor(userId), id, body));
};
