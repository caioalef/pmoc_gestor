import app from './app.js';
import { config } from './config/index.js';
import { initDatabase } from './db.js';
import { checkAndSeedDatabase } from './seed.js';

export async function startServer() {
  let connected = false;
  let attempts = 0;
  const maxAttempts = 20;

  console.log('[API] Aguardando conexão com o MariaDB...');
  while (!connected && attempts < maxAttempts) {
    try {
      attempts++;
      await initDatabase();
      await checkAndSeedDatabase();
      connected = true;
      console.log('[API] Conectado ao MariaDB com sucesso.');
    } catch (err) {
      console.warn(`[API] Tentativa ${attempts}/${maxAttempts} falhou (${err.message}). Tentando novamente em 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (!connected) {
    console.error('[API] Falha crítica: não foi possível conectar ao MariaDB após várias tentativas.');
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[API] Servidor backend ativo na porta ${config.port}`);
  });

  return server;
}

startServer();
