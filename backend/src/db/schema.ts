import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ─── USUARIOS ────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['Administrador', 'Capturista', 'Auditor', 'Alumno'] }).notNull().default('Capturista'),
  dependencia: text('dependencia'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  lastLogin: text('last_login'),
});

// ─── EJERCICIOS FISCALES ──────────────────────────────────────
export const fiscalYears = sqliteTable('fiscal_years', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: integer('year').notNull().unique(),
  name: text('name').notNull(),
  status: text('status', { enum: ['Abierto', 'Cerrado', 'En Proceso de Cierre'] }).notNull().default('Abierto'),
  openDate: text('open_date').notNull(),
  closeDate: text('close_date'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const fiscalPeriods = sqliteTable('fiscal_periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fiscalYearId: integer('fiscal_year_id').notNull().references(() => fiscalYears.id),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  name: text('name').notNull(),
  status: text('status', { enum: ['Abierto', 'Cerrado'] }).notNull().default('Abierto'),
  openDate: text('open_date'),
  closeDate: text('close_date'),
}, (table) => ({
  yearMonthIdx: uniqueIndex('fiscal_period_year_month').on(table.year, table.month),
}));

// ─── CATÁLOGO DE CUENTAS ─────────────────────────────────────
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  level: integer('level').notNull(),        // 1=Grupo, 2=Subgrupo, 3=Cuenta, 4=Subcuenta
  parentCode: text('parent_code'),
  nature: text('nature', { enum: ['Deudora', 'Acreedora'] }).notNull(),
  accountType: text('account_type', { enum: ['Balance', 'Resultados', 'Orden'] }).notNull(),
  groupNum: integer('group_num').notNull(),  // 1000-9000
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  isConac: integer('is_conac', { mode: 'boolean' }).notNull().default(true),
  description: text('description'),
  normalBalance: text('normal_balance', { enum: ['Debit', 'Credit'] }).notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
}, (table) => ({
  codeIdx: index('account_code_idx').on(table.code),
  parentIdx: index('account_parent_idx').on(table.parentCode),
  groupIdx: index('account_group_idx').on(table.groupNum),
}));

// ─── CLASIFICADOR POR OBJETO DEL GASTO ───────────────────────
export const cogCatalog = sqliteTable('cog_catalog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  capitulo: text('capitulo').notNull(),
  capituloNombre: text('capitulo_nombre').notNull(),
  concepto: text('concepto').notNull(),
  conceptoNombre: text('concepto_nombre').notNull(),
  partidaGenerica: text('partida_generica').notNull(),
  partidaGenericaNombre: text('partida_generica_nombre').notNull(),
  partidaEspecifica: text('partida_especifica'),
  partidaEspecificaNombre: text('partida_especifica_nombre'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

// ─── CLASIFICADOR FUNCIONAL ───────────────────────────────────
export const functionalClassifier = sqliteTable('functional_classifier', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  funcion: text('funcion').notNull(),
  funcionNombre: text('funcion_nombre').notNull(),
  subfuncion: text('subfuncion').notNull(),
  subfuncionNombre: text('subfuncion_nombre').notNull(),
  actividad: text('actividad'),
  actividadNombre: text('actividad_nombre'),
});

// ─── FUENTES DE FINANCIAMIENTO ────────────────────────────────
export const financingSources = sqliteTable('financing_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type', { enum: ['Recursos Propios', 'Federales', 'Crédito', 'Otros'] }).notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

// ─── UNIDADES RESPONSABLES ────────────────────────────────────
export const responsibleUnits = sqliteTable('responsible_units', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  area: text('area'),
  head: text('head'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

// ─── PROGRAMAS PRESUPUESTARIOS ────────────────────────────────
export const programs = sqliteTable('programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fiscalYear: integer('fiscal_year').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  objective: text('objective'),
  unitResponsible: text('unit_responsible'),
  mirObjective: text('mir_objective'),
  mirIndicator: text('mir_indicator'),
  mirFrequency: text('mir_frequency'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
}, (table) => ({
  yearCodeIdx: uniqueIndex('program_year_code').on(table.fiscalYear, table.code),
}));

// ─── PRESUPUESTO ──────────────────────────────────────────────
export const budgetLines = sqliteTable('budget_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fiscalYear: integer('fiscal_year').notNull(),
  cogCapitulo: text('cog_capitulo').notNull(),
  cogConcepto: text('cog_concepto').notNull(),
  cogPartidaGenerica: text('cog_partida_generica').notNull(),
  cogPartidaEspecifica: text('cog_partida_especifica'),
  programa: text('programa'),
  subprograma: text('subprograma'),
  proyecto: text('proyecto'),
  unidadResponsable: text('unidad_responsable'),
  fuenteFinanciamiento: text('fuente_financiamiento'),
  aprobado: real('aprobado').notNull().default(0),
  modificado: real('modificado').notNull().default(0),
  comprometido: real('comprometido').notNull().default(0),
  devengado: real('devengado').notNull().default(0),
  ejercido: real('ejercido').notNull().default(0),
  pagado: real('pagado').notNull().default(0),
  disponible: real('disponible').notNull().default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ─── PRESUPUESTO DE INGRESOS ──────────────────────────────────
export const incomeBudgetLines = sqliteTable('income_budget_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fiscalYear: integer('fiscal_year').notNull(),
  rubro: text('rubro').notNull(),
  rubroNombre: text('rubro_nombre').notNull(),
  concepto: text('concepto'),
  conceptoNombre: text('concepto_nombre'),
  fuenteFinanciamiento: text('fuente_financiamiento'),
  estimado: real('estimado').notNull().default(0),
  modificado: real('modificado').notNull().default(0),
  devengado: real('devengado').notNull().default(0),
  recaudado: real('recaudado').notNull().default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ─── MODIFICACIONES AL PRESUPUESTO ───────────────────────────
export const budgetModifications = sqliteTable('budget_modifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fiscalYear: integer('fiscal_year').notNull(),
  folio: text('folio').notNull().unique(),
  type: text('type', { enum: ['Ampliación', 'Reducción', 'Traspaso', 'Adecuación'] }).notNull(),
  date: text('date').notNull(),
  concept: text('concept').notNull(),
  sourceLineId: integer('source_line_id').references(() => budgetLines.id),
  targetLineId: integer('target_line_id').references(() => budgetLines.id),
  amount: real('amount').notNull(),
  justification: text('justification'),
  authorizedBy: text('authorized_by'),
  status: text('status', { enum: ['Pendiente', 'Autorizada', 'Rechazada'] }).notNull().default('Pendiente'),
  entryId: integer('entry_id'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── PÓLIZAS (JOURNAL ENTRIES) ────────────────────────────────
export const journalEntries = sqliteTable('journal_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  folio: text('folio').notNull().unique(),
  type: text('type', { enum: ['Ingreso', 'Egreso', 'Diario', 'Cierre', 'Apertura'] }).notNull(),
  date: text('date').notNull(),
  concept: text('concept').notNull(),
  reference: text('reference'),
  area: text('area'),
  dependencia: text('dependencia'),
  officer: text('officer'),
  fiscalYear: integer('fiscal_year').notNull(),
  period: integer('period').notNull(),
  momento: text('momento'),
  templateId: integer('template_id'),
  status: text('status', { enum: ['Borrador', 'Validada', 'Autorizada', 'Cancelada'] }).notNull().default('Borrador'),
  totalDebit: real('total_debit').notNull().default(0),
  totalCredit: real('total_credit').notNull().default(0),
  supportingDoc: text('supporting_doc'),
  digitalSignature: text('digital_signature'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  authorizedBy: integer('authorized_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  dateIdx: index('entry_date_idx').on(table.date),
  yearPeriodIdx: index('entry_year_period_idx').on(table.fiscalYear, table.period),
  folioIdx: index('entry_folio_idx').on(table.folio),
}));

// ─── LÍNEAS DE PÓLIZA ────────────────────────────────────────
export const journalEntryLines = sqliteTable('journal_entry_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  accountCode: text('account_code').notNull().references(() => accounts.code),
  description: text('description').notNull(),
  debit: real('debit').notNull().default(0),
  credit: real('credit').notNull().default(0),
  presupuestalKey: text('presupuestal_key'),
  programatico: text('programatico'),
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => ({
  entryIdx: index('line_entry_idx').on(table.entryId),
  accountIdx: index('line_account_idx').on(table.accountCode),
}));

// ─── REGISTRO PRESUPUESTAL ────────────────────────────────────
export const presupuestalRecords = sqliteTable('presupuestal_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  cogCapitulo: text('cog_capitulo').notNull(),
  cogConcepto: text('cog_concepto').notNull(),
  cogPartidaGenerica: text('cog_partida_generica').notNull(),
  cogPartidaEspecifica: text('cog_partida_especifica'),
  clasificacionEconomica: text('clasificacion_economica', { enum: ['Corriente', 'Capital', 'Amortización'] }),
  funcion: text('funcion'),
  subfuncion: text('subfuncion'),
  actividadFuncional: text('actividad_funcional'),
  programa: text('programa'),
  subprograma: text('subprograma'),
  proyecto: text('proyecto'),
  actividadProgramatica: text('actividad_programatica'),
  fuenteFinanciamiento: text('fuente_financiamiento'),
  unidadResponsable: text('unidad_responsable'),
  momento: text('momento').notNull(),
  monto: real('monto').notNull(),
  budgetLineId: integer('budget_line_id').references(() => budgetLines.id),
});

// ─── REGISTRO PROGRAMÁTICO ────────────────────────────────────
export const programaticRecords = sqliteTable('programatic_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id').notNull().references(() => journalEntries.id, { onDelete: 'cascade' }),
  programa: text('programa').notNull(),
  subprograma: text('subprograma'),
  proyecto: text('proyecto'),
  actividad: text('actividad'),
  meta: text('meta'),
  indicador: text('indicador'),
  avanceFisico: real('avance_fisico'),
  avanceFinanciero: real('avance_financiero'),
  unidadResponsable: text('unidad_responsable'),
  monto: real('monto').notNull(),
});

// ─── PLANTILLAS DE ASIENTOS ───────────────────────────────────
export const entryTemplates = sqliteTable('entry_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  momento: text('momento').notNull(),
  description: text('description').notNull(),
  normReference: text('norm_reference').notNull(),
  linesJson: text('lines_json').notNull(),    // JSON array of template lines
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

// ─── DEUDA PÚBLICA ───────────────────────────────────────────
export const debtRecords = sqliteTable('debt_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  folio: text('folio').notNull().unique(),
  creditor: text('creditor').notNull(),
  debtType: text('debt_type', { enum: ['Interna', 'Externa'] }).notNull(),
  instrument: text('instrument', { enum: ['Bono', 'Crédito', 'Arrendamiento', 'SOFOM', 'Otro'] }).notNull(),
  contractDate: text('contract_date').notNull(),
  maturityDate: text('maturity_date').notNull(),
  originalAmount: real('original_amount').notNull(),
  currency: text('currency').notNull().default('MXN'),
  interestRate: real('interest_rate').notNull(),
  balance: real('balance').notNull(),
  monthlyPayment: real('monthly_payment').notNull(),
  guarantees: text('guarantees'),
  purpose: text('purpose').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const debtPayments = sqliteTable('debt_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  debtId: integer('debt_id').notNull().references(() => debtRecords.id),
  date: text('date').notNull(),
  principal: real('principal').notNull().default(0),
  interest: real('interest').notNull().default(0),
  total: real('total').notNull().default(0),
  entryId: integer('entry_id').references(() => journalEntries.id),
  reference: text('reference'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── INVENTARIO / ACTIVOS ─────────────────────────────────────
export const inventoryItems = sqliteTable('inventory_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  assetType: text('asset_type', { enum: ['Mueble', 'Inmueble', 'Intangible', 'Depreciable'] }).notNull(),
  unit: text('unit').notNull().default('Pieza'),
  quantity: real('quantity').notNull().default(0),
  unitCost: real('unit_cost').notNull().default(0),
  totalCost: real('total_cost').notNull().default(0),
  location: text('location'),
  custodian: text('custodian'),
  acquisitionDate: text('acquisition_date'),
  invoiceRef: text('invoice_ref'),
  condition: text('condition', { enum: ['Bueno', 'Regular', 'Malo', 'Baja'] }).notNull().default('Bueno'),
  depreciationRate: real('depreciation_rate'),
  accumulatedDepreciation: real('accumulated_depreciation').default(0),
  netValue: real('net_value'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  fiscalYear: integer('fiscal_year').notNull(),
  accountCode: text('account_code'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ─── MOVIMIENTOS DE ALMACÉN ───────────────────────────────────
export const warehouseMovements = sqliteTable('warehouse_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemId: integer('item_id').notNull().references(() => inventoryItems.id),
  movementType: text('movement_type', { enum: ['Entrada', 'Salida', 'Transferencia', 'Baja', 'Ajuste'] }).notNull(),
  quantity: real('quantity').notNull(),
  unitCost: real('unit_cost').notNull().default(0),
  totalCost: real('total_cost').notNull().default(0),
  date: text('date').notNull(),
  reference: text('reference').notNull(),
  origin: text('origin'),
  destination: text('destination'),
  justification: text('justification'),
  authorizedBy: text('authorized_by'),
  entryId: integer('entry_id').references(() => journalEntries.id),
  fiscalYear: integer('fiscal_year').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

// ─── BITÁCORA DE AUDITORÍA ───────────────────────────────────
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  module: text('module').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  ipAddress: text('ip_address'),
  timestamp: text('timestamp').default(sql`(datetime('now'))`),
}, (table) => ({
  timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
  userIdx: index('audit_user_idx').on(table.userId),
}));

// ─── GLOSARIO ────────────────────────────────────────────────
export const glossaryTerms = sqliteTable('glossary_terms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  term: text('term').notNull(),
  definition: text('definition').notNull(),
  normReference: text('norm_reference'),
  category: text('category').notNull(),
  relatedTerms: text('related_terms'),  // JSON array
});

// ─── EJERCICIOS EDUCATIVOS ───────────────────────────────────
export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  difficulty: text('difficulty', { enum: ['Básico', 'Intermedio', 'Avanzado'] }).notNull(),
  category: text('category').notNull(),
  expectedEntriesJson: text('expected_entries_json').notNull(),
  hintsJson: text('hints_json').notNull(),
  explanation: text('explanation').notNull(),
  normReference: text('norm_reference').notNull(),
  points: integer('points').notNull().default(10),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const exerciseAttempts = sqliteTable('exercise_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
  userId: integer('user_id').notNull().references(() => users.id),
  entriesJson: text('entries_json'),
  score: real('score').notNull().default(0),
  passed: integer('passed', { mode: 'boolean' }).notNull().default(false),
  feedbackJson: text('feedback_json'),
  completedAt: text('completed_at').default(sql`(datetime('now'))`),
});

// ─── CUENTA PÚBLICA ──────────────────────────────────────────
export const cuentaPublica = sqliteTable('cuenta_publica', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fiscalYear: integer('fiscal_year').notNull().unique(),
  status: text('status', { enum: ['Borrador', 'Revisión', 'Aprobada', 'Publicada'] }).notNull().default('Borrador'),
  sectionsJson: text('sections_json'),
  createdBy: integer('created_by').references(() => users.id),
  approvedBy: text('approved_by'),
  publishDate: text('publish_date'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// ─── SALDOS MENSUALES (para balanza y estados financieros) ────
export const monthlyBalances = sqliteTable('monthly_balances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fiscalYear: integer('fiscal_year').notNull(),
  period: integer('period').notNull(),
  accountCode: text('account_code').notNull().references(() => accounts.code),
  initialBalance: real('initial_balance').notNull().default(0),
  totalDebits: real('total_debits').notNull().default(0),
  totalCredits: real('total_credits').notNull().default(0),
  finalBalance: real('final_balance').notNull().default(0),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
}, (table) => ({
  yearPeriodAccountIdx: uniqueIndex('monthly_balance_idx').on(table.fiscalYear, table.period, table.accountCode),
}));
