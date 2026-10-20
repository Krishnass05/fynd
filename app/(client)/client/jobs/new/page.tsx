'use client';
// Post a job in three steps: Details, Budget, Review. Start from a library profile to fill in the scope and see the
// typical price (illustrative). OWNER: Sanjana (look).
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createJob, getLibrary } from '@/lib/api';
import type { LibraryProfile } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { Button, ErrorMessage, Field, money } from '@/components/ui';

const STEPS = ['Details', 'Budget', 'Review'] as const;

export default function NewJob() {
  const router = useRouter();
  const library = useAsync(getLibrary, []);
  const [step, setStep] = useState(0);
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

  // Each step checks its own fields before moving on, and says what to fix.
  function next() {
    if (step === 0) {
      if (!title.trim()) return setError('Add a project title');
      if (!description.trim()) return setError('Describe the project');
    }
    if (step === 1) {
      if (!(budgetNum > 0) || !Number.isFinite(budgetNum)) return setError('Add a budget above 0');
      if (!deadline) return setError('Choose a deadline');
    }
    setError(null);
    setStep(step + 1);
  }

  async function submit() {
    setBusy(true);
    try {
      const job = await createJob({ title, description, budget: budgetNum, deadline, profileId: profileId || undefined });
      router.push(`/client/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post the job');
      setBusy(false);
    }
  }

  return (
    <>
      <h1 style={{ textAlign: 'center' }}>Post a project</h1>
      <ol className="stepper" aria-label="Steps">
        {STEPS.map((name, i) => (
          <li key={name} aria-current={i === step ? 'step' : undefined} className={i < step ? 'done' : undefined}>
            <span className="dot">{i < step ? '✓' : i + 1}</span>{name}
          </li>
        ))}
      </ol>

      <section className="formcard" aria-labelledby="step-title">
        <ErrorMessage message={error ?? library.error} />

        {step === 0 ? (
          <>
            <h2 id="step-title">Project details</h2>
            <p className="muted">Tell us what you need and get matched with the right talent.</p>
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
            <Field label="Project title"><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="E.g. Website redesign for my brand" /></Field>
            <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={2000} placeholder="Describe your project, goals and requirements" /></Field>
            <div className="formactions"><span /><Button type="button" variant="dark" onClick={next}>Next</Button></div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 id="step-title">Budget and deadline</h2>
            {profile ? (
              <p className="muted" role="note">
                Typical for {profile.name}: {profile.ratePerHour ? `${money(profile.ratePerHour)}/hr` : 'rate not set'}
                {profile.typicalHours ? `, about ${profile.typicalHours} hours` : ''}
                {typical ? `, around ${money(typical)}` : ''}. Illustrative figures from our SOW library, before tax.
                {gap === null ? '' : gap === 0 ? ' Your budget matches that.' : ` Your budget is ${Math.abs(gap)}% ${gap < 0 ? 'below' : 'above'} that.`}
              </p>
            ) : <p className="muted">Pick a job profile on the first step to see a typical price.</p>}
            <Field label="Budget (rupees, before tax)"><input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min={1} step={1} inputMode="numeric" /></Field>
            <Field label="Deadline"><input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" /></Field>
            <div className="formactions">
              <Button type="button" variant="secondary" onClick={() => { setError(null); setStep(0); }}>Back</Button>
              <Button type="button" variant="dark" onClick={next}>Next</Button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="review">
            <h2 id="step-title">Review and post</h2>
            <dl>
              <dt>Title</dt><dd>{title}</dd>
              <dt>Profile</dt><dd>{profile ? profile.name : 'None'}</dd>
              <dt>Budget</dt><dd>{money(budgetNum)} before tax</dd>
              <dt>Deadline</dt><dd>{deadline}</dd>
              <dt>Description</dt><dd style={{ whiteSpace: 'pre-line' }}>{description}</dd>
            </dl>
            <div className="formactions">
              <Button type="button" variant="secondary" onClick={() => { setError(null); setStep(1); }} disabled={busy}>Back</Button>
              <Button type="button" variant="dark" onClick={submit} disabled={busy}>{busy ? 'Posting...' : 'Post job'}</Button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
