import { run } from '@/lib/server/http';
import { actor, startCall } from '@/lib/server/service';

// Caller rings the other project member to begin an audio call.
export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId }) => startCall(actor(userId), id));
};
