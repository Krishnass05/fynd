'use client';
// Post a job. OWNER: Sanjana. Starter version: replace with the final design.
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createJob } from '@/lib/api';
import { Button, Card, ErrorMessage, Field } from '@/components/ui';

export default function NewJob() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const job = await createJob({
        title: String(f.get('title') ?? ''),
        description: String(f.get('description') ?? ''),
        budget: Number(f.get('budget')),
        deadline: String(f.get('deadline') ?? ''),
      });
      router.push(`/client/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post the job');
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Post a job</h1>
      <Card>
        <form onSubmit={submit}>
          <ErrorMessage message={error} />
          <Field label="Title"><input name="title" required maxLength={120} /></Field>
          <Field label="Description"><textarea name="description" required rows={4} maxLength={2000} /></Field>
          <Field label="Budget (rupees)"><input name="budget" type="number" min={1} step={1} required /></Field>
          <Field label="Deadline"><input name="deadline" type="date" required /></Field>
          <Button type="submit" disabled={busy}>{busy ? 'Posting...' : 'Post job'}</Button>
        </form>
      </Card>
    </>
  );
}
