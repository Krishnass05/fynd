// A light top bar for the standalone info pages (About, Contact, Help, Terms): logo home, Log in, Sign up.
// OWNER: Krishna.
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';
import s from './info.module.css';

export default function SimpleHeader() {
  return (
    <header className={s.top}>
      <Link href="/" className={s.brand} aria-label="Crewmate, home"><LogoMark size={28} /> Crewmate</Link>
      <nav className={s.nav} aria-label="Account">
        <Link href="/login">Log in</Link>
        <Link href="/register" className="btn">Sign up</Link>
      </nav>
    </header>
  );
}
