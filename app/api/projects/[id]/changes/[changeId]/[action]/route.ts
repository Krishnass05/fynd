import { run } from '@/lib/server/http';
import { bad } from '@/lib/server/errors';
import { actor, approveChange, rejectChange, reopenChange } from '@/lib/server/service';

export const POST = async (req: Request, c: { params: Promise<{ id: string; changeId: string; action: string }> }) => {
  const { id, changeId, action } = await c.params;
  return run(req, ({ userId, body }) => {
    const u = actor(userId);
    if (action === 'approve') return approveChange(u, id, changeId);
    if (action === 'reject') return rejectChange(u, id, changeId, body.reason);
    if (action === 'reopen') return reopenChange(u, id, changeId, body.reason);
    throw bad('action must be approve, reject or reopen');
  });
};
