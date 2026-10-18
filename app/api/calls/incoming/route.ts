import { run } from '@/lib/server/http';
import { actor, incomingCalls } from '@/lib/server/service';

// Calls ringing for the signed-in person right now, across their projects (the pop-up and ringtone poll this).
export const GET = (req: Request) => run(req, ({ userId }) => incomingCalls(actor(userId)));
