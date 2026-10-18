import { run } from '@/lib/server/http';
import { actOnWork, actor } from '@/lib/server/service';

// One task on the task list: { action: 'move', to, note? } or { action: 'milestone', milestoneId }. Returns the project.
// The key looks like sow:S1:0 or task:T12 (sent URL-encoded).
export const POST = async (req: Request, c: { params: Promise<{ id: string; key: string }> }) => {
  const { id, key } = await c.params;
  return run(req, ({ userId, body }) => actOnWork(actor(userId), id, decodeURIComponent(key), body));
};
