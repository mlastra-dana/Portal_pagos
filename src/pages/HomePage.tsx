import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ID_PREFIXES = ['V', 'E', 'J', 'G'] as const;

const normalizeCedulaNumber = (value: string) => {
  return value.replace(/\D/g, '').slice(0, 9);
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [cedulaPrefix, setCedulaPrefix] = useState<(typeof ID_PREFIXES)[number]>('V');
  const [cedulaNumber, setCedulaNumber] = useState('');
  const [password, setPassword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const cedulaIsValid = useMemo(() => /^\d{6,9}$/.test(cedulaNumber), [cedulaNumber]);
  const passwordIsValid = password.trim().length > 0;
  const showCedulaError = hasSubmitted && !cedulaIsValid;
  const showPasswordError = hasSubmitted && !passwordIsValid;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);

    if (!cedulaIsValid || !passwordIsValid) return;

    navigate('/facturas', {
      state: {
        customer: {
          cedula: `${cedulaPrefix}-${cedulaNumber}`,
        },
      },
    });
  };

  return (
    <div className="flex w-full items-center justify-center py-4 sm:py-6">
      <section className="w-full max-w-[720px] overflow-hidden rounded-xl bg-[linear-gradient(135deg,#5518c9_0%,#3b118d_52%,#140c25_100%)] px-6 py-8 text-white shadow-panel sm:px-12 sm:py-10">
        <div className="max-w-[460px]">
          <img
            src="/Brand/example_brand_kit_2/logos/svg/example_company_white.svg"
            alt="Example Company"
            className="h-11 w-auto object-contain sm:h-12"
          />

          <h1 className="mt-10 text-3xl font-bold leading-tight sm:text-4xl">
            Gestión de pagos
          </h1>

          <form className="mt-6 space-y-3" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="sr-only" htmlFor="cedula">
                Cédula
              </label>
              <div className="flex h-12 overflow-hidden rounded-lg border border-white/30 bg-white shadow-none transition focus-within:border-white focus-within:ring-2 focus-within:ring-white/35">
                <select
                  aria-label="Prefijo de cédula"
                  value={cedulaPrefix}
                  onChange={(event) => setCedulaPrefix(event.target.value as (typeof ID_PREFIXES)[number])}
                  className="h-full w-20 border-r border-brand-100 bg-brand-50 px-3 text-base font-bold text-brand-800 outline-none"
                >
                  {ID_PREFIXES.map((prefix) => (
                    <option key={prefix} value={prefix}>
                      {prefix}
                    </option>
                  ))}
                </select>
                <input
                  id="cedula"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="username"
                  value={cedulaNumber}
                  onChange={(event) => setCedulaNumber(normalizeCedulaNumber(event.target.value))}
                  className="h-full min-w-0 flex-1 bg-white px-4 text-base font-semibold text-brand-900 outline-none placeholder:text-brand-900/45"
                  placeholder="12345678"
                  aria-invalid={showCedulaError}
                  aria-describedby={showCedulaError ? 'cedula-error' : undefined}
                />
              </div>
              {showCedulaError ? (
                <p id="cedula-error" className="mt-2 text-sm font-semibold text-white">
                  Ingresa solo números: mínimo 6 y máximo 9 dígitos.
                </p>
              ) : null}
            </div>

            <div>
              <label className="sr-only" htmlFor="password">
                Clave
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-lg border border-white/30 bg-white px-4 text-base font-semibold text-brand-900 shadow-none outline-none transition placeholder:text-brand-900/45 focus:border-white focus:bg-white focus:ring-2 focus:ring-white/35"
                placeholder="Clave"
                aria-invalid={showPasswordError}
                aria-describedby={showPasswordError ? 'password-error' : undefined}
              />
              {showPasswordError ? (
                <p id="password-error" className="mt-2 text-sm font-semibold text-white">
                  Ingresa una clave para continuar.
                </p>
              ) : null}
            </div>

            <div className="pt-1">
              <p className="mb-3 text-xs font-semibold text-white/82">
                Usa cualquier clave temporal para esta demo.
              </p>
              <button
                type="submit"
                className="inline-flex h-11 min-w-[112px] items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Iniciar
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
