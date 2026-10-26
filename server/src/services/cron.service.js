import cron from 'node-cron';
import { getPool } from '../db.js';
import { sendEmail } from '../email.js';

/**
 * Função utilitária para formatar data em DD/MM/AAAA
 */
function formatDateBR(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Executa a checagem diária das regras de conformidade e envia relatório consolidado por e-mail
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

  // O mês de competência anterior:
  // Se estamos em Novembro (11), a competência anterior é Outubro (10).
  // Se estamos em Janeiro (1), a competência anterior é Dezembro (12) do ano anterior.
  const prevMonthIndex = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const monthNames = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  console.log(`[Cron Jobs] Iniciando checagem diária de conformidade (${formatDateBR(now)})...`);

  try {
    const [systems] = await pool.query('SELECT * FROM systems WHERE na = FALSE');

    const alertsPendenteApontamento = []; // Regra 1: Chegou dia 06 e não marcou execução
    const alertsPendenteRelatorio = [];   // Regra 2: Chegou dia 16 e não subiu anexo
    const alertsFeitoSemAnexo = [];       // Regra 3: Manutenção marcada como realizada sem anexo
    const alertsMaquinasParadas60d = [];  // Regra 4: Equipamento parado há mais de 60 dias

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

      // Identifica o mapa de meses do ano de competência anterior
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

      // REGRA 1: Chegou o dia 06 e a manutenção do mês anterior não foi apontada/enviada
      if (currentDay >= 6 && wasScheduled) {
        if (status !== 'DONE') {
          alertsPendenteApontamento.push({
            id: row.id,
            name: row.name,
            category: row.category_name || row.category,
            resp: row.resp_tecnico || 'Não informado',
            periodicity: row.periodicity,
            refMonth: `${monthNames[prevMonthIndex]}/${prevMonthYear}`,
            currentStatus: status || 'PROGRAMADO_SEM_APONTAMENTO'
          });
        }
      }

      // REGRA 2: Chegou o dia 16 e o arquivo comprobatório não foi adicionado
      if (currentDay >= 16 && wasScheduled && status === 'DONE' && !hasDocuments) {
        alertsPendenteRelatorio.push({
          id: row.id,
          name: row.name,
          category: row.category_name || row.category,
          resp: row.resp_tecnico || 'Não informado',
          periodicity: row.periodicity,
          refMonth: `${monthNames[prevMonthIndex]}/${prevMonthYear}`,
          doneDate: prevMonthData.date ? formatDateBR(prevMonthData.date) : 'Informada'
        });
      }

      // REGRA 3: Manutenção marcada como Realizada (DONE) em qualquer mês ativo, mas sem relatório anexado
      if (status === 'DONE' && !hasDocuments) {
        alertsFeitoSemAnexo.push({
          id: row.id,
          name: row.name,
          category: row.category_name || row.category,
          resp: row.resp_tecnico || 'Não informado',
          refMonth: `${monthNames[prevMonthIndex]}/${prevMonthYear}`
        });
      }

      // REGRA 4: Equipamento parado há mais de 60 dias
      if (equipamentoParado && equipamentoParado.isParado && equipamentoParado.dataParada) {
        const paradaDate = new Date(equipamentoParado.dataParada);
        if (!isNaN(paradaDate.getTime())) {
          const diffMs = now.getTime() - paradaDate.getTime();
          const diasParado = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diasParado >= 60) {
            alertsMaquinasParadas60d.push({
              id: row.id,
              systemName: row.name,
              category: row.category_name || row.category,
              maquina: equipamentoParado.maquina || 'Equipamento',
              motivo: equipamentoParado.motivo || 'Motivo não informado',
              dataParada: formatDateBR(equipamentoParado.dataParada),
              diasParado: diasParado
            });
          }
        }
      }
    }

    const totalAlertas = alertsPendenteApontamento.length +
                         alertsPendenteRelatorio.length +
                         alertsMaquinasParadas60d.length;

    console.log(`[Cron Jobs] Diagnóstico: ${alertsPendenteApontamento.length} pendentes pós dia 05, ${alertsPendenteRelatorio.length} sem laudo pós dia 15, ${alertsMaquinasParadas60d.length} máquinas >60d.`);

    // Se não houver pendências críticas para notificar, encerra
    if (totalAlertas === 0) {
      console.log('[Cron Jobs] Nenhuma inconformidade encontrada para envio de alertas.');
      return;
    }

    // Monta o Relatório Executivo por E-mail
    const recipientEmail = process.env.ALERT_EMAIL_RECIPIENT || process.env.SMTP_USER || 'operacoes@boulevardfs.com.br';
    const subject = `[PMOC Alerta Diário] ${totalAlertas} pendência(s) de manutenção identificada(s) - Boulevard Shopping`;

    let htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #881337, #9f1239); color: #ffffff; padding: 20px 24px;">
          <h2 style="margin: 0; font-size: 20px;">PMOC Gestor 360 &bull; Relatório Automático de Conformidade</h2>
          <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Varredura realizada em: ${formatDateBR(now)} às 07:00</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #334155;">
            Prezada equipe de Operações e Engenharia,<br>
            O sistema identificou pendências nos prazos regulamentares da Lei 13.589/2018 e do cronograma PMOC:
          </p>
    `;

    // Seção 1: Pós Dia 05 (Manutenções Não Apontadas)
    if (alertsPendenteApontamento.length > 0) {
      htmlBody += `
        <div style="margin-top: 20px; border-left: 4px solid #ef4444; background: #fef2f2; padding: 12px 16px; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #b91c1c; font-size: 15px;">
            ⚠️ Pós Dia 05: Manutenções não apontadas da competência anterior (${monthNames[prevMonthIndex]}/${prevMonthYear})
          </h3>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #7f1d1d;">
            O gestor tem até o dia 05 para registrar a execução. Os seguintes sistemas estão pendentes:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b;">
            ${alertsPendenteApontamento.map(a => `
              <li style="margin-bottom: 4px;">
                <strong>${a.name}</strong> (${a.category}) &bull; Resp: ${a.resp}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Seção 2: Pós Dia 15 (Manutenções Realizadas Sem Relatório / OS Anexada)
    if (alertsPendenteRelatorio.length > 0) {
      htmlBody += `
        <div style="margin-top: 20px; border-left: 4px solid #f59e0b; background: #fffbeb; padding: 12px 16px; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #b45309; font-size: 15px;">
            📑 Pós Dia 15: Manutenções realizadas sem relatório comprobatório anexado (${monthNames[prevMonthIndex]}/${prevMonthYear})
          </h3>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #92400e;">
            A manutenção foi marcada como realizada, porém o prazo de inclusão de OS/laudos expirou em 15/${String(currentMonth).padStart(2, '0')}:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b;">
            ${alertsPendenteRelatorio.map(a => `
              <li style="margin-bottom: 4px;">
                <strong>${a.name}</strong> (${a.category}) &bull; Executado em: ${a.doneDate} &bull; Resp: ${a.resp}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    // Seção 3: Máquinas Paradas Há Mais de 60 Dias
    if (alertsMaquinasParadas60d.length > 0) {
      htmlBody += `
        <div style="margin-top: 20px; border-left: 4px solid #dc2626; background: #fdf2f8; padding: 12px 16px; border-radius: 4px;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px;">
            🚨 Alerta Crítico: Máquinas/Equipamentos parados por mais de 60 dias
          </h3>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #7f1d1d;">
            Equipamentos com paralisação prolongada impactando a operação predial:
          </p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b;">
            ${alertsMaquinasParadas60d.map(m => `
              <li style="margin-bottom: 6px;">
                <strong>${m.maquina}</strong> (${m.systemName} - ${m.category})<br>
                <span style="font-size: 12px; color: #475569;">
                  Parado desde: <strong>${m.dataParada}</strong> (${m.diasParado} dias) &bull; Motivo: ${m.motivo}
                </span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    htmlBody += `
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
            <a href="http://10.10.19.4:8081" style="display: inline-block; background: #881337; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600;">
              Acessar PMOC Gestor 360
            </a>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 12px;">
              Mensagem automática enviada diariamente pelo robô de conformidade PMOC Gestor 360.
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlBody
    });

    console.log(`[Cron Jobs] E-mail de conformidade diária enviado com sucesso para ${recipientEmail}.`);
  } catch (err) {
    console.error('[Cron Jobs Error] Erro ao executar checagem diária:', err.message);
  }
}

/**
 * Inicia os agendamentos do backend
 */
export function initCronJobs() {
  // Roda todos os dias às 07:00 da manhã no horário do servidor
  cron.schedule('0 7 * * *', () => {
    runDailyComplianceChecks();
  }, {
    scheduled: true,
    timezone: 'America/Bahia'
  });

  console.log('[Cron Jobs] Agendador diário ativo: Varredura de conformidade agendada para 07:00 (America/Bahia).');
}
