import { run } from '@/lib/server/http';
import { library } from '@/lib/server/library';
import { actor } from '@/lib/server/service';

export const GET = (req: Request) => run(req, ({ userId }) => { actor(userId); return library(); });
