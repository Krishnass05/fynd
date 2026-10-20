import { run } from '@/lib/server/http';
import { logoutAccount } from '@/lib/server/auth';

export const POST = (req: Request) => run(req, () => logoutAccount());
