'use client';
// Step 1: Authentication (Login / Signup View)
// Features:
//  - Role switcher (Freelancer vs. Client)
//  - Anonymous platform display names (no personal email or phone exposed)
//  - Immediate redirect to Main Freelancer Portal (/freelancer) upon Freelancer login
//  - Strict palette: #22223B, #4A4E69, #9A8C98, #C9ADA7, #F2E9E4
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setUserId } from '@/lib/session';
import type { Role } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<Role>('freelancer');
  const [anonymousHandle, setAnonymousHandle] = useState<string>('Harini');

  function handleRoleChange(newRole: Role) {
    setSelectedRole(newRole);
    if (newRole === 'freelancer') {
      setAnonymousHandle('Harini');
    } else {
      setAnonymousHandle('Client_A');
    }
  }

  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedRole === 'freelancer') {
      setUserId('u_freelancer1');
      router.push('/freelancer');
    } else {
      setUserId('u_client1');
      router.push('/client');
    }
  }

  return (
    <div className="welcome">
      <div className="inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="brand" style={{ fontSize: 24 }}>Fynd ScopeDesk</span>
          </div>
          <Link href="/demo" style={{ fontSize: 13, color: 'var(--dusty-grape)', fontWeight: 600 }}>
            Run Automated Checks →
          </Link>
        </div>

        <section className="hero">
          <h1>
            Privacy-First Freelancer Discovery &amp; <em>Scope Change Desk</em>
          </h1>
          <p>
            An end-to-end workspace featuring browser-native WebRTC calls, contact redaction,
            WhatsApp Meta-AI-style scope extraction, and baseline SOW variance pricing.
          </p>
        </section>

        {/* Auth Container Card */}
        <div
          style={{
            maxWidth: 520,
            margin: '0 auto',
            background: 'var(--card)',
            border: '2px solid var(--border)',
            borderRadius: 18,
            padding: 32,
            boxShadow: '0 12px 32px rgba(34, 34, 59, 0.08)',
          }}
        >
          {/* Login vs Signup Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--seashell)',
              padding: 4,
              borderRadius: 999,
              marginBottom: 24,
              border: '1px solid var(--line)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                background: activeTab === 'login' ? 'var(--space-indigo)' : 'transparent',
                color: activeTab === 'login' ? 'var(--seashell)' : 'var(--dusty-grape)',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                background: activeTab === 'signup' ? 'var(--space-indigo)' : 'transparent',
                color: activeTab === 'signup' ? 'var(--seashell)' : 'var(--dusty-grape)',
                transition: 'all 0.15s ease',
              }}
            >
              Sign Up (Anonymous)
            </button>
          </div>

          <form onSubmit={handleAuthSubmit}>
            {/* Step 1 Requirement: Role Switcher (Freelancer vs. Client) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--dusty-grape)', marginBottom: 8 }}>
                Select Workspace Role
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => handleRoleChange('freelancer')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: selectedRole === 'freelancer' ? '2px solid var(--space-indigo)' : '1px solid var(--line)',
                    background: selectedRole === 'freelancer' ? 'var(--seashell)' : 'var(--card)',
                    color: 'var(--space-indigo)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>[Freelancer]</span>
                  <span>Freelancer</span>
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--dusty-grape)' }}>
                    Discover jobs &amp; negotiate scope
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('client')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: selectedRole === 'client' ? '2px solid var(--space-indigo)' : '1px solid var(--line)',
                    background: selectedRole === 'client' ? 'var(--seashell)' : 'var(--card)',
                    color: 'var(--space-indigo)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700 }}>[Client]</span>
                  <span>Client</span>
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--dusty-grape)' }}>
                    Post jobs &amp; approve orders
                  </span>
                </button>
              </div>
            </div>

            {/* Anonymous Display Name (No Email / Phone Exposed) */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--dusty-grape)', marginBottom: 6 }}>
                Anonymous Platform Display Name
              </label>
              <input
                type="text"
                value={anonymousHandle}
                onChange={(e) => setAnonymousHandle(e.target.value)}
                placeholder="e.g. Harini"
                required
                style={{
                  background: 'var(--seashell)',
                  border: '1px solid var(--border)',
                  color: 'var(--space-indigo)',
                  fontWeight: 600,
                }}
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--dusty-grape)' }}>
                [Privacy Guarantee] No personal email or phone number is stored, requested, or exposed.
              </p>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              className="btn"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px 20px',
                fontSize: 15,
                background: 'var(--brand)',
                color: '#FFFFFF',
                borderRadius: 10,
              }}
            >
              {selectedRole === 'freelancer'
                ? 'Enter as Freelancer → (Open Portal)'
                : 'Enter as Client → (Open Portal)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
