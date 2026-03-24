import { Link } from 'react-router-dom';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';

export const HomePage = () => {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-panel md:grid md:grid-cols-[1fr_1.05fr]">
        <div className="bg-brand-700 px-8 py-10 text-white sm:px-12 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">Portal cliente</p>
          <h2 className="mt-8 text-4xl font-semibold leading-tight">Valida tu comprobante de pago</h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-white/90">
            Proceso rápido y sencillo para confirmar tu pago de forma segura.
          </p>
          <div className="mt-8">
            <Link
              to="/historial"
              className="inline-flex rounded-md bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Consultar historial
            </Link>
          </div>
        </div>

        <div className="px-8 py-10 sm:px-12 sm:py-14">
          <SectionTitle
            eyebrow="¿Ya tiene su comprobante?"
            title="Ingrese al formulario"
            description="Solo necesitamos su cédula, nombre completo y el archivo del comprobante."
          />
          <div className="mt-8 space-y-4">
            <Link to="/validar" className="block">
              <PrimaryButton className="w-full py-3.5 text-base">Iniciar validación</PrimaryButton>
            </Link>
            <p className="text-center text-sm text-muted">Atención y soporte durante el horario administrativo.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
