import { run } from '@/lib/server/http';
import { googleConfig } from '@/lib/server/google';

// What the sign-in pages can offer. Never returns a secret.
export const GET = (req: Request) => run(req, () => ({ google: Boolean(googleConfig()) }));
