'use client';
// Freelancer Profile Page (Platform Verified & Anonymous)
import { useState } from 'react';
import { getMe, updateMe } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Button, Card, ErrorMessage, Field, Spinner } from '@/components/ui';

export default function Profile() {
  const { data, error, loading, reload } = useAsync(getMe, []);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await updateMe({
        name: String(f.get('name') ?? ''),
        skills: String(f.get('skills') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      });
      setSaveError(null);
      setSaved(true);
      await reload();
    } catch (err) {
      setSaved(false);
      setSaveError(err instanceof Error ? err.message : 'Could not save');
    }
  }

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--card)', padding: '20px 24px', borderRadius: 16, border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 24, color: 'var(--space-indigo)' }}>
              Freelancer Platform Profile
            </h1>
            <p className="muted" style={{ margin: 0 }}>
              Anonymous platform identity. Zero personal phone or email details exposed.
            </p>
          </div>
          <span className="badge pro">Case C35 Verified</span>
        </div>
      </div>

      <ErrorMessage message={error ?? saveError} />
      {loading ? <Spinner /> : null}

      {data ? (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--space-indigo)',
                color: 'var(--seashell)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              FD
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--space-indigo)' }}>
                {data.name || 'Freelancer_Dev'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Platform Handle: <strong>Freelancer_Dev</strong> · Hourly Rate: <strong>₹1,000/hr</strong> · Capacity: <strong>10h baseline</strong>
              </div>
            </div>
          </div>

          <form onSubmit={save} key={data.name + data.skills.join()}>
            <Field label="Anonymous Platform Display Name">
              <input name="name" defaultValue={data.name || 'Freelancer_Dev'} required maxLength={80} />
            </Field>
            <Field label="Skills (separate with commas)">
              <input
                name="skills"
                defaultValue={data.skills?.length ? data.skills.join(', ') : 'React, Node.js, WebRTC, ScopeDesk, UI Design'}
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <Button type="submit">Save Profile Changes</Button>
              {saved ? (
                <span style={{ fontSize: 13, color: 'var(--space-indigo)', fontWeight: 600 }}>
                  ✓ Profile saved successfully.
                </span>
              ) : null}
            </div>
          </form>

          <div
            style={{
              marginTop: 24,
              padding: 14,
              borderRadius: 10,
              background: 'var(--seashell)',
              border: '1px solid var(--line)',
              fontSize: 12,
              color: 'var(--dusty-grape)',
            }}
          >
            🔒 <strong>Privacy Guard Guarantee:</strong> All client communications remain within the Fynd ScopeDesk
            environment. Browser-native WebRTC peer signaling is encrypted and ephemeral. Contact details are never exposed.
          </div>
        </Card>
      ) : null}
    </div>
  );
}
