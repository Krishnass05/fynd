import { run } from '@/lib/server/http';
import { bad } from '@/lib/server/errors';
import { actor, approveMilestone, markMilestoneReady } from '@/lib/server/service';

export const POST = async (req: Request, c: { params: Promise<{ id: string; milestoneId: string; action: string }> }) => {
  const { id, milestoneId, action } = await c.params;
  return run(req, ({ userId }) => {
    const u = actor(userId);
    if (action === 'ready') return markMilestoneReady(u, id, milestoneId);
    if (action === 'approve') return approveMilestone(u, id, milestoneId);
    throw bad('action must be ready or approve');
  });
};
