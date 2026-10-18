import { run } from '@/lib/server/http';
import { registerAccount } from '@/lib/server/auth';

export const POST = (req: Request) => run(req, ({ body }) => registerAccount(body));
