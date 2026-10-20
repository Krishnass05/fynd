import { run } from '@/lib/server/http';
import { actor, leaveReview } from '@/lib/server/service';

// Feedback after the job: { rating: 1-5, text }. Open once the client has approved every milestone; one per side.
export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => leaveReview(actor(userId), id, body));
};
