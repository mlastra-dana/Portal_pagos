import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <section className="overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#0f0f1f_0%,#4b16b6_62%,#a779ff_100%)] px-8 py-8 text-white shadow-panel sm:px-12 sm:py-10 md:px-20 md:py-12">
        <img
          src="/Brand/example_brand_kit_2/logos/svg/example_company_white.svg"
          alt="Example Company"
          className="h-14 w-auto object-contain sm:h-16"
        />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">Example Company</p>
        <h1 className="mt-5 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-[4.4rem]">
          Gestión de pagos: Validación de comprobantes
        </h1>
        <div className="mt-8">
          <Link to="/validar" className="inline-flex">
            <button
              type="button"
              className="inline-flex min-w-[240px] items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-none transition hover:bg-brand-50"
            >
              Ir al demo
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};
