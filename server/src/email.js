import nodemailer from 'nodemailer';

let cachedTransporter = null;

/**
 * Cria ou recupera a instância do transportador SMTP
 */
export function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    return null;
  }

  // Opções de conexão
  const transportOptions = {
    host,
    port,
    secure,
    auth: (user && pass) ? { user, pass } : undefined,
    tls: {
      rejectUnauthorized: process.env.SMTP_IGNORE_TLS_ERROR !== 'true'
    }
  };

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport(transportOptions);
  }

  return cachedTransporter;
}

/**
 * Verifica se o serviço de e-mail está com configurações preenchidas
 */
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST);
}

/**
 * Testa a conexão com o servidor SMTP
 */
export async function verifySmtpConnection() {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return {
      configured: false,
      connected: false,
      message: 'Servidor SMTP não configurado no arquivo .env (SMTP_HOST ausente).'
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      connected: true,
      message: 'Conexão com servidor SMTP estabelecida com sucesso.'
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      message: `Falha ao conectar no servidor SMTP: ${err.message}`
    };
  }
}

/**
 * Envia um e-mail genérico
 */
export async function sendEmail({ to, subject, html, text }) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    throw new Error('Serviço de e-mail não configurado (defina as variáveis SMTP no .env).');
  }

  const from = process.env.SMTP_FROM || '"PMOC Gestor 360" <noreply@boulevardfs.com.br>';

  const mailOptions = {
    from,
    to,
    subject,
    text: text || '',
    html: html || text
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email] Mensagem enviada para ${to}. ID: ${info.messageId}`);
  return info;
}

/**
 * Envia e-mail de alerta de prazo ou pendência de manutenção
 */
export async function sendDeadlineAlert({ to, systemName, systemCategory, periodicity, dueDate, daysRemaining, observations }) {
  const subject = `[PMOC Alerta] Prazo de Manutenção: ${systemName} (${systemCategory || 'Sistema'})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #881337, #9f1239); color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 28px 24px; }
        .alert-box { background: #fff1f2; border-left: 4px solid #e11d48; padding: 14px 18px; border-radius: 6px; margin-bottom: 22px; font-size: 14px; color: #9f1239; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .details-table th, .details-table td { padding: 10px 12px; text-align: left; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
        .details-table th { color: #64748b; font-weight: 600; width: 38%; }
        .details-table td { color: #0f172a; font-weight: 500; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #fee2e2; color: #b91c1c; }
        .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>PMOC GESTOR 360</h1>
          <p>Boulevard Shopping Feira de Santana &bull; Operações Prediais</p>
        </div>
        <div class="body">
          <div class="alert-box">
            <strong>⚠️ Notificação de Prazo de Manutenção Preventiva</strong>
            <p style="margin: 4px 0 0;">Um sistema de manutenção sob monitoramento possui prazo próximo ou pendência de execução.</p>
          </div>

          <table class="details-table">
            <tr>
              <th>Sistema / Ativo:</th>
              <td><strong>${systemName}</strong></td>
            </tr>
            <tr>
              <th>Disciplina / Setor:</th>
              <td>${systemCategory || 'Geral'}</td>
            </tr>
            <tr>
              <th>Periodicidade:</th>
              <td>${periodicity || 'Mensal'}</td>
            </tr>
            ${dueDate ? `<tr><th>Data Prevista / Mês:</th><td>${dueDate}</td></tr>` : ''}
            ${daysRemaining !== undefined ? `<tr><th>Situação do Prazo:</th><td><span class="badge">${daysRemaining} dias restantes</span></td></tr>` : ''}
            ${observations ? `<tr><th>Observações:</th><td>${observations}</td></tr>` : ''}
          </table>

          <p style="font-size: 13px; color: #475569; line-height: 1.5;">
            Por favor, verifique a execução da rotina preventiva e anexe as ordens de serviço / laudos técnicos comprobatórios diretamente no sistema.
          </p>
        </div>
        <div class="footer">
          Mensagem automática enviada pelo PMOC Gestor 360.<br>
          Para acessar a plataforma, utilize a rede interna: <strong>http://10.10.19.4:8081</strong> (ou base de testes).
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
