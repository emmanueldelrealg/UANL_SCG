import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './db/index';
import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';
import entryRoutes from './routes/entries';
import budgetRoutes from './routes/budget';
import reportsRoutes from './routes/reports';
import inventoryRoutes from './routes/inventory';
import debtRoutes from './routes/debt';
import educationalRoutes from './routes/educational';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Init DB
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/debt', debtRoutes);
app.use('/api/educational', educationalRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', system: 'SCG-UANL' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🏛️  SCG-UANL Backend corriendo en http://localhost:${PORT}`);
  console.log(`📊  API disponible en http://localhost:${PORT}/api`);
  console.log(`💾  Base de datos: ${process.env.DATABASE_URL || path.join(process.cwd(), 'data/scg.db')}\n`);
});

export default app;
