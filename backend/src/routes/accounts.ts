import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const { level, group, search, active } = req.query;
  let sql = 'SELECT * FROM accounts WHERE 1=1';
  const params: any[] = [];
  if (level) { sql += ' AND level=?'; params.push(Number(level)); }
  if (group) { sql += ' AND group_num=?'; params.push(Number(group)); }
  if (search) { sql += ' AND (code LIKE ? OR name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (active !== undefined) { sql += ' AND active=?'; params.push(active === 'true' ? 1 : 0); }
  sql += ' ORDER BY code';
  const accounts = db.prepare(sql).all(...params);
  db.close();
  res.json({ success: true, data: accounts });
});

router.get('/tree', authenticate, (req, res) => {
  const db = getDb();
  const accounts = db.prepare('SELECT * FROM accounts WHERE active=1 ORDER BY code').all() as any[];
  db.close();
  const map = new Map<string, any>();
  accounts.forEach(a => map.set(a.code, { ...a, children: [] }));
  const roots: any[] = [];
  accounts.forEach(a => {
    if (a.parent_code && map.has(a.parent_code)) map.get(a.parent_code).children.push(map.get(a.code));
    else if (!a.parent_code) roots.push(map.get(a.code));
  });
  res.json({ success: true, data: roots });
});

router.get('/:code', authenticate, (req, res) => {
  const db = getDb();
  const account = db.prepare('SELECT * FROM accounts WHERE code=?').get(req.params.code);
  db.close();
  if (!account) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
  res.json({ success: true, data: account });
});

router.post('/', authenticate, requireRole('Administrador'), (req, res) => {
  const { code, name, level, parentCode, nature, accountType, groupNum, description, normalBalance } = req.body;
  const db = getDb();
  try {
    const result = db.prepare(`INSERT INTO accounts(code,name,level,parent_code,nature,account_type,group_num,description,normal_balance,is_conac) VALUES(?,?,?,?,?,?,?,?,?,0)`).run(code, name, level, parentCode||null, nature, accountType, groupNum, description||null, normalBalance);
    res.json({ success: true, data: { id: result.lastInsertRowid, code } });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  } finally { db.close(); }
});

router.put('/:id', authenticate, requireRole('Administrador'), (req, res) => {
  const { name, active, description } = req.body;
  const db = getDb();
  db.prepare('UPDATE accounts SET name=?,active=?,description=? WHERE id=?').run(name, active?1:0, description||null, req.params.id);
  db.close();
  res.json({ success: true, message: 'Cuenta actualizada' });
});

export default router;
