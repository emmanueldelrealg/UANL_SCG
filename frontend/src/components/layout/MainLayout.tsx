import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from '@/store/useStore';
import { ToastContainer } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string,string> = {
  '/dashboard':'Dashboard','/accounts':'Plan de Cuentas CONAC','/entries':'Pólizas y Registro Único',
  '/budget':'Control Presupuestal','/balanza':'Balanza de Comprobación','/diario':'Libro Diario',
  '/mayor':'Libro Mayor','/reports/situacion':'Estado de Situación Financiera',
  '/reports/actividades':'Estado de Actividades','/reports/eai':'Estado Analítico de Ingresos (EAI)',
  '/reports/eaepe':'Estado Analítico del Ejercicio del Presupuesto de Egresos (EAEPE)',
  '/cuenta-publica':'Cuenta Pública','/cierre':'Cierre del Ejercicio',
  '/educational/exercises':'Ejercicios Educativos','/educational/glossary':'Glosario CONAC',
  '/educational/tutorials':'Tutoriales','/captura/ingresos':'Captura de Ingresos',
  '/captura/egresos':'Captura de Egresos','/captura/deuda':'Deuda Pública',
  '/captura/almacen':'Almacén e Inventario','/audit':'Bitácora de Auditoría',
  '/catalogs':'Catálogos Presupuestales','/users':'Gestión de Usuarios',
};

export default function MainLayout() {
  const { darkMode } = useStore();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'SCG-UANL';
  return (
    <div className={cn("flex h-screen overflow-hidden", darkMode && "dark")}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
