import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { RoleRoute } from './components/RoleRoute';
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
        <Spinner label="Iniciando ApiTrace…" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="producers"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'PRODUCTOR', 'AUDITOR']}>
                <ProducersPage />
              </RoleRoute>
            }
          />
          <Route
            path="establishments"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'PRODUCTOR', 'SALA', 'ACOPIADOR', 'FRACCIONADOR', 'AUDITOR']}>
                <EstablishmentsPage />
              </RoleRoute>
            }
          />
          <Route
            path="apiaries"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'PRODUCTOR', 'AUDITOR']}>
                <ApiariesPage />
              </RoleRoute>
            }
          />
          <Route
            path="movements"
            element={
              <RoleRoute
                allowedRoles={['ADMIN', 'PRODUCTOR', 'SALA', 'ACOPIADOR', 'FRACCIONADOR', 'TRANSPORTISTA', 'AUDITOR']}
              >
                <MovementsPage />
              </RoleRoute>
            }
          />
          <Route
            path="movements/:id"
            element={
              <RoleRoute
                allowedRoles={['ADMIN', 'PRODUCTOR', 'SALA', 'ACOPIADOR', 'FRACCIONADOR', 'TRANSPORTISTA', 'AUDITOR']}
              >
                <MovementDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="extractions"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'SALA', 'ACOPIADOR', 'AUDITOR']}>
                <ExtractionsPage />
              </RoleRoute>
            }
          />
          <Route
            path="lots"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR', 'LABORATORIO', 'AUDITOR']}>
                <LotsPage />
              </RoleRoute>
            }
          />
          <Route
            path="lots/:id"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR', 'LABORATORIO', 'AUDITOR']}>
                <LotDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="drums"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'SALA', 'ACOPIADOR', 'FRACCIONADOR', 'EXPORTADOR', 'AUDITOR']}>
                <DrumsPage />
              </RoleRoute>
            }
          />
          <Route path="trace" element={<TracePage />} />
          <Route path="trace/:direction/:entityType/:id" element={<TracePage />} />
          <Route
            path="rules"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'AUDITOR']}>
                <RulesPage />
              </RoleRoute>
            }
          />
          <Route
            path="audit"
            element={
              <RoleRoute allowedRoles={['ADMIN', 'AUDITOR']}>
                <AuditPage />
              </RoleRoute>
            }
          />
          <Route path="pending" element={<PendingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <UpdatePrompt />
    </>
  );
};
