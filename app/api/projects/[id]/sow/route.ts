import { run } from '@/lib/server/http';
import { actor, uploadSow } from '@/lib/server/service';

export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => uploadSow(actor(userId), id, body));
};
