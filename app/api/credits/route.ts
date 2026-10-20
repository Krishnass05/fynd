import { run } from '@/lib/server/http';
import { actor, getCredits } from '@/lib/server/service';

// A client's call credits: balance, packs and history. Freelancers get 403 (calls are free for them).
export const GET = (req: Request) => run(req, ({ userId }) => getCredits(actor(userId)));
