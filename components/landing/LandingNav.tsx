'use client';
// Top bar of the public home page: Crewmate wordmark, Find Talent, Find Work, Explore Categories
// (drop-down), How It Works, Pricing, and on the right Log in and Sign up, which open /login and /register.
// Sticky; on phones the links move into a drawer. OWNER: Krishna.
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from './data';
import { goSearch } from './goSearch';

export default function LandingNav() {
  const router = useRouter();
  const [cats, setCats] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const wrap = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setCats(false); setDrawer(false); } };
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setCats(false); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, []);
  useEffect(() => { document.body.style.overflow = drawer ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer]);

  const close = () => { setCats(false); setDrawer(false); };
  const talent = () => { close(); goSearch(router.push, 'hire'); };
  const work = () => { close(); goSearch(router.push, 'work'); };

  const links = (
    <>
      <button type="button" className="lnav-link" onClick={talent}>Find Talent</button>
      <button type="button" className="lnav-link" onClick={work}>Find Work</button>
      <div className="lnav-item" onMouseEnter={() => setCats(true)} onMouseLeave={() => setCats(false)}>
        <button type="button" className="lnav-link" aria-expanded={cats} aria-controls="lnav-cats" onClick={() => setCats(true)}>
          Explore Categories<span className="caret" aria-hidden="true" />
        </button>
        {cats ? (
          <ul className="lnav-menu" id="lnav-cats">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <button type="button" onClick={() => { close(); goSearch(router.push, 'hire', c.to); }}>
                  <strong>{c.name}</strong><span>{c.description}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <a className="lnav-link" href="#how-it-works" onClick={close}>How It Works</a>
      <a className="lnav-link" href="#pricing" onClick={close}>Pricing</a>
    </>
  );

  return (
    <header className="lnav" data-scrolled={scrolled || undefined} ref={wrap}>
      <div className="lnav-row">
        <Link href="/" className="lnav-brand" aria-label="Crewmate, home"><LogoMark size={28} />Crew<span>mate</span><i aria-hidden="true" /></Link>
        <nav className="lnav-links" aria-label="Main">{links}</nav>
        <div className="lnav-cta">
          <Link href="/login" className="lnav-link lnav-signin">Log in</Link>
          <Link href="/register" className="btn">Sign up</Link>
        </div>
        <button type="button" className="lnav-burger" aria-label={drawer ? 'Close menu' : 'Open menu'} aria-expanded={drawer} aria-controls="lnav-drawer" onClick={() => setDrawer((d) => !d)}>
          <span /><span /><span />
        </button>
      </div>
      {drawer ? (
        <div className="lnav-drawer" id="lnav-drawer">
          <nav aria-label="Main">{links}</nav>
          <div className="lnav-drawer-cta">
            <Link href="/login" className="btn secondary" onClick={close}>Log in</Link>
            <Link href="/register" className="btn" onClick={close}>Sign up</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
