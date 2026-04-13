import { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '@/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export function useAdminAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [username, setUsername] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await adminApi.me();
      setUsername(me.username);
      setStatus('authenticated');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStatus('unauthenticated');
        setUsername(null);
      } else {
        setStatus('unauthenticated');
      }
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (u: string, p: string) => {
    const res = await adminApi.login(u, p);
    setUsername(res.username);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await adminApi.logout();
    setUsername(null);
    setStatus('unauthenticated');
  }, []);

  return { status, username, login, logout, refresh };
}
