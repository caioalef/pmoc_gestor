import { loginWithActiveDirectory } from '../services/auth.service.js';

export async function loginHandler(req, res, next) {
  const { username, password } = req.body;

  try {
    const result = await loginWithActiveDirectory(username, password);
    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        ...(err.details || {})
      });
    }
    next(err);
  }
}

export function getCurrentUserHandler(req, res) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Não autenticado.' });
  }
  res.json({ success: true, user: req.user });
}
