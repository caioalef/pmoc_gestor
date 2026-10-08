import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAuth } from '../src/middlewares/auth.middleware.js';
import { requireCanInsert, requireCanDelete } from '../src/middlewares/rbac.middleware.js';
import { config } from '../src/config/index.js';

// App de teste isolado para testar exclusivamente a camada de middleware
const testApp = express();
testApp.use(express.json());
testApp.use(authenticateToken);

testApp.get('/test/protected', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

testApp.post('/test/insert', requireCanInsert, (req, res) => {
  res.json({ success: true, message: 'inserido' });
});

testApp.delete('/test/delete', requireCanDelete, (req, res) => {
  res.json({ success: true, message: 'excluido' });
});

describe('Middlewares de Autenticação e RBAC (Controle de Acesso)', () => {
  it('deve rejeitar com 401 requisições sem token em rotas protegidas', async () => {
    const res = await request(testApp).get('/test/protected');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('deve autorizar requisição com token JWT válido', async () => {
    const validToken = jwt.sign(
      { username: 'pedro.oliveira', role: 'USER', canInsert: true, canDelete: false },
      config.jwtSecret
    );

    const res = await request(testApp)
      .get('/test/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('pedro.oliveira');
  });

  it('deve permitir inserção para usuários com permissão canInsert', async () => {
    const userToken = jwt.sign(
      { username: 'pedro.oliveira', role: 'USER', canInsert: true, canDelete: false },
      config.jwtSecret
    );

    const res = await request(testApp)
      .post('/test/insert')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('inserido');
  });

  it('deve bloquear com 403 exclusão por usuário que não seja SUPERADMIN', async () => {
    const operatorToken = jwt.sign(
      { username: 'operador.comum', role: 'USER', canInsert: true, canDelete: false },
      config.jwtSecret
    );

    const res = await request(testApp)
      .delete('/test/delete')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('apenas administradores possuem permissão para excluir');
  });

  it('deve permitir exclusão para usuário SUPERADMIN', async () => {
    const adminToken = jwt.sign(
      { username: 'admin.bsfs', role: 'SUPERADMIN', canInsert: true, canDelete: true },
      config.jwtSecret
    );

    const res = await request(testApp)
      .delete('/test/delete')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('excluido');
  });
});
