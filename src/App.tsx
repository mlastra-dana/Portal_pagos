import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { ComplementaryDocumentsPage } from './pages/ComplementaryDocumentsPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PendingInvoicesPage } from './pages/PendingInvoicesPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { ResultPage } from './pages/ResultPage';
import { ValidatePage } from './pages/ValidatePage';

const App = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/facturas" element={<PendingInvoicesPage />} />
        <Route path="/validar" element={<ValidatePage />} />
        <Route path="/documentos-complementarios" element={<ComplementaryDocumentsPage />} />
        <Route path="/procesando" element={<ProcessingPage />} />
        <Route path="/resultado" element={<ResultPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
};

export default App;
