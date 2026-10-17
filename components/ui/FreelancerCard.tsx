'use client';
// A freelancer as a pastel card: availability pill, name, headline, rate, rating, jobs, place, top skills, and a profile button.
// Used when a client browses freelancers. Profiles are sample data. OWNER: Sanjana (look).
import type { Freelancer } from '@/lib/types';
import { ButtonLink, Card, Meta, money } from './index';
import { Briefcase, MapPin, Rupee, Star } from './icons';

const initials = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function FreelancerCard({ f, href, cta = 'See profile' }: { f: Freelancer; href: string; cta?: string }) {
  return (
    <Card
      title={f.name}
      badge={f.availability === 'available' ? 'Available' : 'Booked for now'}
      icon={<span style={{ fontWeight: 700, fontSize: 22 }} aria-hidden="true">{initials(f.name)}</span>}
      footer={
        <>
          <span>{f.category}</span>
          <ButtonLink href={href}>{cta}</ButtonLink>
        </>
      }
    >
      <p className="pcard-desc">{f.headline}</p>
      <Meta
        items={[
          { icon: <Rupee />, text: f.ratePerHour ? `${money(f.ratePerHour)}/hr` : 'Rate not set' },
          { icon: <Star />, text: f.rating ? `${f.rating.toFixed(1)} rating` : 'No rating yet' },
          { icon: <Briefcase />, text: `${f.jobsDone} jobs` },
          ...(f.location ? [{ icon: <MapPin />, text: f.location }] : []),
        ]}
      />
      {f.skills.length ? (
        <ul className="pcard-chips" aria-label="Skills">
          {f.skills.slice(0, 5).map((s) => <li key={s} className="pcard-chip">{s}</li>)}
        </ul>
      ) : null}
    </Card>
  );
}
