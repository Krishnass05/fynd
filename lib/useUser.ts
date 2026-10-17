'use client';
// Who is acting right now, and the guard that sends people back to the start page. OWNER: Krishna.
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getMe } from './api';
import type { Role, User } from './types';
import { useAsync } from './useAsync';

export function useUser(requiredRole?: Role): { user: User | null; loading: boolean } {
  const router = useRouter();
  const { data, error, loading } = useAsync(getMe, []);
  useEffect(() => {
    if (loading) return;
    if (error || !data || (requiredRole && data.role !== requiredRole)) router.replace('/login');
  }, [loading, error, data, requiredRole, router]);
  return { user: data, loading };
}
