'use client';
// Browse freelancers: search, category, skill, maximum rate and availability. OWNER: Krishna (look: Sanjana).
import { useEffect, useState } from 'react';
import { searchFreelancers } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { Button, EmptyState, ErrorMessage, Field, Spinner } from '@/components/ui';
import FreelancerCard from '@/components/ui/FreelancerCard';
import s from './freelancers.module.css';

export default function FindFreelancers() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState('');
  const [skill, setSkill] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [available, setAvailable] = useState(false);

  // Wait a moment after typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const rate = Number(maxRate);
  const { data, error, loading } = useAsync(
    () => searchFreelancers({ q: debouncedQ, category, skill, maxRate: rate > 0 ? rate : undefined, available }),
    [debouncedQ, category, skill, maxRate, available],
  );
  const filtered = Boolean(debouncedQ || category || skill || maxRate || available);
  const clear = () => { setQ(''); setDebouncedQ(''); setCategory(''); setSkill(''); setMaxRate(''); setAvailable(false); };

  return (
    <>
      <h1>Find freelancers</h1>
      <p className="muted">Sample profiles for the demo. Ratings and job counts are made-up numbers, not real reviews.</p>

      <form className={s.filters} role="search" onSubmit={(e) => e.preventDefault()}>
        <Field label="Search by name, skill or place">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="logo, React, Pune" />
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {(data?.categories ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
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
        {filtered ? <Button type="button" variant="secondary" onClick={clear}>Clear filters</Button> : null}
      </form>

      <ErrorMessage message={error} />
      {loading && !data ? <Spinner /> : null}
      {data ? <p className="muted" role="status" aria-live="polite">{data.freelancers.length} {data.freelancers.length === 1 ? 'freelancer' : 'freelancers'}{filtered ? ' match' : ''}</p> : null}
      {data?.freelancers.length === 0 ? <EmptyState>No freelancer matches. Try fewer filters.</EmptyState> : null}
      <div className="card-grid">
        {(data?.freelancers ?? []).map((f) => <FreelancerCard key={f.id} f={f} href={`/client/freelancers/${f.id}`} />)}
      </div>
    </>
  );
}
