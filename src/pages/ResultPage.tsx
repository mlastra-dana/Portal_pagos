import { Link, Navigate, useLocation } from 'react-router-dom';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionTitle } from '../components/ui/SectionTitle';

export const ResultPage = () => {
  const location = useLocation();
  const state = (location.state ?? {}) as { title?: string };

  if (!state.title) {
    return <Navigate to="/validar" replace />;
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,255,255,0.97))] shadow-premium">
        <div className="px-7 py-10 md:px-9">
          <SectionTitle
            eyebrow="Example Company"
            title={state.title}
          />

          <div className="mt-8 rounded-[1.5rem] border border-border bg-white p-6 shadow-soft">
            <p className="text-lg font-semibold text-text">{state.title}</p>

            <div className="mt-6">
              <Link to="/validar" className="inline-flex">
                <PrimaryButton className="px-6 py-2.5 text-sm">
                  Nuevo registro
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
