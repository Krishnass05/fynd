import { run } from '@/lib/server/http';
import { actor, listCallSignals } from '@/lib/server/service';

export const GET = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, url }) => listCallSignals(actor(userId), id, Number(url.searchParams.get('since')) || 0));
};
