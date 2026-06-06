import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-white p-6 text-center shadow-soft">
      <h1 className="text-2xl font-semibold text-brand-900">Página no encontrada</h1>
      <p className="mt-3 text-sm text-muted">La ruta solicitada no está disponible en este portal.</p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-md bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
};
