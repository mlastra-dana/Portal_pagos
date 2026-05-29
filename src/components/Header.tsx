import { useLocation, useNavigate } from 'react-router-dom';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const showExitButton = location.pathname !== '/';

  return (
    <header>
      <div className="h-2 w-full bg-[linear-gradient(90deg,#4b16b6_0%,#6d28e0_56%,#a779ff_100%)]" />
      <div className="w-full border-b border-border bg-white px-4 py-2.5 text-brand-900 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center text-left"
          >
            <img
              src="/Brand/example_brand_kit_2/logos/svg/example_company_color.svg"
              alt="Example Company"
              className="h-10 w-auto object-contain sm:h-11"
            />
          </button>
          <div className="flex items-center gap-2">
            {showExitButton ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="hidden rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:border-brand-200 hover:bg-brand-50 md:inline-flex"
              >
                Salir
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {showExitButton ? (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-4 sm:px-6 md:hidden lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full rounded-full border border-border bg-white px-3 py-2 text-center text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Salir
          </button>
        </div>
      ) : null}
    </header>
  );
};
