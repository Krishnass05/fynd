'use client';
// A freelancer as a card: photo block with initials and a heart to save, name, headline, rating, place, skills, rate.
// Used when a client browses freelancers. Profiles are sample data. OWNER: Sanjana (look).
import Link from 'next/link';
import { initials } from '@/lib/format';
import type { Freelancer } from '@/lib/types';
import { ButtonLink, money, toneFor } from './index';
import { Heart, MapPin, Star } from './icons';

export default function FreelancerCard({ f, href, onSave }: {
  f: Freelancer;
  href: string;
  onSave?: (id: string, saved: boolean) => void; // when given, the heart is shown
}) {
  return (
    <article className="fcard">
      <div className="fcard-photo" data-tone={toneFor(f.name)}>
        <span className="fcard-initials" aria-hidden="true">{initials(f.name)}</span>
        <span className={`fcard-avail${f.availability === 'available' ? '' : ' busy'}`}>{f.availability === 'available' ? 'Available' : 'Booked for now'}</span>
        {onSave ? (
          <button
            type="button"
            className="fcard-heart"
            aria-pressed={Boolean(f.saved)}
            aria-label={`${f.saved ? 'Remove' : 'Save'} ${f.name}`}
            onClick={() => onSave(f.id, !f.saved)}
          >
            <Heart size={20} filled={Boolean(f.saved)} />
          </button>
        ) : null}
      </div>
      <div className="fcard-body">
        <h3 className="fcard-name"><Link href={href}>{f.name}</Link></h3>
        <p className="fcard-role">{f.headline}</p>
        <p className="fcard-meta">
          <span><Star size={14} /> {f.rating ? f.rating.toFixed(1) : 'New'} ({f.jobsDone})</span>
          {f.location ? <span><MapPin size={14} /> {f.location}</span> : null}
        </p>
        {f.skills.length ? (
          <ul className="fcard-chips" aria-label="Skills">
            {f.skills.slice(0, 3).map((s) => <li key={s}>{s}</li>)}
          </ul>
        ) : null}
        <div className="fcard-foot">
          <strong>{f.ratePerHour ? `${money(f.ratePerHour)}/hr` : 'Rate not set'}</strong>
          <ButtonLink href={href} variant="secondary">See profile</ButtonLink>
        </div>
      </div>
    </article>
  );
}
