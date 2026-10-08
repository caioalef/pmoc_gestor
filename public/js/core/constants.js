/**
 * Constantes globais e definições de domínio do PMOC Gestor 360
 */
export const MONTHS = [
  { key: 'jan', label: 'Janeiro', short: 'JAN' },
  { key: 'fev', label: 'Fevereiro', short: 'FEV' },
  { key: 'mar', label: 'Março', short: 'MAR' },
  { key: 'abr', label: 'Abril', short: 'ABR' },
  { key: 'mai', label: 'Maio', short: 'MAI' },
  { key: 'jun', label: 'Junho', short: 'JUN' },
  { key: 'jul', label: 'Julho', short: 'JUL' },
  { key: 'ago', label: 'Agosto', short: 'AGO' },
  { key: 'set', label: 'Setembro', short: 'SET' },
  { key: 'out', label: 'Outubro', short: 'OUT' },
  { key: 'nov', label: 'Novembro', short: 'NOV' },
  { key: 'dez', label: 'Dezembro', short: 'DEZ' }
];

export const STATUS_TYPES = {
  EXECUTED: { key: 'Executado', label: 'Executado', className: 'status-done', color: '#10b981' },
  ATTENTION: { key: 'Atencao', label: 'Atenção', className: 'status-attention', color: '#0284c7' },
  SCHEDULED: { key: 'Programado', label: 'Programado', className: 'status-scheduled', color: '#f59e0b' },
  UNREALIZED: { key: 'NaoRealizado', label: 'Não Realizado', className: 'status-unrealized', color: '#ef4444' }
};

export const PMOC_STATUSES = {
  COMPLIANT: { key: 'COMPLIANT', label: 'Em Conformidade (PMOC/ART Anexado)', color: '#10b981' },
  PENDING: { key: 'PENDING', label: 'Pendente de Documentação', color: '#ef4444' },
  NOT_REQUIRED: { key: 'NOT_REQUIRED', label: 'Não Requer PMOC', color: '#64748b' }
};

export const DEFAULT_YEAR = '2026';
export const AVAILABLE_YEARS = ['2025', '2026', '2027', '2028'];
