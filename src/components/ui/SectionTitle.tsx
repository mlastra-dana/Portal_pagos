import type { ReactNode } from 'react';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}

export const SectionTitle = ({ eyebrow, title, description }: SectionTitleProps) => {
  return (
    <div className="space-y-3">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-3xl text-base leading-7 text-muted">{description}</p> : null}
    </div>
  );
};
