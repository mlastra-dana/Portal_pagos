import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

export const SecondaryButton = ({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold tracking-[0.01em] text-brand-500 shadow-[0_1px_2px_rgba(95,75,59,0.05)] transition hover:-translate-y-[1px] hover:border-brand-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
