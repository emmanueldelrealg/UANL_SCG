// ============================================================
// SHARED TYPES - Sistema de Contabilidad Gubernamental CONAC
// ============================================================

// ─── AUTH ───────────────────────────────────────────────────
export type UserRole = 'Administrador' | 'Capturista' | 'Auditor' | 'Alumno';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  dependencia?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthPayload {
  userId: number;
  username: string;
  role: UserRole;
}

// ─── CATÁLOGO DE CUENTAS ─────────────────────────────────────
export type AccountNature = 'Deudora' | 'Acreedora';
export type AccountType = 'Balance' | 'Resultados' | 'Orden';
export type AccountLevel = 1 | 2 | 3 | 4;

export interface Account {
  id: number;
  code: string;         // e.g. "1111-01-01-001"
  name: string;
  level: AccountLevel;
  parentCode?: string;
  nature: AccountNature;
  accountType: AccountType;
  group: number;        // 1000-9000
  active: boolean;
  isConac: boolean;     // true = standard CONAC, false = custom
  description?: string;
  normalBalance: 'Debit' | 'Credit';
}

// ─── PLAN DE CUENTAS GRUPOS ──────────────────────────────────
export const ACCOUNT_GROUPS = {
  1000: 'Activo',
  2000: 'Pasivo',
  3000: 'Hacienda Pública/Patrimonio',
  4000: 'Ingresos de Gestión',
  5000: 'Gastos de Funcionamiento',
  6000: 'Hacienda Pública/Patrimonio-Resultado del Ejercicio',
  7000: 'Cuentas de Orden Contables',
  8000: 'Cuentas de Orden Presupuestales de Egresos',
  9000: 'Cuentas de Orden Presupuestales de Ingresos',
} as const;

// ─── MOMENTOS CONTABLES ──────────────────────────────────────
export type MomentoEgreso = 'Aprobado' | 'Comprometido' | 'Devengado' | 'Ejercido' | 'Pagado';
export type MomentoIngreso = 'Estimado' | 'Modificado' | 'Devengado' | 'Recaudado';
export type MomentoContable = MomentoEgreso | MomentoIngreso;

export const MOMENTOS_EGRESO: MomentoEgreso[] = ['Aprobado', 'Comprometido', 'Devengado', 'Ejercido', 'Pagado'];
export const MOMENTOS_INGRESO: MomentoIngreso[] = ['Estimado', 'Modificado', 'Devengado', 'Recaudado'];

// ─── PÓLIZA / JOURNAL ENTRY ──────────────────────────────────
export type EntryType = 'Ingreso' | 'Egreso' | 'Diario' | 'Cierre' | 'Apertura';
export type EntryStatus = 'Borrador' | 'Validada' | 'Autorizada' | 'Cancelada';

export interface JournalEntryLine {
  id?: number;
  entryId?: number;
  accountCode: string;
  accountName?: string;
  description: string;
  debit: number;
  credit: number;
  presupuestalKey?: string;
  programatico?: string;
}

export interface JournalEntry {
  id: number;
  folio: string;         // TYPE-YEAR-SEQUENCE e.g. E-2025-00001
  type: EntryType;
  date: string;
  concept: string;
  reference?: string;    // invoice/document number
  area?: string;
  dependencia?: string;
  officer?: string;
  fiscalYear: number;
  period: number;        // month 1-12
  momento?: MomentoContable;
  templateId?: number;
  status: EntryStatus;
  totalDebit: number;
  totalCredit: number;
  lines: JournalEntryLine[];
  presupuestalRecord?: PresupuestalRecord;
  programaticRecord?: ProgramaticRecord;
  supportingDoc?: string;
  digitalSignature?: string;
  createdBy: number;
  createdAt: string;
  authorizedBy?: number;
  notes?: string;
}

// ─── REGISTRO ÚNICO E INTEGRADOR ────────────────────────────
export interface PresupuestalRecord {
  id?: number;
  entryId?: number;
  cog_capitulo: string;   // Clasificador por Objeto del Gasto
  cog_concepto: string;
  cog_partida_generica: string;
  cog_partida_especifica: string;
  clasificacion_economica: 'Corriente' | 'Capital' | 'Amortización';
  funcion: string;
  subfuncion: string;
  actividad_funcional: string;
  programa: string;
  subprograma: string;
  proyecto: string;
  actividad_programatica: string;
  fuente_financiamiento: string;
  unidad_responsable: string;
  momento: MomentoContable;
  monto: number;
}

export interface ProgramaticRecord {
  id?: number;
  entryId?: number;
  programa: string;
  subprograma: string;
  proyecto: string;
  actividad: string;
  meta?: string;
  indicador?: string;
  avanceFisico?: number;
  avanceFinanciero?: number;
  unidad_responsable: string;
  monto: number;
}

// ─── PRESUPUESTO ─────────────────────────────────────────────
export type BudgetModType = 'Ampliación' | 'Reducción' | 'Traspaso' | 'Adecuación';

export interface BudgetLine {
  id: number;
  fiscalYear: number;
  cog_capitulo: string;
  cog_concepto: string;
  cog_partida_generica: string;
  cog_partida_especifica: string;
  programa: string;
  subprograma: string;
  proyecto: string;
  unidad_responsable: string;
  fuente_financiamiento: string;
  aprobado: number;
  modificado: number;
  comprometido: number;
  devengado: number;
  ejercido: number;
  pagado: number;
  disponible: number;
}

// ─── CLASIFICADORES ──────────────────────────────────────────
export interface COGItem {
  capitulo: string;
  capitulo_nombre: string;
  concepto: string;
  concepto_nombre: string;
  partida_generica: string;
  partida_generica_nombre: string;
  partida_especifica: string;
  partida_especifica_nombre: string;
}

export interface FuenteFinanciamiento {
  code: string;
  name: string;
  type: 'Recursos Propios' | 'Federales' | 'Crédito' | 'Otros';
}

// ─── ESTADOS FINANCIEROS ─────────────────────────────────────
export interface BalanzaLine {
  accountCode: string;
  accountName: string;
  level: AccountLevel;
  initialBalance: number;
  debits: number;
  credits: number;
  finalBalance: number;
  nature: AccountNature;
}

// ─── INVENTARIO / ALMACÉN ────────────────────────────────────
export type AssetType = 'Mueble' | 'Inmueble' | 'Intangible' | 'Depreciable';
export type MovimientoAlmacen = 'Entrada' | 'Salida' | 'Transferencia' | 'Baja' | 'Ajuste';

export interface InventoryItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  assetType: AssetType;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  location: string;
  custodian: string;
  acquisitionDate: string;
  invoiceRef?: string;
  condition: 'Bueno' | 'Regular' | 'Malo' | 'Baja';
  depreciationRate?: number;
  accumulatedDepreciation?: number;
  netValue?: number;
  active: boolean;
  fiscalYear: number;
  accountCode?: string;   // linked COA account
}

export interface WarehouseMovement {
  id: number;
  itemId: number;
  itemName?: string;
  movementType: MovimientoAlmacen;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  reference: string;
  origin?: string;
  destination?: string;
  justification: string;
  authorizedBy: string;
  entryId?: number;    // linked journal entry
  fiscalYear: number;
  createdBy: number;
  createdAt: string;
}

// ─── DEUDA PÚBLICA ───────────────────────────────────────────
export type DebtType = 'Interna' | 'Externa';
export type DebtInstrument = 'Bono' | 'Crédito' | 'Arrendamiento' | 'SOFOM' | 'Otro';

export interface DebtRecord {
  id: number;
  folio: string;
  creditor: string;
  debtType: DebtType;
  instrument: DebtInstrument;
  contractDate: string;
  maturityDate: string;
  originalAmount: number;
  currency: string;
  interestRate: number;
  balance: number;
  monthlyPayment: number;
  guarantees?: string;
  purpose: string;
  fiscalYear: number;
  active: boolean;
  createdAt: string;
}

export interface DebtPayment {
  id: number;
  debtId: number;
  date: string;
  principal: number;
  interest: number;
  total: number;
  entryId?: number;
  reference: string;
  createdAt: string;
}

// ─── PLANTILLAS DE ASIENTOS ──────────────────────────────────
export interface EntryTemplate {
  id: number;
  code: string;
  name: string;
  category: string;
  momento: MomentoContable;
  description: string;
  normReference: string;   // CONAC agreement reference
  lines: EntryTemplateLine[];
  active: boolean;
}

export interface EntryTemplateLine {
  accountCode: string;
  accountName: string;
  debitFormula: string;    // e.g. "amount" or "amount*0.16"
  creditFormula: string;
  description: string;
  nature: AccountNature;
}

// ─── AUDITORÍA ───────────────────────────────────────────────
export interface AuditLog {
  id: number;
  userId: number;
  userName?: string;
  action: string;
  module: string;
  entityType: string;
  entityId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  timestamp: string;
}

// ─── EJERCICIO FISCAL ────────────────────────────────────────
export interface FiscalYear {
  id: number;
  year: number;
  name: string;
  status: 'Abierto' | 'Cerrado' | 'En Proceso de Cierre';
  openDate: string;
  closeDate?: string;
  periods: FiscalPeriod[];
}

export interface FiscalPeriod {
  id: number;
  fiscalYearId: number;
  year: number;
  month: number;
  name: string;
  status: 'Abierto' | 'Cerrado';
  openDate?: string;
  closeDate?: string;
}

// ─── CUENTA PÚBLICA ──────────────────────────────────────────
export interface CuentaPublica {
  id: number;
  fiscalYear: number;
  status: 'Borrador' | 'Revisión' | 'Aprobada' | 'Publicada';
  sections: CuentaPublicaSection[];
  createdAt: string;
  approvedBy?: string;
  publishDate?: string;
}

export interface CuentaPublicaSection {
  id: number;
  sectionCode: string;
  title: string;
  content: string;
  order: number;
  completed: boolean;
}

// ─── GLOSARIO ────────────────────────────────────────────────
export interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  normReference?: string;
  category: string;
  relatedTerms?: string[];
}

// ─── EJERCICIOS EDUCATIVOS ───────────────────────────────────
export type ExerciseDifficulty = 'Básico' | 'Intermedio' | 'Avanzado';

export interface Exercise {
  id: number;
  title: string;
  description: string;
  difficulty: ExerciseDifficulty;
  category: string;
  expectedEntries: Partial<JournalEntry>[];
  hints: string[];
  explanation: string;
  normReference: string;
  points: number;
}

export interface ExerciseAttempt {
  id: number;
  exerciseId: number;
  userId: number;
  entries: Partial<JournalEntry>[];
  score: number;
  passed: boolean;
  feedback: string[];
  completedAt: string;
}

// ─── API RESPONSES ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
