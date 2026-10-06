import mysql from 'mysql2/promise';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'mariadb',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'pmoc_user',
      password: process.env.DB_PASSWORD || 'pmoc_password_2026',
      database: process.env.DB_NAME || 'pmoc_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}

export async function initDatabase() {
  const p = getPool();

  console.log('[MariaDB] Verificando e inicializando tabelas...');

  // 1. Tabela de Sistemas
  await p.query(`
    CREATE TABLE IF NOT EXISTS systems (
      id VARCHAR(100) PRIMARY KEY,
      shopping VARCHAR(100) DEFAULT 'BSFS',
      programacao VARCHAR(100) DEFAULT 'Finalizada',
      category VARCHAR(100) NOT NULL,
      category_name VARCHAR(150) NOT NULL,
      name VARCHAR(255) NOT NULL,
      periodicity VARCHAR(100) NOT NULL,
      resp_tecnico VARCHAR(255) DEFAULT '',
      na BOOLEAN DEFAULT FALSE,
      pmoc_status VARCHAR(100) DEFAULT 'NOT_REQUIRED',
      pmoc_status_label VARCHAR(255) DEFAULT '',
      standards TEXT,
      description LONGTEXT,
      pmoc_data LONGTEXT,
      equipamento_parado LONGTEXT,
      months_data LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Verificação individual e migração de colunas
  const requiredColumns = [
    { name: 'shopping', def: "VARCHAR(100) DEFAULT 'BSFS'" },
    { name: 'programacao', def: "VARCHAR(100) DEFAULT 'Finalizada'" },
    { name: 'resp_tecnico', def: "VARCHAR(255) DEFAULT ''" },
    { name: 'pmoc_status', def: "VARCHAR(100) DEFAULT 'NOT_REQUIRED'" },
    { name: 'pmoc_status_label', def: "VARCHAR(255) DEFAULT ''" },
    { name: 'standards', def: "TEXT" },
    { name: 'description', def: "LONGTEXT" },
    { name: 'pmoc_data', def: "LONGTEXT" },
    { name: 'equipamento_parado', def: "LONGTEXT" },
    { name: 'months_data', def: "LONGTEXT" }
  ];

  for (const col of requiredColumns) {
    try {
      const [existing] = await p.query(
        `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'systems' AND COLUMN_NAME = ?`,
        [col.name]
      );
      if (existing.length === 0) {
        console.log(`[MariaDB] Adicionando coluna ausente \`${col.name}\` em systems...`);
        await p.query(`ALTER TABLE systems ADD COLUMN \`${col.name}\` ${col.def}`);
      } else if (col.def === 'LONGTEXT' && existing[0].DATA_TYPE !== 'longtext') {
        console.log(`[MariaDB] Atualizando tipo da coluna \`${col.name}\` para LONGTEXT...`);
        await p.query(`ALTER TABLE systems MODIFY COLUMN \`${col.name}\` LONGTEXT`);
      }
    } catch (colErr) {
      console.warn(`[MariaDB] Aviso ao verificar coluna ${col.name}:`, colErr.message);
    }
  }

  // 3. Tabela de Logs de Auditoria
  await p.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(100) PRIMARY KEY,
      timestamp DATETIME NOT NULL,
      user_email VARCHAR(150) NOT NULL,
      user_group VARCHAR(100) NOT NULL,
      action VARCHAR(100) NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('[MariaDB] Inicialização e migrações concluídas com sucesso.');
}
