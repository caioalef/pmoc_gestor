import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireCanDelete } from '../middlewares/rbac.middleware.js';
import {
  getAllResponsibles,
  saveResponsible,
  deleteResponsible
} from '../services/responsibles.service.js';

const router = Router();

// Listagem pública para usuários autenticados (para popular selects no frontend)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const onlyActive = req.query.active === 'true';
    const list = await getAllResponsibles(onlyActive);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Criar / Atualizar responsável (Requer permissão administrativa)
router.post('/', requireAuth, requireCanDelete, async (req, res, next) => {
  try {
    const saved = await saveResponsible(req.body);
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Excluir responsável (Requer permissão administrativa)
router.delete('/:id', requireAuth, requireCanDelete, async (req, res, next) => {
  try {
    const result = await deleteResponsible(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
