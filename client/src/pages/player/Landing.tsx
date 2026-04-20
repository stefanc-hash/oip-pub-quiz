import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/AppShell';

interface Props { sessionName: string; onJoin: () => void }

export function Landing({ sessionName, onJoin }: Props) {
  return (
    <AppShell className="animate-fade-in">
      <div className="flex-1 flex flex-col justify-center gap-8 py-12">
<Badge variant="secondary" className="self-start">
          <Sparkles className="h-3 w-3" />
          Live now
        </Badge>
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">Pub Quiz</h1>
          <p className="text-lg text-[var(--color-fg-muted)]">
            You're joining <strong className="text-[var(--color-primary)]">{sessionName}</strong>
          </p>
        </div>
      </div>
      <Button size="xl" className="w-full" onClick={onJoin}>
        Join the quiz
        <ArrowRight className="h-5 w-5" />
      </Button>
    </AppShell>
  );
}
