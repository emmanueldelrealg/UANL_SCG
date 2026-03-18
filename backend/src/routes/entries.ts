import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

function nextFolio(db: Database.Database, type: string, year: number) {
  const map: Record<string,string> = { Ingreso:'I', Egreso:'E', Diario:'D', Cierre:'C', Apertura:'A' };
  const prefix = map[type] || 'D';
  const last = db.prepare(`SELECT folio FROM journal_entries WHERE folio LIKE ? ORDER BY folio DESC LIMIT 1`).get(`${prefix}-${year}-%`) as any;
  if (last) {
    const seq = parseInt(last.folio.split('-')[2]) + 1;
    return `${prefix}-${year}-${String(seq).padStart(5,'0')}`;
  }
  return `${prefix}-${year}-00001`;
}

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear, period, type, status, search, from, to, page = '1', limit = '50' } = req.query;
  let sql = `SELECT je.*, u.name as created_by_name FROM journal_entries je LEFT JOIN users u ON u.id=je.created_by WHERE 1=1`;
  const params: any[] = [];
  if (fiscalYear) { sql += ' AND je.fiscal_year=?'; params.push(Number(fiscalYear)); }
  if (period) { sql += ' AND je.period=?'; params.push(Number(period)); }
  if (type) { sql += ' AND je.type=?'; params.push(type); }
  if (status) { sql += ' AND je.status=?'; params.push(status); }
  if (search) { sql += ' AND (je.folio LIKE ? OR je.concept LIKE ? OR je.reference LIKE ?)'; const s = `%${search}%`; params.push(s,s,s); }
  if (from) { sql += ' AND je.date>=?'; params.push(from); }
  if (to) { sql += ' AND je.date<=?'; params.push(to); }
  const total = (db.prepare(`SELECT COUNT(*) as c FROM (${sql})`).get(...params) as any).c;
  sql += ' ORDER BY je.date DESC, je.folio DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page)-1)*Number(limit));
  const entries = db.prepare(sql).all(...params);
  db.close();
  res.json({ success: true, data: entries, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const entry = db.prepare(`SELECT je.*, u.name as created_by_name, a.name as authorized_by_name FROM journal_entries je LEFT JOIN users u ON u.id=je.created_by LEFT JOIN users a ON a.id=je.authorized_by WHERE je.id=?`).get(req.params.id) as any;
  if (!entry) { db.close(); return res.status(404).json({ success: false, error: 'Póliza no encontrada' }); }
  const lines = db.prepare(`SELECT jel.*, acc.name as account_name FROM journal_entry_lines jel JOIN accounts acc ON acc.code=jel.account_code WHERE jel.entry_id=? ORDER BY sort_order`).all(req.params.id);
  const presupuestal = db.prepare('SELECT * FROM presupuestal_records WHERE entry_id=?').get(req.params.id);
  const programatico = db.prepare('SELECT * FROM programatic_records WHERE entry_id=?').get(req.params.id);
  db.close();
  res.json({ success: true, data: { ...entry, lines, presupuestalRecord: presupuestal, programaticRecord: programatico } });
});

router.post('/', authenticate, requireRole('Administrador','Capturista'), (req: AuthRequest, res) => {
  const { type, date, concept, reference, area, dependencia, officer, fiscalYear, period, momento, templateId, lines, presupuestalRecord, programaticRecord, notes } = req.body;
  if (!type || !date || !concept || !fiscalYear || !period || !lines?.length) return res.status(400).json({ success: false, error: 'Campos requeridos faltantes' });
  const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit||0), 0);
  const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit||0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) return res.status(400).json({ success: false, error: `Póliza desbalanceada: Cargos=${totalDebit.toFixed(2)}, Abonos=${totalCredit.toFixed(2)}` });
  const db = getDb();
  try {
    const folio = nextFolio(db, type, fiscalYear);
    const tx = db.transaction(() => {
      const result = db.prepare(`INSERT INTO journal_entries(folio,type,date,concept,reference,area,dependencia,officer,fiscal_year,period,momento,template_id,status,total_debit,total_credit,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(folio,type,date,concept,reference||null,area||null,dependencia||null,officer||null,fiscalYear,period,momento||null,templateId||null,'Borrador',totalDebit,totalCredit,notes||null,req.user!.userId);
      const entryId = result.lastInsertRowid;
      for (let i=0; i<lines.length; i++) {
        const l = lines[i];
        db.prepare(`INSERT INTO journal_entry_lines(entry_id,account_code,description,debit,credit,presupuestal_key,programatico,sort_order) VALUES(?,?,?,?,?,?,?,?)`).run(entryId,l.accountCode,l.description,l.debit||0,l.credit||0,l.presupuestalKey||null,l.programatico||null,i);
      }
      if (presupuestalRecord) {
        db.prepare(`INSERT INTO presupuestal_records(entry_id,cog_capitulo,cog_concepto,cog_partida_generica,cog_partida_especifica,clasificacion_economica,funcion,subfuncion,actividad_funcional,programa,subprograma,proyecto,actividad_programatica,fuente_financiamiento,unidad_responsable,momento,monto) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(entryId,presupuestalRecord.cogCapitulo||'',presupuestalRecord.cogConcepto||'',presupuestalRecord.cogPartidaGenerica||'',presupuestalRecord.cogPartidaEspecifica||null,presupuestalRecord.clasificacionEconomica||null,presupuestalRecord.funcion||null,presupuestalRecord.subfuncion||null,presupuestalRecord.actividadFuncional||null,presupuestalRecord.programa||null,presupuestalRecord.subprograma||null,presupuestalRecord.proyecto||null,presupuestalRecord.actividadProgramatica||null,presupuestalRecord.fuenteFinanciamiento||null,presupuestalRecord.unidadResponsable||null,presupuestalRecord.momento||momento||'',presupuestalRecord.monto||totalDebit);
      }
      if (programaticRecord) {
        db.prepare(`INSERT INTO programatic_records(entry_id,programa,subprograma,proyecto,actividad,meta,indicador,unidad_responsable,monto) VALUES(?,?,?,?,?,?,?,?,?)`).run(entryId,programaticRecord.programa||'',programaticRecord.subprograma||null,programaticRecord.proyecto||null,programaticRecord.actividad||null,programaticRecord.meta||null,programaticRecord.indicador||null,programaticRecord.unidadResponsable||null,programaticRecord.monto||totalDebit);
      }
      // Update monthly balances
      for (const l of lines) {
        const acc = db.prepare('SELECT * FROM accounts WHERE code=?').get(l.accountCode) as any;
        if (!acc) continue;
        const existing = db.prepare('SELECT * FROM monthly_balances WHERE fiscal_year=? AND period=? AND account_code=?').get(fiscalYear, period, l.accountCode) as any;
        if (existing) {
          db.prepare('UPDATE monthly_balances SET total_debits=total_debits+?,total_credits=total_credits+?,final_balance=final_balance+?,updated_at=datetime("now") WHERE fiscal_year=? AND period=? AND account_code=?').run(l.debit||0,l.credit||0,(l.debit||0)-(l.credit||0),fiscalYear,period,l.accountCode);
        } else {
          db.prepare('INSERT INTO monthly_balances(fiscal_year,period,account_code,total_debits,total_credits,final_balance) VALUES(?,?,?,?,?,?)').run(fiscalYear,period,l.accountCode,l.debit||0,l.credit||0,(l.debit||0)-(l.credit||0));
        }
      }
      // Update budget if has presupuestal record
      if (presupuestalRecord && ['Comprometido','Devengado','Ejercido','Pagado'].includes(presupuestalRecord.momento)) {
        const bl = db.prepare(`SELECT id FROM budget_lines WHERE fiscal_year=? AND cog_capitulo=? AND cog_concepto=? AND cog_partida_generica=?`).get(fiscalYear, presupuestalRecord.cogCapitulo, presupuestalRecord.cogConcepto, presupuestalRecord.cogPartidaGenerica) as any;
        if (bl) {
          const col = (presupuestalRecord.momento as string).toLowerCase();
          db.prepare(`UPDATE budget_lines SET ${col}=${col}+?,disponible=disponible-?,updated_at=datetime("now") WHERE id=?`).run(presupuestalRecord.monto, presupuestalRecord.monto, bl.id);
        }
      }
      return entryId;
    });
    const entryId = tx();
    db.close();
    res.json({ success: true, data: { id: entryId, folio } });
  } catch (e: any) {
    db.close();
    res.status(500).json({ success: false, error: e.message });
  }
});

router.patch('/:id/authorize', authenticate, requireRole('Administrador'), (req: AuthRequest, res) => {
  const db = getDb();
  db.prepare('UPDATE journal_entries SET status=?,authorized_by=?,updated_at=datetime("now") WHERE id=?').run('Autorizada', req.user!.userId, req.params.id);
  db.close();
  res.json({ success: true, message: 'Póliza autorizada' });
});

router.patch('/:id/cancel', authenticate, requireRole('Administrador'), (req, res) => {
  const db = getDb();
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id=?').get(req.params.id) as any;
  if (!entry) { db.close(); return res.status(404).json({ success: false, error: 'No encontrada' }); }
  if (entry.status === 'Cancelada') { db.close(); return res.status(400).json({ success: false, error: 'Ya cancelada' }); }
  db.prepare('UPDATE journal_entries SET status=?,updated_at=datetime("now") WHERE id=?').run('Cancelada', req.params.id);
  db.close();
  res.json({ success: true, message: 'Póliza cancelada' });
});

router.get('/templates/all', authenticate, (req, res) => {
  const db = getDb();
  const templates = db.prepare('SELECT * FROM entry_templates WHERE active=1 ORDER BY category,name').all() as any[];
  db.close();
  res.json({ success: true, data: templates.map(t => ({ ...t, lines: JSON.parse(t.lines_json) })) });
});

export default router;
