import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { authenticateToken } from './middlewares/auth.middleware.js';
import { errorHandler } from './middlewares/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import systemsRoutes from './routes/systems.routes.js';
import auditRoutes from './routes/audit.routes.js';
import emailRoutes from './routes/email.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// Middlewares Globais
app.use(cors(config.cors));
app.use(express.json({ limit: config.bodyLimit }));
app.use(express.urlencoded({ limit: config.bodyLimit, extended: true }));
app.use(authenticateToken);

// Registro de Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/systems', systemsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/health', healthRoutes);

// Tratamento Global de Erros
app.use(errorHandler);

export default app;
