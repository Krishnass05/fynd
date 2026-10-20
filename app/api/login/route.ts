import { run } from '@/lib/server/http';
import { loginAccount } from '@/lib/server/auth';

export const POST = (req: Request) => run(req, ({ body }) => loginAccount(body));
