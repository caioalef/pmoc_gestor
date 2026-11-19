import { getPool } from '../db.js';
import crypto from 'crypto';

/**
 * Retorna todos os responsáveis cadastrados
 */
export async function getAllResponsibles(onlyActive = false) {
  const pool = getPool();
  if (!pool) return [];

  let query = 'SELECT * FROM responsibles';
  if (onlyActive) {
    query += ' WHERE active = TRUE';
  }
  query += ' ORDER BY role DESC, name ASC';

  const [rows] = await pool.query(query);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    company: r.company || '',
    phone: r.phone || '',
    active: Boolean(r.active)
  }));
}

/**
 * Cria ou atualiza um responsável
 */
export async function saveResponsible(data) {
  const pool = getPool();
  if (!pool) throw new Error('Banco de dados indisponível');

  const id = data.id || `resp-${crypto.randomUUID().slice(0, 8)}`;
  const name = (data.name || '').trim();
  const email = (data.email || '').trim().toLowerCase();
  const role = data.role === 'GERENTE' ? 'GERENTE' : 'RESPONSAVEL';
  const company = (data.company || '').trim();
  const phone = (data.phone || '').trim();
  const active = data.active !== false;

  if (!name || !email) {
    throw new Error('Nome e E-mail são obrigatórios.');
  }

  await pool.query(`
    INSERT INTO responsibles (id, name, email, role, company, phone, active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      email = VALUES(email),
      role = VALUES(role),
      company = VALUES(company),
      phone = VALUES(phone),
      active = VALUES(active)
  `, [id, name, email, role, company, phone, active]);

  return { id, name, email, role, company, phone, active };
}

/**
 * Remove ou desativa um responsável
 */
export async function deleteResponsible(id) {
  const pool = getPool();
  if (!pool) throw new Error('Banco de dados indisponível');

  // Hard delete ou soft delete (aqui fazemos delete do registro)
  await pool.query('DELETE FROM responsibles WHERE id = ?', [id]);
  return { success: true, id };
}

/**
 * Busca o e-mail do gerente cadastrado
 */
export async function getManagerInfo() {
  const pool = getPool();
  if (!pool) return null;

  const [rows] = await pool.query('SELECT * FROM responsibles WHERE role = "GERENTE" AND active = TRUE LIMIT 1');
  if (rows.length > 0) {
    return {
      name: rows[0].name,
      email: rows[0].email
    };
  }
  return null;
}

/**
 * Busca responsável por nome ou id
 */
export async function findResponsibleByNameOrId(nameOrId) {
  const pool = getPool();
  if (!pool || !nameOrId) return null;

  const [rows] = await pool.query(
    'SELECT * FROM responsibles WHERE (id = ? OR name = ?) AND active = TRUE LIMIT 1',
    [nameOrId, nameOrId]
  );
  if (rows.length > 0) {
    return {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role
    };
  }
  return null;
}
