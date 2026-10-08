import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Healthcheck Endpoint (/api/health)', () => {
  it('deve responder com status HTTP 200 e campos estruturados de diagnóstico', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.mariaDB).toBeDefined();
    expect(res.body.activeDirectory).toBeDefined();
    expect(res.body.emailService).toBeDefined();
  });
});
