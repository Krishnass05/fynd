'use client';
// The client's own profile: details, company, rating and reviews, and an edit form for the name and company
// details (saved with the client's account). The dashboard has its own page. OWNER: Krishna.
import { useState } from 'react';
import { getClient, updateMe } from '@/lib/api';
import { useAsync } from '@/lib/useAsync';
import { useUser } from '@/lib/useUser';
import ClientProfileView from '@/components/profile/ClientProfileView';
import { Button, ErrorMessage, Field, Spinner } from '@/components/ui';

const SIZES = ['Just me', '2-10 people', '11-50 people', '51-200 people', 'More than 200 people'];

export default function ClientProfile() {
  const { user } = useUser('client');
  const { data, error, reload } = useAsync(() => (user ? getClient(user.id) : Promise.resolve(null)), [user?.id]);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? '').trim();
    setBusy(true);
    try {
      await updateMe({
        name: v('name'),
        company: { name: v('company'), industry: v('industry'), size: v('size'), location: v('location'), website: v('website'), about: v('about') },
      });
      setSaveError(null);
      setSaved(true);
      setEditing(false);
      await reload();
    } catch (err) {
      setSaved(false);
      setSaveError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  const c = data?.company;
  return (
    <>
      <ErrorMessage message={error} />
      {!data && !error ? <Spinner /> : null}
      {data ? (
        <>
          <div className="section-head">
            <p className="muted" style={{ margin: 0 }}>This is what freelancers see when they open your profile.</p>
            <Button type="button" variant="secondary" aria-expanded={editing} onClick={() => { setEditing((x) => !x); setSaved(false); setSaveError(null); }}>{editing ? 'Cancel' : 'Edit profile'}</Button>
          </div>
          {saved ? <p className="muted" role="status">Saved.</p> : null}

          {editing ? (
            <form className="authcard" onSubmit={save} aria-label="Edit your profile" style={{ marginBottom: 20 }}>
              <Field label="Your name"><input name="name" defaultValue={data.name} required maxLength={80} /></Field>
              <Field label="Company name"><input name="company" defaultValue={c?.name ?? ''} maxLength={80} placeholder="Leave empty if you hire as an individual" /></Field>
              <Field label="Industry"><input name="industry" defaultValue={c?.industry ?? ''} maxLength={60} placeholder="For example: Food and beverage" /></Field>
              <Field label="Company size">
                <select name="size" defaultValue={c?.size ?? ''}>
                  <option value="">Not set</option>
                  {SIZES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Location"><input name="location" defaultValue={c?.location ?? ''} maxLength={60} placeholder="City" /></Field>
              <Field label="Website"><input name="website" defaultValue={c?.website ?? ''} maxLength={120} placeholder="example.com" /></Field>
              <Field label="About the company"><textarea name="about" defaultValue={c?.about ?? ''} rows={4} maxLength={1000} /></Field>
              <ErrorMessage message={saveError} />
              <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</Button>
            </form>
          ) : null}

          <ClientProfileView data={data} own jobHref={(id) => `/client/jobs/${id}`} />
        </>
      ) : null}
    </>
  );
}
