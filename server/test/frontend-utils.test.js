import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatFileSize, calculateComplianceMetrics, derivePeriodicityFromMonths } from '../../public/js/utils/formatters.js';
import { MONTHS, STATUS_TYPES, PMOC_STATUSES } from '../../public/js/core/constants.js';

describe('Frontend Utils & Constantes de Domínio', () => {
  it('deve ter os 12 meses do ano cadastrados corretamente', () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[0].key).toBe('jan');
    expect(MONTHS[11].key).toBe('dez');
  });

  it('deve formatar datas para o padrão brasileiro DD/MM/AAAA', () => {
    expect(formatDate('2026-10-08T12:00:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatDate(null)).toBe('-');
    expect(formatDate('')).toBe('-');
  });

  it('deve formatar data e hora para o padrão brasileiro', () => {
    const formatted = formatDateTime('2026-10-08T15:30:00Z');
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatDateTime(null)).toBe('-');
  });

  it('deve formatar tamanhos de arquivo em B, KB e MB', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1048576 * 5)).toBe('5 MB');
  });

  it('deve calcular métricas de conformidade PMOC/ART com precisão', () => {
    const mockSystems = [
      { id: 'SYS-1', pmocStatus: 'COMPLIANT', na: false, pmoc: { attached: true } },
      { id: 'SYS-2', pmocStatus: 'PENDING', na: false, pmoc: { attached: false } },
      { id: 'SYS-3', pmocStatus: 'NOT_REQUIRED', na: true, pmoc: { attached: false } },
      { id: 'SYS-4', pmocStatus: 'COMPLIANT', na: false, pmoc: { attached: true } }
    ];

    const metrics = calculateComplianceMetrics(mockSystems, '2026');

    expect(metrics.total).toBe(4);
    expect(metrics.compliant).toBe(2);
    expect(metrics.pending).toBe(1);
    expect(metrics.notRequired).toBe(1);
    // Aplicáveis = 3 (SYS-1, SYS-2, SYS-4). Conformes = 2. % = 2 / 3 * 100 = 67%
    expect(metrics.percentage).toBe(67);
  });

  describe('Dedução de Periodicidade por Meses Selecionados (Opção A)', () => {
    it('deve classificar 12 meses como Mensal', () => {
      const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const res = derivePeriodicityFromMonths(allMonths);
      expect(res.category).toBe('Mensal');
      expect(res.label).toBe('Mensal');
      expect(res.count).toBe(12);
    });

    it('deve classificar meses regulares como Bimestral, Trimestral e Semestral', () => {
      const bi = derivePeriodicityFromMonths([2, 4, 6, 8, 10, 12]);
      expect(bi.category).toBe('Bimestral');
      expect(bi.label).toBe('Bimestral');

      const tri = derivePeriodicityFromMonths([3, 6, 9, 12]);
      expect(tri.category).toBe('Trimestral');
      expect(tri.label).toBe('Trimestral');

      const sem = derivePeriodicityFromMonths([6, 12]);
      expect(sem.category).toBe('Semestral');
      expect(sem.label).toBe('Semestral');
    });

    it('deve classificar 1 único mês como Anual com o mês indicado', () => {
      const anualFev = derivePeriodicityFromMonths([2]);
      expect(anualFev.category).toBe('Anual');
      expect(anualFev.label).toBe('Anual (Fev)');

      const anualDez = derivePeriodicityFromMonths([12]);
      expect(anualDez.category).toBe('Anual');
      expect(anualDez.label).toBe('Anual (Dez)');
    });

    it('deve tratar combinações personalizadas informando os meses', () => {
      const custom = derivePeriodicityFromMonths([3, 7, 11]);
      expect(custom.count).toBe(3);
      expect(custom.label).toBe('Mar, Jul, Nov');
      expect(custom.category).toBe('Personalizado');
    });

    it('deve retornar Não programado para lista vazia', () => {
      const none = derivePeriodicityFromMonths([]);
      expect(none.category).toBe('Nenhum');
      expect(none.label).toBe('Não programado');
    });
  });
});
