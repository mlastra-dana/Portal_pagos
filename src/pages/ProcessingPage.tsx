import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoadingState } from '../components/ui/LoadingState';
import { validateReceipt } from '../lib/api';
import type { ValidationRequestPayload } from '../types/validation';

interface ProcessingLocationState {
  fileToken?: string;
  payload?: ValidationRequestPayload;
}

export const ProcessingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ProcessingLocationState | null) ?? null;
  const [error, setError] = useState('');

  useEffect(() => {
    const runValidation = async () => {
      if (!state?.fileToken || !state.payload) {
        navigate('/validar');
        return;
      }

      try {
        const { validationId } = await validateReceipt(state.fileToken, state.payload);
        navigate('/resultado', { state: { validationId } });
      } catch {
        setError('La validación no pudo completarse. Intenta nuevamente en unos momentos.');
      }
    };

    runValidation();
  }, [navigate, state]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
        <h2 className="text-2xl font-semibold text-danger">No se pudo completar el proceso</h2>
        <p className="mt-3 text-sm text-muted">{error}</p>
        <button
          className="mt-6 rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => navigate('/validar')}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <LoadingState
      title="Estamos validando tu comprobante"
      message="Este proceso puede tomar unos segundos. Mantén esta ventana abierta mientras completamos la revisión."
    />
  );
};
