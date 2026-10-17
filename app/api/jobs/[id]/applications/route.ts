import { run } from '@/lib/server/http';
import { actor, applyToJob } from '@/lib/server/service';

export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => applyToJob(actor(userId), id, body));
};
