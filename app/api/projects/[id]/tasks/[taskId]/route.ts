import { run } from '@/lib/server/http';
import { actOnTask, actor } from '@/lib/server/service';

// One step on a task request: { action: included | defect | quote | ask | details | decline | counter | accept, ... }.
// Returns the whole project, so the page can redraw the totals too.
export const POST = async (req: Request, c: { params: Promise<{ id: string; taskId: string }> }) => {
  const { id, taskId } = await c.params;
  return run(req, ({ userId, body }) => actOnTask(actor(userId), id, taskId, body));
};
