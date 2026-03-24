import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/validar', label: 'Validar comprobante' },
  { to: '/historial', label: 'Historial' },
];

export const Header = () => {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-border/80 bg-bg/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex min-h-20 w-full max-w-7xl flex-col justify-center py-3 md:h-20 md:flex-row md:items-center md:justify-between md:py-0">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-600">Portal de Soporte</p>
          <p className="text-xl font-semibold text-brand-900">Mercantil Seguros</p>
        </div>

        <nav aria-label="Navegación principal" className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  isActive ? 'bg-brand-100 text-brand-900' : 'text-muted hover:bg-brand-50 hover:text-brand-800',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <nav aria-label="Navegación móvil" className="mt-3 flex w-full gap-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex-1 rounded-md px-3 py-2 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
                  isActive ? 'bg-brand-100 text-brand-900' : 'bg-white text-muted hover:bg-brand-50',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};
