import type { ReactNode } from 'react';

interface ResultSummaryCardProps {
  title: string;
  children: ReactNode;
}

export const ResultSummaryCard = ({ title, children }: ResultSummaryCardProps) => {
  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-soft">
      <h3 className="text-sm font-semibold text-brand-900">{title}</h3>
      <div className="mt-2 text-sm leading-5 text-muted">{children}</div>
    </section>
  );
};
