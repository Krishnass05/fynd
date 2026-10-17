import { run } from '@/lib/server/http';
import { actor, listCallSignals } from '@/lib/server/service';

// Poll for call signals addressed to this member since the given sequence number.
export const GET = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, url }) => {
    const since = Number(url.searchParams.get('since')) || 0;
    return listCallSignals(actor(userId), id, since);
  });
};
