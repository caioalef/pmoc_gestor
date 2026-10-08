import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (!err && user) {
      req.user = user;
    }
    next();
  });
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado. É necessário estar autenticado no sistema com usuário de rede.'
    });
  }
  next();
}
