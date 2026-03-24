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
        'inline-flex items-center justify-center rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
