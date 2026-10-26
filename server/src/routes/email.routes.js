import { Router } from 'express';
import {
  getEmailStatusHandler,
  postEmailTestHandler,
  postDeadlineAlertHandler
} from '../controllers/email.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { runDailyComplianceChecks } from '../services/cron.service.js';

const router = Router();

router.get('/status', getEmailStatusHandler);
router.post('/test', requireAuth, postEmailTestHandler);
router.post('/deadline-alert', requireAuth, postDeadlineAlertHandler);
router.post('/run-checks', requireAuth, async (req, res, next) => {
  try {
    await runDailyComplianceChecks();
    res.json({ success: true, message: 'Varredura de conformidade executada com sucesso.' });
  } catch (err) {
    next(err);
  }
});

export default router;
