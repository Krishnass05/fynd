'use client';
// A project as a pastel card: pill, title, a line of detail, a row of facts, a capacity bar, then a footer button.
// Used by the client and freelancer dashboards. OWNER: Sanjana (look).
import type { ReactNode } from 'react';
import { ButtonLink, Card, Meta } from './index';
import { FileText } from './icons';

export default function ProjectCard({ title, detail, facts, usedPercent, badge = 'In progress', footerLabel, footerValue, href, cta, secondary }: {
  title: string;
  detail: string;
  facts: Array<{ icon?: ReactNode; text: string }>;
  usedPercent: number;
  badge?: string;
  footerLabel: string;
  footerValue: ReactNode;
  href: string;
  cta: string;
  secondary?: { href: string; label: string };
}) {
  return (
    <Card
      title={title}
      badge={badge}
      icon={<FileText size={38} />}
      progress={{ value: usedPercent, label: 'Capacity used' }}
      footer={
        <>
          <span>{footerLabel}: <b>{footerValue}</b></span>
          <span className="pcard-actions">
            {secondary ? <ButtonLink href={secondary.href} variant="secondary">{secondary.label}</ButtonLink> : null}
            <ButtonLink href={href}>{cta}</ButtonLink>
          </span>
        </>
      }
    >
      <p className="pcard-desc">{detail}</p>
      <Meta items={facts} />
    </Card>
  );
}
