import type { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export const SectionTitle = ({ eyebrow, title, description }: SectionTitleProps) => {
  return (
    <div className="space-y-2">
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600">{eyebrow}</p> : null}
      <h1 className="text-[2.05rem] font-semibold leading-tight tracking-[-0.01em] text-brand-900 sm:text-[2.3rem]">{title}</h1>
      {description ? <p className="max-w-3xl text-[1.03rem] leading-7 text-muted">{description}</p> : null}
    </div>
  );
};
