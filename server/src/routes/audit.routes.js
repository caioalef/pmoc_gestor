import { Router } from 'express';
import {
  getAuditLogsHandler,
  postAuditLogHandler,
  deleteAuditLogsHandler
} from '../controllers/audit.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireCanDelete } from '../middlewares/rbac.middleware.js';

const router = Router();

router.get('/', getAuditLogsHandler);
router.post('/', requireAuth, postAuditLogHandler);
router.delete('/', requireCanDelete, deleteAuditLogsHandler);

export default router;
