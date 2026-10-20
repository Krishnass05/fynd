import { run } from '@/lib/server/http';
import { actor, setSaved } from '@/lib/server/service';

// PUT { saved: true | false } saves or removes a freelancer from the client's shortlist.
export const PUT = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => setSaved(actor(userId), id, body.saved));
};
