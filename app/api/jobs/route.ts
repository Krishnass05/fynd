import { run } from '@/lib/server/http';
import { actor, createJob, listJobs } from '@/lib/server/service';

export const GET = (req: Request) =>
  run(req, ({ userId, url }) => listJobs(actor(userId), url.searchParams.get('mine') === '1', url.searchParams.get('status')));
export const POST = (req: Request) => run(req, ({ userId, body }) => createJob(actor(userId), body));
