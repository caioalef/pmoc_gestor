# 🚀 Guia de Implantação e Operação — PMOC Gestor 360

Este guia orienta a instalação, deploy contínuo, rotinas de backup e operação do **PMOC Gestor 360** em servidores corporativos **Rocky Linux / RHEL / CentOS**.

---

## 1. Requisitos de Infraestrutura

- **Sistema Operacional Recomendado**: Rocky Linux 9.x ou RHEL 9.x (64-bit).
- **Recursos Mínimos**:
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

### Passo 2: Configurar o Arquivo `.env`
Copie o modelo de exemplo e ajuste os parâmetros conforme a rede do shopping:

```bash
cp .env.example .env
nano .env
```

**Principais variáveis a conferir:**
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
O script [`setup_server.sh`](../setup_server.sh) executa todas as etapas necessárias:
1. Valida a instalação do Docker.
2. Sincroniza e reforça as configurações de segurança do `.env`.
3. Ajusta donos, permissões (755/644) e contextos SELinux (`container_file_t`).
4. Libera a porta 8081 permanentemente no `firewalld`.
5. Compila e sobe todos os contêineres Docker em segundo plano.

```bash
chmod +x setup_server.sh
./setup_server.sh
```

### Passo 4: Acessar o Sistema
Abra o navegador em qualquer estação da rede do shopping:
```
http://10.10.19.4:8081
```

---

## 3. Comandos Úteis do Docker

### Visualizar Status dos Contêineres
```bash
docker compose ps
```

### Acompanhar Logs em Tempo Real
```bash
# Logs de todos os serviços
docker compose logs -f

# Apenas logs da API Node.js
docker compose logs -f api

# Apenas logs do banco de dados MariaDB
docker compose logs -f mariadb
```

### Reiniciar os Serviços
```bash
docker compose restart
```

### Reconstruir Contêineres após Atualização do Código
```bash
git pull origin main
docker compose up -d --build
```

---

## 4. Rotinas de Backup e Restauração do Banco de Dados

### 1. Backup Rápido com `mysqldump`
Para gerar um snapshot imediato do banco de dados:

```bash
docker exec pmoc_gestor_db mysqldump -u pmoc_user -ppmoc_password_2026 pmoc_db > /opt/backup_pmoc_$(date +%Y%m%d_%H%M).sql
```

### 2. Script de Backup Automatizado
O repositório disponibiliza um script pronto em `scripts/backup_prod.sh`:
```bash
chmod +x scripts/backup_prod.sh
./scripts/backup_prod.sh
```
> **Dica**: Pode ser agendado no crontab (`crontab -e`) para execução diária às 03:00:
> `0 3 * * * /opt/pmoc_gestor/scripts/backup_prod.sh > /dev/null 2>&1`

### 3. Restauração de Dados
Para restaurar um dump no banco MariaDB:

```bash
docker exec -i pmoc_gestor_db mariadb -u pmoc_user -ppmoc_password_2026 pmoc_db < /opt/backup_pmoc_20261008.sql
```

---

## 5. Diagnóstico e Resolução de Problemas Frequentes

| Sintoma | Causa Provável | Procedimento de Resolução |
| :--- | :--- | :--- |
| **"Não foi possível inicializar conexão com o AD"** | Bloqueio de rede ou DC inacessível | Testar conexão do host: `nc -zv 10.10.19.2 389`. Verificar se a rota de rede corporativa está ativa. |
| **"Usuário autenticado, mas suas informações de grupo não foram localizadas"** | Conta de usuário não vinculada aos grupos no AD | Verificar no Windows Server se o usuário pertence a `BSFS_OPE_SYSUSER` ou `BSFS_OPE_SYSADMIN`. |
| **Tela em branco ao abrir no navegador** | Cache de scripts antigos do navegador | Forçar atualização com **Ctrl + F5**. A versão do script é automaticamente controlada por query string `?v=5`. |
| **Porta 8081 não responde de outra máquina** | Bloqueio de firewall no Rocky Linux | Executar `sudo firewall-cmd --permanent --add-port=8081/tcp && sudo firewall-cmd --reload`. |
| **Falha ao anexar arquivos volumosos** | Limite de upload do MariaDB ou Nginx | O sistema já está configurado para 200MB no Nginx/Express e 256MB no MariaDB (`max_allowed_packet`). |
