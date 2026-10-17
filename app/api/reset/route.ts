import { run } from '@/lib/server/http';
import { resetDb } from '@/lib/server/store';

// Resets the in-memory data to the seed. For demos and tests only.
export const POST = (req: Request) => run(req, () => { resetDb(); return { ok: true }; });
