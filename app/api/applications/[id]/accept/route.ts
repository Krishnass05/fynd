import { run } from '@/lib/server/http';
import { acceptApplication, actor } from '@/lib/server/service';

export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId }) => acceptApplication(actor(userId), id));
};
