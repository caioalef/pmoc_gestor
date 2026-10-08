import { getPool } from '../db.js';

export function prepareMonthsDataPayload(sys) {
  let years = sys.years || null;
  const rawMonths = typeof sys.months === 'object' && sys.months !== null ? sys.months : {};

  // Normaliza anos para garantir estrutura consistente { [ano]: { months: { ... } } }
  if (years && typeof years === 'object') {
    const normYears = {};
    Object.entries(years).forEach(([yrKey, yrVal]) => {
      if (yrVal && typeof yrVal === 'object') {
        if (yrVal.months && typeof yrVal.months === 'object') {
          normYears[yrKey] = yrVal;
        } else {
          normYears[yrKey] = { months: yrVal };
        }
      }
    });
    years = normYears;
  }

  let lightMonths = rawMonths;
  if (years && (years['2026'] || Object.keys(years).length > 0)) {
    lightMonths = {};
    Object.entries(rawMonths).forEach(([mKey, mVal]) => {
      if (mKey === '_years' || mKey === 'years') return;
      if (mVal && Array.isArray(mVal.documents)) {
        lightMonths[mKey] = {
          ...mVal,
          documents: mVal.documents.map(d => ({
            id: d.id,
            name: d.name,
            size: d.size,
            type: d.type,
            uploadedAt: d.uploadedAt,
            uploadedBy: d.uploadedBy
          }))
        };
      } else {
        lightMonths[mKey] = mVal;
      }
    });
  }

  return JSON.stringify({
    ...lightMonths,
    _years: years || (rawMonths._years ? rawMonths._years : null)
  });
}

export function formatSystemRow(r) {
  let monthsData = {};
  try {
    monthsData = typeof r.months_data === 'string' ? JSON.parse(r.months_data) : (r.months_data || {});
  } catch (e) {
    monthsData = {};
  }
  const yearsData = monthsData._years || monthsData.years || null;
  let cleanMonths = { ...monthsData };
  delete cleanMonths._years;
  delete cleanMonths.years;

  if (yearsData && yearsData['2026'] && yearsData['2026'].months) {
    cleanMonths = yearsData['2026'].months;
  }

  return {
    id: r.id,
    shopping: r.shopping || 'BSFS',
    programacao: r.programacao || 'Finalizada',
    category: r.category,
    categoryName: r.category_name,
    name: r.name,
    periodicity: r.periodicity,
    respTecnico: r.resp_tecnico,
    na: Boolean(r.na),
    pmocStatus: r.pmoc_status || 'NOT_REQUIRED',
    pmocStatusLabel: r.pmoc_status_label || '',
    standards: r.standards,
    description: r.description,
    pmoc: typeof r.pmoc_data === 'string' ? JSON.parse(r.pmoc_data) : (r.pmoc_data || { attached: false }),
    equipamentoParado: typeof r.equipamento_parado === 'string' ? JSON.parse(r.equipamento_parado) : (r.equipamento_parado || { isParado: false, dataParada: null }),
    months: cleanMonths,
    years: yearsData || { '2026': { months: cleanMonths } }
  };
}

export async function getAllSystems() {
  const pool = getPool();
  // Ordenação numérica pelo ID para manter a ordem estrita da planilha mestre (1 a 40)
  const [rows] = await pool.query('SELECT * FROM systems ORDER BY CAST(SUBSTRING(id, 5) AS UNSIGNED), id ASC');
  return rows.map(formatSystemRow);
}

export async function upsertSystemsBatch(systems) {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const sys of systems) {
      await conn.query(
        `INSERT INTO systems 
         (id, shopping, programacao, category, category_name, name, periodicity, resp_tecnico, na, pmoc_status, pmoc_status_label, standards, description, pmoc_data, equipamento_parado, months_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           shopping = VALUES(shopping),
           programacao = VALUES(programacao),
           category = VALUES(category),
           category_name = VALUES(category_name),
           name = VALUES(name),
           periodicity = VALUES(periodicity),
           resp_tecnico = VALUES(resp_tecnico),
           na = VALUES(na),
           pmoc_status = VALUES(pmoc_status),
           pmoc_status_label = VALUES(pmoc_status_label),
           standards = VALUES(standards),
           description = VALUES(description),
           pmoc_data = VALUES(pmoc_data),
           equipamento_parado = VALUES(equipamento_parado),
           months_data = VALUES(months_data)`,
        [
          sys.id,
          sys.shopping || 'BSFS',
          sys.programacao || 'Finalizada',
          sys.category || 'GERAL',
          sys.categoryName || sys.category || 'GERAL',
          sys.name,
          sys.periodicity || 'Mensal',
          sys.respTecnico || '',
          Boolean(sys.na),
          sys.pmocStatus || 'NOT_REQUIRED',
          sys.pmocStatusLabel || '',
          sys.standards || '',
          sys.description || '',
          typeof sys.pmoc === 'string' ? sys.pmoc : JSON.stringify(sys.pmoc || { attached: false }),
          typeof sys.equipamentoParado === 'string' ? sys.equipamentoParado : JSON.stringify(sys.equipamentoParado || { isParado: false, dataParada: null }),
          prepareMonthsDataPayload(sys)
        ]
      );
    }

    await conn.commit();
    return { success: true, count: systems.length };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function upsertSingleSystem(id, sys) {
  const pool = getPool();
  const sysName = sys.name || sys.manutencao || id || 'Sistema';
  const sysCategory = sys.category || 'GERAL';
  const sysCategoryName = sys.categoryName || sys.category || 'GERAL';
  const sysPeriodicity = sys.periodicity || 'Mensal';
  const sysRespTecnico = sys.respTecnico || '';
  const sysShopping = sys.shopping || 'BSFS';
  const sysProgramacao = sys.programacao || 'Finalizada';
  const sysNa = Boolean(sys.na);
  const sysPmocStatus = sys.pmocStatus || 'NOT_REQUIRED';
  const sysPmocStatusLabel = sys.pmocStatusLabel || '';
  const sysStandards = sys.standards || '';
  const sysDescription = sys.description || '';
  const sysPmoc = typeof sys.pmoc === 'string' ? sys.pmoc : JSON.stringify(sys.pmoc || { attached: false });
  const sysEquipParado = typeof sys.equipamentoParado === 'string' ? sys.equipamentoParado : JSON.stringify(sys.equipamentoParado || { isParado: false, dataParada: null });
  const sysMonthsData = prepareMonthsDataPayload(sys);

  await pool.query(
    `INSERT INTO systems 
     (id, shopping, programacao, category, category_name, name, periodicity, resp_tecnico, na, pmoc_status, pmoc_status_label, standards, description, pmoc_data, equipamento_parado, months_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       shopping = VALUES(shopping),
       programacao = VALUES(programacao),
       category = VALUES(category),
       category_name = VALUES(category_name),
       name = VALUES(name),
       periodicity = VALUES(periodicity),
       resp_tecnico = VALUES(resp_tecnico),
       na = VALUES(na),
       pmoc_status = VALUES(pmoc_status),
       pmoc_status_label = VALUES(pmoc_status_label),
       standards = VALUES(standards),
       description = VALUES(description),
       pmoc_data = VALUES(pmoc_data),
       equipamento_parado = VALUES(equipamento_parado),
       months_data = VALUES(months_data)`,
    [
      id,
      sysShopping,
      sysProgramacao,
      sysCategory,
      sysCategoryName,
      sysName,
      sysPeriodicity,
      sysRespTecnico,
      sysNa,
      sysPmocStatus,
      sysPmocStatusLabel,
      sysStandards,
      sysDescription,
      sysPmoc,
      sysEquipParado,
      sysMonthsData
    ]
  );

  return { success: true, id };
}

export async function deleteSystemById(id) {
  const pool = getPool();
  await pool.query('DELETE FROM systems WHERE id = ?', [id]);
  return { success: true, id };
}
