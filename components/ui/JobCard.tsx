'use client';
// A job as a pastel card: pill with the status, title, short description, budget and deadline, then a footer button.
// Used on the client and freelancer job lists and dashboards. OWNER: Sanjana (look).
import type { Job } from '@/lib/types';
import { ButtonLink, Card, Meta, money } from './index';
import { Briefcase, Calendar, Rupee } from './icons';

const STATUS = { open: 'Open', in_progress: 'In progress', closed: 'Closed' } as const;

export default function JobCard({ job, href, cta }: { job: Job; href: string; cta: string }) {
  return (
    <Card
      title={job.title}
      badge={STATUS[job.status]}
      icon={<Briefcase size={38} />}
      footer={
        <>
          <span>Deadline: <b>{job.deadline}</b></span>
          <ButtonLink href={href}>{cta}</ButtonLink>
        </>
      }
    >
      <p className="pcard-desc">{job.description}</p>
      <Meta items={[{ icon: <Rupee />, text: `${money(job.budget)} budget` }, { icon: <Calendar />, text: job.deadline }]} />
    </Card>
  );
}
