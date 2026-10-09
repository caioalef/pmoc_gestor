# 📋 Guia de Implantação da Base de Testes (Ubuntu Linux - 192.168.0.50)

Este guia orienta passo a passo a criação e manutenção do ambiente de homologação/testes isolado na máquina **Ubuntu (192.168.0.50)** para o **PMOC Gestor 360**, garantindo total segurança para o ambiente de produção.

---

## 🎯 Arquitetura dos Ambientes

| Parâmetro | Produção (Atual) | Testes / Homologação (Novo) |
| :--- | :--- | :--- |
| **IP do Servidor** | `10.10.19.4` | `192.168.0.50` |
| **Sistema Operacional** | Rocky Linux 9 | **Ubuntu Linux (20.04 / 22.04 / 24.04 LTS)** |
| **Porta da Aplicação** | `8081` | `8081` (ou a definida em `APP_PORT`) |
| **Banco de Dados** | MariaDB 10.11 (`pmoc_gestor_db`) | MariaDB 10.11 isolado (`pmoc_gestor_db`) |
| **Serviços Compose** | `web`, `api`, `mariadb` | `web`, `api`, `mariadb` |
| **URL de Acesso** | `http://10.10.19.4:8081` | `http://192.168.0.50:8081` |

---

## 🚀 Passo a Passo de Implantação

### Etapa 1: Obter o Projeto no Servidor Ubuntu (192.168.0.50)

Conecte via SSH na máquina de testes:

```bash
# Conectar no servidor de testes
ssh usuario@192.168.0.50

# Clonar o repositório em /opt/pmoc_gestor
sudo git clone https://github.com/caioalef/pmoc_gestor.git /opt/pmoc_gestor

# Conceder propriedade dos arquivos ao usuário operacional para evitar conflitos de permissão no git
sudo chown -R $USER:$USER /opt/pmoc_gestor
cd /opt/pmoc_gestor
```

---

### Etapa 2: Executar o Script de Instalação Automatizada

Dentro da pasta do projeto no servidor Ubuntu (`192.168.0.50`), execute:

```bash
chmod +x scripts/*.sh
./scripts/setup_ubuntu_test.sh
```

**O que este script realiza:**
1. Atualiza repositórios do Ubuntu e instala **Docker Engine** e **Docker Compose** (caso ainda não estejam instalados).
2. Adiciona o usuário corrente ao grupo `docker`.
3. Gera o arquivo `.env` de configuração com os parâmetros da base de testes.
4. Libera a porta `8081/tcp` no firewall do Ubuntu (`ufw`).
5. Compila as imagens e inicializa os três contêineres:
   - `api` (`pmoc_gestor_api`)
   - `web` (`pmoc_gestor_web`)
   - `mariadb` (`pmoc_gestor_db`)

---

### Etapa 3: Executar Testes Automatizados no Ambiente de Testes

Antes de iniciar as validações manuais, confirme a integridade dos módulos e rotas executando a suíte com Vitest:

```bash
cd /opt/pmoc_gestor/server
npm test
```
*Garante que os 14 testes de rotas, RBAC, diagnóstico e formatação passem com 100% de sucesso.*

---

### Etapa 4: Clonar os Dados Reais de Produção (Opcional)

Se desejar que a base de testes replique exatamente os dados cadastrados em produção:

#### 1. No servidor de Produção (`10.10.19.4`):
Execute o script seguro de exportação:
```bash
cd /opt/pmoc_gestor
./scripts/backup_prod.sh
```
*O arquivo será gerado no formato `pmoc_prod_backup_AAAAMMDD_HHMMSS.sql`.*

#### 2. Enviar o arquivo para o servidor de Testes (`192.168.0.50`):
```bash
scp pmoc_prod_backup_*.sql usuario@192.168.0.50:/opt/pmoc_gestor/
```

#### 3. No servidor de Testes (`192.168.0.50`):
Importe o arquivo no banco de dados de testes:
```bash
cd /opt/pmoc_gestor
./scripts/restore_test.sh
```

---

## 🔐 Autenticação e Contingência na Rede de Testes

1. **Conexão com o Active Directory (LDAP):**
   - Caso `192.168.0.50` possua rota e acesso à porta `389` do IP `10.10.19.2`, o login com credenciais corporativas (`BSFS.LOCAL`) funcionará de forma transparente.
   - Para testar a conectividade com o DC a partir do servidor de testes:
     ```bash
     nc -zv 10.10.19.2 389
     ```

2. **Login de Contingência Local (Fallback):**
   - Se a máquina de testes estiver em uma rede isolada sem rota para o AD, o sistema permite utilizar o usuário de contingência configurado no `.env`:
     - **Usuário:** `caio.alef`
     - **Senha Padrão:** `Boulevard@1234`
     - **Perfil:** Superadmin corporativo.

---

## 🛠️ Comandos Úteis e Operação no Servidor Ubuntu

### Mapeamento de Serviços Docker Compose

| Nome do Serviço Compose | Nome do Contêiner | Comando de Rebuild Específico |
| :--- | :--- | :--- |
| `api` | `pmoc_gestor_api` | `docker compose build api` |
| `web` | `pmoc_gestor_web` | `docker compose build web` |
| `mariadb` | `pmoc_gestor_db` | `docker compose up -d mariadb` |

### Atualizar com as Últimas Alterações do Git:
```bash
cd /opt/pmoc_gestor
git pull origin main
docker compose up -d --build
```

### Se o `git pull` der "insufficient permission":
```bash
sudo chown -R $USER:$USER /opt/pmoc_gestor
git pull origin main
```

### Acompanhar Logs em Tempo Real:
```bash
docker compose logs -f api
```

### Procedimento de Rollback no Servidor de Testes:
Caso queira reverter para uma versão anterior do repositório:
```bash
git log --oneline -n 5
git reset --hard <HASH_DO_COMMIT>
docker compose up -d --build
```
