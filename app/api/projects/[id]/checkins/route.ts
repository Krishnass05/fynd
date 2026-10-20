import { run } from '@/lib/server/http';
import { actor, addCheckin } from '@/lib/server/service';

// The freelancer's daily check-in: { did, hours, blockers?, moved?: [{ key, to }] }. One a day (India time).
export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => addCheckin(actor(userId), id, body));
};
