import type { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export const SectionTitle = ({ eyebrow, title, description }: SectionTitleProps) => {
  return (
    <div className="space-y-1.5">
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-500">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold leading-tight text-text sm:text-[2rem]">{title}</h1>
      {description ? <p className="max-w-3xl text-[0.95rem] leading-6 text-muted">{description}</p> : null}
    </div>
  );
};
