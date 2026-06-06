import type { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export const InfoCard = ({ title, description, icon }: InfoCardProps) => {
  return (
    <article className="rounded-lg border border-border bg-surface p-4 shadow-soft">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-100 text-brand-700">{icon}</div>
      <h3 className="text-base font-semibold text-brand-900">{title}</h3>
      <p className="mt-2 text-sm leading-5 text-muted">{description}</p>
    </article>
  );
};
