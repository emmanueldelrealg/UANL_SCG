import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import MainLayout from './components/layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import EntriesPage from './pages/EntriesPage';
import BudgetPage from './pages/BudgetPage';
import BalanzaPage from './pages/BalanzaPage';
import DiarioPage from './pages/DiarioPage';
import MayorPage from './pages/MayorPage';
import ReportsPage from './pages/ReportsPage';
import CapturePage from './pages/CapturePage';
import EducationalPage from './pages/EducationalPage';
import CuentaPublicaPage from './pages/CuentaPublicaPage';
import CierrePage from './pages/CierrePage';
import AuditPage from './pages/AuditPage';
import CatalogsPage from './pages/CatalogsPage';
import UsersPage from './pages/UsersPage';
import FiscalYearsPage from './pages/FiscalYearsPage';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { token, user } = useStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { darkMode } = useStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Catálogos */}
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="catalogs" element={<CatalogsPage />} />

          {/* Captura */}
          <Route path="entries" element={<EntriesPage />} />
          <Route path="captura/ingresos" element={<CapturePage module="ingresos" />} />
          <Route path="captura/egresos" element={<CapturePage module="egresos" />} />
          <Route path="captura/deuda" element={<CapturePage module="deuda" />} />
          <Route path="captura/almacen" element={<CapturePage module="almacen" />} />

          {/* Presupuesto */}
          <Route path="budget" element={<BudgetPage />} />

          {/* Libros Contables */}
          <Route path="balanza" element={<BalanzaPage />} />
          <Route path="diario" element={<DiarioPage />} />
          <Route path="mayor" element={<MayorPage />} />

          {/* Estados Financieros */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/situacion" element={<ReportsPage reportType="situacion" />} />
          <Route path="reports/actividades" element={<ReportsPage reportType="actividades" />} />
          <Route path="reports/variacion" element={<ReportsPage reportType="variacion" />} />
          <Route path="reports/flujos" element={<ReportsPage reportType="flujos" />} />
          <Route path="reports/activo" element={<ReportsPage reportType="activo" />} />
          <Route path="reports/eai" element={<ReportsPage reportType="eai" />} />
          <Route path="reports/eaepe" element={<ReportsPage reportType="eaepe" />} />
          <Route path="reports/deuda-neta" element={<ReportsPage reportType="deuda-neta" />} />
          <Route path="reports/notas" element={<ReportsPage reportType="notas" />} />

          {/* Cuenta Pública y Cierre */}
          <Route path="cuenta-publica" element={<CuentaPublicaPage />} />
          <Route path="cierre" element={<CierrePage />} />

          {/* Módulo Educativo */}
          <Route path="educational" element={<EducationalPage />} />
          <Route path="educational/glossary" element={<EducationalPage module="glossary" />} />
          <Route path="educational/exercises" element={<EducationalPage module="exercises" />} />
          <Route path="educational/tutorials" element={<EducationalPage module="tutorials" />} />
          <Route path="educational/simulation" element={<EducationalPage module="simulation" />} />

          {/* Administración */}
          <Route
            path="users"
            element={
              <PrivateRoute roles={['Administrador']}>
                <UsersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="fiscal-years"
            element={
              <PrivateRoute roles={['Administrador']}>
                <FiscalYearsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="audit"
            element={
              <PrivateRoute roles={['Administrador', 'Auditor']}>
                <AuditPage />
              </PrivateRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppContent />;
}
