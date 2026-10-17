import { run } from '@/lib/server/http';
import { login } from '@/lib/server/service';

export const POST = (req: Request) => run(req, ({ body }) => login(body));
