import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', label: 'Inicio' },
  { to: '/validar', label: 'Validar comprobante' },
  { to: '/historial', label: 'Historial' },
];

export const Header = () => {
  return (
    <header className="mb-8 mt-2 rounded-2xl bg-brand-700 px-5 py-4 text-white shadow-soft sm:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="leading-tight">
          <p className="text-3xl font-semibold italic tracking-tight">Mercantil</p>
          <p className="-mt-1 text-2xl font-semibold italic">Seguros</p>
        </div>

        <div className="flex items-center gap-3">
          <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                    isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="rounded-sm bg-white/15 px-2 py-1 text-lg leading-none" aria-label="Venezuela">
            🇻🇪
          </span>
        </div>

        <nav aria-label="Navegación móvil" className="grid w-full grid-cols-3 gap-2 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-center text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                  isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-white/90 hover:bg-white/20',
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
