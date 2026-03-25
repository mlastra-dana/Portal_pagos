import { Link } from 'react-router-dom';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';

export const HomePage = () => {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel md:grid md:grid-cols-[1fr_1.05fr]">
        <div className="bg-brand-700 px-8 py-10 text-white sm:px-12 sm:py-14">
          <h2 className="mt-8 text-4xl font-semibold leading-tight">Portal de Gestión de Pagos</h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-white/90">
            Proceso rápido y sencillo para confirmar tu pago de forma segura.
          </p>
        </div>

        <div className="px-8 py-10 sm:px-12 sm:py-14">
          <SectionTitle
            title="Ingrese al módulo de pagos"
            description="Registre y valide pagos cargando el comprobante correspondiente."
          />
          <div className="mt-8 space-y-4">
            <Link to="/validar" className="block">
              <PrimaryButton className="w-full py-3.5 text-base">Ir a Gestión de Pagos</PrimaryButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
