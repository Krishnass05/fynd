'use client';
// The landing after Google (or any server-side sign-in): learn who is signed in from the cookie, remember it in this
// browser, and go to the right side. OWNER: Krishna.
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { getMe } from '@/lib/api';
import { HOME } from '@/lib/nav';
import { setRole, setUserId } from '@/lib/session';
import { ErrorMessage, Spinner } from '@/components/ui';

function Done() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getMe().then((me) => {
      const want = params.get('role');
      const side = want === 'client' || want === 'freelancer' ? (me.roles ?? [me.role]).includes(want) ? want : me.role : me.role;
      setUserId(me.id);
      setRole(side);
      const next = params.get('next');
      router.replace(next && next.startsWith(`/${side}`) && !next.startsWith('//') ? next : HOME[side]);
    }).catch(() => setError('We could not finish signing you in. Please log in again.'));
  }, [params, router]);
  return (
    <main id="main-content" style={{ maxWidth: 480, margin: '80px auto', padding: 16, textAlign: 'center' }}>
      <ErrorMessage message={error} />
      {error ? <p><a href="/login">Back to log in</a></p> : <><Spinner /><p className="muted">Signing you in...</p></>}
    </main>
  );
}

export default function AuthDone() {
  return <Suspense fallback={<Spinner />}><Done /></Suspense>;
}
