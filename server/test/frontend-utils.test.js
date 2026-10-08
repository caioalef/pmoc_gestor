import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatFileSize, calculateComplianceMetrics } from '../../public/js/utils/formatters.js';
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
});
