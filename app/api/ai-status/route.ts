import { run } from '@/lib/server/http';
import { status } from '@/lib/engine/aiguard';

// Whether the AI second check is on (a key is set) and which provider. Never returns the key.
export const GET = (req: Request) => run(req, () => status(process.env));
