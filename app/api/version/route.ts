// Which commit this server was built from, so a deploy can be checked from outside. Vercel sets the variables;
// locally they are empty. Nothing secret is returned.
export const dynamic = 'force-dynamic';

export const GET = () =>
  Response.json({
    commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'local',
    env: process.env.VERCEL_ENV || 'local',
  });
