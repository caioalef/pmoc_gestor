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
    if (rows[0].count > 0) {
      console.log(`[MariaDB] Base já contém ${rows[0].count} sistemas cadastrados. Pulando seed.`);
      return;
    }

    console.log('[MariaDB] Tabela "systems" vazia. Iniciando carga inicial de sistemas...');
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
         (id, category, category_name, name, periodicity, resp_tecnico, na, standards, description, pmoc_data, equipamento_parado, months_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sys.id,
          sys.category || 'GERAL',
          sys.categoryName || sys.category || 'GERAL',
          sys.name,
          sys.periodicity || 'Mensal',
          sys.respTecnico || '',
          Boolean(sys.na),
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
