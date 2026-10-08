import jwt from 'jsonwebtoken';
import { authenticateWithAD } from '../ldap.js';
import { config } from '../config/index.js';

export async function loginWithActiveDirectory(username, password) {
  if (!username || !password) {
    const error = new Error('Usuário e senha são obrigatórios.');
    error.statusCode = 400;
    throw error;
  }

  const result = await authenticateWithAD(username, password);

  if (!result.success) {
    const error = new Error(result.error || 'Credenciais inválidas.');
    error.statusCode = 401;
    error.details = result;
    throw error;
  }

  const token = jwt.sign(result.user, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });

  return {
    success: true,
    token,
    user: result.user
  };
}

export function generateTestToken(userPayload) {
  return jwt.sign(userPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}
