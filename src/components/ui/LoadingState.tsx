interface LoadingStateProps {
  title: string;
  message: string;
}

export const LoadingState = ({ title, message }: LoadingStateProps) => {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-xl border border-border bg-white px-8 py-16 text-center shadow-panel">
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-700"
        role="status"
        aria-label="Cargando"
      />
      <h2 className="mt-6 text-2xl font-semibold text-brand-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
    </div>
  );
};
