import { run } from '@/lib/server/http';
import { actor, rejectApplication } from '@/lib/server/service';

export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId }) => rejectApplication(actor(userId), id));
};
