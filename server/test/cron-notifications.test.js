import { describe, it, expect } from 'vitest';
import { buildEmailHtml, formatDateBR } from '../src/services/cron.service.js';

describe('Cron Service & Templates de E-mail de Notificação', () => {
  it('deve formatar data brasileira corretamente', () => {
    expect(formatDateBR('2026-10-28')).toBe('28/10/2026');
    expect(formatDateBR(null)).toBe('-');
  });

  it('deve construir o HTML sem molduras rígidas e sem linhas tracejadas', () => {
    const html = buildEmailHtml({
      title: '[PMOC Lembrete] Anexo Comprobatório Pendente: Chiller 01',
      greeting: 'Olá, Renato Santos,',
      intro: 'Identificamos no sistema que o anexo da documentação comprobatória referente ao mês de Outubro/2026 ainda não foi inserido.',
      details: {
        'Sistema / Ativo': 'Chiller 01 - Expansão Central',
        'Mês de Competência': 'Outubro/2026',
        'Responsável': 'Renato Santos'
      },
      instruction: 'Para garantir a conformidade legal do shopping perante a Lei Federal 13.589/2018 solicitamos que acesse o sistema e anexe o arquivo comprobatório:',
      note: 'Nota: Esta notificação é enviada como lembrete semanal para acompanhamento do cronograma.'
    });

    // Verifica que não contém as caixas antigas nem tracejados
    expect(html).not.toContain('+----------------');
    expect(html).not.toContain('-----------------');
    expect(html).not.toContain('Aos 60 dias de paralisação contínua, este alerta será escalonado');
    expect(html).toContain('Renato Santos');
    expect(html).toContain('Chiller 01 - Expansão Central');
    expect(html).toContain('Para garantir a conformidade legal do shopping perante a Lei Federal 13.589/2018');
  });

  it('deve exibir o campo Responsável de forma limpa nos detalhes', () => {
    const html = buildEmailHtml({
      title: '[PMOC Notificação] Acompanhamento de Anexo',
      greeting: 'Prezado(a) Gerente de Operações,',
      intro: 'Comunicamos que o sistema abaixo ultrapassou a data limite de tolerância (dia 20) sem a devida inserção do laudo técnico comprobatório ou ART.',
      details: {
        'Sistema': 'Elevador 02',
        'Responsável': 'Marcos Andrade'
      }
    });

    expect(html).toContain('<strong>Responsável:</strong> Marcos Andrade');
    expect(html).not.toContain('Responsável Técnico:');
  });
});
