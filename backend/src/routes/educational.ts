import { Router } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');
const getDb = () => { const db = new Database(DB_PATH); db.pragma('foreign_keys = ON'); return db; };

router.get('/glossary', authenticate, (req, res) => {
  const { search, category } = req.query;
  const db = getDb();
  let sql = 'SELECT * FROM glossary_terms WHERE 1=1';
  const params: any[] = [];
  if (search) { sql += ' AND (term LIKE ? OR definition LIKE ?)'; const s=`%${search}%`; params.push(s,s); }
  if (category) { sql += ' AND category=?'; params.push(category); }
  sql += ' ORDER BY term';
  res.json({ success: true, data: db.prepare(sql).all(...params) });
  db.close();
});

router.get('/exercises', authenticate, (req, res) => {
  const { difficulty, category } = req.query;
  const db = getDb();
  let sql = 'SELECT id,title,description,difficulty,category,norm_reference,points FROM exercises WHERE active=1';
  const params: any[] = [];
  if (difficulty) { sql += ' AND difficulty=?'; params.push(difficulty); }
  if (category) { sql += ' AND category=?'; params.push(category); }
  sql += ' ORDER BY difficulty, title';
  res.json({ success: true, data: db.prepare(sql).all(...params) });
  db.close();
});

router.get('/exercises/:id', authenticate, (req, res) => {
  const db = getDb();
  const ex = db.prepare('SELECT * FROM exercises WHERE id=?').get(req.params.id) as any;
  if (!ex) { db.close(); return res.status(404).json({ success: false, error: 'Ejercicio no encontrado' }); }
  res.json({ success: true, data: { ...ex, hints: JSON.parse(ex.hints_json), expectedEntries: JSON.parse(ex.expected_entries_json) } });
  db.close();
});

router.get('/exercises/:id/attempts', authenticate, (req: AuthRequest, res) => {
  const db = getDb();
  const attempts = db.prepare('SELECT * FROM exercise_attempts WHERE exercise_id=? AND user_id=? ORDER BY completed_at DESC').all(req.params.id, req.user!.userId);
  db.close();
  res.json({ success: true, data: attempts });
});

router.post('/exercises/:id/submit', authenticate, (req: AuthRequest, res) => {
  const { entries } = req.body;
  const db = getDb();
  const ex = db.prepare('SELECT * FROM exercises WHERE id=?').get(req.params.id) as any;
  if (!ex) { db.close(); return res.status(404).json({ success: false, error: 'No encontrado' }); }
  // Basic grading: check if entries are balanced
  let score = 0; const feedback: string[] = [];
  if (entries?.length > 0) {
    const totalD = entries.reduce((s: number, e: any) => s + (e.lines||[]).reduce((ls: number, l: any) => ls+(l.debit||0), 0), 0);
    const totalC = entries.reduce((s: number, e: any) => s + (e.lines||[]).reduce((ls: number, l: any) => ls+(l.credit||0), 0), 0);
    if (Math.abs(totalD-totalC) < 0.01) { score += 50; feedback.push('✅ Las pólizas están balanceadas (cargos = abonos)'); }
    else { feedback.push(`❌ Pólizas desbalanceadas: Cargos=${totalD.toFixed(2)}, Abonos=${totalC.toFixed(2)}`); }
    if (entries.length > 0) { score += 30; feedback.push('✅ Se registraron asientos contables'); }
    score = Math.min(score, ex.points);
  } else { feedback.push('❌ No se registraron asientos'); }
  const passed = score >= ex.points * 0.6;
  const result = db.prepare(`INSERT INTO exercise_attempts(exercise_id,user_id,entries_json,score,passed,feedback_json) VALUES(?,?,?,?,?,?)`).run(ex.id,req.user!.userId,JSON.stringify(entries),score,passed?1:0,JSON.stringify(feedback));
  db.close();
  res.json({ success: true, data: { id: result.lastInsertRowid, score, passed, feedback, maxScore: ex.points, explanation: ex.explanation } });
});

router.get('/dashboard/:userId', authenticate, (req: AuthRequest, res) => {
  const userId = req.params.userId === 'me' ? req.user!.userId : Number(req.params.userId);
  const db = getDb();
  const attempts = db.prepare('SELECT ea.*, e.title, e.difficulty, e.points FROM exercise_attempts ea JOIN exercises e ON e.id=ea.exercise_id WHERE ea.user_id=? ORDER BY ea.completed_at DESC').all(userId) as any[];
  const totalScore = attempts.reduce((s,a)=>s+a.score,0);
  const passed = attempts.filter(a=>a.passed).length;
  const entries = db.prepare('SELECT COUNT(*) as c FROM journal_entries WHERE created_by=?').get(userId) as any;
  db.close();
  res.json({ success: true, data: { attempts, stats: { totalAttempts: attempts.length, passed, totalScore, entriesCreated: entries.c } } });
});

export default router;
