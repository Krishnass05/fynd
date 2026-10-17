'use client';
// Post a job. Start from a library profile to fill in the scope, and see the typical price (illustrative).
// OWNER: Sanjana. Starter version: replace with the final design.
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createJob, getLibrary } from '@/lib/api';
import type { LibraryProfile } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { Button, Card, ErrorMessage, Field, money } from '@/components/ui';

export default function NewJob() {
  const router = useRouter();
  const library = useAsync(getLibrary, []);
  const [profileId, setProfileId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const profile: LibraryProfile | undefined = library.data?.profiles.find((p) => p.id === profileId);
  const grouped = useMemo(() => {
    const out: Record<string, LibraryProfile[]> = {};
    for (const p of library.data?.profiles ?? []) (out[p.category] ??= []).push(p);
    return out;
  }, [library.data]);

  const typical = profile?.ratePerHour && profile.typicalHours ? profile.ratePerHour * profile.typicalHours : null;
  const budgetNum = Number(budget);
  const gap = typical && budgetNum > 0 ? Math.round(((budgetNum - typical) / typical) * 100) : null;

  function choose(id: string) {
    setProfileId(id);
    const p = library.data?.profiles.find((x) => x.id === id);
    if (!p) return;
    setTitle(p.name);
    const lines = [`Work needed: ${p.name}.`];
    if (p.deliverables.length) lines.push(`Included: ${p.deliverables.join('; ')}.`);
    if (p.excluded.length) lines.push(`Not included unless agreed: ${p.excluded.join('; ')}.`);
    setDescription(lines.join('\n'));
    if (p.ratePerHour && p.typicalHours) setBudget(String(p.ratePerHour * p.typicalHours));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const job = await createJob({ title, description, budget: Number(budget), deadline, profileId: profileId || undefined });
      router.push(`/client/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post the job');
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Post a job</h1>
      <Card plain>
        <form onSubmit={submit}>
          <ErrorMessage message={error ?? library.error} />
          <Field label="Start from a job profile (optional)">
            <select value={profileId} onChange={(e) => choose(e.target.value)}>
              <option value="">No profile, I will describe it myself</option>
              {Object.entries(grouped).map(([cat, list]) => (
                <optgroup key={cat} label={cat}>
                  {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          {profile ? (
            <p className="muted" role="note">
              Typical for {profile.name}: {profile.ratePerHour ? `${money(profile.ratePerHour)}/hr` : 'rate not set'}
              {profile.typicalHours ? `, about ${profile.typicalHours} hours` : ''}
              {typical ? `, around ${money(typical)}` : ''}. Illustrative figures from our SOW library, before tax.
              {gap === null ? '' : gap === 0 ? ' Your budget matches that.' : ` Your budget is ${Math.abs(gap)}% ${gap < 0 ? 'below' : 'above'} that.`}
            </p>
          ) : null}
          <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></Field>
          <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} maxLength={2000} /></Field>
          <Field label="Budget (rupees)"><input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min={1} step={1} required /></Field>
          <Field label="Deadline"><input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" required /></Field>
          <Button type="submit" disabled={busy}>{busy ? 'Posting...' : 'Post job'}</Button>
        </form>
      </Card>
    </>
  );
}
