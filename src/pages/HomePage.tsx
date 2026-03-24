import { Link } from 'react-router-dom';
import { InfoCard } from '../components/ui/InfoCard';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';

export const HomePage = () => {
  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-border bg-gradient-to-b from-white to-brand-50/40 p-8 shadow-panel sm:p-12">
        <SectionTitle
          eyebrow="Portal de validación"
          title="Validación de comprobantes de pago"
          description="Carga tu comprobante de forma segura y obtén un resultado claro sobre su consistencia, en un flujo diseñado para clientes y equipos de soporte."
        />

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link to="/validar">
            <PrimaryButton>Iniciar validación</PrimaryButton>
          </Link>
          <Link
            to="/historial"
            className="inline-flex rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Consultar historial
          </Link>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <InfoCard
          title="Carga segura"
          description="Tus comprobantes se procesan en un entorno controlado con trazabilidad de cada validación."
          icon={<span className="text-lg font-semibold">01</span>}
        />
        <InfoCard
          title="Validación automatizada"
          description="El sistema identifica y compara datos clave del comprobante para acelerar la revisión."
          icon={<span className="text-lg font-semibold">02</span>}
        />
        <InfoCard
          title="Resultado claro"
          description="Obtén un dictamen entendible con observaciones y siguiente acción recomendada."
          icon={<span className="text-lg font-semibold">03</span>}
        />
      </section>
    </div>
  );
};
