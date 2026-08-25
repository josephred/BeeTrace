import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { UpdatePrompt } from './components/UpdatePrompt';
import { Spinner } from './components/ui';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProducersPage } from './pages/ProducersPage';
import { EstablishmentsPage } from './pages/EstablishmentsPage';
import { ApiariesPage } from './pages/ApiariesPage';
import { MovementsPage } from './pages/MovementsPage';
import { MovementDetailPage } from './pages/MovementDetailPage';
import { ExtractionsPage } from './pages/ExtractionsPage';
import { LotsPage } from './pages/LotsPage';
import { LotDetailPage } from './pages/LotDetailPage';
import { DrumsPage } from './pages/DrumsPage';
import { TracePage } from './pages/TracePage';
import { AuditPage } from './pages/AuditPage';
import { RulesPage } from './pages/RulesPage';
import { PendingPage } from './pages/PendingPage';

export const App = () => {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <Spinner label="Iniciando BeeTrace…" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<DashboardPage />} />
          <Route path="producers" element={<ProducersPage />} />
          <Route path="establishments" element={<EstablishmentsPage />} />
          <Route path="apiaries" element={<ApiariesPage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="movements/:id" element={<MovementDetailPage />} />
          <Route path="extractions" element={<ExtractionsPage />} />
          <Route path="lots" element={<LotsPage />} />
          <Route path="lots/:id" element={<LotDetailPage />} />
          <Route path="drums" element={<DrumsPage />} />
          <Route path="trace" element={<TracePage />} />
          <Route path="trace/:direction/:entityType/:id" element={<TracePage />} />
          <Route path="rules" element={<RulesPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="pending" element={<PendingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <UpdatePrompt />
    </>
  );
};
