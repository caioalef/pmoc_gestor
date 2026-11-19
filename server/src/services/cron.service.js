import cron from 'node-cron';
import { getPool } from '../db.js';
import { sendEmail } from '../email.js';
import {
  getManagerInfo,
  findResponsibleByNameOrId
} from './responsibles.service.js';
import crypto from 'crypto';

/**
 * Formata data em DD/MM/AAAA tratando UTC ou timezone local
 */
export function formatDateBR(date) {
  if (!date) return '-';
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = date.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

/**
 * Verifica se já se passaram 7 dias corridos desde o último envio para esta mesma pendência
 */
export async function shouldSendWeeklyNotification(systemId, alertType, refCompetencia) {
  const pool = getPool();
  if (!pool) return true;

  const [rows] = await pool.query(`
    SELECT last_sent_at FROM notification_history
    WHERE system_id = ? AND alert_type = ? AND ref_competencia = ?
    ORDER BY last_sent_at DESC LIMIT 1
  `, [systemId, alertType, refCompetencia]);

  if (rows.length === 0) {
    return true; // Primeiro envio
  }

  const lastSent = new Date(rows[0].last_sent_at);
  const now = new Date();
  const diffMs = now.getTime() - lastSent.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 7; // Reenvio a cada 7 dias corridos
}

/**
 * Registra o envio da notificação para controle dos 7 dias
 */
export async function recordNotificationSent(systemId, alertType, refCompetencia, recipientEmail) {
  const pool = getPool();
  if (!pool) return;

  const id = `notif-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date();
  await pool.query(`
    INSERT INTO notification_history (id, system_id, alert_type, ref_competencia, recipient_email, last_sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, systemId, alertType, refCompetencia, recipientEmail, now]);
}

/**
 * Modelos de E-mail HTML amigáveis, sem molduras rígidas e sem divisórias
 */
export function buildEmailHtml({ title, greeting, intro, details, instruction, note, buttonText, buttonUrl }) {
  const appUrl = buttonUrl || process.env.APP_URL || 'http://10.10.19.4:8081';

  const detailsList = Object.entries(details).map(([key, val]) => `
    <li style="margin-bottom: 6px; font-size: 14px; color: #1e293b;">
      <strong>${key}:</strong> ${val}
    </li>
  `).join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px 20px; color: #1e293b; line-height: 1.6;">
      <h2 style="color: #881337; font-size: 19px; margin-top: 0; margin-bottom: 16px;">${title}</h2>
      
      <p style="font-size: 14px; margin-bottom: 14px;">${greeting}</p>
      
      <p style="font-size: 14px; margin-bottom: 16px;">${intro}</p>
      
      <div style="margin: 18px 0; background-color: #f8fafc; padding: 16px; border-radius: 8px;">
        <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">
          DETALHES DO SISTEMA
        </span>
        <ul style="list-style-type: none; padding-left: 0; margin: 0;">
          ${detailsList}
        </ul>
      </div>

      ${instruction ? `
        <div style="margin: 18px 0;">
          <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
            INSTRUÇÃO OPERACIONAL
          </span>
          <p style="font-size: 14px; margin: 0;">${instruction}</p>
        </div>
      ` : ''}

      <div style="margin: 26px 0 20px 0;">
        <a href="${appUrl}" style="display: inline-block; background-color: #881337; color: #ffffff; text-decoration: none; padding: 11px 22px; border-radius: 6px; font-size: 13px; font-weight: 600;">
          ${buttonText || 'Acessar PMOC Gestor 360'} &rarr;
        </a>
      </div>

      ${note ? `
        <p style="font-size: 12px; color: #64748b; font-style: italic; margin-top: 24px;">
          ${note}
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Executa a checagem diária das regras de conformidade e envia os e-mails
 */
export async function runDailyComplianceChecks() {
  const pool = getPool();
  if (!pool) {
    console.warn('[Cron Jobs] Pool do MariaDB indisponível. Abortando checagem diária.');
    return;
  }

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Competência anterior (ex: se hoje é Novembro, a competência é Outubro)
  const prevMonthIndex = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const monthNames = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const competenciaStr = `${monthNames[prevMonthIndex]}/${prevMonthYear}`;

  console.log(`[Cron Jobs] Iniciando checagem diária de conformidade (${formatDateBR(now)} às 09:00)...`);

  // Busca dados do Gerente
  const manager = await getManagerInfo();
  const managerEmail = (manager && manager.email) || process.env.ALERT_EMAIL_GERENTE || null;

  try {
    const [systems] = await pool.query('SELECT * FROM systems WHERE na = FALSE');

    for (const row of systems) {
      let monthsData = {};
      let equipamentoParado = {};

      try {
        monthsData = typeof row.months_data === 'string' ? JSON.parse(row.months_data) : (row.months_data || {});
      } catch (e) {
        monthsData = {};
      }

      try {
        equipamentoParado = typeof row.equipamento_parado === 'string' ? JSON.parse(row.equipamento_parado) : (row.equipamento_parado || {});
      } catch (e) {
        equipamentoParado = {};
      }

      // Descobre o responsável cadastrado
      const respName = row.resp_tecnico || 'Não informado';
      const respObj = await findResponsibleByNameOrId(respName);
      const respEmail = (respObj && respObj.email) || process.env.ALERT_EMAIL_RESPONSAVEIS || null;

      // Análise dos meses da competência anterior
      const yearsData = monthsData._years || monthsData.years || null;
      let targetYearMonths = monthsData;
      if (yearsData && yearsData[String(prevMonthYear)] && yearsData[String(prevMonthYear)].months) {
        targetYearMonths = yearsData[String(prevMonthYear)].months;
      }

      const prevMonthData = targetYearMonths[String(prevMonthIndex)] || {};
      const wasScheduled = Boolean(prevMonthData.scheduled);
      const status = prevMonthData.status;
      const documents = Array.isArray(prevMonthData.documents) ? prevMonthData.documents : [];
      const hasDocuments = documents.length > 0;

      // ========================================================================
      // SITUAÇÃO 1: Dia 16 em diante — Alerta ao Responsável (Anexo pendente)
      // ========================================================================
      if (currentDay >= 16 && wasScheduled && !hasDocuments) {
        const alertType = 'PENDENCIA_ANEXO_RESPONSAVEL';
        const shouldSend = await shouldWeeklyNotification(row.id, alertType, competenciaStr);

        if (shouldSend && respEmail) {
          const html = buildEmailHtml({
            title: `[PMOC Lembrete] Anexo Comprobatório Pendente: ${row.name}`,
            greeting: `Olá, ${respName},`,
            intro: `Identificamos no sistema que o anexo da documentação comprobatória (Laudo Técnico, Relatório Fotográfico ou Ordem de Serviço) referente ao mês de ${competenciaStr} ainda não foi inserido.`,
            details: {
              'Sistema / Ativo': row.name,
              'Disciplina / Setor': row.category_name || row.category,
              'Mês de Competência': competenciaStr,
              'Status Apontado': status === 'DONE' ? `Realizado em ${formatDateBR(prevMonthData.date)}` : 'Pendente de apontamento',
              'Documentação': 'Pendente de Anexo'
            },
            instruction: 'Para garantir a conformidade legal do shopping perante a Lei Federal 13.589/2018 solicitamos que acesse o sistema e anexe o arquivo comprobatório:',
            buttonText: 'Clique aqui para anexar o arquivo no PMOC Gestor 360',
            note: 'Nota: Esta notificação é enviada como lembrete semanal para acompanhamento do cronograma.'
          });

          try {
            await sendEmail({
              to: respEmail,
              subject: `[PMOC Lembrete] Anexo Comprobatório Pendente: ${row.name} (${competenciaStr})`,
              html
            });
            await recordNotificationSent(row.id, alertType, competenciaStr, respEmail);
            console.log(`[Cron Jobs] Lembrete do dia 16 enviado para ${respEmail} (Sistema: ${row.name})`);
          } catch (err) {
            console.error(`[Cron Jobs Error] Falha ao enviar para ${respEmail}:`, err.message);
          }
        }
      }

      // ========================================================================
      // SITUAÇÃO 2: Dia 20 em diante — Notificação ao Gerente de Operações
      // ========================================================================
      if (currentDay >= 20 && wasScheduled && !hasDocuments) {
        const alertType = 'PENDENCIA_ANEXO_GERENTE';
        const shouldSend = await shouldWeeklyNotification(row.id, alertType, competenciaStr);

        if (shouldSend && managerEmail) {
          const html = buildEmailHtml({
            title: `[PMOC Notificação] Acompanhamento de Anexo: ${row.name}`,
            greeting: 'Prezado(a) Gerente de Operações,',
            intro: 'Comunicamos que o sistema abaixo ultrapassou a data limite de tolerância (dia 20) sem a devida inserção do laudo técnico comprobatório ou ART.',
            details: {
              'Sistema': row.name,
              'Disciplina': row.category_name || row.category,
              'Responsável': respName,
              'Competência': `${competenciaStr} (${status === 'DONE' ? `Apontado como realizado em ${formatDateBR(prevMonthData.date)}` : 'Não apontado'})`,
              'Situação Atual': 'Pendente de anexo comprobatório'
            },
            buttonText: 'Acessar Painel de Controle do PMOC Gestor 360',
            note: 'Mensagem automática de acompanhamento enviada semanalmente para controle das rotinas.'
          });

          try {
            await sendEmail({
              to: managerEmail,
              cc: respEmail || undefined,
              subject: `[PMOC Notificação] Acompanhamento de Anexo: ${row.name}`,
              html
            });
            await recordNotificationSent(row.id, alertType, competenciaStr, managerEmail);
            console.log(`[Cron Jobs] Notificação do dia 20 enviada para Gerente: ${managerEmail} (Sistema: ${row.name})`);
          } catch (err) {
            console.error(`[Cron Jobs Error] Falha ao enviar para gerente:`, err.message);
          }
        }
      }

      // ========================================================================
      // SITUAÇÃO 3 & 4: Máquina Parada (>= 30 dias para Resp / >= 60 dias para Gerente)
      // ========================================================================
      if (equipamentoParado && equipamentoParado.isParado && equipamentoParado.dataParada) {
        const paradaDate = new Date(equipamentoParado.dataParada);
        if (!isNaN(paradaDate.getTime())) {
          const diffMs = now.getTime() - paradaDate.getTime();
          const diasParado = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const maquinaNome = equipamentoParado.maquina || row.name;
          const refParada = `parada-${equipamentoParado.dataParada}`;

          // Situação 3: >= 30 dias -> Lembrete ao Responsável
          if (diasParado >= 30) {
            const alertType = 'MAQUINA_PARADA_RESPONSAVEL';
            const shouldSend = await shouldWeeklyNotification(row.id, alertType, refParada);

            if (shouldSend && respEmail) {
              const html = buildEmailHtml({
                title: `[Acompanhamento Operacional] Máquina Parada há ${diasParado} dias: ${maquinaNome}`,
                greeting: `Olá, ${respName},`,
                intro: `O equipamento abaixo completou ${diasParado} dias em status de Parada no monitoramento do shopping.`,
                details: {
                  'Equipamento / Máquina': maquinaNome,
                  'Sistema Pertencente': `${row.name} (${row.category_name || row.category})`,
                  'Data da Paralisação': `${formatDateBR(equipamentoParado.dataParada)} (${diasParado} dias)`,
                  'Motivo Registrado': equipamentoParado.motivo || 'Motivo não informado',
                  'Previsão Registrada': equipamentoParado.previsaoRetorno ? formatDateBR(equipamentoParado.previsaoRetorno) : 'Não informada'
                },
                instruction: '1. Caso o equipamento já tenha retornado à operação, favor acessar o sistema e atualizar o status para operacional.<br>2. Caso permaneça inoperante, solicitamos atualizar a data de previsão de retorno e as observações no sistema.',
                buttonText: 'Atualizar Status do Equipamento no Sistema',
                note: 'Mensagem automática de acompanhamento enviada semanalmente para controle das rotinas.'
              });

              try {
                await sendEmail({
                  to: respEmail,
                  subject: `[Acompanhamento Operacional] Máquina Parada há ${diasParado} dias: ${maquinaNome}`,
                  html
                });
                await recordNotificationSent(row.id, alertType, refParada, respEmail);
                console.log(`[Cron Jobs] Alerta Máquina Parada (>30d) enviado para ${respEmail} (${maquinaNome})`);
              } catch (err) {
                console.error(`[Cron Jobs Error] Falha ao enviar para ${respEmail}:`, err.message);
              }
            }
          }

          // Situação 4: >= 60 dias -> Notificação ao Gerente
          if (diasParado >= 60) {
            const alertType = 'MAQUINA_PARADA_GERENTE';
            const shouldSend = await shouldWeeklyNotification(row.id, alertType, refParada);

            if (shouldSend && managerEmail) {
              const html = buildEmailHtml({
                title: `[Acompanhamento Operacional] Equipamento parado há ${diasParado} dias: ${maquinaNome}`,
                greeting: 'Prezado(a) Gerente de Operações,',
                intro: `Encaminhamos o status de acompanhamento do ativo operacional que atingiu ${diasParado} dias de paralisação:`,
                details: {
                  'Máquina Parada': maquinaNome,
                  'Setor / Local': `${row.name} (${row.category_name || row.category})`,
                  'Data da Parada': `${formatDateBR(equipamentoParado.dataParada)} (${diasParado} dias)`,
                  'Responsável': respName,
                  'Causa Informada': equipamentoParado.motivo || 'Não detalhada',
                  'Previsão Registrada': equipamentoParado.previsaoRetorno ? formatDateBR(equipamentoParado.previsaoRetorno) : 'Sem previsão definida'
                },
                buttonText: 'Abrir Ficha do Ativo no PMOC Gestor 360',
                note: 'Mensagem automática de acompanhamento enviada semanalmente para controle das rotinas.'
              });

              try {
                await sendEmail({
                  to: managerEmail,
                  cc: respEmail || undefined,
                  subject: `[Acompanhamento Operacional] Equipamento parado há ${diasParado} dias: ${maquinaNome}`,
                  html
                });
                await recordNotificationSent(row.id, alertType, refParada, managerEmail);
                console.log(`[Cron Jobs] Notificação Máquina Parada (>60d) enviada para Gerente: ${managerEmail}`);
              } catch (err) {
                console.error(`[Cron Jobs Error] Falha ao enviar para gerente:`, err.message);
              }
            }
          }
        }
      }
    }

    console.log('[Cron Jobs] Varredura diária das 09:00 finalizada com sucesso.');
  } catch (err) {
    console.error('[Cron Jobs Error] Erro ao executar checagem diária:', err.message);
  }
}

/**
 * Inicia os agendamentos do backend às 09:00 da manhã
 */
export function initCronJobs() {
  // Roda todos os dias pontualmente às 09:00 no horário de Salvador / Feira de Santana
  cron.schedule('0 9 * * *', () => {
    runDailyComplianceChecks();
  }, {
    scheduled: true,
    timezone: 'America/Bahia'
  });

  console.log('[Cron Jobs] Agendador ativo: Varredura programada para as 09:00 (America/Bahia) com recorrência semanal (7 dias).');
}

// Aliases para manter compatibilidade
export const shouldWeeklyNotification = shouldSendWeeklyNotification;
