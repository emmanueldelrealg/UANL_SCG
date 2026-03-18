import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard, BookOpen, FileText, DollarSign, BarChart3, Building2,
  GraduationCap, ChevronRight, ChevronLeft, Settings, LogOut, Scale,
  TrendingUp, Archive, CreditCard, Book, ClipboardList, Users, Landmark,
  BookMarked, FileBarChart, Receipt, Database, Shield
} from 'lucide-react';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Configuración',
    items: [
      { href: '/accounts', icon: BookOpen, label: 'Plan de Cuentas' },
      { href: '/catalogs', icon: Database, label: 'Catálogos' },
      { href: '/fiscal-years', icon: Settings, label: 'Ejercicios Fiscales' },
      { href: '/users', icon: Users, label: 'Usuarios', roles: ['Administrador'] },
    ]
  },
  {
    label: 'Operación',
    items: [
      { href: '/entries', icon: FileText, label: 'Pólizas / Registro' },
      { href: '/captura/ingresos', icon: TrendingUp, label: 'Captura Ingresos' },
      { href: '/captura/egresos', icon: Receipt, label: 'Captura Egresos' },
      { href: '/captura/deuda', icon: CreditCard, label: 'Deuda Pública' },
      { href: '/captura/almacen', icon: Archive, label: 'Almacén / Inventario' },
      { href: '/budget', icon: DollarSign, label: 'Control Presupuestal' },
    ]
  },
  {
    label: 'Consultas',
    items: [
      { href: '/diario', icon: BookMarked, label: 'Libro Diario' },
      { href: '/mayor', icon: Book, label: 'Libro Mayor' },
      { href: '/balanza', icon: Scale, label: 'Balanza de Comprobación' },
    ]
  },
  {
    label: 'Estados Financieros',
    items: [
      { href: '/reports/situacion', icon: Landmark, label: 'Situación Financiera' },
      { href: '/reports/actividades', icon: BarChart3, label: 'Estado de Actividades' },
      { href: '/reports/variacion', icon: TrendingUp, label: 'Variación Hacienda Pública' },
      { href: '/reports/flujos', icon: DollarSign, label: 'Flujos de Efectivo' },
      { href: '/reports/activo', icon: Building2, label: 'Analítico del Activo' },
      { href: '/reports/deuda-estado', icon: CreditCard, label: 'Deuda y Pasivos' },
      { href: '/reports/notas', icon: FileText, label: 'Notas a los EF' },
    ]
  },
  {
    label: 'Info. Presupuestal',
    items: [
      { href: '/reports/eai', icon: FileBarChart, label: 'EAI - Ingresos' },
      { href: '/reports/eaepe', icon: ClipboardList, label: 'EAEPE - Egresos' },
      { href: '/reports/deuda-neta', icon: CreditCard, label: 'Endeudamiento Neto' },
    ]
  },
  {
    label: 'Cuenta Pública',
    items: [
      { href: '/cuenta-publica', icon: Shield, label: 'Cuenta Pública' },
      { href: '/cierre', icon: BookOpen, label: 'Cierre del Ejercicio' },
    ]
  },
  {
    label: 'Educativo',
    items: [
      { href: '/educational/tutorials', icon: GraduationCap, label: 'Tutoriales' },
      { href: '/educational/exercises', icon: ClipboardList, label: 'Ejercicios' },
      { href: '/educational/glossary', icon: BookOpen, label: 'Glosario' },
      { href: '/audit', icon: Shield, label: 'Bitácora de Auditoría' },
    ]
  },
];

export default function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, user, clearAuth } = useStore();

  return (
    <aside className={cn("flex flex-col h-full bg-navy-900 text-white transition-all duration-300 no-print", sidebarCollapsed ? "w-16" : "w-64")}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-navy-700">
        <div className="flex-shrink-0 w-8 h-8 bg-gold-500 rounded flex items-center justify-center font-bold text-navy-900 text-sm">
          SCG
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">SCG-UANL</p>
            <p className="text-xs text-navy-300 leading-tight">Contabilidad Gubernamental</p>
          </div>
        )}
        <button onClick={toggleSidebar} className="ml-auto text-navy-400 hover:text-white">
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {navGroups.map(group => (
          <div key={group.label} className="mb-2">
            {!sidebarCollapsed && (
              <p className="px-4 py-1 text-xs font-semibold text-navy-400 uppercase tracking-wider">{group.label}</p>
            )}
            {group.items.map(item => {
              if ((item as any).roles && !(item as any).roles.includes(user?.role)) return null;
              const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link key={item.href} to={item.href}
                  className={cn("flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                    active ? "bg-navy-700 text-gold-400 font-medium" : "text-navy-200 hover:bg-navy-800 hover:text-white"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-navy-700 p-4">
        {!sidebarCollapsed && user && (
          <div className="mb-3">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-navy-400">{user.role}</p>
          </div>
        )}
        <button onClick={clearAuth} className={cn("flex items-center gap-2 text-sm text-navy-400 hover:text-white w-full", sidebarCollapsed && "justify-center")}>
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
