import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/validar', label: 'Gestión de pagos' },
  { to: '/historial', label: 'Historial' },
];

export const Header = () => {
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  return (
    <header>
      <div className="h-5 w-full bg-[#5d3b18]" />
      <div className="w-full bg-brand-700 px-4 py-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between">
          {logoError ? (
            <div className="text-white">
              <p className="text-3xl font-semibold italic leading-none">Mercantil</p>
              <p className="text-2xl font-semibold italic leading-none">Seguros</p>
            </div>
          ) : (
            <img
              src="/Brand/logo_mercantil.png"
              alt="Mercantil Seguros"
              className="h-11 w-auto sm:h-12"
              onError={() => setLogoError(true)}
            />
          )}
          <div className="flex items-center gap-2">
            <nav aria-label="Navegación principal" className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md border border-white/25 px-3 py-1.5 text-sm font-semibold transition',
                      isActive ? 'bg-white text-brand-800' : 'bg-white/10 text-white hover:bg-white/20',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Salir
              </button>
            </nav>
            <span className="rounded-sm bg-white/10 px-2 py-1 text-lg leading-none" aria-label="Venezuela">
              🇻🇪
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 md:hidden lg:px-8">
        <nav aria-label="Navegación móvil" className="grid grid-cols-2 gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md border px-3 py-2 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 md:text-sm',
                  isActive
                    ? 'border-brand-300 bg-brand-50 text-brand-800'
                    : 'border-border bg-white text-muted hover:bg-brand-50/40',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-md border border-border bg-white px-3 py-2 text-center text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
};
