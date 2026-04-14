import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Login } from './Login';
import { Sessions } from './Sessions';
import { Questions } from './Questions';

type AdminView = 'sessions' | 'questions';

export function AdminApp() {
  const { status, login, logout, username } = useAdminAuth();
  const [view, setView] = useState<AdminView>('sessions');

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

  if (view === 'questions') {
    return <Questions onBack={() => setView('sessions')} />;
  }

  return (
    <Sessions
      onLogout={logout}
      username={username ?? ''}
      onNavigateQuestions={() => setView('questions')}
    />
  );
}
