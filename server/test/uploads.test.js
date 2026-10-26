import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

describe('Upload Endpoint (/api/uploads)', () => {
  it('deve rejeitar upload sem token de autenticação (HTTP 401)', async () => {
    const res = await request(app)
      .post('/api/uploads')
      .attach('file', Buffer.from('conteúdo simulado de teste'), 'teste.pdf');

    expect(res.status).toBe(401);
  });

  it('deve realizar upload unitário de arquivo com token autenticado', async () => {
    const validToken = jwt.sign(
      {
        username: 'operador_teste',
        name: 'Operador Teste',
        email: 'operador@boulevardfs.com.br',
        role: 'SYSUSER',
        roleLabel: 'Operador Predial'
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    );

    const testBuffer = Buffer.from('Laudo Tecnico PMOC Simulado 2026');
    const res = await request(app)
      .post('/api/uploads')
      .set('Authorization', `Bearer ${validToken}`)
      .attach('file', testBuffer, 'laudo_chiller_teste.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.file).toBeDefined();
    expect(res.body.file.name).toBe('laudo_chiller_teste.pdf');
    expect(res.body.file.url).toMatch(/^\/uploads\//);
    expect(res.body.file.size).toBe(testBuffer.length);
  });
});
