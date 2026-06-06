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
        'inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-[1px] hover:bg-brand-600 hover:shadow-panel disabled:cursor-not-allowed disabled:bg-brand-200 disabled:text-white/80 disabled:hover:translate-y-0 disabled:hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
