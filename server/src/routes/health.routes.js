import { Router } from 'express';
import { getPool } from '../db.js';
import { isEmailConfigured } from '../email.js';

const router = Router();

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const pool = getPool();
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error: ' + e.message;
  }

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    mariaDB: dbStatus,
    activeDirectory: {
      status: process.env.AD_HOST ? 'configured' : 'not_configured'
    },
    emailService: {
      configured: isEmailConfigured()
    }
  });
});

export default router;
