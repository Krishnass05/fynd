import { run } from '@/lib/server/http';
import { demo } from '@/lib/server/service';

export const GET = (req: Request) => run(req, () => demo());
