# 📋 Guia de Implantação da Base de Testes (Ubuntu Linux - 192.168.0.50)

Este guia orienta passo a passo a criação de um ambiente de homologação/testes isolado na máquina **Ubuntu (192.168.0.50)** para o **PMOC Gestor 360**, garantindo total segurança para o ambiente de produção.

---

## 🎯 Arquitetura dos Ambientes

| Parâmetro | Produção (Atual) | Testes / Homologação (Novo) |
| :--- | :--- | :--- |
| **IP do Servidor** | `10.10.19.4` | `192.168.0.50` |
| **Sistema Operacional** | Rocky Linux | **Ubuntu Linux (20.04 / 22.04 / 24.04)** |
| **Porta da Aplicação** | `8081` | `8081` (ou a definida em `APP_PORT`) |
| **Banco de Dados** | MariaDB 10.11 (`pmoc_gestor_db`) | MariaDB 10.11 isolado (`pmoc_gestor_db`) |
| **URL de Acesso** | `http://10.10.19.4:8081` | `http://192.168.0.50:8081` |

---

## 🚀 Passo a Passo de Implantação

### Etapa 1: Copiar o Projeto para o Servidor Ubuntu (192.168.0.50)

No seu terminal ou via SSH, acesse o servidor Ubuntu ou envie os arquivos:

#### Opção A: Clonar via Git diretamente no Ubuntu (Recomendado)
```bash
# Conectar no servidor de testes
ssh usuario@192.168.0.50

# Clonar o repositório em /opt/pmoc_gestor (ou na sua home)
git clone https://github.com/caioalef/pmoc_gestor.git /opt/pmoc_gestor
cd /opt/pmoc_gestor
```

#### Opção B: Copiar do seu computador para o Ubuntu via SCP
```bash
# Executado a partir do seu terminal local onde os arquivos estão
scp -r . usuario@192.168.0.50:/opt/pmoc_gestor/
```

---

### Etapa 2: Executar o Script de Instalação no Ubuntu

Dentro da pasta do projeto no servidor Ubuntu (`192.168.0.50`), execute:

```bash
chmod +x scripts/*.sh
./scripts/setup_ubuntu_test.sh
```

**O que este script faz automaticamente:**
1. Atualiza repositórios do Ubuntu e instala **Docker Engine** e o plugin **Docker Compose** (caso ainda não estejam instalados).
2. Adiciona o usuário ao grupo `docker`.
3. Cria o arquivo `.env` de configuração se ainda não existir.
4. Libera a porta `8081/tcp` no firewall do Ubuntu (`ufw`).
5. Constrói as imagens e sobe os três containers:
   - `pmoc_gestor_db` (MariaDB 10.11)
   - `pmoc_gestor_api` (Node.js)
   - `pmoc_gestor_web` (Nginx)

---

### Etapa 3: Clonar os Dados Reais de Produção (Opcional, mas Recomendado)

Se desejar que a base de testes contenha exatamente o mesmo histórico e dados já cadastrados em produção:

#### 1. No servidor de Produção (`10.10.19.4`):
Execute o script seguro de exportação (não bloqueia operações de leitura/escrita):
```bash
cd /opt/pmoc_gestor   # ou pasta da produção
./scripts/backup_prod.sh
```
*O script gerará um arquivo com nome no formato: `pmoc_prod_backup_AAAAMMDD_HHMMSS.sql`.*

#### 2. Enviar o arquivo para o servidor de Testes (`192.168.0.50`):
```bash
scp pmoc_prod_backup_*.sql usuario@192.168.0.50:/opt/pmoc_gestor/
```

#### 3. No servidor de Testes (`192.168.0.50`):
Importe o arquivo no banco de testes:
```bash
cd /opt/pmoc_gestor
./scripts/restore_test.sh
```
*(O script detecta o arquivo `.sql` mais recente, restaura as tabelas e reinicia a API).*

> **Nota:** Caso **não** queira copiar os dados de produção, o sistema já iniciará automaticamente com a base inicial limpa (40 sistemas da planilha mestre via `seed.js`).

---

## 🔐 Observações Importantes sobre Autenticação

Como a máquina de testes está na sub-rede `192.168.0.x` e a produção está na `10.10.19.x`:

1. **Acesso ao Active Directory (LDAP):**
   - Caso `192.168.0.50` consiga se comunicar com o IP `10.10.19.2:389` (Active Directory), o login com as credenciais de rede funcionará normalmente.
   - Para testar conectividade com o AD a partir do servidor de testes:
     ```bash
     nc -zv 10.10.19.2 389   # ou: telnet 10.10.19.2 389
     ```

2. **Login Local de Testes (Fallback):**
   - Se o servidor de testes estiver isolado da rede corporativa ou sem rota para o AD, o sistema já conta com o usuário de contingência local configurado no `.env`:
     - **Usuário:** `caio.alef`
     - **Senha Padrão:** `Boulevard@1234`
     - **Perfil:** Superadmin completo.

---

## 🛠️ Comandos Úteis no Servidor de Testes

- **Ver status dos containers:**
  ```bash
  docker compose ps
  ```
- **Acompanhar logs da API:**
  ```bash
  docker logs -f pmoc_gestor_api
  ```
- **Acompanhar logs do Banco de Dados:**
  ```bash
  docker logs -f pmoc_gestor_db
  ```
- **Reiniciar os serviços:**
  ```bash
  docker compose restart
  ```
- **Parar o ambiente de testes:**
  ```bash
  docker compose down
  ```
- **Recriar a base do zero (limpar volumes):**
  ```bash
  docker compose down -v
  docker compose up -d --build
  ```
