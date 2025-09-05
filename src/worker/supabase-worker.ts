import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './utils';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import activityRoutes from './routes/activities';
import kpiRoutes from './routes/kpis';
import calculatorRoutes from './routes/calculator';
import lancamentoRoutes from './routes/lancamentos';
import wmsTaskRoutes from './routes/wms-tasks';
import monthlyEarningsRoutes from './routes/monthly-earnings';
import historicoAprovacoesRoutes from './routes/historico-aprovacoes';
import colaboradoresRoutes from './routes/colaboradores';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors());

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/usuarios', userRoutes);
app.route('/api', activityRoutes);
app.route('/api', kpiRoutes);
app.route('/api', calculatorRoutes);
app.route('/api', lancamentoRoutes);
app.route('/api/wms-tasks', wmsTaskRoutes);
app.route('/api', monthlyEarningsRoutes);
app.route('/api', historicoAprovacoesRoutes);
app.route('/api/colaboradores', colaboradoresRoutes);
app.route('/api', colaboradoresRoutes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;