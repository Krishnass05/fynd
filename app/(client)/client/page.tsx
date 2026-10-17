'use client';
// The client dashboard now lives under the profile. Old links to /client still work.
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ClientIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/client/profile'); }, [router]);
  return null;
}
