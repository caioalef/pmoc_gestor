import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function checkAndSeedDatabase() {
  const pool = getPool();
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM systems');
    if (rows[0].count >= 40) {
      console.log(`[MariaDB] Base já contém ${rows[0].count} sistemas cadastrados. Pulando seed.`);
      return;
    }

    if (rows[0].count > 0 && rows[0].count < 40) {
      console.log(`[MariaDB] Base contém ${rows[0].count} sistemas (desatualizado). Sincronizando com os 40 sistemas da planilha mestre...`);
      await pool.query('DELETE FROM systems');
    }

    console.log('[MariaDB] Iniciando carga inicial dos 40 sistemas da planilha mestre...');
    const possiblePaths = [
      path.resolve(__dirname, '../../public/js/data/initialData.js'),
      path.resolve(__dirname, '../public/js/data/initialData.js'),
      '/public/js/data/initialData.js',
      path.resolve(process.cwd(), 'public/js/data/initialData.js'),
      path.resolve(process.cwd(), '../public/js/data/initialData.js')
    ];

    let dataPath = possiblePaths.find(p => fs.existsSync(p));
    if (!dataPath) {
      console.warn('[MariaDB Seed] Arquivo initialData.js não encontrado nos caminhos verificados.');
      return;
    }

    const content = fs.readFileSync(dataPath, 'utf8');
    const json = content.replace(/^\s*const\s+INITIAL_SYSTEMS_DATA\s*=\s*/, '').trim().replace(/;$/, '');
    const systems = JSON.parse(json);

    for (const sys of systems) {
      await pool.query(
        `INSERT INTO systems 
         (id, shopping, programacao, category, category_name, name, periodicity, resp_tecnico, na, pmoc_status, pmoc_status_label, standards, description, pmoc_data, equipamento_parado, months_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          JSON.stringify(sys.pmoc || { attached: false }),
          JSON.stringify(sys.equipamentoParado || { isParado: false, dataParada: null }),
          JSON.stringify(sys.months || {})
        ]
      );
    }

    console.log(`[MariaDB] Carga inicial concluída com sucesso! ${systems.length} sistemas inseridos.`);
  } catch (err) {
    console.error('[MariaDB Seed Error]:', err.message);
  }
}
