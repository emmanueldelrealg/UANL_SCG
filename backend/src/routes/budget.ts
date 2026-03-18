import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

// Budget lines (egresos)
router.get('/lines', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear, capitulo, programa, ur } = req.query;
  let sql = 'SELECT * FROM budget_lines WHERE 1=1';
  const params: any[] = [];
  if (fiscalYear) { sql += ' AND fiscal_year=?'; params.push(Number(fiscalYear)); }
  if (capitulo) { sql += ' AND cog_capitulo=?'; params.push(capitulo); }
  if (programa) { sql += ' AND programa=?'; params.push(programa); }
  if (ur) { sql += ' AND unidad_responsable=?'; params.push(ur); }
  sql += ' ORDER BY cog_capitulo, cog_concepto, cog_partida_generica';
  res.json({ success: true, data: db.prepare(sql).all(...params) });
  db.close();
});

router.get('/lines/summary', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear } = req.query;
  const rows = db.prepare(`SELECT cog_capitulo, SUM(aprobado) as aprobado, SUM(modificado) as modificado, SUM(comprometido) as comprometido, SUM(devengado) as devengado, SUM(ejercido) as ejercido, SUM(pagado) as pagado, SUM(disponible) as disponible FROM budget_lines WHERE fiscal_year=? GROUP BY cog_capitulo ORDER BY cog_capitulo`).all(fiscalYear || 2025);
  db.close();
  res.json({ success: true, data: rows });
});

router.post('/lines', authenticate, requireRole('Administrador'), (req, res) => {
  const { fiscalYear, cogCapitulo, cogConcepto, cogPartidaGenerica, cogPartidaEspecifica, programa, subprograma, proyecto, unidadResponsable, fuenteFinanciamiento, aprobado } = req.body;
  const db = getDb();
  try {
    const result = db.prepare(`INSERT INTO budget_lines(fiscal_year,cog_capitulo,cog_concepto,cog_partida_generica,cog_partida_especifica,programa,subprograma,proyecto,unidad_responsable,fuente_financiamiento,aprobado,modificado,disponible) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(fiscalYear, cogCapitulo, cogConcepto, cogPartidaGenerica, cogPartidaEspecifica||null, programa||null, subprograma||null, proyecto||null, unidadResponsable||null, fuenteFinanciamiento||null, aprobado, aprobado, aprobado);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  finally { db.close(); }
});

// Income budget lines
router.get('/income', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear } = req.query;
  const rows = db.prepare('SELECT * FROM income_budget_lines WHERE fiscal_year=? ORDER BY rubro, concepto').all(fiscalYear || 2025);
  db.close();
  res.json({ success: true, data: rows });
});

// Budget modifications
router.get('/modifications', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear } = req.query;
  const rows = db.prepare(`SELECT bm.*, u.name as created_by_name FROM budget_modifications bm LEFT JOIN users u ON u.id=bm.created_by WHERE bm.fiscal_year=? ORDER BY bm.created_at DESC`).all(fiscalYear || 2025);
  db.close();
  res.json({ success: true, data: rows });
});

router.post('/modifications', authenticate, requireRole('Administrador','Capturista'), (req: any, res) => {
  const { fiscalYear, type, date, concept, sourceLineId, targetLineId, amount, justification } = req.body;
  const db = getDb();
  const lastMod = db.prepare("SELECT folio FROM budget_modifications ORDER BY created_at DESC LIMIT 1").get() as any;
  const seq = lastMod ? parseInt(lastMod.folio.split('-')[2]) + 1 : 1;
  const folio = `MOD-${fiscalYear}-${String(seq).padStart(4,'0')}`;
  try {
    const result = db.prepare(`INSERT INTO budget_modifications(fiscal_year,folio,type,date,concept,source_line_id,target_line_id,amount,justification,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)`).run(fiscalYear, folio, type, date, concept, sourceLineId||null, targetLineId||null, amount, justification||null, req.user?.userId);
    res.json({ success: true, data: { id: result.lastInsertRowid, folio } });
  } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  finally { db.close(); }
});

// Programs
router.get('/programs', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear } = req.query;
  const rows = db.prepare('SELECT * FROM programs WHERE fiscal_year=? AND active=1 ORDER BY code').all(fiscalYear || 2025);
  db.close();
  res.json({ success: true, data: rows });
});

// COG catalog
router.get('/cog', authenticate, (req, res) => {
  const db = getDb();
  const { capitulo } = req.query;
  let sql = 'SELECT * FROM cog_catalog WHERE active=1';
  const params: any[] = [];
  if (capitulo) { sql += ' AND capitulo=?'; params.push(capitulo); }
  sql += ' ORDER BY capitulo,concepto,partida_generica';
  res.json({ success: true, data: db.prepare(sql).all(...params) });
  db.close();
});

// Financing sources
router.get('/financing-sources', authenticate, (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.prepare('SELECT * FROM financing_sources WHERE active=1 ORDER BY code').all() });
  db.close();
});

// Responsible units
router.get('/responsible-units', authenticate, (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.prepare('SELECT * FROM responsible_units WHERE active=1 ORDER BY code').all() });
  db.close();
});

// Functional classifier
router.get('/functional', authenticate, (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.prepare('SELECT * FROM functional_classifier ORDER BY funcion,subfuncion').all() });
  db.close();
});

// Fiscal years
router.get('/fiscal-years', authenticate, (req, res) => {
  const db = getDb();
  const years = db.prepare('SELECT * FROM fiscal_years ORDER BY year DESC').all() as any[];
  const periods = db.prepare('SELECT * FROM fiscal_periods ORDER BY year, month').all() as any[];
  const result = years.map((y: any) => ({
    ...y,
    periods: periods.filter((p: any) => p.year === y.year),
  }));
  db.close();
  res.json({ success: true, data: result });
});

router.post('/fiscal-years', authenticate, requireRole('Administrador'), (req: any, res) => {
  const { year, name } = req.body;
  if (!year || !name) return res.status(400).json({ success: false, error: 'Año y nombre requeridos' });
  const db = getDb();
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  try {
    db.prepare('INSERT INTO fiscal_years(year,name,status,open_date,created_by) VALUES(?,?,?,?,?)').run(year, name, 'Abierto', `${year}-01-01`, req.user.userId);
    for (let m = 1; m <= 12; m++) {
      db.prepare('INSERT OR IGNORE INTO fiscal_periods(fiscal_year_id,year,month,name,status,open_date) SELECT id,?,?,?,?,? FROM fiscal_years WHERE year=?').run(year, m, MONTHS[m-1], 'Abierto', `${year}-${String(m).padStart(2,'0')}-01`, year);
    }
    res.json({ success: true, message: `Ejercicio ${year} creado` });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  } finally { db.close(); }
});

router.patch('/fiscal-periods/:id', authenticate, requireRole('Administrador'), (req, res) => {
  const { status } = req.body;
  const db = getDb();
  db.prepare('UPDATE fiscal_periods SET status=?, close_date=? WHERE id=?').run(status, status === 'Cerrado' ? new Date().toISOString().split('T')[0] : null, req.params.id);
  db.close();
  res.json({ success: true, message: 'Período actualizado' });
});

export default router;
