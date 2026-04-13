import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Login } from './Login';
import { Sessions } from './Sessions';

export function AdminApp() {
  const { status, login, logout, username } = useAdminAuth();

  if (status === 'loading') {
    return (
      <AppShell variant="wide">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--color-fg-muted)]">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading…</p>
        </div>
      </AppShell>
    );
  }

  if (status === 'unauthenticated') {
    return <Login onLogin={login} />;
  }

  return <Sessions onLogout={logout} username={username ?? ''} />;
}
