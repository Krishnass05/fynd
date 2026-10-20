import { run } from '@/lib/server/http';
import { actor, createTask, listTasks } from '@/lib/server/service';

// New tasks asked for in plain English: list them, or (client) ask for one.
export const GET = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId }) => listTasks(actor(userId), id));
};
export const POST = async (req: Request, c: { params: Promise<{ id: string }> }) => {
  const { id } = await c.params;
  return run(req, ({ userId, body }) => createTask(actor(userId), id, body));
};
