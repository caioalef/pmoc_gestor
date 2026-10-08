import { Router } from 'express';
import { loginHandler, getCurrentUserHandler } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginHandler);
router.get('/me', getCurrentUserHandler);

export default router;
