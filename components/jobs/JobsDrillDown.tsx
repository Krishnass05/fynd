'use client';
// Step 3: "Jobs" Tab Drill-Down Flow
// 1. Sub-Navigation Tabs: 'Recently Viewed Jobs', 'Find New Jobs', 'Already Working On Jobs'
// 2. Domain Filter Grid: Web Development, UI/UX Design, AI/ML & Data Science, E-Commerce
// 3. Job Listings & Detail View:
//    - Full Job Description
//    - Baseline Included Scope & Exclusions (Case C35 fixture data)
//    - Required Skills badges
//    - Primary CTA Button: [ Accept Job / Open Project Workspace ]
import { useState } from 'react';
import fixture from '@/fixture.json';
import { money } from '@/components/ui';

export type JobSubTab = 'recent' | 'find' | 'working';
export type DomainCategory = 'web' | 'design' | 'ai' | 'ecommerce';

export interface JobItem {
  id: string;
  projectId: string;
  title: string;
  domain: DomainCategory;
  categoryName: string;
  clientHandle: string;
  description: string;
  hourlyRate: number;
  availableHours: number;
  budget: number;
  deadline: string;
  includedScope: string[];
  excludedScope: string[];
  skills: string[];
  isFlagship?: boolean;
}

const JOBS_CATALOG: JobItem[] = [
  {
    id: 'J_FLAGSHIP',
    projectId: 'P1',
    title: 'Landing page for a small shop (Flagship Contract)',
    domain: 'web',
    categoryName: 'Web Development',
    clientHandle: 'Client_A',
    description:
      'Develop a responsive, high-converting landing page with a validated contact form. Strict capacity ceiling of 10 hours at ₹1,000/hr before tax. Scope boundaries are legally locked in baseline SOW v1.',
    hourlyRate: fixture.ratePerHour || 1000,
    availableHours: fixture.availableHours || 10,
    budget: 10000,
    deadline: '2026-11-15',
    includedScope: fixture.scope?.included || ['one landing page', 'contact form'],
    excludedScope: fixture.scope?.excluded || ['payment checkout'],
    skills: ['React', 'Node.js', 'WebRTC', 'UI Design', 'ScopeDesk'],
    isFlagship: true,
  },
  {
    id: 'J_WEB_2',
    projectId: 'P2',
    title: 'SaaS Customer Onboarding Portal',
    domain: 'web',
    categoryName: 'Web Development',
    clientHandle: 'Client_B',
    description:
      'Build step-by-step interactive onboarding flow with telemetry tracking and workspace invite links.',
    hourlyRate: 1200,
    availableHours: 15,
    budget: 18000,
    deadline: '2026-11-28',
    includedScope: ['3-step onboarding wizard', 'team invite modal'],
    excludedScope: ['custom billing integration', 'SSO authentication'],
    skills: ['Next.js', 'TypeScript', 'Tailwind', 'REST API'],
  },
  {
    id: 'J_UIUX_1',
    projectId: 'P3',
    title: 'Fintech Mobile Dashboard Wireframes & Design System',
    domain: 'design',
    categoryName: 'UI/UX Design',
    clientHandle: 'Client_C',
    description:
      'Create high-fidelity Figma components and tokenized dark/light UI palette for an investment tracking app.',
    hourlyRate: 950,
    availableHours: 20,
    budget: 19000,
    deadline: '2026-12-05',
    includedScope: ['Figma design system tokens', '5 core application views'],
    excludedScope: ['interactive micro-prototypes', 'user testing sessions'],
    skills: ['Figma', 'UI Design', 'Design Systems', 'Accessibility'],
  },
  {
    id: 'J_AI_1',
    projectId: 'P4',
    title: 'Enterprise Document RAG Extractor & Classifier',
    domain: 'ai',
    categoryName: 'AI/ML & Data Science',
    clientHandle: 'Client_D',
    description:
      'Build offline deterministic text classifier pipeline and vector semantic search over contracts and SOWs.',
    hourlyRate: 1500,
    availableHours: 25,
    budget: 37500,
    deadline: '2026-12-10',
    includedScope: ['PDF chunking pipeline', 'hybrid keyword/vector search'],
    excludedScope: ['fine-tuned LLM checkpoints', 'multi-region GPU deployment'],
    skills: ['Python', 'Embeddings', 'LangChain', 'FastAPI'],
  },
  {
    id: 'J_ECOM_1',
    projectId: 'P5',
    title: 'Multi-Vendor Product Catalog & Cart Workflow',
    domain: 'ecommerce',
    categoryName: 'E-Commerce',
    clientHandle: 'Client_E',
    description:
      'Implement responsive catalog filtering, inventory state sync, and headless cart reconciliation.',
    hourlyRate: 1100,
    availableHours: 18,
    budget: 19800,
    deadline: '2026-12-01',
    includedScope: ['product grid with facet filters', 'in-memory cart state'],
    excludedScope: ['Stripe payment gateway', 'logistics courier API'],
    skills: ['React', 'State Management', 'E-Commerce', 'GraphQL'],
  },
];

interface JobsDrillDownProps {
  onOpenWorkspace: (projectId: string, job: JobItem) => void;
}

export default function JobsDrillDown({ onOpenWorkspace }: JobsDrillDownProps) {
  const [subTab, setSubTab] = useState<JobSubTab>('find');
  const [selectedDomain, setSelectedDomain] = useState<DomainCategory>('web');
  const [selectedJobId, setSelectedJobId] = useState<string>('J_FLAGSHIP');

  // Filter jobs based on subTab & domain
  const domainJobs = JOBS_CATALOG.filter((j) => {
    if (subTab === 'working') return j.isFlagship;
    if (subTab === 'recent') return j.domain === selectedDomain || j.isFlagship;
    return j.domain === selectedDomain;
  });

  const activeJob = JOBS_CATALOG.find((j) => j.id === selectedJobId) || JOBS_CATALOG[0];

  const domains: Array<{ id: DomainCategory; label: string; icon: string; count: number }> = [
    { id: 'web', label: 'Web Development', icon: '[Web]', count: 2 },
    { id: 'design', label: 'UI/UX Design', icon: '[UI]', count: 1 },
    { id: 'ai', label: 'AI/ML & Data Science', icon: '[AI]', count: 1 },
    { id: 'ecommerce', label: 'E-Commerce', icon: '[Shop]', count: 1 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Sub-Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 6,
          gap: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setSubTab('recent')}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            background: subTab === 'recent' ? 'var(--space-indigo)' : 'transparent',
            color: subTab === 'recent' ? 'var(--seashell)' : 'var(--dusty-grape)',
            transition: 'all 0.15s ease',
          }}
        >
          Recently Viewed Jobs
        </button>
        <button
          type="button"
          onClick={() => setSubTab('find')}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            background: subTab === 'find' ? 'var(--space-indigo)' : 'transparent',
            color: subTab === 'find' ? 'var(--seashell)' : 'var(--dusty-grape)',
            transition: 'all 0.15s ease',
          }}
        >
          Find New Jobs
        </button>
        <button
          type="button"
          onClick={() => setSubTab('working')}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            background: subTab === 'working' ? 'var(--space-indigo)' : 'transparent',
            color: subTab === 'working' ? 'var(--seashell)' : 'var(--dusty-grape)',
            transition: 'all 0.15s ease',
          }}
        >
          Already Working On Jobs
        </button>
      </div>

      {/* 2. Domain Filter Grid */}
      <div>
        <h3 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--space-indigo)' }}>
          Domain Categories
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {domains.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                setSelectedDomain(d.id);
                const first = JOBS_CATALOG.find((j) => j.domain === d.id);
                if (first) setSelectedJobId(first.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                border: selectedDomain === d.id ? '2px solid var(--space-indigo)' : '1px solid var(--line)',
                background: selectedDomain === d.id ? 'var(--seashell)' : 'var(--card)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 24 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--space-indigo)' }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {d.count} job{d.count > 1 ? 's' : ''} available
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Job Listings & Detail View Split Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 20 }}>
        {/* Left Column: Job Listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: 'var(--space-indigo)' }}>
            Matching Listings ({domainJobs.length})
          </h3>
          {domainJobs.map((j) => (
            <div
              key={j.id}
              onClick={() => setSelectedJobId(j.id)}
              style={{
                background: selectedJobId === j.id ? 'var(--seashell)' : 'var(--card)',
                border: selectedJobId === j.id ? '2px solid var(--dusty-grape)' : '1px solid var(--line)',
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                boxShadow: selectedJobId === j.id ? '0 4px 12px rgba(34, 34, 59, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: 'var(--space-indigo)' }}>
                  {j.title}
                </h4>
                {j.isFlagship ? (
                  <span
                    style={{
                      background: 'var(--space-indigo)',
                      color: 'var(--seashell)',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    CASE C35
                  </span>
                ) : null}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--dusty-grape)', lineHeight: 1.4 }}>
                {j.description.slice(0, 110)}...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--space-indigo)' }}>
                  {money(j.hourlyRate)}/hr · {j.availableHours}h cap
                </span>
                <span className="muted">By {j.clientHandle}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Detailed Job View */}
        <div
          style={{
            background: 'var(--card)',
            border: '2px solid var(--dusty-grape)',
            borderRadius: 16,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 8px 24px rgba(34, 34, 59, 0.06)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                {activeJob.categoryName} · Posted by {activeJob.clientHandle}
              </span>
              {activeJob.isFlagship ? (
                <span className="badge pro">Flagship C35 Baseline</span>
              ) : null}
            </div>
            <h2 style={{ margin: '0 0 10px', fontSize: 20, color: 'var(--space-indigo)' }}>
              {activeJob.title}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--dusty-grape)', lineHeight: 1.5 }}>
              {activeJob.description}
            </p>
          </div>

          {/* Baseline Scope & Exclusions Breakdown (Fixture Data) */}
          <div
            style={{
              background: 'var(--seashell)',
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--space-indigo)', marginBottom: 10 }}>
              [SOW] Baseline Scope &amp; Legal Exclusions (SOW v1)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 6 }}>
                  [Included] INCLUDED SCOPE:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--dusty-grape)' }}>
                  {activeJob.includedScope.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      <strong>{item}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 6 }}>
                  [Excluded] EXCLUDED SCOPE (Requires Scope Change):
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--dusty-grape)' }}>
                  {activeJob.excludedScope.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>
                      <span style={{ textDecoration: 'line-through' }}>{item}</span>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>
                        (Triggers ScopeDesk R1 quote @ ₹1,000/hr)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Commercial Terms & Capacity */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              padding: 12,
              borderRadius: 10,
              background: 'var(--card)',
              border: '1px solid var(--line)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Hourly Rate</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--space-indigo)' }}>
                {money(activeJob.hourlyRate)}/hr
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>before tax</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Baseline Capacity</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--space-indigo)' }}>
                {activeJob.availableHours} Hours
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>strictly capped</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total Contract Budget</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--space-indigo)' }}>
                {money(activeJob.budget)}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>fixed baseline</div>
            </div>
          </div>

          {/* Required Skills Badges */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--dusty-grape)', marginBottom: 8 }}>
              Required Skills Badges:
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activeJob.skills.map((skill) => (
                <span key={skill} className="badge">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Primary CTA Button */}
          <button
            type="button"
            className="btn"
            onClick={() => onOpenWorkspace(activeJob.projectId, activeJob)}
            style={{
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 700,
              background: 'var(--space-indigo)',
              color: 'var(--seashell)',
              justifyContent: 'center',
              borderRadius: 12,
              marginTop: 'auto',
              boxShadow: '0 4px 14px rgba(34, 34, 59, 0.25)',
              cursor: 'pointer',
            }}
          >
            [Open] [ Accept Job / Open Project Workspace ]
          </button>
        </div>
      </div>
    </div>
  );
}
