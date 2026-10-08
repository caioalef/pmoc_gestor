import { Router } from 'express';
import {
  getSystemsHandler,
  putSystemsBatchHandler,
  putSingleSystemHandler,
  deleteSystemHandler
} from '../controllers/systems.controller.js';
import { requireCanInsert, requireCanDelete } from '../middlewares/rbac.middleware.js';

const router = Router();

router.get('/', getSystemsHandler);
router.put('/', requireCanInsert, putSystemsBatchHandler);
router.put('/:id', requireCanInsert, putSingleSystemHandler);
router.delete('/:id', requireCanDelete, deleteSystemHandler);

export default router;
