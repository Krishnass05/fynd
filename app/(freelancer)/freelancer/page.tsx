'use client';
// Step 2: Main Freelancer Portal (3-Column + Top Navbar Layout)
// Features:
//  - Left Sidebar: Task List Panel (interactive checklist, remaining effort capacity 10h baseline, active milestones)
//  - Right Sidebar: Notifications Panel (real-time platform alerts)
//  - Center Main Content Area: Dynamically renders Dashboard, Jobs (Step 3), or Profile
//  - Flagship Case C35 integration with instant Open Project Workspace CTA
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import fixture from '@/fixture.json';
import JobsDrillDown from '@/components/jobs/JobsDrillDown';
import UnifiedWorkspace from '@/components/workspace/UnifiedWorkspace';
import { getCallCount, isProSubscribed } from '@/lib/subscription';
import { money } from '@/components/ui';

export type PortalTab = 'dashboard' | 'jobs' | 'profile';

export interface TaskItem {
  id: string;
  label: string;
  hours: number;
  completed: boolean;
  isScopeChange?: boolean;
}

export default function FreelancerPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string>('P1');

  // Subscription state
  const [callCount, setCallCountState] = useState(0);
  const [isSubscribed, setIsSubscribedState] = useState(false);

  useEffect(() => {
    function sync() {
      setCallCountState(getCallCount());
      setIsSubscribedState(isProSubscribed());
    }
    sync();
    window.addEventListener('scopedesk_subscription_updated', sync);
    return () => window.removeEventListener('scopedesk_subscription_updated', sync);
  }, []);

  // Left Sidebar: Interactive Checklist & Capacity
  const baselineHours = fixture.availableHours || 10;
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', label: 'Baseline SOW v1 Agreement', hours: 0, completed: true },
    { id: 't2', label: 'One Landing Page Structure', hours: 4, completed: true },
    { id: 't3', label: 'Contact Form Integration', hours: 2, completed: false },
    { id: 't4', label: 'Scope Request R1 (Payment Checkout)', hours: 6, completed: false, isScopeChange: true },
  ]);

  const [capacityCommitted, setCapacityCommitted] = useState(6); // Default starting committed hours

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  const remainingHours = Math.max(0, baselineHours - capacityCommitted);

  // Right Sidebar: Real-time Notifications Panel
  const notifications = [
    {
      id: 'n1',
      icon: '[Scope]',
      title: 'Scope Request R1 Received',
      desc: 'Client_A submitted "Add payment checkout" (6 hrs) flagged as Exclusion Override.',
      time: '5m ago',
      urgent: true,
    },
    {
      id: 'n2',
      icon: '[Call]',
      title: 'Incoming WebRTC Call Ready',
      desc: 'Browser-native peer room projectFor(P1) available for audio call.',
      time: '12m ago',
    },
    {
      id: 'n3',
      icon: '[Quota]',
      title: 'Free Call Quota Warning',
      desc: isSubscribed
        ? 'Pro Seat Active: Unlimited calls unlocked.'
        : `Free tier: ${Math.max(0, 5 - callCount)}/5 audio calls remaining on this workspace.`,
      time: '25m ago',
    },
    {
      id: 'n4',
      icon: '[SOW]',
      title: 'Baseline SOW v1 Locked',
      desc: 'Included: 1 landing page, contact form. Excluded: payment checkout.',
      time: '1h ago',
    },
    {
      id: 'n5',
      icon: '[AI]',
      title: 'WhatsApp Meta-AI Available',
      desc: 'Type @AI in chat to extract scope changes and calculate variance pricing.',
      time: '2h ago',
    },
  ];

  function handleOpenWorkspaceFromJob(projId: string) {
    setActiveProjectId(projId);
    setIsWorkspaceOpen(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab Switcher Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--card)',
          padding: '8px 16px',
          borderRadius: 12,
          border: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setIsWorkspaceOpen(false);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              background: activeTab === 'dashboard' && !isWorkspaceOpen ? 'var(--space-indigo)' : 'transparent',
              color: activeTab === 'dashboard' && !isWorkspaceOpen ? 'var(--seashell)' : 'var(--dusty-grape)',
              transition: 'all 0.15s ease',
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('jobs');
              setIsWorkspaceOpen(false);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              background: activeTab === 'jobs' && !isWorkspaceOpen ? 'var(--space-indigo)' : 'transparent',
              color: activeTab === 'jobs' && !isWorkspaceOpen ? 'var(--seashell)' : 'var(--dusty-grape)',
              transition: 'all 0.15s ease',
            }}
          >
            Jobs (Drill-Down Flow)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setIsWorkspaceOpen(false);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              background: activeTab === 'profile' && !isWorkspaceOpen ? 'var(--space-indigo)' : 'transparent',
              color: activeTab === 'profile' && !isWorkspaceOpen ? 'var(--seashell)' : 'var(--dusty-grape)',
              transition: 'all 0.15s ease',
            }}
          >
            Profile
          </button>
        </div>

        {isWorkspaceOpen ? (
          <button
            type="button"
            className="btn secondary pill-sm"
            onClick={() => setIsWorkspaceOpen(false)}
          >
            ← Back to Portal Layout
          </button>
        ) : (
          <button
            type="button"
            className="btn pill-sm"
            onClick={() => setIsWorkspaceOpen(true)}
            style={{ background: 'var(--brand)', color: '#FFFFFF' }}
          >
            [Workspace] Open Project Workspace
          </button>
        )}
      </div>

      {/* Main 3-Column Layout */}
      {isWorkspaceOpen ? (
        <UnifiedWorkspace
          projectId={activeProjectId}
          onClose={() => setIsWorkspaceOpen(false)}
          initialCommittedHours={0}
          onCapacityUpdate={(committed, remaining) => {
            setCapacityCommitted(committed);
          }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '270px 1fr 290px',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {/* ============================================================
              LEFT SIDEBAR: Task List Panel & Effort Capacity
             ============================================================ */}
          <aside
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 18,
              boxShadow: '0 2px 8px rgba(34, 34, 59, 0.04)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>[Tasks]</span>
                <h3 style={{ margin: 0, fontSize: 15, color: 'var(--space-indigo)' }}>
                  Task List Panel
                </h3>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                Committed work items &amp; milestones
              </p>
            </div>

            {/* Effort Capacity Box */}
            <div
              style={{
                background: 'var(--seashell)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--space-indigo)' }}>
                  REMAINING EFFORT
                </span>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: remainingHours <= 2 ? 'var(--space-indigo)' : 'var(--dusty-grape)',
                  }}
                >
                  {remainingHours}h / {baselineHours}h
                </span>
              </div>

              {/* Capacity Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: 8,
                  background: 'var(--almond-silk)',
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, (capacityCommitted / baselineHours) * 100)}%`,
                    height: '100%',
                    background: 'var(--space-indigo)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Rate: {money(fixture.ratePerHour || 1000)}/hr</span>
                <span>Baseline Cap: {baselineHours}h</span>
              </div>
            </div>

            {/* Interactive Checklist */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 8 }}>
                Committed Work Items:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map((task) => (
                  <label
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: task.completed ? 'var(--seashell)' : 'var(--card)',
                      border: '1px solid var(--line)',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      style={{ width: 'auto', marginTop: 3, cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span
                        style={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'var(--muted)' : 'var(--space-indigo)',
                          fontWeight: task.isScopeChange ? 700 : 500,
                        }}
                      >
                        {task.label}
                      </span>
                      {task.isScopeChange ? (
                        <div style={{ fontSize: 10, color: 'var(--dusty-grape)', fontWeight: 600 }}>
                          [Change] Scope Change (+{task.hours}h)
                        </div>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Milestones */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 8 }}>
                Active Milestones:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--dusty-grape)' }}>
                  <span>[Done]</span> <strong>M1:</strong> SOW &amp; Wireframes (Done)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--space-indigo)' }}>
                  <span>[Active]</span> <strong>M2:</strong> Contact Form Validation (In Progress)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
                  <span>[Pending]</span> <strong>M3:</strong> Scope Change R1 (Pending Approval)
                </div>
              </div>
            </div>
          </aside>

          {/* ============================================================
              CENTER MAIN CONTENT AREA: Dynamically Renders Tab Content
             ============================================================ */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {activeTab === 'dashboard' ? (
              <>
                {/* Greeting & Quick Stats */}
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(34, 34, 59, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h1 style={{ margin: '0 0 6px', fontSize: 24, color: 'var(--space-indigo)' }}>
                        Welcome back, Freelancer_Dev
                      </h1>
                      <p className="muted" style={{ margin: 0 }}>
                        Project Workspace is active. All communication is privacy-guarded.
                      </p>
                    </div>
                    <span className="badge pro">Platform Verified</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 18 }}>
                    <div style={{ background: 'var(--seashell)', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Active Workspace</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--space-indigo)' }}>Flagship Project</div>
                      <div style={{ fontSize: 10, color: 'var(--dusty-grape)' }}>Web Development</div>
                    </div>
                    <div style={{ background: 'var(--seashell)', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Hourly Rate</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--space-indigo)' }}>{money(1000)}/hr</div>
                      <div style={{ fontSize: 10, color: 'var(--dusty-grape)' }}>before taxes</div>
                    </div>
                    <div style={{ background: 'var(--seashell)', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Remaining Capacity</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--space-indigo)' }}>{remainingHours} Hours</div>
                      <div style={{ fontSize: 10, color: 'var(--dusty-grape)' }}>of 10h baseline</div>
                    </div>
                    <div style={{ background: 'var(--seashell)', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>WebRTC Calls</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--space-indigo)' }}>
                        {isSubscribed ? 'Unlimited' : `${callCount}/5 Used`}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--dusty-grape)' }}>
                        {isSubscribed ? 'Pro Plan Active' : 'Free Audio Tier'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flagship Active Project Card */}
                <div
                  style={{
                    background: 'var(--card)',
                    border: '2px solid var(--border)',
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 4px 16px rgba(34, 34, 59, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge pro">Flagship Project</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                          Client: Client_A · Baseline SOW v1
                        </span>
                      </div>
                      <h2 style={{ margin: 0, fontSize: 20, color: 'var(--space-indigo)' }}>
                        Landing page for a small shop
                      </h2>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setIsWorkspaceOpen(true)}
                      style={{
                        padding: '10px 20px',
                        fontSize: 14,
                        background: 'var(--space-indigo)',
                        color: 'var(--seashell)',
                        borderRadius: 10,
                        fontWeight: 700,
                      }}
                    >
                      [Open] [ Open Project Workspace ]
                    </button>
                  </div>

                  <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--dusty-grape)', lineHeight: 1.5 }}>
                    Build a high-performance landing page and contact form under a strict 10-hour capacity ceiling.
                    Includes browser-native WebRTC calls, WhatsApp Meta-AI assistant (@AI), and ScopeDesk variance pricing.
                  </p>

                  <div
                    style={{
                      background: 'var(--seashell)',
                      border: '1px solid var(--line)',
                      borderRadius: 10,
                      padding: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <strong>Scope In:</strong> 1 landing page, contact form &nbsp;|&nbsp;{' '}
                      <strong>Scope Out:</strong> payment checkout
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--space-indigo)' }}>
                      Budget: ₹10,000 (10h @ ₹1,000/hr)
                    </div>
                  </div>
                </div>

                {/* Attention Needed Items */}
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--space-indigo)' }}>
                    Pending Scope Desk Actions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--seashell)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--space-indigo)' }}>
                          Request R1: &quot;Add payment checkout&quot; (6h)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--dusty-grape)' }}>
                          Explicit Exclusion Override · Estimated Quote: {money(6000)} before tax
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn pill-sm"
                        onClick={() => setIsWorkspaceOpen(true)}
                      >
                        Review in Scope Desk →
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 10,
                        background: 'var(--seashell)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--space-indigo)' }}>
                          Request R2: &quot;Fix our broken contact form&quot; (2h)
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--dusty-grape)' }}>
                          Internal Defect Rework · Billable Quote: ₹0 (Effort logged, price 0)
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn pill-sm"
                        onClick={() => setIsWorkspaceOpen(true)}
                      >
                        Review in Scope Desk →
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'jobs' ? (
              /* Step 3: Jobs Tab Drill-Down Flow */
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <h1 style={{ margin: '0 0 6px', fontSize: 22, color: 'var(--space-indigo)' }}>
                    Freelancer Job Discovery Flow
                  </h1>
                  <p className="muted" style={{ margin: 0 }}>
                    Filter by domain category, inspect baseline scope, exclusions, and open the interactive project workspace.
                  </p>
                </div>
                <JobsDrillDown onOpenWorkspace={handleOpenWorkspaceFromJob} />
              </div>
            ) : (
              /* Profile Tab */
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'var(--space-indigo)',
                      color: 'var(--seashell)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 26,
                      fontWeight: 800,
                    }}
                  >
                    FD
                  </div>
                  <div>
                    <h1 style={{ margin: '0 0 4px', fontSize: 22, color: 'var(--space-indigo)' }}>
                      Freelancer_Dev
                    </h1>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge pro">Platform Verified Freelancer</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        [Privacy] Privacy-First Platform Profile
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 14,
                    marginBottom: 20,
                  }}
                >
                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Hourly Billing Rate</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--space-indigo)' }}>₹1,000 / hr</div>
                    <div style={{ fontSize: 11, color: 'var(--dusty-grape)' }}>Locked in SOW baseline</div>
                  </div>
                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Weekly Capacity</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--space-indigo)' }}>10 Hours</div>
                    <div style={{ fontSize: 11, color: 'var(--dusty-grape)' }}>Strict effort tracking</div>
                  </div>
                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Performance Rating</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--space-indigo)' }}>4.9 / 5.0</div>
                    <div style={{ fontSize: 11, color: 'var(--dusty-grape)' }}>14 Completed Scopes</div>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px', fontSize: 15, color: 'var(--space-indigo)' }}>
                    Verified Competency Badges
                  </h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge">React &amp; Next.js</span>
                    <span className="badge">WebRTC Peer Calls</span>
                    <span className="badge">Scope Negotiation</span>
                    <span className="badge">Contact Redaction</span>
                    <span className="badge">SOW Variance Pricing</span>
                    <span className="badge">Offline Meta-AI Engine</span>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* ============================================================
              RIGHT SIDEBAR: Real-time Notifications Panel
             ============================================================ */}
          <aside
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: 'var(--card)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: 18,
              boxShadow: '0 2px 8px rgba(34, 34, 59, 0.04)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>[Alerts]</span>
                <h3 style={{ margin: 0, fontSize: 15, color: 'var(--space-indigo)' }}>
                  Notifications Panel
                </h3>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: 12 }}>
                Real-time workspace &amp; call alerts
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: n.urgent ? 'var(--seashell)' : 'var(--card)',
                    border: n.urgent ? '1.5px solid var(--dusty-grape)' : '1px solid var(--line)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--space-indigo)' }}>
                      {n.icon} {n.title}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{n.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--dusty-grape)', lineHeight: 1.4 }}>
                    {n.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Launch Workspace Banner */}
            <div
              style={{
                background: 'var(--space-indigo)',
                color: 'var(--seashell)',
                borderRadius: 12,
                padding: 14,
                textAlign: 'center',
                marginTop: 'auto',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                Ready to Negotiate?
              </div>
              <div style={{ fontSize: 11, color: 'var(--almond-silk)', marginBottom: 10 }}>
                Open Case C35 unified workspace with Client_A
              </div>
              <button
                type="button"
                className="btn secondary pill-sm"
                onClick={() => setIsWorkspaceOpen(true)}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'var(--seashell)',
                  color: 'var(--space-indigo)',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                Launch Workspace
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
