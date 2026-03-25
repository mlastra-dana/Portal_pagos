import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

export const PrimaryButton = ({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-brand-700 px-5 py-3 text-sm font-semibold tracking-[0.01em] text-white shadow-soft transition hover:-translate-y-[1px] hover:bg-brand-800 hover:shadow-panel disabled:cursor-not-allowed disabled:bg-brand-300 disabled:hover:translate-y-0 disabled:hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
