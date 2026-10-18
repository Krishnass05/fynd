'use client';
// The freelancer's own profile, laid out like the client profile: a header card, about, skills, previous work,
// past clients and reviews. The edit form sits in its own section. OWNER: Krishna.
import { useState } from 'react';
import { getFreelancer, getMe, updateMe } from '@/lib/api';
import { initials } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { Badge, Button, ErrorMessage, Field, Spinner, money } from '@/components/ui';
import { MapPin } from '@/components/ui/icons';
import { PortfolioList, RatingSummary, ReviewList, SampleNote } from '@/components/profile/Parts';

export default function Profile() {
  const me = useAsync(getMe, []);
  const id = me.data?.id;
  const profile = useAsync(() => (id ? getFreelancer(id) : Promise.resolve(null)), [id, me.data?.name, me.data?.headline, me.data?.overview, me.data?.skills.join()]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const user = me.data;
  const data = profile.data;

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
      setEditing(false);
      await me.reload();
    } catch (err) {
      setSaved(false);
      setSaveError(err instanceof Error ? err.message : 'Could not save');
    }
  }

  return (
    <>
      <ErrorMessage message={me.error ?? profile.error ?? saveError} />
      {!user ? <Spinner /> : null}
      {user && data ? (
        <>
          <section className="profilecard" aria-labelledby="profile-title">
            <span className="avatar-xl" aria-hidden="true">{initials(data.name)}</span>
            <div className="profilecard-main">
              <h1 id="profile-title">{data.name}</h1>
              <p style={{ margin: '0 0 8px' }}>{data.headline || 'Add a headline so clients know what you do.'}</p>
              <Badge tone={data.availability === 'available' ? 'good' : 'warn'}>{data.availability === 'available' ? 'Available now' : 'Booked for now'}</Badge>
            </div>
            <RatingSummary rating={data.rating} count={data.reviewCount} label="sample" />
            <dl className="profile-facts">
              <div><dt>Name</dt><dd>{data.name}</dd></div>
              {user.email ? <div><dt>Email</dt><dd>{user.email}</dd></div> : null}
              <div><dt>Account type</dt><dd>Freelancer (finds work)</dd></div>
              <div><dt>Location</dt><dd>{data.location ? <><MapPin size={14} /> {data.location}</> : 'Not set'}</dd></div>
              <div><dt>Category</dt><dd>{data.category}</dd></div>
              <div><dt>Hourly rate</dt><dd>{data.ratePerHour ? `${money(data.ratePerHour)}/hr` : 'Not set'}</dd></div>
            </dl>
          </section>

          <div className="section-head">
            <p className="muted" style={{ margin: 0 }}>This is what clients see when they open your profile.</p>
            <Button type="button" variant="secondary" aria-expanded={editing} onClick={() => { setEditing((v) => !v); setSaved(false); }}>{editing ? 'Cancel' : 'Edit profile'}</Button>
          </div>
          {saved ? <p className="muted" role="status">Saved.</p> : null}

          {editing ? (
            <form className="authcard" onSubmit={save} aria-label="Edit your profile" style={{ marginBottom: 20 }}>
              <Field label="Name"><input name="name" defaultValue={user.name} required maxLength={80} /></Field>
              <Field label="Headline (one line)"><input name="headline" defaultValue={user.headline ?? ''} maxLength={120} placeholder="What you do, in a few words" /></Field>
              <Field label="About you"><textarea name="overview" defaultValue={user.overview ?? ''} rows={4} maxLength={1000} /></Field>
              <Field label="Location"><input name="location" defaultValue={user.location ?? ''} maxLength={60} /></Field>
              <Field label="Rate per hour (rupees)"><input name="rate" type="number" min={1} step={1} inputMode="numeric" defaultValue={user.ratePerHour ?? ''} /></Field>
              <Field label="Skills (separate with commas)"><input name="skills" defaultValue={user.skills.join(', ')} /></Field>
              <Button type="submit">Save</Button>
            </form>
          ) : null}

          <h2 style={{ marginTop: 0 }}>About</h2>
          <p>{data.overview || 'No overview yet.'}</p>

          <h2>Skills</h2>
          {data.skills.length ? <ul className="fcard-chips" aria-label="Skills">{data.skills.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="muted">No skills listed.</p>}

          <div className="statrow">
            <div><strong>{data.jobsDone}</strong><span>Jobs (sample)</span></div>
            <div><strong>{data.projects.length}</strong><span>Projects on this site</span></div>
            <div><strong>{data.reviewCount}</strong><span>Reviews (sample)</span></div>
            <div><strong>{data.rating ? data.rating.toFixed(1) : '-'}</strong><span>Rating (sample)</span></div>
          </div>

          <h2>Previous work</h2>
          <PortfolioList items={data.portfolio} empty="No previous work yet." />

          {data.workedWith.length ? (
            <>
              <h2>You have worked with</h2>
              <ul className="fcard-chips" aria-label="Past clients">{data.workedWith.map((c) => <li key={c}>{c}</li>)}</ul>
            </>
          ) : null}

          <h2>Reviews from clients</h2>
          <ReviewList reviews={data.reviews} empty="No reviews yet." />
          <SampleNote>Previous work, ratings and reviews are made-up sample content for the demo.</SampleNote>
        </>
      ) : null}
    </>
  );
}
