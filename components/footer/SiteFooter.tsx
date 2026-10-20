// The footer on every page (rendered once, in app/layout.tsx). OWNER: Krishna.
// A centered footer in the style of React Bits Pro "Footer 8" (built here: the Pro block needs a licence we do not
// have). Brand, tagline and social icons in the middle, then Company and Help & Support, then the copyright.
// Content (tagline, social links) lives in lib/site.ts.
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { DESCRIPTION, SOCIAL, TAGLINE, type SocialId } from '@/lib/site';
import s from './footer.module.css';

const ICONS: Record<SocialId, React.ReactNode> = {
  linkedin: <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.35h-4v-4.75c0-1.13-.02-2.6-1.58-2.6-1.59 0-1.83 1.24-1.83 2.52v4.83h-4v-11Z" />,
  instagram: <path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.75a3.05 3.05 0 1 1 0-6.1 3.05 3.05 0 0 1 0 6.1ZM17 5.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 3c-2.44 0-2.75.01-3.71.05C5.3 3.2 3.2 5.3 3.05 8.29 3.01 9.25 3 9.56 3 12s.01 2.75.05 3.71c.15 2.99 2.25 5.09 5.24 5.24.96.04 1.27.05 3.71.05s2.75-.01 3.71-.05c2.99-.15 5.09-2.25 5.24-5.24.04-.96.05-1.27.05-3.71s-.01-2.75-.05-3.71C20.8 5.3 18.7 3.2 15.71 3.05 14.75 3.01 14.44 3 12 3Z" />,
  x: <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z" />,
  youtube: <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />,
};

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brandBlock}>
          <Link href="/" className={s.brand} aria-label="Crewmate, home"><LogoMark size={34} /><span>Crewmate</span></Link>
          <p className={s.tagline}>{TAGLINE}</p>
          <p className={s.desc}>{DESCRIPTION}</p>
          <ul className={s.social} aria-label="Crewmate on social media">
            {SOCIAL.map((x) => (
              <li key={x.id}>
                {x.url ? (
                  <a href={x.url} className={s.icon} aria-label={`Crewmate on ${x.label}`} target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">{ICONS[x.id]}</svg>
                  </a>
                ) : (
                  <span className={`${s.icon} ${s.iconSoon}`} role="img" aria-label={`${x.label}: page coming soon`} title={`${x.label}: page coming soon`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">{ICONS[x.id]}</svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className={s.columns}>
          <nav className={s.col} aria-label="Company">
            <h2>Company</h2>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
            </ul>
          </nav>
          <nav className={s.col} aria-label="Help and support">
            <h2>Help &amp; Support</h2>
            <ul className={s.help}>
              <li>
                <Link href="/help/freelancer"><strong>Freelancer</strong><span>Your profile, finding work, proposals and clients</span></Link>
              </li>
              <li>
                <Link href="/help/client"><strong>Client</strong><span>Posting work, hiring, projects and your account</span></Link>
              </li>
            </ul>
          </nav>
        </div>

        <hr className={s.rule} />
        <p className={s.copy}>© {year} Crewmate. All rights reserved. <span>Hackathon demo with synthetic data; a workflow aid, not legal advice.</span></p>
      </div>
    </footer>
  );
}
