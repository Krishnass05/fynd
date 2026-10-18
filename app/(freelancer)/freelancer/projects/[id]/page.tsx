'use client';
// Freelancer project workspace: signed SOW upload, change orders, capacity, chat. OWNER: Krishna.
import { useParams } from 'next/navigation';
import { getProject } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import Chat from '@/components/chat/Chat';
import Call from '@/components/call/Call';
import ChangeList from '@/components/changes/ChangeList';
import SowUpload from '@/components/sow/SowUpload';
import MilestoneList from '@/components/milestones/MilestoneList';
import { Card, ErrorMessage, Spinner, money } from '@/components/ui';

export default function FreelancerProject() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload, setData } = useAsync(() => getProject(id), [id]);
  return (
    <>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <>
          <h1>{data.project.jobTitle}</h1>
          <p className="muted">For {data.client.name} · rate {money(data.project.ratePerHour)}/hr · amounts before tax</p>
          <Card title="Capacity">
            <p>{data.totals.committedHours}h of {data.project.availableHours}h committed · {data.totals.remainingHours}h remaining · approved changes {money(data.totals.committedValue)}</p>
          </Card>
          <Card title="SOW versions">
            {data.sowDocuments.length ? data.sowDocuments.map((s) => <p key={s.id}>v{s.version} {s.kind}: {s.filename} ({s.items.length} items)</p>) : <p className="muted">No signed SOW yet.</p>}
          </Card>
          {!data.sowDocuments.some((s) => s.kind === 'baseline') ? (
            <Card title="Upload the signed SOW">
              <SowUpload projectId={id} kind="baseline" onDone={() => void reload()} />
            </Card>
          ) : null}
          <MilestoneList projectId={id} milestones={data.milestones} summary={data.milestoneSummary} role="freelancer" onChanged={setData} />
          <h2>Change orders</h2>
          <ChangeList projectId={id} changes={data.changeRequests} canDecide={false} onChanged={setData} />
          <h2>Call</h2>
          <Card plain><Call projectId={id} peerName={data.client.name} /></Card>
          <h2>Chat</h2>
          <Card plain><Chat projectId={id} role="freelancer" /></Card>
        </>
      ) : null}
    </>
  );
}
