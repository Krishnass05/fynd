import { run } from '@/lib/server/http';
import { actor, buyCredits } from '@/lib/server/service';

// Buy a credit pack: { pack }. Demo: no payment is taken; the credits are added straight away.
export const POST = (req: Request) => run(req, ({ userId, body }) => buyCredits(actor(userId), body));
