import { run } from '@/lib/server/http';
import { actor, getFreelancerProfile } from '@/lib/server/service';

export const GET = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId }) => getFreelancerProfile(actor(userId), id));
};
