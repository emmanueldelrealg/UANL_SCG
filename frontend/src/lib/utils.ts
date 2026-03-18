import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);
}
export function formatDate(d: string): string {
  if (!d) return '-';
  return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}
export function formatDateShort(d: string): string {
  if (!d) return '-';
  return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
export const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const MOMENTOS_EGRESO = ['Aprobado','Comprometido','Devengado','Ejercido','Pagado'];
export const MOMENTOS_INGRESO = ['Estimado','Modificado','Devengado','Recaudado'];
export const ACCOUNT_GROUPS: Record<number,string> = {
  1000:'Activo',2000:'Pasivo',3000:'Hacienda Pública/Patrimonio',
  4000:'Ingresos de Gestión',5000:'Gastos de Funcionamiento',
  6000:'Resultado del Ejercicio',7000:'Cuentas de Orden Contables',
  8000:'Cuentas de Orden Presupuestales de Egresos',9000:'Cuentas de Orden Presupuestales de Ingresos'
};
export function getMomentoColor(m: string): string {
  const map: Record<string,string> = { Aprobado:'bg-blue-100 text-blue-800', Comprometido:'bg-yellow-100 text-yellow-800', Devengado:'bg-orange-100 text-orange-800', Ejercido:'bg-purple-100 text-purple-800', Pagado:'bg-green-100 text-green-800', Estimado:'bg-blue-100 text-blue-800', Modificado:'bg-yellow-100 text-yellow-800', Recaudado:'bg-green-100 text-green-800' };
  return map[m] || 'bg-gray-100 text-gray-800';
}
export function getStatusColor(s: string): string {
  const map: Record<string,string> = { Borrador:'bg-gray-100 text-gray-700', Validada:'bg-blue-100 text-blue-700', Autorizada:'bg-green-100 text-green-700', Cancelada:'bg-red-100 text-red-700' };
  return map[s] || 'bg-gray-100 text-gray-700';
}
