'use client';
// The client's saved freelancers (a shortlist). OWNER: Krishna (look: Sanjana).
import { useState } from 'react';
import { listSaved, setSaved } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { ButtonLink, EmptyState, ErrorMessage, Spinner } from '@/components/ui';
import FreelancerCard from '@/components/ui/FreelancerCard';

export default function Saved() {
  const { data, error, loading, setData } = useAsync(listSaved, []);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Un-saving removes the card from this list straight away; if the server refuses, it comes back.
  async function toggle(id: string, next: boolean) {
    if (!data) return;
    const before = data;
    setData(next ? data.map((f) => (f.id === id ? { ...f, saved: true } : f)) : data.filter((f) => f.id !== id));
    try {
      await setSaved(id, next);
      setSaveError(null);
    } catch (e) {
      setData(before);
      setSaveError(e instanceof Error ? e.message : 'Could not update');
    }
  }

  return (
    <>
      <h1>Saved freelancers</h1>
      <p className="muted">Your shortlist. Tap the heart on any card to add or remove someone.</p>
      <ErrorMessage message={error ?? saveError} />
      {loading && !data ? <Spinner /> : null}
      {data?.length === 0 ? (
        <EmptyState>No one saved yet.<br /><ButtonLink href="/client/freelancers" variant="secondary">Find freelancers</ButtonLink></EmptyState>
      ) : null}
      <div className="fgrid">
        {(data ?? []).map((f) => <FreelancerCard key={f.id} f={f} href={`/client/freelancers/${f.id}`} onSave={toggle} />)}
      </div>
    </>
  );
}
