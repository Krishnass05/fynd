'use client';
// Small helper so every page handles loading and errors the same way. OWNER: Krishna.
import { useCallback, useEffect, useState } from 'react';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}
