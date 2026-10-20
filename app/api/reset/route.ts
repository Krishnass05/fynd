import { run } from '@/lib/server/http';
import { forbidden } from '@/lib/server/errors';
import { clearSignals, persistent } from '@/lib/server/persist';
import { resetDb } from '@/lib/server/store';

// Puts the demo data back. For demos and tests only: in production it is OFF unless ALLOW_RESET=true is set,
// because anyone who found it could wipe the live data.
export const POST = (req: Request) => run(req, async () => {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_RESET !== 'true') throw forbidden('Reset is switched off on this site');
  resetDb();
  if (persistent()) await clearSignals();
  return { ok: true };
});
