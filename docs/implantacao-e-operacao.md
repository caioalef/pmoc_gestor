# 🚀 Guia de Implantação e Operação — PMOC Gestor 360

Este guia orienta a instalação, deploy contínuo, rotinas de backup, testes automatizados e procedimentos de contingência/rollback do **PMOC Gestor 360** em servidores corporativos **Rocky Linux / RHEL / CentOS / Ubuntu**.

---

## 1. Requisitos de Infraestrutura

- **Sistemas Operacionais Homologados**:
  - Rocky Linux 9.x / RHEL 9.x (Ambiente de Produção)
  - Ubuntu Linux 22.04 / 24.04 LTS (Ambiente de Testes / Homologação)
- **Recursos de Hardware Recomendados**:
  - 2 vCPUs
  - 4 GB de memória RAM
  - 20 GB de armazenamento disponível
- **Softwares Necessários**:
  - Docker Engine 24.x ou superior
  - Docker Compose v2 (plugin nativo `docker compose`)
  - Git
  - Conectividade de rede interna liberada para o Controlador de Domínio Active Directory (`10.10.19.2:389`).

---

## 2. Passo a Passo de Instalação e Deploy

### Passo 1: Clonar o Repositório
No servidor Linux (diretório padrão `/opt`):

```bash
cd /opt
sudo git clone https://github.com/caioalef/pmoc_gestor.git
cd /opt/pmoc_gestor
```

> **Atenção à propriedade de arquivos:** Certifique-se de que o usuário operacional local (ex.: `ti`) seja o proprietário da pasta para permitir comandos `git pull`:
> ```bash
> sudo chown -R $USER:$USER /opt/pmoc_gestor
> ```

### Passo 2: Configurar o Arquivo `.env`
Copie o modelo de exemplo e ajuste os parâmetros conforme a rede do shopping:

```bash
cp .env.example .env
nano .env
```

**Principais variáveis corporativas:**
```ini
APP_PORT=8081
DB_HOST=mariadb
DB_NAME=pmoc_db
DB_USER=pmoc_user
DB_PASSWORD=pmoc_password_2026
DB_ROOT_PASSWORD=pmoc_root_password_2026

# Active Directory (LDAP)
AD_HOST=10.10.19.2
AD_PORT=389
AD_DOMAIN=BSFS.LOCAL
AD_BASE_DN=DC=BSFS,DC=LOCAL
AD_USER_GROUP=BSFS_OPE_SYSUSER
AD_ADMIN_GROUP=BSFS_OPE_SYSADMIN
AD_REQUIRE_GROUP=true

# Segurança
JWT_SECRET=pmoc_jwt_secret_boulevard_2026_super_secure
```

### Passo 3: Executar o Script Automatizado de Deploy
O script [`setup_server.sh`](../setup_server.sh) executa todas as etapas necessárias no Rocky Linux:
1. Valida a instalação do Docker e Compose.
2. Sincroniza e reforça as configurações de segurança do `.env`.
3. Ajusta donos, permissões (755/644) e contextos SELinux (`container_file_t`).
4. Libera a porta 8081 permanentemente no `firewalld`.
5. Compila e sobe todos os contêineres Docker em segundo plano.

```bash
chmod +x setup_server.sh
./setup_server.sh
```

### Passo 4: Acessar o Sistema
Abra o navegador em qualquer estação da rede corporativa:
```
http://10.10.19.4:8081       # IP de Produção (Rocky Linux)
http://192.168.0.50:8081     # IP de Homologação (Ubuntu)
```

---

## 3. Gestão e Comandos Úteis do Docker Compose

### Nomes de Serviços vs. Nomes de Contêineres

| Serviço (`docker compose`) | Contêiner (`docker ps`) | Função |
| :--- | :--- | :--- |
| `web` | `pmoc_gestor_web` | Nginx 1.25 Alpine (Reverse Proxy & Estáticos) |
| `api` | `pmoc_gestor_api` | Node.js 20 LTS (Clean Architecture API) |
| `mariadb` | `pmoc_gestor_db` | MariaDB 10.11 (Banco de dados relacional) |

### Visualizar Status dos Contêineres
```bash
docker compose ps
```

### Acompanhar Logs em Tempo Real
```bash
# Logs de todos os serviços unificados
docker compose logs -f

# Apenas logs da API Node.js
docker compose logs -f api

# Apenas logs do banco de dados MariaDB
docker compose logs -f mariadb

# Apenas logs de acesso e erros do Nginx
docker compose logs -f web
```

### Reconstruir e Atualizar os Serviços
Ao aplicar atualizações trazidas do repositório Git:

```bash
cd /opt/pmoc_gestor
git pull origin main
docker compose up -d --build
```

Para recompilar somente o backend sem interromper o banco de dados:
```bash
docker compose build api
docker compose up -d --no-deps api
```

---

## 4. Testes Automatizados antes da Entrada em Produção

Antes de disponibilizar novas versões para a equipe de Engenharia, valide a integridade da aplicação com a suíte de testes:

```bash
cd /opt/pmoc_gestor/server
npm test
```
*A suíte executa 14 testes cobrindo saúde da API (`/api/health`), controle de acesso RBAC, integridade de serialização de manutenções e sanitização de dados.*

---

## 5. Rotinas de Backup e Restauração do Banco de Dados

### 1. Backup Imediato com `mysqldump`
Para gerar um snapshot pré-atualização do banco:

```bash
docker exec pmoc_gestor_db mysqldump -u pmoc_user -ppmoc_password_2026 pmoc_db > /opt/backup_pmoc_$(date +%Y%m%d_%H%M).sql
```

### 2. Script de Backup Automatizado
O script oficial em `scripts/backup_prod.sh` realiza backups consistentes sem bloquear transações (`--single-transaction`):
```bash
chmod +x scripts/backup_prod.sh
./scripts/backup_prod.sh
```

> **Agendamento no Crontab (`crontab -e`):**
> ```cron
> 0 3 * * * /opt/pmoc_gestor/scripts/backup_prod.sh > /dev/null 2>&1
> ```

### 3. Restauração de Dados
Para restaurar um dump no banco MariaDB:

```bash
docker exec -i pmoc_gestor_db mariadb -u pmoc_user -ppmoc_password_2026 pmoc_db < /opt/backup_pmoc_20261008.sql
```

---

## 6. Procedimento de Rollback de Emergência (Plano de Contingência)

Se uma atualização em produção apresentar inconsistências ou for aplicada no servidor incorreto, execute o procedimento de retorno imediato à versão anterior estável:

### Passo a Passo de Rollback:

1. **Acessar a pasta da aplicação no servidor:**
   ```bash
   cd /opt/pmoc_gestor
   ```

2. **Identificar o histórico de commits recentes:**
   ```bash
   git log --oneline -n 5
   ```
   *(Identifique o hash da versão estável homologada anterior, por exemplo `f543dc7`)*.

3. **Reverter o código para o commit estável:**
   ```bash
   git reset --hard <HASH_DO_COMMIT>
   ```

4. **Recompilar e reiniciar os contêineres:**
   ```bash
   docker compose up -d --build
   ```

5. **Validar a saúde dos contêineres e logs:**
   ```bash
   docker compose ps
   docker compose logs --tail=50 api
   ```

6. **Confirmar no navegador:**
   Acesse `http://10.10.19.4:8081` e faça login para validar que o sistema está operando na versão restabelecida.

---

## 7. Diagnóstico e Resolução de Problemas Frequentes

| Sintoma | Causa Provável | Procedimento de Resolução |
| :--- | :--- | :--- |
| **"error: insufficient permission for adding an object to repository database" no `git pull`** | Arquivos do `.git` foram manipulados por usuário diferente (ex.: `root`) | Executar `sudo chown -R $USER:$USER /opt/pmoc_gestor` e repetir o `git pull`. |
| **"Cannot read properties of null (reading 'edgesOut')" ao construir Docker da API** | Tentativa de resolver dependências sem o `package-lock.json` | O `Dockerfile` atual utiliza `COPY package*.json ./` e flags `--legacy-peer-deps --omit=dev`. Execute `docker compose build --no-cache api`. |
| **"Não foi possível inicializar conexão com o AD"** | Bloqueio de rede ou DC inacessível | Testar conexão do host: `nc -zv 10.10.19.2 389`. Verificar se a rota corporativa está ativa. |
| **"Usuário autenticado, mas suas informações de grupo não foram localizadas"** | Conta de usuário não vinculada aos grupos no AD | Verificar no Windows Server se o usuário pertence a `BSFS_OPE_SYSUSER` ou `BSFS_OPE_SYSADMIN`. |
| **Tela em branco ao abrir no navegador** | Cache de scripts antigos no navegador | Forçar atualização com **Ctrl + F5** para recarregar o bundle atualizado. |
| **Porta 8081 não responde de outra estação** | Bloqueio de firewall | No Rocky Linux: `sudo firewall-cmd --permanent --add-port=8081/tcp && sudo firewall-cmd --reload`. No Ubuntu: `sudo ufw allow 8081/tcp`. |
| **Falha ao anexar arquivos volumosos** | Limite de upload do MariaDB ou Nginx | O sistema suporta até 200MB no Nginx/Express e 256MB no MariaDB (`max_allowed_packet`). |
