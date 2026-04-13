import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-bg-elevated-2)] text-[var(--color-fg-muted)]',
        primary: 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]',
        secondary: 'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] border border-[var(--color-secondary)]/30',
        correct: 'bg-[var(--color-correct)] text-[var(--color-correct-fg)]',
        incorrect: 'bg-[var(--color-incorrect)] text-[var(--color-incorrect-fg)]',
        outline: 'border border-[var(--color-border-strong)] text-[var(--color-fg)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
