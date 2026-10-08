import {
  sendEmail,
  verifySmtpConnection,
  sendDeadlineAlert
} from '../email.js';

export async function getEmailStatusHandler(req, res, next) {
  try {
    const result = await verifySmtpConnection();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function postEmailTestHandler(req, res, next) {
  const { to } = req.body;
  const targetEmail = to || (req.user && req.user.email);

  if (!targetEmail) {
    return res.status(400).json({ error: 'E-mail destinatário não informado.' });
  }

  try {
    const info = await sendEmail({
      to: targetEmail,
      subject: '[PMOC Gestor 360] Teste de Conexão do Serviço de E-mail',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2 style="color: #9f1239;">PMOC Gestor 360 - Boulevard Shopping</h2>
          <p>Este é um e-mail de teste para verificar a integração do serviço SMTP.</p>
          <p><strong>Status:</strong> Serviço de e-mail ativo e operacional!</p>
          <p style="font-size: 12px; color: #64748b;">Enviado por solicitação de: ${req.user ? (req.user.name || req.user.username) : 'Sistema'}</p>
        </div>
      `
    });
    res.json({
      success: true,
      message: `E-mail de teste enviado para ${targetEmail}`,
      messageId: info.messageId
    });
  } catch (err) {
    console.error('[API Email Test Error]:', err.message);
    res.status(500).json({ error: `Falha ao enviar e-mail: ${err.message}` });
  }
}

export async function postDeadlineAlertHandler(req, res, next) {
  const { to, systemName, systemCategory, periodicity, dueDate, daysRemaining, observations } = req.body;

  if (!to || !systemName) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes (to, systemName).' });
  }

  try {
    const info = await sendDeadlineAlert({
      to,
      systemName,
      systemCategory,
      periodicity,
      dueDate,
      daysRemaining,
      observations
    });
    res.json({
      success: true,
      message: `Alerta de prazo enviado com sucesso para ${to}.`,
      messageId: info.messageId
    });
  } catch (err) {
    console.error('[API Deadline Alert Error]:', err.message);
    res.status(500).json({ error: `Falha ao enviar alerta de prazo: ${err.message}` });
  }
}
