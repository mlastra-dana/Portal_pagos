import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getCustomerSession, saveCustomerSession } from '../lib/activeValidationSession';

const ID_PREFIXES = ['V', 'E', 'J', 'G'] as const;

const normalizeCedulaNumber = (value: string) => {
  return value.replace(/\D/g, '').slice(0, 9);
};

export const HomePage = () => {
  const navigate = useNavigate();
  const activeCustomer = getCustomerSession();
  const [cedulaPrefix, setCedulaPrefix] = useState<(typeof ID_PREFIXES)[number]>('V');
  const [cedulaNumber, setCedulaNumber] = useState('');
  const [password, setPassword] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const cedulaIsValid = useMemo(() => /^\d{6,9}$/.test(cedulaNumber), [cedulaNumber]);
  const passwordIsValid = password.trim().length > 0;
  const showCedulaError = hasSubmitted && !cedulaIsValid;
  const showPasswordError = hasSubmitted && !passwordIsValid;

  if (activeCustomer) {
    return <Navigate to="/facturas" replace state={{ customer: activeCustomer }} />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSubmitted(true);

    if (!cedulaIsValid || !passwordIsValid) return;
    const customer = {
      cedula: `${cedulaPrefix}-${cedulaNumber}`,
    };

    saveCustomerSession(customer);

    navigate('/facturas', {
      state: {
        customer,
      },
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f6f3fb]">
      <div className="h-[140px] bg-white sm:h-[166px]" />
      <div className="flex flex-1 items-start justify-center px-5 py-7 sm:px-8">
        <section className="w-full max-w-[746px] overflow-hidden rounded-lg bg-[linear-gradient(136deg,#5718cb_0%,#421495_50%,#171025_100%)] px-8 py-10 text-white shadow-[0_34px_92px_rgba(31,14,65,0.24)] sm:min-h-[686px] sm:px-16 sm:py-[96px]">
          <div className="max-w-[488px]">
            <img
              src="/Brand/example_brand_kit_2/logos/svg/example_company_white.svg"
              alt="Example Company"
              className="h-[64px] w-auto object-contain opacity-90"
            />

            <h1 className="mt-[72px] text-[38px] font-bold leading-tight sm:text-[48px]">
              Gestión de pagos
            </h1>

            <form className="mt-8 w-full max-w-[488px] space-y-3.5" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="sr-only" htmlFor="cedula">
                  Cédula
                </label>
                <div className="flex h-[58px] overflow-hidden rounded-md border border-white/35 bg-white/12 shadow-none transition focus-within:border-white/70 focus-within:ring-2 focus-within:ring-white/25">
                  <select
                    aria-label="Prefijo de cédula"
                    value={cedulaPrefix}
                    onChange={(event) => setCedulaPrefix(event.target.value as (typeof ID_PREFIXES)[number])}
                    className="login-id-select h-full w-[78px] border-r border-white/25 bg-transparent px-4 text-[24px] font-bold text-white outline-none"
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
                    className="login-id-input h-full min-w-0 flex-1 bg-transparent px-5 text-[24px] font-semibold text-white outline-none placeholder:text-white/62"
                    placeholder="Número de cédula"
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
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="login-password-input h-[58px] w-full rounded-md border border-white/35 px-5 text-[24px] font-semibold shadow-none outline-none transition placeholder:text-white/62 focus:border-white/80 focus:ring-2 focus:ring-white/35"
                  placeholder="Contraseña"
                  aria-invalid={showPasswordError}
                  aria-describedby={showPasswordError ? 'password-error' : undefined}
                />
                {showPasswordError ? (
                  <p id="password-error" className="mt-2 text-sm font-semibold text-white">
                    Ingresa una contraseña para continuar.
                  </p>
                ) : null}
              </div>

              <div className="pt-[54px]">
                <button
                  type="submit"
                  className="inline-flex h-[52px] min-w-[98px] items-center justify-center rounded-md bg-white px-5 text-[24px] font-bold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  Iniciar
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
