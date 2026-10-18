'use client';
// Client project page: overview, amendment upload, change orders, chat. OWNER: Harini.
// Starter version works end to end; improve it to the final design.
import { useParams } from 'next/navigation';
import { getProject } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import Chat from '@/components/chat/Chat';
import Call from '@/components/call/Call';
import ChangeList from '@/components/changes/ChangeList';
import SowUpload from '@/components/sow/SowUpload';
import SowReview from '@/components/sow/SowReview';
import TaskRequests from '@/components/tasks/TaskRequests';
import ProjectFeedback from '@/components/profile/ProjectFeedback';
import WorkBoard from '@/components/work/WorkBoard';
import CheckIns from '@/components/work/CheckIns';
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
            <p>{data.totals.committedHours}h of {data.project.availableHours}h committed · {data.totals.remainingHours}h remaining · agreed extra work {money(data.totals.committedValue)}</p>
          </Card>
          <Card title="SOW">
            <SowReview projectId={id} role="client" docs={data.sowDocuments} ratePerHour={data.project.ratePerHour} onChanged={setData} onUploaded={() => void reload()} />
          </Card>
          {data.sowDocuments.some((s) => s.kind === 'baseline' && (s.status ?? 'signed') === 'signed') ? (
            <Card title="Ask for more work">
              <SowUpload projectId={id} kind="amendment" onDone={() => void reload()} />
            </Card>
          ) : null}
          <h2>Tasks and progress</h2>
          <WorkBoard projectId={id} role="client" work={data.work} progress={data.progress} milestones={data.milestones} onChanged={setData} />
          <h2>Daily check-ins</h2>
          <CheckIns projectId={id} role="client" checkins={data.checkins} status={data.checkinStatus} work={data.work} freelancerName={data.freelancer.name} onChanged={setData} />
          <h2>Ask for a new task</h2>
          <TaskRequests projectId={id} role="client" tasks={data.taskRequests} ratePerHour={data.project.ratePerHour} onChanged={setData} />
          <h2>Change orders</h2>
          <ChangeList projectId={id} changes={data.changeRequests} canDecide onChanged={setData} />
          <h2>Feedback</h2>
          <Card plain><ProjectFeedback projectId={id} otherName={data.freelancer.name} data={data.feedback} onChanged={setData} /></Card>
          <h2>Call</h2>
          <Card plain><Call projectId={id} peerName={data.freelancer.name} credits={data.callCredits} onLive={() => void reload()} /></Card>
          <h2>Chat</h2>
          <Card plain><Chat projectId={id} role="client" /></Card>
        </>
      ) : null}
    </>
  );
}
