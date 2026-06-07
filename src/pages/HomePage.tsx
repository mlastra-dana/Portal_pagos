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
      <div className="h-24 bg-white sm:h-36 lg:h-44" />
      <div className="flex flex-1 items-start justify-center px-5 py-8 sm:px-8 sm:py-10">
        <section className="w-full max-w-[850px] overflow-hidden rounded-xl bg-[linear-gradient(135deg,#5317c9_0%,#3d128d_50%,#151020_100%)] px-8 py-10 text-white shadow-[0_34px_92px_rgba(31,14,65,0.26)] sm:px-16 sm:py-14 lg:min-h-[620px] lg:px-20">
          <div className="max-w-[560px]">
            <img
              src="/Brand/example_brand_kit_2/logos/svg/example_company_white.svg"
              alt="Example Company"
              className="h-16 w-auto object-contain opacity-90 sm:h-20"
            />

            <h1 className="mt-16 text-4xl font-bold leading-tight sm:text-5xl">
              Gestión de pagos
            </h1>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="sr-only" htmlFor="cedula">
                  Cédula
                </label>
                <div className="flex h-16 overflow-hidden rounded-lg border border-transparent bg-[#e8effa] shadow-none transition focus-within:border-white/70 focus-within:ring-2 focus-within:ring-white/25">
                  <select
                    aria-label="Prefijo de cédula"
                    value={cedulaPrefix}
                    onChange={(event) => setCedulaPrefix(event.target.value as (typeof ID_PREFIXES)[number])}
                    className="login-id-select h-full w-24 border-r border-[#c9d3e1] bg-[#e8effa] px-4 text-lg font-bold text-text outline-none"
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
                    className="login-id-input h-full min-w-0 flex-1 bg-[#e8effa] px-5 text-xl font-semibold text-text outline-none placeholder:text-text/45"
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
                  className="login-password-input h-16 w-full rounded-lg border border-white/40 px-5 text-xl font-semibold shadow-none outline-none transition placeholder:text-white/58 focus:border-white/80 focus:ring-2 focus:ring-white/35"
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

              <div className="pt-8">
                <button
                  type="submit"
                  className="inline-flex h-14 min-w-[118px] items-center justify-center rounded-lg bg-white px-6 text-lg font-bold text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
