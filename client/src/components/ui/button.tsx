import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[var(--radius-lg)] text-sm font-medium tracking-wide',
    'transition-all duration-200 ease-in-out',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.97] active:shadow-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-primary)] text-[var(--color-primary-fg)]',
          'shadow-[0_1px_3px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.06)_inset]',
          'hover:bg-[var(--color-primary-hover)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
        ].join(' '),
        secondary: [
          'bg-[var(--color-bg-elevated-2)] text-[var(--color-fg)]',
          'border border-[var(--color-border)]',
          'shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
          'hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.25)]',
        ].join(' '),
        ghost: [
          'bg-transparent text-[var(--color-fg-muted)]',
          'hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-fg)]',
        ].join(' '),
        outline: [
          'bg-transparent border border-[var(--color-border-strong)] text-[var(--color-fg)]',
          'hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-fg-muted)]',
        ].join(' '),
        destructive: [
          'bg-[var(--color-incorrect)] text-[var(--color-incorrect-fg)]',
          'shadow-[0_1px_3px_rgba(0,0,0,0.25)]',
          'hover:opacity-90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
        ].join(' '),
      },
      size: {
        sm: 'h-9 px-3 text-xs rounded-[var(--radius-md)]',
        md: 'h-11 px-5',
        lg: 'h-14 px-6 text-base',
        xl: 'h-16 px-8 text-base font-semibold',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
