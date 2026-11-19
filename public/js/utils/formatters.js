/**
 * Utilitários de formatação e cálculo do PMOC Gestor 360
 */

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function calculateComplianceMetrics(systems = [], year = '2026') {
  if (!Array.isArray(systems) || systems.length === 0) {
    return { total: 0, compliant: 0, pending: 0, notRequired: 0, percentage: 0 };
  }

  let total = systems.length;
  let compliant = 0;
  let pending = 0;
  let notRequired = 0;

  systems.forEach(sys => {
    const status = sys.pmocStatus;
    if (status === 'COMPLIANT' || (sys.pmoc && sys.pmoc.attached)) {
      compliant++;
    } else if (status === 'PENDING') {
      pending++;
    } else {
      notRequired++;
    }
  });

  const applicable = total - notRequired;
  const percentage = applicable > 0 ? Math.round((compliant / applicable) * 100) : 100;

  return { total, compliant, pending, notRequired, percentage };
}

/**
 * Dedução de periodicidade a partir da lista de números de meses selecionados (1..12).
 * Retorna { label: string, category: 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual' | 'Personalizado' | 'Nenhum' }
 */
export function derivePeriodicityFromMonths(monthNumbers = []) {
  const sorted = Array.from(new Set(monthNumbers.map(Number)))
    .filter(m => m >= 1 && m <= 12)
    .sort((a, b) => a - b);

  const count = sorted.length;
  const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  if (count === 0) {
    return {
      label: 'Não programado',
      category: 'Nenhum',
      count: 0,
      months: []
    };
  }

  if (count === 12) {
    return {
      label: 'Mensal',
      category: 'Mensal',
      count: 12,
      months: sorted
    };
  }

  const strJoined = sorted.join(',');

  // Padrões regulares típicos
  if (count === 6 && strJoined === '2,4,6,8,10,12') {
    return { label: 'Bimestral', category: 'Bimestral', count: 6, months: sorted };
  }
  if (count === 4 && strJoined === '3,6,9,12') {
    return { label: 'Trimestral', category: 'Trimestral', count: 4, months: sorted };
  }
  if (count === 2 && strJoined === '6,12') {
    return { label: 'Semestral', category: 'Semestral', count: 2, months: sorted };
  }
  if (count === 1) {
    const mName = monthNames[sorted[0]];
    return { label: `Anual (${mName})`, category: 'Anual', count: 1, months: sorted };
  }

  // Combinações genéricas com contagem de vezes ao ano e listagem dos meses
  const abbr = sorted.map(m => monthNames[m]).join(', ');
  let category = 'Personalizado';
  if (count === 6) category = 'Bimestral';
  else if (count === 4) category = 'Trimestral';
  else if (count === 2) category = 'Semestral';
  else if (count === 1) category = 'Anual';

  return {
    label: `${abbr}`,
    category,
    count,
    months: sorted
  };
}
