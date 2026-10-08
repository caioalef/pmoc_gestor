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
