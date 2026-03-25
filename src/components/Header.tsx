import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Header = () => {
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const showExitButton = location.pathname !== '/';

  return (
    <header>
      <div className="h-5 w-full bg-[#5d3b18]" />
      <div className="w-full border-b border-[#e3e7ee] bg-white px-4 py-3 text-brand-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between">
          {logoError ? (
            <div className="text-brand-900">
              <p className="text-3xl font-semibold italic leading-none">Mercantil</p>
              <p className="text-2xl font-semibold italic leading-none">Seguros</p>
            </div>
          ) : (
            <img
              src="/Brand/logo_mercantil.jpg"
              alt="Mercantil Seguros"
              className="h-12 w-auto object-contain sm:h-14"
              onError={() => setLogoError(true)}
            />
          )}
          <div className="flex items-center gap-2">
            {showExitButton ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="hidden rounded-md border border-[#d3dbe8] bg-white px-3 py-1.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 md:inline-flex"
              >
                Salir
              </button>
            ) : null}
            <span className="rounded-md border border-[#d3dbe8] bg-white px-2 py-1 text-lg leading-none" aria-label="Venezuela">
              🇻🇪
            </span>
          </div>
        </div>
      </div>

      {showExitButton ? (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 md:hidden lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-center text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Salir
          </button>
        </div>
      ) : null}
    </header>
  );
};
