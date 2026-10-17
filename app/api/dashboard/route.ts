import { run } from '@/lib/server/http';
import { actor, freelancerDashboard } from '@/lib/server/service';

export const GET = (req: Request) => run(req, ({ userId }) => freelancerDashboard(actor(userId)));
