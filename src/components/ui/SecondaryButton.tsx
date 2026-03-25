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
        'inline-flex items-center justify-center rounded-lg border border-border bg-white px-5 py-3 text-sm font-semibold tracking-[0.01em] text-brand-700 shadow-[0_1px_2px_rgba(7,52,90,0.06)] transition hover:-translate-y-[1px] hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
