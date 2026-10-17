import { run } from '@/lib/server/http';
import { siteStats } from '@/lib/server/service';

// Public: real counts from our own data, shown on the landing page. No sign-in needed.
export const GET = (req: Request) => run(req, () => siteStats());
