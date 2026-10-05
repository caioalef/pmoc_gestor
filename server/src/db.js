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

  // Tabela de Sistemas
  await p.query(`
    CREATE TABLE IF NOT EXISTS systems (
      id VARCHAR(100) PRIMARY KEY,
      shopping VARCHAR(50) DEFAULT 'BSFS',
      programacao VARCHAR(50) DEFAULT 'Finalizada',
      category VARCHAR(50) NOT NULL,
      category_name VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      periodicity VARCHAR(50) NOT NULL,
      resp_tecnico VARCHAR(150),
      na BOOLEAN DEFAULT FALSE,
      pmoc_status VARCHAR(50),
      pmoc_status_label VARCHAR(255),
      standards VARCHAR(255),
      description TEXT,
      pmoc_data JSON,
      equipamento_parado JSON,
      months_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Migrações graduais se tabela já existia
  try {
    await p.query(`ALTER TABLE systems ADD COLUMN IF NOT EXISTS shopping VARCHAR(50) DEFAULT 'BSFS'`);
    await p.query(`ALTER TABLE systems ADD COLUMN IF NOT EXISTS programacao VARCHAR(50) DEFAULT 'Finalizada'`);
    await p.query(`ALTER TABLE systems ADD COLUMN IF NOT EXISTS pmoc_status VARCHAR(50)`);
    await p.query(`ALTER TABLE systems ADD COLUMN IF NOT EXISTS pmoc_status_label VARCHAR(255)`);
  } catch (migrErr) {
    // Alguns sabores antigos do MySQL não suportam IF NOT EXISTS em ALTER TABLE
    console.log('[MariaDB] Verificação de colunas concluída.');
  }

  // Tabela de Logs de Auditoria
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

  console.log('[MariaDB] Tabelas prontas com sucesso.');
}
