import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };

// Initialize tables
export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'Capturista' CHECK(role IN ('Administrador','Capturista','Auditor','Alumno')),
      dependencia TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS fiscal_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Abierto' CHECK(status IN ('Abierto','Cerrado','En Proceso de Cierre')),
      open_date TEXT NOT NULL,
      close_date TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fiscal_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_year_id INTEGER NOT NULL REFERENCES fiscal_years(id),
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Abierto' CHECK(status IN ('Abierto','Cerrado')),
      open_date TEXT,
      close_date TEXT,
      UNIQUE(year, month)
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      parent_code TEXT,
      nature TEXT NOT NULL CHECK(nature IN ('Deudora','Acreedora')),
      account_type TEXT NOT NULL CHECK(account_type IN ('Balance','Resultados','Orden')),
      group_num INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      is_conac INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      normal_balance TEXT NOT NULL CHECK(normal_balance IN ('Debit','Credit')),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS account_code_idx ON accounts(code);
    CREATE INDEX IF NOT EXISTS account_parent_idx ON accounts(parent_code);
    CREATE INDEX IF NOT EXISTS account_group_idx ON accounts(group_num);

    CREATE TABLE IF NOT EXISTS cog_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      capitulo TEXT NOT NULL,
      capitulo_nombre TEXT NOT NULL,
      concepto TEXT NOT NULL,
      concepto_nombre TEXT NOT NULL,
      partida_generica TEXT NOT NULL,
      partida_generica_nombre TEXT NOT NULL,
      partida_especifica TEXT,
      partida_especifica_nombre TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS functional_classifier (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funcion TEXT NOT NULL,
      funcion_nombre TEXT NOT NULL,
      subfuncion TEXT NOT NULL,
      subfuncion_nombre TEXT NOT NULL,
      actividad TEXT,
      actividad_nombre TEXT
    );

    CREATE TABLE IF NOT EXISTS financing_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Recursos Propios','Federales','Crédito','Otros')),
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS responsible_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      area TEXT,
      head TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_year INTEGER NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      objective TEXT,
      unit_responsible TEXT,
      mir_objective TEXT,
      mir_indicator TEXT,
      mir_frequency TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      UNIQUE(fiscal_year, code)
    );

    CREATE TABLE IF NOT EXISTS budget_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_year INTEGER NOT NULL,
      cog_capitulo TEXT NOT NULL,
      cog_concepto TEXT NOT NULL,
      cog_partida_generica TEXT NOT NULL,
      cog_partida_especifica TEXT,
      programa TEXT,
      subprograma TEXT,
      proyecto TEXT,
      unidad_responsable TEXT,
      fuente_financiamiento TEXT,
      aprobado REAL NOT NULL DEFAULT 0,
      modificado REAL NOT NULL DEFAULT 0,
      comprometido REAL NOT NULL DEFAULT 0,
      devengado REAL NOT NULL DEFAULT 0,
      ejercido REAL NOT NULL DEFAULT 0,
      pagado REAL NOT NULL DEFAULT 0,
      disponible REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS income_budget_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_year INTEGER NOT NULL,
      rubro TEXT NOT NULL,
      rubro_nombre TEXT NOT NULL,
      concepto TEXT,
      concepto_nombre TEXT,
      fuente_financiamiento TEXT,
      estimado REAL NOT NULL DEFAULT 0,
      modificado REAL NOT NULL DEFAULT 0,
      devengado REAL NOT NULL DEFAULT 0,
      recaudado REAL NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget_modifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_year INTEGER NOT NULL,
      folio TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('Ampliación','Reducción','Traspaso','Adecuación')),
      date TEXT NOT NULL,
      concept TEXT NOT NULL,
      source_line_id INTEGER REFERENCES budget_lines(id),
      target_line_id INTEGER REFERENCES budget_lines(id),
      amount REAL NOT NULL,
      justification TEXT,
      authorized_by TEXT,
      status TEXT NOT NULL DEFAULT 'Pendiente' CHECK(status IN ('Pendiente','Autorizada','Rechazada')),
      entry_id INTEGER,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('Ingreso','Egreso','Diario','Cierre','Apertura')),
      date TEXT NOT NULL,
      concept TEXT NOT NULL,
      reference TEXT,
      area TEXT,
      dependencia TEXT,
      officer TEXT,
      fiscal_year INTEGER NOT NULL,
      period INTEGER NOT NULL,
      momento TEXT,
      template_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Borrador' CHECK(status IN ('Borrador','Validada','Autorizada','Cancelada')),
      total_debit REAL NOT NULL DEFAULT 0,
      total_credit REAL NOT NULL DEFAULT 0,
      supporting_doc TEXT,
      digital_signature TEXT,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      authorized_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS entry_date_idx ON journal_entries(date);
    CREATE INDEX IF NOT EXISTS entry_year_period_idx ON journal_entries(fiscal_year, period);
    CREATE INDEX IF NOT EXISTS entry_folio_idx ON journal_entries(folio);

    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_code TEXT NOT NULL REFERENCES accounts(code),
      description TEXT NOT NULL,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      presupuestal_key TEXT,
      programatico TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS line_entry_idx ON journal_entry_lines(entry_id);
    CREATE INDEX IF NOT EXISTS line_account_idx ON journal_entry_lines(account_code);

    CREATE TABLE IF NOT EXISTS presupuestal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      cog_capitulo TEXT NOT NULL,
      cog_concepto TEXT NOT NULL,
      cog_partida_generica TEXT NOT NULL,
      cog_partida_especifica TEXT,
      clasificacion_economica TEXT CHECK(clasificacion_economica IN ('Corriente','Capital','Amortización')),
      funcion TEXT,
      subfuncion TEXT,
      actividad_funcional TEXT,
      programa TEXT,
      subprograma TEXT,
      proyecto TEXT,
      actividad_programatica TEXT,
      fuente_financiamiento TEXT,
      unidad_responsable TEXT,
      momento TEXT NOT NULL,
      monto REAL NOT NULL,
      budget_line_id INTEGER REFERENCES budget_lines(id)
    );

    CREATE TABLE IF NOT EXISTS programatic_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      programa TEXT NOT NULL,
      subprograma TEXT,
      proyecto TEXT,
      actividad TEXT,
      meta TEXT,
      indicador TEXT,
      avance_fisico REAL,
      avance_financiero REAL,
      unidad_responsable TEXT,
      monto REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entry_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      momento TEXT NOT NULL,
      description TEXT NOT NULL,
      norm_reference TEXT NOT NULL,
      lines_json TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS debt_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folio TEXT NOT NULL UNIQUE,
      creditor TEXT NOT NULL,
      debt_type TEXT NOT NULL CHECK(debt_type IN ('Interna','Externa')),
      instrument TEXT NOT NULL CHECK(instrument IN ('Bono','Crédito','Arrendamiento','SOFOM','Otro')),
      contract_date TEXT NOT NULL,
      maturity_date TEXT NOT NULL,
      original_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'MXN',
      interest_rate REAL NOT NULL,
      balance REAL NOT NULL,
      monthly_payment REAL NOT NULL,
      guarantees TEXT,
      purpose TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debt_id INTEGER NOT NULL REFERENCES debt_records(id),
      date TEXT NOT NULL,
      principal REAL NOT NULL DEFAULT 0,
      interest REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      entry_id INTEGER REFERENCES journal_entries(id),
      reference TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      asset_type TEXT NOT NULL CHECK(asset_type IN ('Mueble','Inmueble','Intangible','Depreciable')),
      unit TEXT NOT NULL DEFAULT 'Pieza',
      quantity REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      location TEXT,
      custodian TEXT,
      acquisition_date TEXT,
      invoice_ref TEXT,
      condition TEXT NOT NULL DEFAULT 'Bueno' CHECK(condition IN ('Bueno','Regular','Malo','Baja')),
      depreciation_rate REAL,
      accumulated_depreciation REAL DEFAULT 0,
      net_value REAL,
      active INTEGER NOT NULL DEFAULT 1,
      fiscal_year INTEGER NOT NULL,
      account_code TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS warehouse_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES inventory_items(id),
      movement_type TEXT NOT NULL CHECK(movement_type IN ('Entrada','Salida','Transferencia','Baja','Ajuste')),
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      reference TEXT NOT NULL,
      origin TEXT,
      destination TEXT,
      justification TEXT,
      authorized_by TEXT,
      entry_id INTEGER REFERENCES journal_entries(id),
      fiscal_year INTEGER NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS audit_timestamp_idx ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS audit_user_idx ON audit_logs(user_id);

    CREATE TABLE IF NOT EXISTS glossary_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      norm_reference TEXT,
      category TEXT NOT NULL,
      related_terms TEXT
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('Básico','Intermedio','Avanzado')),
      category TEXT NOT NULL,
      expected_entries_json TEXT NOT NULL,
      hints_json TEXT NOT NULL,
      explanation TEXT NOT NULL,
      norm_reference TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 10,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS exercise_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      entries_json TEXT,
      score REAL NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      feedback_json TEXT,
      completed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cuenta_publica (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_year INTEGER NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'Borrador' CHECK(status IN ('Borrador','Revisión','Aprobada','Publicada')),
      sections_json TEXT,
      created_by INTEGER REFERENCES users(id),
      approved_by TEXT,
      publish_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS monthly_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fiscal_year INTEGER NOT NULL,
      period INTEGER NOT NULL,
      account_code TEXT NOT NULL REFERENCES accounts(code),
      initial_balance REAL NOT NULL DEFAULT 0,
      total_debits REAL NOT NULL DEFAULT 0,
      total_credits REAL NOT NULL DEFAULT 0,
      final_balance REAL NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(fiscal_year, period, account_code)
    );
  `);

  console.log('✅ Database tables initialized');
}
