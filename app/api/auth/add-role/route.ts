import { run } from '@/lib/server/http';
import { addRole } from '@/lib/server/auth';
import { actor } from '@/lib/server/service';

// Adds the other side (client or freelancer) to the signed-in account.
export const POST = (req: Request) => run(req, ({ userId, body }) => addRole(actor(userId), body.role));
