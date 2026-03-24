import type { ReactNode } from 'react';

interface InfoCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export const InfoCard = ({ title, description, icon }: InfoCardProps) => {
  return (
    <article className="rounded-lg border border-border bg-surface p-6 shadow-soft">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-brand-100 text-brand-700">{icon}</div>
      <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </article>
  );
};
