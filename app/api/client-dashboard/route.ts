import { run } from '@/lib/server/http';
import { actor, clientDashboard } from '@/lib/server/service';

export const GET = (req: Request) => run(req, ({ userId }) => clientDashboard(actor(userId)));
