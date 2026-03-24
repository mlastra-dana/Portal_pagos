interface ResultFieldProps {
  label: string;
  value: string;
}

export const ResultField = ({ label, value }: ResultFieldProps) => {
  return (
    <div className="rounded-md border border-border bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-brand-900">{value}</p>
    </div>
  );
};
