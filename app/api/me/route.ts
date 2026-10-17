import { run } from '@/lib/server/http';
import { actor, updateMe } from '@/lib/server/service';

export const GET = (req: Request) => run(req, ({ userId }) => actor(userId));
export const PUT = (req: Request) => run(req, ({ userId, body }) => updateMe(actor(userId), body));
