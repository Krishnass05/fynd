'use client';
// Client view of a project's milestones: see them and approve each one. OWNER: Krishna.
// (Harini can also embed <MilestoneList /> in the project page; this page works on its own.)
import { useParams } from 'next/navigation';
import { getProject } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import MilestoneList from '@/components/milestones/MilestoneList';
import { ButtonLink, ErrorMessage, Spinner } from '@/components/ui';

export default function ClientMilestones() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, setData } = useAsync(() => getProject(id), [id]);
  return (
    <>
      <p><ButtonLink href={`/client/projects/${id}`} variant="secondary">Back to the project</ButtonLink></p>
      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <>
          <h1>{data.project.jobTitle}</h1>
          <p className="muted">With {data.freelancer.name}. Approve a milestone when that part of the work is done.</p>
          <MilestoneList projectId={id} milestones={data.milestones} summary={data.milestoneSummary} role="client" onChanged={setData} />
        </>
      ) : null}
    </>
  );
}
