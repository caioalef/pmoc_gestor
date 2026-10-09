import { describe, it, expect } from 'vitest';
import { prepareMonthsDataPayload, formatSystemRow } from '../src/services/systems.service.js';

describe('Systems Service - Lógica de Normalização', () => {
  it('deve normalizar anos e meses no formato correto de payload', () => {
    const input = {
      id: 'SYS-01',
      years: {
        '2026': {
          jan: { status: 'OK' }
        }
      },
      months: {
        jan: {
          status: 'OK',
          documents: [
            { id: 'doc-1', name: 'relatorio.pdf', size: 1024, type: 'pdf' }
          ]
        }
      }
    };

    const payloadString = prepareMonthsDataPayload(input);
    const parsed = JSON.parse(payloadString);

    expect(parsed._years).toBeDefined();
    expect(parsed._years['2026'].months).toEqual({ jan: { status: 'OK' } });
    expect(parsed.jan.documents).toHaveLength(1);
    expect(parsed.jan.documents[0].name).toBe('relatorio.pdf');
  });

  it('deve formatar corretamente as linhas do banco com fallback para 2026', () => {
    const dbRow = {
      id: 'SYS-01',
      shopping: 'BSFS',
      category: 'HVAC',
      category_name: 'Ar Condicionado',
      name: 'Chiller 01',
      periodicity: 'Mensal',
      resp_tecnico: 'Eng. Teste',
      na: 0,
      pmoc_status: 'OK',
      pmoc_status_label: 'Conforme',
      standards: 'ABNT',
      description: 'Descricao',
      pmoc_data: JSON.stringify({ attached: true }),
      equipamento_parado: JSON.stringify({ isParado: false }),
      months_data: JSON.stringify({
        _years: {
          '2026': {
            months: {
              jan: { status: 'Executado' }
            }
          }
        }
      })
    };

    const formatted = formatSystemRow(dbRow);

    expect(formatted.id).toBe('SYS-01');
    expect(formatted.name).toBe('Chiller 01');
    expect(formatted.na).toBe(false);
    expect(formatted.pmoc.attached).toBe(true);
    expect(formatted.months.jan.status).toBe('Executado');
    expect(formatted.years['2026'].months.jan.status).toBe('Executado');
  });

  it('deve tratar com segurança registros com months_data corrompido ou vazio', () => {
    const corruptedRow = {
      id: 'SYS-99',
      name: 'Sistema Sem Dados',
      category: 'GERAL',
      category_name: 'Geral',
      periodicity: 'Mensal',
      months_data: '{invalido-json'
    };

    const formatted = formatSystemRow(corruptedRow);

    expect(formatted.id).toBe('SYS-99');
    expect(formatted.months).toEqual({});
    expect(formatted.years).toBeDefined();
  });

  it('deve processar corretamente sistema sys-10 (Teste de hidrantes - Anual Fev) preservando documentos e removendo dataUrl duplicado', () => {
    const sys10Input = {
      id: 'sys-10',
      name: 'Teste de hidrantes (com água)',
      category: 'PREVENÇÃO_CONTRA_INCÊNDIO',
      categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
      periodicity: 'Anual',
      respTecnico: 'Renato Santos',
      pmocStatus: 'NOT_REQUIRED',
      pmocStatusLabel: 'Não exigido',
      years: {
        '2026': {
          months: {
            '2': {
              scheduled: true,
              status: 'DONE',
              date: '2026-02-15',
              documents: [
                {
                  id: 'doc-hidrante-01',
                  name: 'laudo_hidrantes_fev2026.pdf',
                  size: 204800,
                  type: 'application/pdf',
                  uploadedAt: '15/02/2026 14:30',
                  uploadedBy: 'Renato Santos',
                  dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
                }
              ]
            }
          }
        }
      },
      months: {
        '2': {
          scheduled: true,
          status: 'DONE',
          date: '2026-02-15',
          documents: [
            {
              id: 'doc-hidrante-01',
              name: 'laudo_hidrantes_fev2026.pdf',
              size: 204800,
              type: 'application/pdf',
              uploadedAt: '15/02/2026 14:30',
              uploadedBy: 'Renato Santos',
              dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
            }
          ]
        }
      }
    };

    const payloadStr = prepareMonthsDataPayload(sys10Input);
    const parsed = JSON.parse(payloadStr);

    // No nível raiz espelhado (months), o dataUrl pesado é removido para não duplicar espaço
    expect(parsed['2'].documents[0].name).toBe('laudo_hidrantes_fev2026.pdf');
    expect(parsed['2'].documents[0].dataUrl).toBeUndefined();

    // No nível canônico _years, os dados completos e o documento com dataUrl são mantidos com integridade
    expect(parsed._years['2026'].months['2'].documents[0].dataUrl).toBe('data:application/pdf;base64,JVBERi0xLjQKJ...');

    // Verifica que formatSystemRow recupera os dados do ano 2026 perfeitamente
    const row = {
      id: 'sys-10',
      name: 'Teste de hidrantes (com água)',
      category: 'PREVENÇÃO_CONTRA_INCÊNDIO',
      category_name: 'PREVENÇÃO CONTRA INCÊNDIO',
      periodicity: 'Anual',
      resp_tecnico: 'Renato Santos',
      pmoc_status: 'NOT_REQUIRED',
      pmoc_status_label: 'Não exigido',
      na: 0,
      months_data: payloadStr
    };

    const formatted = formatSystemRow(row);
    expect(formatted.id).toBe('sys-10');
    expect(formatted.pmocStatus).toBe('NOT_REQUIRED');
    expect(formatted.periodicity).toBe('Anual');
    expect(formatted.months['2'].status).toBe('DONE');
    expect(formatted.years['2026'].months['2'].documents[0].name).toBe('laudo_hidrantes_fev2026.pdf');
  });
});

