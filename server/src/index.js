import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { getPool, initDatabase } from './db.js';
import { authenticateWithAD } from './ldap.js';
import { checkAndSeedDatabase } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pmoc_secret_boulevard_2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware de Autenticação JWT opcional
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
}

app.use(authenticateToken);

/* ==========================================================================
   Rotas de Autenticação (Active Directory / LDAP)
   ========================================================================== */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    const result = await authenticateWithAD(username, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    const token = jwt.sign(result.user, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      success: true,
      token,
      user: result.user
    });
  } catch (err) {
    console.error('[Auth Route Error]:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao autenticar no servidor AD.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Não autenticado.' });
  }
  res.json({ success: true, user: req.user });
});

/* ==========================================================================
   Rotas de Sistemas e Cronograma (MariaDB)
   ========================================================================== */
app.get('/api/systems', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM systems ORDER BY category, id');

    const formatted = rows.map(r => ({
      id: r.id,
      shopping: r.shopping || 'BSFS',
      programacao: r.programacao || 'Finalizada',
      category: r.category,
      categoryName: r.category_name,
      name: r.name,
      periodicity: r.periodicity,
      respTecnico: r.resp_tecnico,
      na: Boolean(r.na),
      pmocStatus: r.pmoc_status || 'NOT_REQUIRED',
      pmocStatusLabel: r.pmoc_status_label || '',
      standards: r.standards,
      description: r.description,
      pmoc: typeof r.pmoc_data === 'string' ? JSON.parse(r.pmoc_data) : (r.pmoc_data || { attached: false }),
      equipamentoParado: typeof r.equipamento_parado === 'string' ? JSON.parse(r.equipamento_parado) : (r.equipamento_parado || { isParado: false, dataParada: null }),
      months: typeof r.months_data === 'string' ? JSON.parse(r.months_data) : (r.months_data || {})
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[API Systems GET Error]:', err.message);
    res.status(500).json({ error: 'Erro ao buscar sistemas no MariaDB.' });
  }
});

app.put('/api/systems', async (req, res) => {
  const systems = req.body;
  if (!Array.isArray(systems)) {
    return res.status(400).json({ error: 'Formato inválido. Esperado um array de sistemas.' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const sys of systems) {
      await conn.query(
        `INSERT INTO systems 
         (id, shopping, programacao, category, category_name, name, periodicity, resp_tecnico, na, pmoc_status, pmoc_status_label, standards, description, pmoc_data, equipamento_parado, months_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           shopping = VALUES(shopping),
           programacao = VALUES(programacao),
           category = VALUES(category),
           category_name = VALUES(category_name),
           name = VALUES(name),
           periodicity = VALUES(periodicity),
           resp_tecnico = VALUES(resp_tecnico),
           na = VALUES(na),
           pmoc_status = VALUES(pmoc_status),
           pmoc_status_label = VALUES(pmoc_status_label),
           standards = VALUES(standards),
           description = VALUES(description),
           pmoc_data = VALUES(pmoc_data),
           equipamento_parado = VALUES(equipamento_parado),
           months_data = VALUES(months_data)`,
        [
          sys.id,
          sys.shopping || 'BSFS',
          sys.programacao || 'Finalizada',
          sys.category || 'GERAL',
          sys.categoryName || sys.category || 'GERAL',
          sys.name,
          sys.periodicity || 'Mensal',
          sys.respTecnico || '',
          Boolean(sys.na),
          sys.pmocStatus || 'NOT_REQUIRED',
          sys.pmocStatusLabel || '',
          sys.standards || '',
          sys.description || '',
          JSON.stringify(sys.pmoc || { attached: false }),
          JSON.stringify(sys.equipamentoParado || { isParado: false, dataParada: null }),
          JSON.stringify(sys.months || {})
        ]
      );
    }

    await conn.commit();
    res.json({ success: true, message: `${systems.length} sistemas sincronizados no MariaDB.` });
  } catch (err) {
    await conn.rollback();
    console.error('[API Systems PUT Error]:', err.message);
    res.status(500).json({ error: 'Erro ao salvar sistemas no MariaDB: ' + err.message });
  } finally {
    conn.release();
  }
});

app.delete('/api/systems/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    await pool.query('DELETE FROM systems WHERE id = ?', [id]);
    res.json({ success: true, message: `Sistema ${id} excluído com sucesso.` });
  } catch (err) {
    console.error('[API Systems DELETE Error]:', err.message);
    res.status(500).json({ error: 'Erro ao excluir sistema no MariaDB.' });
  }
});

/* ==========================================================================
   Rotas de Auditoria (MariaDB)
   ========================================================================== */
app.get('/api/audit-logs', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');

    const formatted = rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      user: r.user_email,
      group: r.user_group,
      action: r.action,
      actionType: r.action_type,
      details: r.details
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[API Audit GET Error]:', err.message);
    res.status(500).json({ error: 'Erro ao buscar logs de auditoria no MariaDB.' });
  }
});

app.post('/api/audit-logs', async (req, res) => {
  const log = req.body;
  if (!log || !log.action) {
    return res.status(400).json({ error: 'Dados de log inválidos.' });
  }

  try {
    const pool = getPool();
    const id = log.id || `log-${Date.now()}`;
    const timestamp = log.timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, user_email, user_group, action, action_type, details)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        timestamp,
        log.user || 'anonimo@boulevardfs.com.br',
        log.group || 'BSFS_OPE_SYSUSER',
        log.action,
        log.actionType || 'update',
        log.details || ''
      ]
    );

    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('[API Audit POST Error]:', err.message);
    res.status(500).json({ error: 'Erro ao salvar log de auditoria no MariaDB.' });
  }
});

app.delete('/api/audit-logs', async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('TRUNCATE TABLE audit_logs');
    res.json({ success: true, message: 'Logs de auditoria limpos com sucesso.' });
  } catch (err) {
    console.error('[API Audit DELETE Error]:', err.message);
    res.status(500).json({ error: 'Erro ao limpar logs de auditoria no MariaDB.' });
  }
});

/* ==========================================================================
   Healthcheck & Status
   ========================================================================== */
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    mariaDB: dbStatus,
    activeDirectory: {
      host: process.env.AD_HOST || '10.10.19.2',
      port: process.env.AD_PORT || 389,
      domain: process.env.AD_DOMAIN || 'BSFS.LOCAL',
      userGroup: process.env.AD_USER_GROUP || 'BSFS_OPE_SYSUSER',
      adminGroup: process.env.AD_ADMIN_GROUP || 'BSFS_OPE_SYSADMIN'
    }
  });
});

/* ==========================================================================
   Inicialização com Retry para o MariaDB
   ========================================================================== */
async function startServer() {
  let connected = false;
  let attempts = 0;
  const maxAttempts = 20;

  console.log('[API] Aguardando conexão com o MariaDB...');
  while (!connected && attempts < maxAttempts) {
    try {
      attempts++;
      await initDatabase();
      await checkAndSeedDatabase();
      connected = true;
      console.log('[API] Conectado ao MariaDB com sucesso.');
    } catch (err) {
      console.warn(`[API] Tentativa ${attempts}/${maxAttempts} falhou (${err.message}). Tentando novamente em 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (!connected) {
    console.error('[API] Falha crítica: não foi possível conectar ao MariaDB após várias tentativas.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[API] Servidor backend ativo na porta ${PORT}`);
  });
}

startServer();
