import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { fiscalYear, category, assetType, search } = req.query;
  let sql = 'SELECT * FROM inventory_items WHERE 1=1';
  const params: any[] = [];
  if (fiscalYear) { sql += ' AND fiscal_year=?'; params.push(Number(fiscalYear)); }
  if (category) { sql += ' AND category=?'; params.push(category); }
  if (assetType) { sql += ' AND asset_type=?'; params.push(assetType); }
  if (search) { sql += ' AND (code LIKE ? OR name LIKE ?)'; const s=`%${search}%`; params.push(s,s); }
  sql += ' ORDER BY code';
  res.json({ success: true, data: db.prepare(sql).all(...params) });
  db.close();
});

router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM inventory_items WHERE id=?').get(req.params.id);
  if (!item) { db.close(); return res.status(404).json({ success: false, error: 'No encontrado' }); }
  const movements = db.prepare('SELECT * FROM warehouse_movements WHERE item_id=? ORDER BY date DESC').all(req.params.id);
  db.close();
  res.json({ success: true, data: { ...item as any, movements } });
});

router.post('/', authenticate, requireRole('Administrador','Capturista'), (req: AuthRequest, res) => {
  const { code, name, description, category, assetType, unit, quantity, unitCost, location, custodian, acquisitionDate, invoiceRef, condition, depreciationRate, accountCode, fiscalYear } = req.body;
  const totalCost = quantity * unitCost;
  const db = getDb();
  try {
    const result = db.prepare(`INSERT INTO inventory_items(code,name,description,category,asset_type,unit,quantity,unit_cost,total_cost,location,custodian,acquisition_date,invoice_ref,condition,depreciation_rate,accumulated_depreciation,net_value,account_code,fiscal_year,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)`).run(code,name,description||null,category,assetType,unit||'Pieza',quantity,unitCost,totalCost,location||null,custodian||null,acquisitionDate||null,invoiceRef||null,condition||'Bueno',depreciationRate||null,totalCost,accountCode||null,fiscalYear||2025,req.user!.userId);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (e: any) { res.status(400).json({ success: false, error: e.message }); }
  finally { db.close(); }
});

router.post('/:id/movements', authenticate, requireRole('Administrador','Capturista'), (req: AuthRequest, res) => {
  const { movementType, quantity, unitCost, date, reference, origin, destination, justification, authorizedBy, entryId, fiscalYear } = req.body;
  const db = getDb();
  try {
    const item = db.prepare('SELECT * FROM inventory_items WHERE id=?').get(req.params.id) as any;
    if (!item) { db.close(); return res.status(404).json({ success: false, error: 'Artículo no encontrado' }); }
    const totalCost = quantity * (unitCost || item.unit_cost);
    const result = db.prepare(`INSERT INTO warehouse_movements(item_id,movement_type,quantity,unit_cost,total_cost,date,reference,origin,destination,justification,authorized_by,entry_id,fiscal_year,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(item.id,movementType,quantity,unitCost||item.unit_cost,totalCost,date,reference,origin||null,destination||null,justification||null,authorizedBy||null,entryId||null,fiscalYear||2025,req.user!.userId);
    // Update inventory quantity
    const qtyChange = ['Entrada'].includes(movementType) ? quantity : movementType === 'Salida' || movementType === 'Baja' ? -quantity : 0;
    const costChange = ['Entrada'].includes(movementType) ? totalCost : movementType === 'Salida' || movementType === 'Baja' ? -totalCost : 0;
    db.prepare('UPDATE inventory_items SET quantity=quantity+?,total_cost=total_cost+?,net_value=net_value+?,updated_at=datetime("now") WHERE id=?').run(qtyChange,costChange,costChange,item.id);
    db.close();
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (e: any) { db.close(); res.status(500).json({ success: false, error: e.message }); }
});

router.post('/depreciation', authenticate, requireRole('Administrador'), (req: AuthRequest, res) => {
  const { fiscalYear, period, date } = req.body;
  const db = getDb();
  const items = db.prepare("SELECT * FROM inventory_items WHERE fiscal_year=? AND depreciation_rate IS NOT NULL AND depreciation_rate>0 AND active=1 AND asset_type='Depreciable'").all(fiscalYear||2025) as any[];
  const depEntries = items.map(item => {
    const monthly = (item.unit_cost * item.depreciation_rate / 100) / 12;
    return { item, monthly };
  });
  const totalDep = depEntries.reduce((s,e)=>s+e.monthly,0);
  // Update accumulated depreciation
  const tx = db.transaction(() => {
    for (const { item, monthly } of depEntries) {
      db.prepare('UPDATE inventory_items SET accumulated_depreciation=accumulated_depreciation+?,net_value=net_value-? WHERE id=?').run(monthly,monthly,item.id);
    }
  });
  tx();
  db.close();
  res.json({ success: true, data: { totalDepreciation: totalDep, itemsProcessed: depEntries.length, entries: depEntries.map(e=>({name:e.item.name,depreciation:e.monthly})) } });
});

export default router;
