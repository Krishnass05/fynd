import { run } from '@/lib/server/http';
import { actor, reportCaption } from '@/lib/server/service';

// The AI check can take a few seconds, so allow the function more time on the host.
export const maxDuration = 30;

export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => reportCaption(actor(userId), id, body));
};
