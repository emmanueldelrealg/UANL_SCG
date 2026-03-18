import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'scg.db');

export function auditLog(module: string, action: string, entityType: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (res.statusCode < 400 && req.user) {
        try {
          const db = new Database(DB_PATH);
          db.prepare(`INSERT INTO audit_logs(user_id,action,module,entity_type,entity_id,ip_address) VALUES(?,?,?,?,?,?)`)
            .run(req.user.userId, action, module, entityType, data?.data?.id || null, req.ip);
          db.close();
        } catch (_) {}
      }
      return originalJson(data);
    };
    next();
  };
}
