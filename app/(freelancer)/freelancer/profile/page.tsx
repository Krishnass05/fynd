'use client';
// Basic profile: name and skills. OWNER: Krishna.
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
    <>
      <h1>Profile</h1>
      <ErrorMessage message={error ?? saveError} />
      {loading ? <Spinner /> : null}
      {data ? (
        <Card>
          <form onSubmit={save} key={data.name + data.skills.join()}>
            <Field label="Name"><input name="name" defaultValue={data.name} required maxLength={80} /></Field>
            <Field label="Skills (separate with commas)"><input name="skills" defaultValue={data.skills.join(', ')} /></Field>
            <Button type="submit">Save</Button>
            {saved ? <span className="muted"> Saved.</span> : null}
          </form>
        </Card>
      ) : null}
    </>
  );
}
