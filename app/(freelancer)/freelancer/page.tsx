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

export type PortalTab = 'dashboard' | 'jobs' | 'tasks' | 'alerts' | 'profile';

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            Find Jobs
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('tasks');
              setIsWorkspaceOpen(false);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              background: activeTab === 'tasks' && !isWorkspaceOpen ? 'var(--space-indigo)' : 'transparent',
              color: activeTab === 'tasks' && !isWorkspaceOpen ? 'var(--seashell)' : 'var(--dusty-grape)',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Open Task List Panel & Effort Capacity"
          >
            <span>TASKS</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 999,
                background: activeTab === 'tasks' && !isWorkspaceOpen ? 'var(--brand)' : 'var(--seashell)',
                color: activeTab === 'tasks' && !isWorkspaceOpen ? '#FFFFFF' : 'var(--space-indigo)',
                fontWeight: 800,
              }}
            >
              {remainingHours}h
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('alerts');
              setIsWorkspaceOpen(false);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              background: activeTab === 'alerts' && !isWorkspaceOpen ? 'var(--space-indigo)' : 'transparent',
              color: activeTab === 'alerts' && !isWorkspaceOpen ? 'var(--seashell)' : 'var(--dusty-grape)',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="Open Alert Notifications Panel"
          >
            <span>ALERTS</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                borderRadius: 999,
                background: activeTab === 'alerts' && !isWorkspaceOpen ? 'var(--brand)' : 'rgba(235, 94, 40, 0.15)',
                color: activeTab === 'alerts' && !isWorkspaceOpen ? '#FFFFFF' : 'var(--brand)',
                fontWeight: 800,
              }}
            >
              {notifications.length}
            </span>
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
                      Welcome back, Harini
                    </h1>
                    <p className="muted" style={{ margin: 0 }}>
                      Project Workspace is active. All communication is privacy-guarded.
                    </p>
                  </div>
                  <span className="badge pro">Harini (Freelancer)</span>
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
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                      Active negotiated baseline scope: <strong>one landing page</strong>, <strong>contact form</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn pill-sm"
                    onClick={() => setIsWorkspaceOpen(true)}
                    style={{ background: 'var(--brand)', color: '#FFFFFF' }}
                  >
                    Open Scope Workspace →
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '18px 0' }}>
                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 6 }}>
                      Baseline Deliverables (In Scope)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--space-indigo)' }}>
                      <li>One responsive landing page</li>
                      <li>Contact inquiry form with validation</li>
                      <li>Strict 10-hour capacity baseline ceiling</li>
                    </ul>
                  </div>

                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 12, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 6 }}>
                      Explicit SOW Exclusions (Requires Quote)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--dusty-grape)' }}>
                      <li>Payment checkout integration (R1)</li>
                      <li>Third-party gateway integrations</li>
                      <li>Custom user auth or DB setup</li>
                    </ul>
                  </div>
                </div>

                {/* Scope Change Orders In Review */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 10 }}>
                    Scope Desk Change Orders In Review:
                  </div>

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
              </div>

              {/* 2-Column Summary Widgets for Quick Access */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {/* Tasks Quick Widget */}
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(34, 34, 59, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>[Tasks]</span>
                        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--space-indigo)' }}>Task List Panel</h3>
                      </div>
                      <span className="badge pro">{remainingHours}h Left</span>
                    </div>
                    {/* Capacity bar */}
                    <div style={{ width: '100%', height: 8, background: 'var(--almond-silk)', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ width: `${Math.min(100, (capacityCommitted / baselineHours) * 100)}%`, height: '100%', background: 'var(--space-indigo)', transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                      {tasks.slice(0, 3).map((t) => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.completed ? 'var(--muted)' : 'var(--space-indigo)' }}>
                          <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} style={{ cursor: 'pointer' }} />
                          <span style={{ textDecoration: t.completed ? 'line-through' : 'none' }}>{t.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('tasks')}
                    className="btn secondary pill-sm"
                    style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                  >
                    Open Full Task List Panel →
                  </button>
                </div>

                {/* Alerts Quick Widget */}
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 2px 8px rgba(34, 34, 59, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>[Alerts]</span>
                        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--space-indigo)' }}>Alert Notifications</h3>
                      </div>
                      <span className="badge" style={{ background: 'rgba(235, 94, 40, 0.15)', color: 'var(--brand)' }}>
                        {notifications.length} Active
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                      {notifications.slice(0, 2).map((n) => (
                        <div key={n.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--seashell)', border: '1px solid var(--line)' }}>
                          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--space-indigo)' }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--dusty-grape)', marginTop: 2 }}>{n.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('alerts')}
                    className="btn secondary pill-sm"
                    style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
                  >
                    Open Alert Notifications Panel →
                  </button>
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
          ) : activeTab === 'tasks' ? (
            /* ============================================================
               FULL-WIDTH DEDICATED TASKS PANEL VIEW (Relocated from sidebar)
               ============================================================ */
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 2px 8px rgba(34, 34, 59, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>[Tasks]</span>
                    <h1 style={{ margin: 0, fontSize: 22, color: 'var(--space-indigo)' }}>
                      Task List Panel &amp; Effort Capacity Tracking
                    </h1>
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    Strict capacity ceiling of 10 hours at ₹1,000/hr before tax. Scope boundaries are legally locked in baseline SOW v1.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn pill-sm"
                  onClick={() => setIsWorkspaceOpen(true)}
                  style={{ background: 'var(--brand)', color: '#FFFFFF' }}
                >
                  Open in Workspace →
                </button>
              </div>

              {/* Effort Capacity Box */}
              <div
                style={{
                  background: 'var(--seashell)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 18,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--space-indigo)' }}>
                    REMAINING EFFORT CAPACITY
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: remainingHours <= 2 ? 'var(--brand)' : 'var(--space-indigo)',
                    }}
                  >
                    {remainingHours}h / {baselineHours}h Available
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div
                  style={{
                    width: '100%',
                    height: 10,
                    background: 'var(--almond-silk)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    marginBottom: 10,
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

                <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Billing Rate: <strong>{money(fixture.ratePerHour || 1000)}/hr</strong> before tax</span>
                  <span>Baseline Contract Cap: <strong>{baselineHours} Hours</strong></span>
                </div>
              </div>

              {/* Interactive Deliverables Checklist */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 10 }}>
                  Committed Work Items &amp; Deliverables Checklist:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tasks.map((task) => (
                    <label
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 10,
                        background: task.completed ? 'var(--seashell)' : 'var(--card)',
                        border: '1px solid var(--line)',
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        style={{ width: 'auto', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
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
                            <div style={{ fontSize: 11, color: 'var(--dusty-grape)', fontWeight: 600, marginTop: 2 }}>
                              [Scope Change] SOW Amendment R1 (+{task.hours}h)
                            </div>
                          ) : null}
                        </div>
                        <span className="badge" style={{ fontSize: 11 }}>
                          {task.completed ? 'Completed' : 'Pending Work'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Milestones Timeline */}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--space-indigo)', marginBottom: 12 }}>
                  Active Milestones Timeline:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 11, color: 'var(--dusty-grape)', fontWeight: 700 }}>[Done] Milestone 1</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--space-indigo)', marginTop: 4 }}>SOW &amp; Wireframes</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Signed Baseline v1</div>
                  </div>
                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 10, border: '1.5px solid var(--space-indigo)' }}>
                    <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 700 }}>[Active] Milestone 2</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--space-indigo)', marginTop: 4 }}>Contact Form Validation</div>
                    <div style={{ fontSize: 11, color: 'var(--dusty-grape)', marginTop: 2 }}>In Progress (2h committed)</div>
                  </div>
                  <div style={{ background: 'var(--seashell)', padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>[Pending] Milestone 3</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--space-indigo)', marginTop: 4 }}>Scope Change R1</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Awaiting Client Decision</div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'alerts' ? (
            /* ============================================================
               FULL-WIDTH DEDICATED ALERTS PANEL VIEW (Relocated from sidebar)
               ============================================================ */
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 2px 8px rgba(34, 34, 59, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>[Alerts]</span>
                    <h1 style={{ margin: 0, fontSize: 22, color: 'var(--space-indigo)' }}>
                      Alert Notifications Panel
                    </h1>
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    Real-time workspace telemetry, scope variance alerts, and encrypted WebRTC call activity.
                  </p>
                </div>
                <span className="badge" style={{ background: 'rgba(235, 94, 40, 0.15)', color: 'var(--brand)', fontWeight: 800, fontSize: 12 }}>
                  {notifications.length} Unread Notifications
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 12,
                      background: n.urgent ? 'var(--seashell)' : 'var(--card)',
                      border: n.urgent ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--space-indigo)' }}>
                          {n.icon} {n.title}
                        </span>
                        {n.urgent && (
                          <span className="badge" style={{ background: 'var(--brand)', color: '#FFFFFF', fontSize: 10 }}>
                            Action Required
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--dusty-grape)', lineHeight: 1.4 }}>
                        {n.desc}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{n.time}</span>
                      <button
                        type="button"
                        className="btn pill-sm"
                        onClick={() => setIsWorkspaceOpen(true)}
                        style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                      >
                        Open Workspace →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                  H
                </div>
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: 22, color: 'var(--space-indigo)' }}>
                    Harini
                  </h1>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge pro">Platform Verified Freelancer</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Harini (Freelancer) · Privacy-First Platform Profile
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
      )}
    </div>
  );
}
