import {
  getAuditLogs,
  createAuditLog,
  clearAuditLogs
} from '../services/audit.service.js';

export async function getAuditLogsHandler(req, res, next) {
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function postAuditLogHandler(req, res, next) {
  try {
    const log = req.body;
    if (!log || !log.action) {
      return res.status(400).json({ error: 'Dados de log inválidos.' });
    }

    const result = await createAuditLog(log, req.user);
    res.status(201).json({ success: true, id: result.id });
  } catch (err) {
    next(err);
  }
}

export async function deleteAuditLogsHandler(req, res, next) {
  try {
    await clearAuditLogs();
    res.json({ success: true, message: 'Logs de auditoria limpos com sucesso.' });
  } catch (err) {
    next(err);
  }
}
