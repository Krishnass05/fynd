'use client';
// The freelancer's own profile: what clients see when they browse. OWNER: Krishna.
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
    const rate = String(f.get('rate') ?? '').trim();
    try {
      await updateMe({
        name: String(f.get('name') ?? ''),
        headline: String(f.get('headline') ?? ''),
        overview: String(f.get('overview') ?? ''),
        location: String(f.get('location') ?? ''),
        ratePerHour: rate ? Number(rate) : undefined,
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
    <>
      <h1>Profile</h1>
      <p className="muted">This is what clients see when they browse freelancers.</p>
      <ErrorMessage message={error ?? saveError} />
      {loading ? <Spinner /> : null}
      {data ? (
        <Card plain>
          <form onSubmit={save} key={data.name + data.skills.join() + (data.headline ?? '')}>
            <Field label="Name"><input name="name" defaultValue={data.name} required maxLength={80} /></Field>
            <Field label="Headline (one line)"><input name="headline" defaultValue={data.headline ?? ''} maxLength={120} placeholder="What you do, in a few words" /></Field>
            <Field label="About you"><textarea name="overview" defaultValue={data.overview ?? ''} rows={4} maxLength={1000} /></Field>
            <Field label="Location"><input name="location" defaultValue={data.location ?? ''} maxLength={60} /></Field>
            <Field label="Rate per hour (rupees)"><input name="rate" type="number" min={1} step={1} inputMode="numeric" defaultValue={data.ratePerHour ?? ''} /></Field>
            <Field label="Skills (separate with commas)"><input name="skills" defaultValue={data.skills.join(', ')} /></Field>
            <Button type="submit">Save</Button>
            {saved ? <span className="muted" role="status"> Saved.</span> : null}
          </form>
        </Card>
      ) : null}
    </>
  );
}
