'use client';
// Feedback after the job, on the project page. OWNER: Krishna.
// Locked until the client has approved every milestone; then each side leaves one review (stars and a comment)
// for the other, which shows on the other person's profile and counts in their rating.
import { useState } from 'react';
import { leaveReview } from '@/lib/api';
import type { ProjectDetail, ReviewItem } from '@/lib/types';
import { Button, ErrorMessage, Field } from '@/components/ui';
import { Star } from '@/components/ui/icons';
import st from './feedback.module.css';

function Stars({ value }: { value: number }) {
  return <span className={st.stars} aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} aria-hidden="true" className={n <= value ? st.on : ''}><Star size={16} /></span>)}</span>;
}

function Shown({ r, title }: { r: ReviewItem; title: string }) {
  return (
    <div className={st.shown}>
      <p className={st.label}>{title}</p>
      <Stars value={r.rating} />
      <p className={st.text}>{r.text}</p>
    </div>
  );
}

export default function ProjectFeedback({ projectId, otherName, data, onChanged }: { projectId: string; otherName: string; data: ProjectDetail['feedback']; onChanged: (p: ProjectDetail) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!data.complete) {
    return <p className="muted">Feedback opens when the client has approved every milestone. Then you and {otherName} can review each other; reviews appear on your profiles.</p>;
  }

  async function send() {
    setBusy(true);
    try { onChanged(await leaveReview(projectId, { rating, text })); setError(null); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save your feedback'); } finally { setBusy(false); }
  }

  return (
    <div className={st.fb}>
      {data.mine ? <Shown r={data.mine} title={`Your feedback for ${otherName} (shown on their profile)`} /> : (
        <div className={st.form}>
          <p className={st.label}>The job is complete. How was working with {otherName}?</p>
          <div className={st.pick} role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className={n <= (hover || rating) ? st.on : ''} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)}>
                <Star size={26} />
              </button>
            ))}
          </div>
          <Field label="Your feedback"><textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="What went well, and what could be better?" /></Field>
          <ErrorMessage message={error} />
          <div className="row"><Button disabled={busy || rating === 0 || text.trim().length < 10} onClick={() => void send()}>{busy ? 'Saving...' : 'Submit feedback'}</Button></div>
          <p className="muted">One review per project. It shows on {otherName}&apos;s profile and counts in their rating.</p>
        </div>
      )}
      {data.theirs ? <Shown r={data.theirs} title={`${otherName}'s feedback for you`} /> : <p className="muted">{otherName} has not left feedback yet.</p>}
    </div>
  );
}
