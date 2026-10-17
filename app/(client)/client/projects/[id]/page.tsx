'use client';
// Client project page: overview, amendment upload, change orders, chat. OWNER: Harini.
// Starter version works end to end; improve it to the final design.
import { useParams } from 'next/navigation';
import { getProject } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import Chat from '@/components/chat/Chat';
import ChangeList from '@/components/changes/ChangeList';
import SowUpload from '@/components/sow/SowUpload';
import { Card, ErrorMessage, Spinner, money } from '@/components/ui';

export default function ClientProject() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload, setData } = useAsync(() => getProject(id), [id]);
  return (
    <>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <>
          <h1>{data.project.jobTitle}</h1>
          <p className="muted">With {data.freelancer.name} · rate {money(data.project.ratePerHour)}/hr · amounts before tax</p>
          <Card title="Capacity and value">
            <p>{data.totals.committedHours}h of {data.project.availableHours}h committed · {data.totals.remainingHours}h remaining · approved changes {money(data.totals.committedValue)}</p>
          </Card>
          <Card title="SOW versions">
            {data.sowDocuments.length ? data.sowDocuments.map((s) => <p key={s.id}>v{s.version} {s.kind}: {s.filename} ({s.items.length} items)</p>) : <p className="muted">No signed SOW uploaded yet. The freelancer uploads it first.</p>}
          </Card>
          {data.sowDocuments.length ? (
            <Card title="Ask for more work">
              <SowUpload projectId={id} kind="amendment" onDone={() => void reload()} />
            </Card>
          ) : null}
          <h2>Change orders</h2>
          <ChangeList projectId={id} changes={data.changeRequests} canDecide onChanged={setData} />
          <h2>Chat</h2>
          <Card plain><Chat projectId={id} role="client" /></Card>
        </>
      ) : null}
    </>
  );
}
