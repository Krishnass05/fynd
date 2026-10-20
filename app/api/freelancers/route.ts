import { run } from '@/lib/server/http';
import { actor, searchFreelancers } from '@/lib/server/service';

export const GET = (req: Request) => run(req, ({ userId, url }) => searchFreelancers(actor(userId), url.searchParams));
