import { cn } from '@/lib/utils';

interface Props {
  /** Seconds remaining (integer for display) */
  secondsLeft: number;
  /** Total seconds (for fill ratio) */
  totalSeconds: number;
  className?: string;
  size?: number;
}

/**
 * Radial countdown ring. Color shifts to warning at 50%, danger at <=5s.
 */
export function RadialTimer({ secondsLeft, totalSeconds, className, size = 56 }: Props) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, secondsLeft / Math.max(totalSeconds, 1)));
  const dashOffset = circumference * (1 - ratio);

  const danger = secondsLeft <= 5;
  const warning = !danger && ratio < 0.5;
  const stroke = danger
    ? 'var(--color-incorrect)'
    : warning
      ? 'var(--color-primary)'
      : 'var(--color-correct)';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 100ms linear, stroke 200ms ease' }}
        />
      </svg>
      <span
        className={cn(
          'absolute font-bold tabular-nums',
          danger && 'text-[var(--color-incorrect)]',
          !danger && 'text-[var(--color-fg)]',
        )}
        style={{ fontSize: size * 0.32 }}
      >
        {secondsLeft}
      </span>
    </div>
  );
}
