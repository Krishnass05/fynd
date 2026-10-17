import { run } from '@/lib/server/http';
import { actor, listSaved } from '@/lib/server/service';

export const GET = (req: Request) => run(req, ({ userId }) => listSaved(actor(userId)));
