import { run } from '@/lib/server/http';
import { actor, listProjects } from '@/lib/server/service';

export const GET = (req: Request) => run(req, ({ userId }) => listProjects(actor(userId)));
