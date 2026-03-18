import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const JWT_SECRET = process.env.JWT_SECRET || 'scg-uanl-secret-key-2025';
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username=? AND active=1').get(username) as any;
  db.close();
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
  const db2 = getDb(); db2.prepare('UPDATE users SET last_login=? WHERE id=?').run(new Date().toISOString(), user.id); db2.close();
  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ success: true, data: { token, user: { id: user.id, username: user.username, name: user.name, email: user.email, role: user.role, dependencia: user.dependencia } } });
});

router.get('/me', authenticate, (req: AuthRequest, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id,username,name,email,role,dependencia,active,created_at,last_login FROM users WHERE id=?').get(req.user!.userId) as any;
  db.close();
  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  res.json({ success: true, data: user });
});

router.get('/users', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'Administrador') return res.status(403).json({ success: false, error: 'Solo administradores' });
  const db = getDb();
  const users = db.prepare('SELECT id,username,name,email,role,dependencia,active,created_at,last_login FROM users ORDER BY name').all();
  db.close();
  res.json({ success: true, data: users });
});

router.post('/users', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'Administrador') return res.status(403).json({ success: false, error: 'Solo administradores' });
  const { username, password, name, email, role, dependencia } = req.body;
  if (!username || !password || !name || !email || !role) return res.status(400).json({ success: false, error: 'Campos requeridos faltantes' });
  const hash = bcrypt.hashSync(password, 10);
  const db = getDb();
  try {
    const result = db.prepare('INSERT INTO users(username,password_hash,name,email,role,dependencia) VALUES(?,?,?,?,?,?)').run(username, hash, name, email, role, dependencia || null);
    res.json({ success: true, data: { id: result.lastInsertRowid, username, name, email, role } });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  } finally { db.close(); }
});

router.put('/users/:id', authenticate, (req: AuthRequest, res) => {
  if (req.user!.role !== 'Administrador') return res.status(403).json({ success: false, error: 'Solo administradores' });
  const { name, email, role, dependencia, active, password } = req.body;
  const db = getDb();
  if (password) db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password, 10), req.params.id);
  db.prepare('UPDATE users SET name=?,email=?,role=?,dependencia=?,active=? WHERE id=?').run(name, email, role, dependencia||null, active?1:0, req.params.id);
  db.close();
  res.json({ success: true, message: 'Usuario actualizado' });
});

export default router;
