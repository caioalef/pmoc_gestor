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
      category VARCHAR(50) NOT NULL,
      category_name VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      periodicity VARCHAR(50) NOT NULL,
      resp_tecnico VARCHAR(150),
      na BOOLEAN DEFAULT FALSE,
      standards VARCHAR(255),
      description TEXT,
      pmoc_data JSON,
      equipamento_parado JSON,
      months_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

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
