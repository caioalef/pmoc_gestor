import { Router } from 'express';
import {
  getEmailStatusHandler,
  postEmailTestHandler,
  postDeadlineAlertHandler
} from '../controllers/email.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/status', getEmailStatusHandler);
router.post('/test', requireAuth, postEmailTestHandler);
router.post('/deadline-alert', requireAuth, postDeadlineAlertHandler);

export default router;
