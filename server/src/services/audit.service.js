import { getPool } from '../db.js';

export async function getAuditLogs(limit = 200) {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?', [limit]);

  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    user: r.user_email,
    group: r.user_group,
    action: r.action,
    actionType: r.action_type,
    details: r.details
  }));
}

export async function createAuditLog(log, user) {
  const pool = getPool();
  const id = log.id || `log-${Date.now()}`;
  const timestamp = log.timestamp || new Date().toISOString().slice(0, 19).replace('T', ' ');

  await pool.query(
    `INSERT INTO audit_logs (id, timestamp, user_email, user_group, action, action_type, details)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      timestamp,
      log.user || (user && user.email) || 'anonimo@boulevardfs.com.br',
      log.group || (user && (user.roleLabel || user.role)) || 'Operador',
      log.action,
      log.actionType || 'update',
      log.details || ''
    ]
  );

  return { success: true, id };
}

export async function clearAuditLogs() {
  const pool = getPool();
  await pool.query('TRUNCATE TABLE audit_logs');
  return { success: true };
}
