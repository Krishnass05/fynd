'use client';
// The three case outcome checks, in printed order. OWNER: Krishna.
import { runCaseChecks } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import AppNav from '@/components/shell/AppNav';
import { Badge, Button, Card, ErrorMessage, Spinner } from '@/components/ui';

export default function Demo() {
  const { data, error, loading, reload } = useAsync(runCaseChecks, []);
  return (
    <main id="main-content" className="page">
      <div className="appbar-public"><AppNav /></div>
      <h1>Case outcome checks</h1>
      <p className="muted">Runs on a scratch desk, so your data is untouched.</p>
      <Button onClick={() => void reload()}>Run again</Button>
      <ErrorMessage message={error} />
      {loading ? <Spinner /> : null}
      {(data?.steps ?? []).map((s) => (
        <Card key={s.n} title={`${s.n}. ${s.title}`}>
          <Badge tone={s.pass ? 'good' : 'bad'}>{s.pass ? 'PASS' : 'FAIL'}</Badge>
          <p className="muted">Expected: {s.expected}</p>
          <p className="muted">Actual: {s.actual}</p>
        </Card>
      ))}
    </main>
  );
}
