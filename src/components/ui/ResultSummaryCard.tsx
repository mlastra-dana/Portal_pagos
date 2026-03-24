import type { ReactNode } from 'react';

interface ResultSummaryCardProps {
  title: string;
  children: ReactNode;
}

export const ResultSummaryCard = ({ title, children }: ResultSummaryCardProps) => {
  return (
    <section className="rounded-lg border border-border bg-white p-6 shadow-soft">
      <h3 className="text-base font-semibold text-brand-900">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-muted">{children}</div>
    </section>
  );
};
