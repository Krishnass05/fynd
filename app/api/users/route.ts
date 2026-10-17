import { run } from '@/lib/server/http';
import { listUsers } from '@/lib/server/service';

export const GET = (req: Request) => run(req, () => listUsers());
