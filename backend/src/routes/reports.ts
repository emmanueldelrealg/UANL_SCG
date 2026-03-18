import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

// Balanza de Comprobación
router.get('/balanza', authenticate, (req, res) => {
  const { fiscalYear, period, level = '4', from, to } = req.query;
  const db = getDb();
  const fy = Number(fiscalYear) || 2025;
  const lvl = Number(level);
  const per = period ? Number(period) : null;
  let sql = `SELECT a.code, a.name, a.level, a.nature, a.group_num,
    COALESCE(SUM(mb.total_debits),0) as debits,
    COALESCE(SUM(mb.total_credits),0) as credits,
    COALESCE(SUM(mb.final_balance),0) as final_balance
    FROM accounts a
    LEFT JOIN monthly_balances mb ON mb.account_code=a.code AND mb.fiscal_year=?`;
  const params: any[] = [fy];
  if (per) { sql += ' AND mb.period=?'; params.push(per); }
  sql += ` WHERE a.level=? AND a.active=1 GROUP BY a.code ORDER BY a.code`;
  params.push(lvl);
  const rows = db.prepare(sql).all(...params) as any[];
  // Add initial balance (from prior periods)
  const balanza = rows.map(r => ({
    accountCode: r.code, accountName: r.name, level: r.level, nature: r.nature, groupNum: r.group_num,
    initialBalance: 0, debits: r.debits, credits: r.credits, finalBalance: r.final_balance,
  }));
  const totalD = balanza.reduce((s,r)=>s+r.debits,0);
  const totalC = balanza.reduce((s,r)=>s+r.credits,0);
  db.close();
  res.json({ success: true, data: balanza, totals: { debits: totalD, credits: totalC, balanced: Math.abs(totalD-totalC)<0.01 } });
});

// Libro Diario
router.get('/diario', authenticate, (req, res) => {
  const { fiscalYear, period, from, to, accountCode, page = '1', limit = '100' } = req.query;
  const db = getDb();
  let sql = `SELECT je.folio, je.date, je.concept, je.reference, je.area, je.tipo, jel.account_code, acc.name as account_name, jel.description, jel.debit, jel.credit, je.total_debit, je.total_credit, je.status, je.momento, je.type as tipo
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id=jel.entry_id
    JOIN accounts acc ON acc.code=jel.account_code
    WHERE je.status != 'Cancelada'`;
  const params: any[] = [];
  if (fiscalYear) { sql += ' AND je.fiscal_year=?'; params.push(Number(fiscalYear)); }
  if (period) { sql += ' AND je.period=?'; params.push(Number(period)); }
  if (from) { sql += ' AND je.date>=?'; params.push(from); }
  if (to) { sql += ' AND je.date<=?'; params.push(to); }
  if (accountCode) { sql += ' AND jel.account_code=?'; params.push(accountCode); }
  sql += ' ORDER BY je.date, je.folio, jel.sort_order';
  sql += ` LIMIT ? OFFSET ?`;
  const total = (db.prepare(`SELECT COUNT(*) as c FROM (${sql.split(' LIMIT')[0]})`).get(...params) as any).c;
  params.push(Number(limit), (Number(page)-1)*Number(limit));
  const rows = db.prepare(sql).all(...params);
  db.close();
  res.json({ success: true, data: rows, total, page: Number(page), limit: Number(limit) });
});

// Libro Mayor (por cuenta)
router.get('/mayor/:accountCode', authenticate, (req, res) => {
  const { fiscalYear, period } = req.query;
  const db = getDb();
  const account = db.prepare('SELECT * FROM accounts WHERE code=?').get(req.params.accountCode) as any;
  if (!account) { db.close(); return res.status(404).json({ success: false, error: 'Cuenta no encontrada' }); }
  let sql = `SELECT je.folio, je.date, je.concept, je.reference, je.momento, jel.description, jel.debit, jel.credit
    FROM journal_entry_lines jel JOIN journal_entries je ON je.id=jel.entry_id
    WHERE jel.account_code=? AND je.status!='Cancelada'`;
  const params: any[] = [req.params.accountCode];
  if (fiscalYear) { sql += ' AND je.fiscal_year=?'; params.push(Number(fiscalYear)); }
  if (period) { sql += ' AND je.period=?'; params.push(Number(period)); }
  sql += ' ORDER BY je.date, je.folio';
  const movements = db.prepare(sql).all(...params) as any[];
  let balance = 0;
  const rows = movements.map(m => {
    balance += m.debit - m.credit;
    return { ...m, balance };
  });
  db.close();
  res.json({ success: true, data: { account, movements: rows, totalDebits: movements.reduce((s,m)=>s+m.debit,0), totalCredits: movements.reduce((s,m)=>s+m.credit,0), finalBalance: balance } });
});

// Estado de Situación Financiera (Balance General)
router.get('/situacion-financiera', authenticate, (req, res) => {
  const { fiscalYear, period } = req.query;
  const db = getDb();
  const fy = Number(fiscalYear) || 2025;
  const groups = [1000, 2000, 3000];
  const result: any = {};
  for (const g of groups) {
    const rows = db.prepare(`SELECT a.code, a.name, a.level, a.nature, a.group_num,
      COALESCE(SUM(mb.final_balance),0) as balance
      FROM accounts a LEFT JOIN monthly_balances mb ON mb.account_code=a.code AND mb.fiscal_year=?
      ${period ? 'AND mb.period<=?' : ''}
      WHERE a.group_num=? AND a.level>=3 AND a.active=1 GROUP BY a.code ORDER BY a.code`).all(...(period ? [fy, Number(period), g] : [fy, g])) as any[];
    result[g] = rows;
  }
  db.close();
  res.json({ success: true, data: result });
});

// Estado de Actividades (Resultados)
router.get('/actividades', authenticate, (req, res) => {
  const { fiscalYear, period } = req.query;
  const db = getDb();
  const fy = Number(fiscalYear) || 2025;
  const groups = [4000, 5000, 6000];
  const result: any = {};
  for (const g of groups) {
    const rows = db.prepare(`SELECT a.code, a.name, a.level, a.nature, a.group_num,
      COALESCE(SUM(mb.total_debits),0) as debits, COALESCE(SUM(mb.total_credits),0) as credits,
      COALESCE(SUM(mb.final_balance),0) as balance
      FROM accounts a LEFT JOIN monthly_balances mb ON mb.account_code=a.code AND mb.fiscal_year=?
      ${period ? 'AND mb.period<=?' : ''}
      WHERE a.group_num=? AND a.level>=3 AND a.active=1 GROUP BY a.code ORDER BY a.code`).all(...(period ? [fy, Number(period), g] : [fy, g])) as any[];
    result[g] = rows;
  }
  db.close();
  res.json({ success: true, data: result });
});

// Estado Analítico del Activo
router.get('/activo', authenticate, (req, res) => {
  const { fiscalYear, period } = req.query;
  const db = getDb();
  const fy = Number(fiscalYear) || 2025;
  const rows = db.prepare(`SELECT a.code, a.name, a.level, COALESCE(SUM(mb.final_balance),0) as balance
    FROM accounts a LEFT JOIN monthly_balances mb ON mb.account_code=a.code AND mb.fiscal_year=? ${period?'AND mb.period<=?':''}
    WHERE a.group_num=1000 AND a.level>=3 AND a.active=1 GROUP BY a.code ORDER BY a.code`).all(...(period?[fy,Number(period)]:[fy]));
  db.close();
  res.json({ success: true, data: rows });
});

// Estado Analítico de Ingresos (EAI) - LGCG Art.53
router.get('/eai', authenticate, (req, res) => {
  const { fiscalYear } = req.query;
  const db = getDb();
  const fy = Number(fiscalYear) || 2025;
  const income = db.prepare('SELECT * FROM income_budget_lines WHERE fiscal_year=? ORDER BY rubro,concepto').all(fy);
  const totalEstimado = (income as any[]).reduce((s,r)=>s+r.estimado,0);
  const totalModificado = (income as any[]).reduce((s,r)=>s+r.modificado,0);
  const totalRecaudado = (income as any[]).reduce((s,r)=>s+r.recaudado,0);
  // Get actual collections from journal entries
  const collections = db.prepare(`SELECT pr.cog_capitulo, SUM(pr.monto) as monto FROM presupuestal_records pr JOIN journal_entries je ON je.id=pr.entry_id WHERE je.fiscal_year=? AND pr.momento='Recaudado' GROUP BY pr.cog_capitulo`).all(fy);
  db.close();
  res.json({ success: true, data: { lines: income, collections, totals: { estimado: totalEstimado, modificado: totalModificado, recaudado: totalRecaudado } } });
});

// Estado Analítico del Ejercicio del Presupuesto de Egresos (EAEPE) - LGCG Art.53
router.get('/eaepe', authenticate, (req, res) => {
  const { fiscalYear, clasificacion = 'objeto' } = req.query;
  const db = getDb();
  const fy = Number(fiscalYear) || 2025;
  let rows;
  if (clasificacion === 'objeto') {
    rows = db.prepare(`SELECT cog_capitulo, SUM(aprobado) ap, SUM(modificado) mo, SUM(comprometido) co, SUM(devengado) de, SUM(ejercido) ej, SUM(pagado) pa, SUM(disponible) di FROM budget_lines WHERE fiscal_year=? GROUP BY cog_capitulo ORDER BY cog_capitulo`).all(fy);
  } else if (clasificacion === 'programa') {
    rows = db.prepare(`SELECT programa, SUM(aprobado) ap, SUM(modificado) mo, SUM(comprometido) co, SUM(devengado) de, SUM(ejercido) ej, SUM(pagado) pa, SUM(disponible) di FROM budget_lines WHERE fiscal_year=? GROUP BY programa ORDER BY programa`).all(fy);
  } else {
    rows = db.prepare(`SELECT unidad_responsable, SUM(aprobado) ap, SUM(modificado) mo, SUM(comprometido) co, SUM(devengado) de, SUM(ejercido) ej, SUM(pagado) pa, SUM(disponible) di FROM budget_lines WHERE fiscal_year=? GROUP BY unidad_responsable ORDER BY unidad_responsable`).all(fy);
  }
  const totals = db.prepare(`SELECT SUM(aprobado) ap, SUM(modificado) mo, SUM(comprometido) co, SUM(devengado) de, SUM(ejercido) ej, SUM(pagado) pa, SUM(disponible) di FROM budget_lines WHERE fiscal_year=?`).get(fy);
  db.close();
  res.json({ success: true, data: rows, totals, clasificacion });
});

// Fiscal years
router.get('/fiscal-years', authenticate, (req, res) => {
  const db = getDb();
  const years = db.prepare('SELECT * FROM fiscal_years ORDER BY year DESC').all();
  const periods = db.prepare('SELECT * FROM fiscal_periods ORDER BY year,month').all();
  db.close();
  res.json({ success: true, data: years, periods });
});

router.post('/fiscal-years', authenticate, (req, res) => {
  const { year, name } = req.body;
  const db = getDb();
  const result = db.prepare(`INSERT OR IGNORE INTO fiscal_years(year,name,status,open_date) VALUES(?,?,?,?)`).run(year, name, 'Abierto', new Date().toISOString().split('T')[0]);
  const fyId = result.lastInsertRowid;
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  for (let m=1;m<=12;m++) db.prepare(`INSERT OR IGNORE INTO fiscal_periods(fiscal_year_id,year,month,name,status) VALUES(?,?,?,?,?)`).run(fyId,year,m,months[m-1],'Abierto');
  db.close();
  res.json({ success: true, data: { id: fyId, year } });
});

// Audit log
router.get('/audit', authenticate, (req, res) => {
  const { page = '1', limit = '50', userId, module } = req.query;
  const db = getDb();
  let sql = `SELECT al.*, u.name as user_name FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id WHERE 1=1`;
  const params: any[] = [];
  if (userId) { sql += ' AND al.user_id=?'; params.push(Number(userId)); }
  if (module) { sql += ' AND al.module=?'; params.push(module); }
  const total = (db.prepare(`SELECT COUNT(*) as c FROM audit_logs`).get() as any).c;
  sql += ' ORDER BY al.timestamp DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page)-1)*Number(limit));
  const rows = db.prepare(sql).all(...params);
  db.close();
  res.json({ success: true, data: rows, total });
});

export default router;
