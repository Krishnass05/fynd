'use client';
// Browse freelancers: category and skill chips, search from the top bar, more filters, and a card grid.
// OWNER: Krishna (look: Sanjana).
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchFreelancers, setSaved } from '@/lib/api';
import type { Freelancer, FreelancerSearch } from '@/lib/types';
import { useAsync } from '@/lib/useAsync';
import { Button, EmptyState, ErrorMessage, Field, Spinner } from '@/components/ui';
import FreelancerCard from '@/components/ui/FreelancerCard';
import s from './freelancers.module.css';

function Browse() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? '');
  const [skill, setSkill] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [available, setAvailable] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // The search box in the top bar changes the address; follow it.
  useEffect(() => { setQ(params.get('q') ?? ''); setCategory(params.get('category') ?? ''); }, [params]);

  const rate = Number(maxRate);
  const { data, error, loading, setData } = useAsync<FreelancerSearch>(
    () => searchFreelancers({ q: q.trim(), category, skill, maxRate: rate > 0 ? rate : undefined, available }),
    [q, category, skill, maxRate, available],
  );
  const filtered = Boolean(q.trim() || category || skill || maxRate || available);
  const clear = () => { setQ(''); setCategory(''); setSkill(''); setMaxRate(''); setAvailable(false); };

  // The skills people list most often become quick chips.
  const topSkills = data ? data.skills.slice(0, 6) : [];

  async function toggleSave(id: string, next: boolean) {
    if (!data) return;
    const before = data;
    setData({ ...data, freelancers: data.freelancers.map((f: Freelancer) => (f.id === id ? { ...f, saved: next } : f)) });
    try {
      await setSaved(id, next);
      setSaveError(null);
    } catch (e) {
      setData(before);
      setSaveError(e instanceof Error ? e.message : 'Could not save');
    }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h1 style={{ marginBottom: 4 }}>Top freelancers</h1>
          <p className="muted" style={{ margin: 0 }}>Discover talented professionals ready to work on your project. Sample profiles: ratings and job counts are made-up numbers.</p>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Quick filters">
        <button type="button" className="chip" aria-pressed={!category && !skill} onClick={() => { setCategory(''); setSkill(''); }}>All</button>
        {(data?.categories ?? []).map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(category === c ? '' : c)}>{c}</button>
        ))}
        {topSkills.map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={skill === k} onClick={() => setSkill(skill === k ? '' : k)}>{k}</button>
        ))}
      </div>

      <details className="morefilters">
        <summary>More filters</summary>
        <form className={s.filters} role="search" onSubmit={(e) => e.preventDefault()}>
          <Field label="Search by name, skill or place">
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="logo, React, Pune" />
          </Field>
          <Field label="Skill">
            <select value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">Any skill</option>
              {(data?.skills ?? []).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
          <Field label="Highest rate per hour (rupees)">
            <input type="number" min={1} step={50} inputMode="numeric" value={maxRate} onChange={(e) => setMaxRate(e.target.value)} placeholder="No limit" />
          </Field>
          <Field label="Availability">
            <select value={available ? '1' : ''} onChange={(e) => setAvailable(e.target.value === '1')}>
              <option value="">Anyone</option>
              <option value="1">Available now</option>
            </select>
          </Field>
        </form>
      </details>

      <ErrorMessage message={error ?? saveError} />
      {loading && !data ? <Spinner /> : null}
      {data ? (
        <p className="muted" role="status" aria-live="polite">
          {data.freelancers.length} {data.freelancers.length === 1 ? 'freelancer' : 'freelancers'}{filtered ? ' match' : ''}
          {filtered ? <> <Button type="button" variant="secondary" onClick={clear}>Clear filters</Button></> : null}
        </p>
      ) : null}
      {data?.freelancers.length === 0 ? <EmptyState>No freelancer matches. Try fewer filters.</EmptyState> : null}
      <div className="fgrid">
        {(data?.freelancers ?? []).map((f) => <FreelancerCard key={f.id} f={f} href={`/client/freelancers/${f.id}`} onSave={toggleSave} />)}
      </div>
    </>
  );
}

export default function FindFreelancers() {
  return <Suspense fallback={<Spinner />}><Browse /></Suspense>;
}
