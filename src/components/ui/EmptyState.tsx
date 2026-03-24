interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{description}</p>
    </div>
  );
};
