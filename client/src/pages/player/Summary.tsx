import { Trophy, Target, Clock, Hash } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatSeconds } from '@/lib/utils';
import type { LeaderboardRow } from '@/types';

interface Props {
  name: string;
  totalQuestions: number;
  ownAnswers: { selectedIndex: number | null; isCorrect: boolean }[];
  leaderboard: LeaderboardRow[];
}

export function Summary({ name, totalQuestions, ownAnswers, leaderboard }: Props) {
  const ownCorrect = ownAnswers.filter(a => a.isCorrect).length;
  const own = leaderboard.find(r => `${r.firstName} ${r.lastName}` === name);
  const first = name.split(' ')[0] ?? name;

  return (
    <AppShell className="animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
          <Trophy className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nice one, {first}!</h1>
          <p className="text-sm text-[var(--color-fg-muted)]">Here’s how you did.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat icon={Target} label="Score" value={`${ownCorrect}/${totalQuestions}`} />
        <Stat
          icon={Clock}
          label="Avg time"
          value={formatSeconds(own?.avgResponseTimeMsOnCorrect ?? null)}
        />
        <Stat icon={Hash} label="Rank" value={own ? `#${own.rank}` : '—'} />
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Group leaderboard</h2>
          <span className="text-xs text-[var(--color-fg-muted)]">{leaderboard.length} player{leaderboard.length === 1 ? '' : 's'}</span>
        </div>
        <Leaderboard rows={leaderboard} highlightParticipantId={own?.participantId} />
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--color-fg-muted)]" />
        <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">{label}</div>
        <div className="text-xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function Leaderboard({ rows, highlightParticipantId }: { rows: LeaderboardRow[]; highlightParticipantId?: number }) {
  if (rows.length === 0) return <p className="text-[var(--color-fg-muted)]">No players yet.</p>;
  return (
    <ol className="space-y-2">
      {rows.map(r => {
        const isMe = r.participantId === highlightParticipantId;
        return (
          <li
            key={r.participantId}
            className={cn(
              'grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 surface',
              isMe && 'border-[var(--color-primary)] bg-[var(--color-primary)]/5',
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-elevated-2)] text-sm font-semibold tabular-nums">
              {r.rank}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{r.firstName} {r.lastName}</div>
              {isMe && <div className="text-xs text-[var(--color-primary)]">You</div>}
            </div>
            <Badge variant={r.correctCount > 0 ? 'primary' : 'default'}>{r.correctCount}</Badge>
            <div className="text-sm text-[var(--color-fg-muted)] tabular-nums w-12 text-right">
              {formatSeconds(r.avgResponseTimeMsOnCorrect)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
