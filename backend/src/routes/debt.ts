import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear } = req.query;
  const rows = db.prepare('SELECT * FROM debt_records WHERE fiscal_year=? ORDER BY created_at DESC').all(fiscalYear||2025);
  db.close();
  res.json({ success: true, data: rows });
});

router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const debt = db.prepare('SELECT * FROM debt_records WHERE id=?').get(req.params.id);
  if (!debt) { db.close(); return res.status(404).json({ success: false, error: 'No encontrado' }); }
  const payments = db.prepare('SELECT * FROM debt_payments WHERE debt_id=? ORDER BY date DESC').all(req.params.id);
  db.close();
  res.json({ success: true, data: { ...debt as any, payments } });
});

router.post('/', authenticate, requireRole('Administrador','Capturista'), (req: AuthRequest, res) => {
  const { creditor, debtType, instrument, contractDate, maturityDate, originalAmount, currency, interestRate, balance, monthlyPayment, guarantees, purpose, fiscalYear } = req.body;
  const db = getDb();
  const lastDebt = db.prepare("SELECT folio FROM debt_records ORDER BY created_at DESC LIMIT 1").get() as any;
  const seq = lastDebt ? parseInt(lastDebt.folio.split('-')[2]) + 1 : 1;
  const folio = `DEUDA-${fiscalYear||2025}-${String(seq).padStart(3,'0')}`;
  try {
    const result = db.prepare(`INSERT INTO debt_records(folio,creditor,debt_type,instrument,contract_date,maturity_date,original_amount,currency,interest_rate,balance,monthly_payment,guarantees,purpose,fiscal_year,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(folio,creditor,debtType,instrument,contractDate,maturityDate,originalAmount,currency||'MXN',interestRate,balance||originalAmount,monthlyPayment,guarantees||null,purpose,fiscalYear||2025,req.user!.userId);
    res.json({ success: true, data: { id: result.lastInsertRowid, folio } });
  } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  finally { db.close(); }
});

router.post('/:id/payments', authenticate, requireRole('Administrador','Capturista'), (req: AuthRequest, res) => {
  const { date, principal, interest, entryId, reference } = req.body;
  const total = (principal||0) + (interest||0);
  const db = getDb();
  const result = db.prepare('INSERT INTO debt_payments(debt_id,date,principal,interest,total,entry_id,reference,created_by) VALUES(?,?,?,?,?,?,?,?)').run(req.params.id,date,principal||0,interest||0,total,entryId||null,reference||null,req.user!.userId);
  db.prepare('UPDATE debt_records SET balance=balance-? WHERE id=?').run(principal||0, req.params.id);
  db.close();
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

router.get('/summary/:fiscalYear', authenticate, (req, res) => {
  const db = getDb();
  const debts = db.prepare('SELECT * FROM debt_records WHERE fiscal_year=? AND active=1').all(req.params.fiscalYear) as any[];
  const total = debts.reduce((s,d)=>s+d.balance,0);
  const totalOriginal = debts.reduce((s,d)=>s+d.original_amount,0);
  const payments = db.prepare(`SELECT SUM(principal) as totalPrincipal, SUM(interest) as totalInterest FROM debt_payments dp JOIN debt_records dr ON dr.id=dp.debt_id WHERE dr.fiscal_year=?`).get(req.params.fiscalYear) as any;
  db.close();
  res.json({ success: true, data: { debts, totalBalance: total, totalOriginal, totalPayments: payments } });
});

export default router;
