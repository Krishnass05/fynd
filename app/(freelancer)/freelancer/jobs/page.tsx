'use client';
// Step 3: Freelancer Job Discovery Flow (/freelancer/jobs)
// Sub-navigation tabs: Recently Viewed, Find New Jobs, Already Working On
// Domain filter grid (Web Dev, UI/UX, AI/ML, E-Commerce)
// Detail view with baseline scope, exclusions, skills, and CTA: [ Accept Job / Open Project Workspace ]
import { useState } from 'react';
import JobsDrillDown from '@/components/jobs/JobsDrillDown';
import UnifiedWorkspace from '@/components/workspace/UnifiedWorkspace';

export default function FindJobsPage() {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>('P1');

  if (workspaceOpen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn secondary pill-sm"
            onClick={() => setWorkspaceOpen(false)}
          >
            ← Back to Jobs Drill-Down
          </button>
          <span className="badge pro">Case C35 Project Workspace Active</span>
        </div>
        <UnifiedWorkspace
          projectId={activeProjectId}
          onClose={() => setWorkspaceOpen(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--card)', padding: '20px 24px', borderRadius: 16, border: '1px solid var(--line)' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, color: 'var(--space-indigo)' }}>
          Job Discovery &amp; Scope Negotiation
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Browse open listings, inspect baseline deliverables and exclusions before accepting work.
        </p>
      </div>

      <div style={{ background: 'var(--card)', padding: 24, borderRadius: 16, border: '1px solid var(--line)' }}>
        <JobsDrillDown
          onOpenWorkspace={(projId) => {
            setActiveProjectId(projId);
            setWorkspaceOpen(true);
          }}
        />
      </div>
    </div>
  );
}
