import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  /** Use centered narrow column (default) or fluid wide layout. */
  variant?: 'narrow' | 'wide' | 'display';
}

/**
 * Page shell. Provides consistent vertical rhythm and max-width per variant:
 *  - narrow: player flow (max-w-lg, padded)
 *  - wide:   admin (max-w-2xl)
 *  - display: full-bleed for projector view
 */
export function AppShell({ children, className, variant = 'narrow' }: Props) {
  return (
    <main
      className={cn(
        'min-h-dvh quiz-bg flex flex-col',
        variant === 'narrow' && 'mx-auto max-w-lg w-full p-5 sm:p-8 gap-6',
        variant === 'wide' && 'mx-auto max-w-2xl w-full p-5 sm:p-8 gap-6',
        variant === 'display' && 'p-8 sm:p-12 gap-8',
        className,
      )}
    >
      {children}
    </main>
  );
}
