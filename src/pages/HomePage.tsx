import { Link } from 'react-router-dom';

export const HomePage = () => {
  return (
    <div className="mx-auto max-w-6xl">
      <section className="rounded-[3rem] bg-[#ea5b31] px-8 py-10 text-white shadow-panel sm:px-12 sm:py-14 md:px-16 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">DANAConnect Demo</p>
        <h1 className="mt-8 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl md:text-[4.4rem]">
          Prueba la extracción de comprobantes.
        </h1>
        <div className="mt-12">
          <Link to="/validar" className="inline-flex">
            <button
              type="button"
              className="inline-flex min-w-[240px] items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-[#d14d28] shadow-none transition hover:bg-[#fff4ee]"
            >
              Ir al demo
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};
