# PMOC Gestor 360 — Boulevard Shopping Feira de Santana

> Portal corporativo para gestão unificada do **PMOC** (Plano de Manutenção, Operação e Controle — Lei Federal nº 13.589/2018), controle regulatório de **ART** (CREA-BA), **Calendário Anual de Manutenções** de 40 sistemas prediais, monitoramento operacional de equipamentos e controle de acesso integrado ao **Active Directory (LDAP)**.

Este repositório consolida todo o ecossistema da aplicação: interface web cliente de alta performance (Vanilla JS modular e CSS Tokens), API REST estruturada em **Clean Architecture** em Node.js 20 LTS (Express), suíte de testes automatizados com **Vitest**, modelagem relacional MariaDB 10.11, proxy reverso Nginx com hardening de segurança e orquestração completa em contêineres Docker para ambientes corporativos (Rocky Linux / RHEL / Ubuntu).

---

## 📚 Conteúdo da Documentação

| Pasta ou Arquivo | O que é |
| :--- | :--- |
| [**docs/funcionalidades.md**](docs/funcionalidades.md) | Detalhamento tela a tela: regras de negócio do PMOC, calendário estático, manutenções extraordinárias, permissões por perfil, indicadores visuais e auditoria. |
| [**docs/arquitetura.md**](docs/arquitetura.md) | Arquitetura em camadas (Clean Architecture), topologia de contêineres, modelo relacional MariaDB, integração LDAP com Active Directory e segurança. |
| [**docs/implantacao-e-operacao.md**](docs/implantacao-e-operacao.md) | Guia de instalação e deploy no Rocky Linux / RHEL, configuração do `.env`, rotinas de backup, testes automatizados e procedimentos de rollback. |
| [**GUIA_BASE_TESTES_UBUNTU.md**](GUIA_BASE_TESTES_UBUNTU.md) | Guia passo a passo para deploy e homologação isolada no servidor de testes Ubuntu (`192.168.0.50`). |
| [**public/**](public/) | Frontend modular (Vanilla JS, tokens visuais corporativos, cliente HTTP assíncrono e sanitização defensiva). |
| [**server/**](server/) | Backend REST modularizado em camadas (`src/config`, `src/middlewares`, `src/services`, `src/controllers`, `src/routes`, `test/`). |
| [**nginx.conf**](nginx.conf) | Proxy reverso com proteção contra H2C smuggling, prevenção de Host header injection e timeouts de upload. |
| [**docker-compose.yml**](docker-compose.yml) | Definição dos serviços orquestrados: `web` (`pmoc_gestor_web`), `api` (`pmoc_gestor_api`) e `mariadb` (`pmoc_gestor_db`). |
| [**setup_server.sh**](setup_server.sh) | Script bash automatizado para deploy, configuração de permissões, SELinux e liberação de portas no `firewalld`. |
| [**scripts/**](scripts/) | Utilitários operacionais para rotinas de backup e restauração em ambientes de teste e produção. |

---

## 🏗️ Estrutura do Projeto

```text
pmoc_gestor/
├── docs/                                # Documentação técnica e operacional
│   ├── arquitetura.md                   # Clean Architecture, banco, LDAP e segurança
│   ├── funcionalidades.md               # Telas, regras de negócio e fluxos
│   └── implantacao-e-operacao.md        # Deploy, backups, logs e rollback
├── GUIA_BASE_TESTES_UBUNTU.md           # Homologação no servidor de testes Ubuntu
├── nginx.conf                           # Configuração do Nginx (Reverse Proxy)
├── docker-compose.yml                   # Orquestração (serviços: api, web, mariadb)
├── setup_server.sh                      # Script de implantação para Rocky Linux / RHEL
├── scripts/                             # Scripts de suporte, backup e restore
│   ├── backup_prod.sh
│   ├── restore_test.sh
│   └── setup_ubuntu_test.sh
├── public/                              # Frontend cliente (Vanilla JS + CSS Tokens)
│   ├── index.html                       # Ponto de entrada SPA com modais e templates
│   ├── css/
│   │   └── style.css                    # Design System Dark Slate (WCAG AA, tokens, SVG gauges)
│   └── js/
│       ├── core/
│       │   └── constants.js             # Constantes globais, status e periodicidades
│       ├── services/
│       │   ├── apiClient.js             # Cliente HTTP desacoplado com injeção de JWT
│       │   ├── AuthService.js           # Gerenciamento de sessão e perfil corporativo
│       │   ├── StorageService.js        # Camada de comunicação com a API REST
│       │   └── AuditService.js          # Trilha de auditoria das ações do usuário
│       ├── utils/
│       │   └── formatters.js            # Formatadores de data, tamanho e escape seguro HTML
│       ├── app.js                       # Orquestrador da aplicação frontend
│       └── ui/
│           ├── UI.js                    # Renderização de tabelas, gauges e filtros
│           ├── Modals.js                # Gestão de modais (mês, PMOC, máquina parada)
│           └── Components.js            # Elementos dinâmicos e notificações toast
└── server/                              # Backend REST (Node.js 20 LTS)
    ├── Dockerfile                       # Build determinístico Alpine com USER node
    ├── package.json                     # Dependências do backend e scripts de teste
    ├── src/
    │   ├── index.js                     # Inicialização do servidor HTTP e conexões
    │   ├── app.js                       # Instância do Express, rotas e tratamento de erros
    │   ├── config/
    │   │   ├── env.js                   # Validação centralizada de variáveis de ambiente
    │   │   └── database.js              # Pool assíncrono MariaDB/MySQL2
    │   ├── middlewares/
    │   │   ├── auth.middleware.js       # Validação e decodificação de tokens JWT
    │   │   ├── rbac.middleware.js       # Controle de permissões baseado em perfil (USER/SUPERADMIN)
    │   │   └── errorHandler.middleware.js # Formatação de erros padronizada (RFC 7807)
    │   ├── services/
    │   │   ├── systems.service.js       # Regras de negócio, serialização JSON e consultas
    │   │   ├── auth.service.js          # Bind LDAP no AD DC e fallback de contingência
    │   │   └── audit.service.js         # Gravação e auditoria de trilhas operacionais
    │   ├── controllers/
    │   │   ├── systems.controller.js    # Handlers REST de inventário e cronogramas
    │   │   ├── auth.controller.js       # Handlers REST de autenticação e sessão
    │   │   └── audit.controller.js      # Handlers REST de logs de auditoria
    │   └── routes/
    │       ├── systems.routes.js        # Definição das rotas /api/systems
    │       ├── auth.routes.js           # Definição das rotas /api/auth
    │       └── audit.routes.js          # Definição das rotas /api/audit-logs
    └── test/                            # Suíte de testes automatizados com Vitest
        ├── health.test.js               # Teste de endpoint de diagnóstico (/api/health)
        ├── systems-logic.test.js        # Teste unitário de lógica e serialização de dados
        ├── rbac-auth.test.js            # Teste de controle de acesso e autorização RBAC
        └── frontend-utils.test.js       # Teste unitário de formatadores e sanitização
```

---

## 🖥️ Módulos e Funcionalidades

### 1. Acesso & Autenticação Corporativa (Active Directory)
- **Login Integrado**: Autenticação com credenciais de rede corporativa no domínio `BSFS.LOCAL` via LDAP Bind (`10.10.19.2:389`).
- **Segregação de Perfis por Grupo do Domínio**:
  - `BSFS_OPE_SYSUSER`: **Operador** — visualização, preenchimento de rotinas mensais, inserção de laudos e reporte de máquina parada.
  - `BSFS_OPE_SYSADMIN`: **Administrador** — todas as permissões de operador + autorização mandatória para exclusão de sistemas.
- **Sessão Segura**: Emissão de token JWT assinado (validade de 8 horas) transmitido via cabeçalho `Authorization: Bearer`.
- **Modo Contingência**: Usuário administrativo de fallback configurável via `.env` para suporte e testes em redes isoladas.

### 2. Painel Executivo & Indicadores (Dashboard & KPIs)
- **Visual Dark Slate & Radiant Gauge**: Interface refinada em tons ardósia escuros com alto contraste (WCAG AA), indicadores circulares em SVG de precisão e badges de alta legibilidade.
- **Gráfico de Rosca / Status dos Sistemas**: Visualização em tempo real das rotinas do exercício anual:
  - 🟠 *Programado (SCHEDULED)*
  - 🟢 *Realizado (DONE)*
  - 🔴 *Não Realizado (UNREALIZED)*
  - 🟡 *Em Execução (ATTENTION)*
- **Índice de Conformidade PMOC & ART**: Indicador visual dinâmico com proporção de sistemas cobertos por planos e ARTs vigentes (Lei Federal 13.589/2018).
- **Filtros em Tempo Real**: Filtros rápidos por categoria/disciplina, periodicidade, conformidade documental e busca textual instantânea.
- **Seletor de Ano de Exercício**: Alternância dinâmica entre **2025**, **2026** e **2027**, garantindo dados e cronogramas independentes por exercício.

### 3. Calendário Master de Manutenções (40 Sistemas Prediais)
- **Estrutura Fiel à Planilha de Engenharia**: Consolidação dos 40 sistemas da planta do Boulevard Shopping com periodicidades técnicas (Mensal, Bimestral, Trimestral, Quadrimestral, Semestral, Anual, Conforme Instrutivo e Não Aplicável).
- **Células Mensais Interativas**: Exibição clara de status (*▲ Programado*, *✓ Realizado*, *✗ Não Realizado*, *! Em Execução*) e indicador de arquivos anexados (📎).
- **Manutenções Extraordinárias**: Permite registrar manutenções preventivas ou corretivas fora do cronograma original, orientando o operador e preservando a matriz original.

### 4. Central de Documentos & Laudos Mensais
- Registro detalhado de data de execução, número da Ordem de Serviço (OS) e parecer técnico de campo.
- Suporte a múltiplos anexos por mês (PDF, DOCX, XLSX, imagens) com pré-visualização em modal e download com um clique.

### 5. Controle Regulatório PMOC & ART (Lei 13.589/2018)
- **Estado Verde (Conforme & Anexado)**: Documentação regularizada, exibindo arquivos comprobatórios, data de emissão, ART registrada no CREA-BA e engenheiro responsável.
- **Estado Vermelho (Pendente)**: Alerta imediato de risco técnico com formulário direto para inserção dos laudos e ARTs.

### 6. Monitoramento de Máquina Parada (Status Operacional)
- Sinalizador visual em cada ativo da planta predial (*Normal* vs. *Máquina Parada*).
- Modal dedicado para registro de data, hora e justificativa técnica da interrupção com histórico.

### 7. Trilha de Auditoria & Conformidade (Audit Logs)
- Log contínuo e estruturado no MariaDB de todas as inclusões, alterações e exclusões, vinculando timestamp oficial (`America/Bahia`), operador de rede e justificativa.
- Bloqueio estrito de ações destrutivas para usuários comuns, exigindo autorização formal de membro do grupo `BSFS_OPE_SYSADMIN`.

---

## 🧪 Testes Automatizados

A aplicação conta com uma suíte de testes com **Vitest**, cobrindo regras de negócio, permissões e sanitização:

```bash
# Executar a suíte de testes no diretório do servidor
cd server
npm test
```

### Escopo dos Testes:
- **`health.test.js`**: Verifica endpoint de saúde da API (`/api/health`) com validação de status HTTP 200 e payload de diagnóstico.
- **`rbac-auth.test.js`**: Valida regras de autorização RBAC, bloqueio de ações destrutivas para usuários comuns e concessão correta para `BSFS_OPE_SYSADMIN`.
- **`systems-logic.test.js`**: Valida cálculo de status de manutenções, serialização de campos JSON no MariaDB e integridade do modelo.
- **`frontend-utils.test.js`**: Valida rotinas de formatação de datas, tamanho de arquivos e escape contra vulnerabilidades XSS.

---

## 🏛️ Arquitetura Tecnológica

```text
[Navegador Web / Intranet]
         │
         ▼  HTTP :8081
┌─────────────────────────────────┐
│ Nginx 1.25 (Alpine)             │ -> Reverse Proxy, Estáticos, Gzip, Header Hardening
└────────┬────────────────────────┘
         │
         ▼  HTTP :3000 (Rede Interna Docker)
┌─────────────────────────────────┐
│ Node.js 20 LTS (Express API)    │ -> Clean Architecture, JWT, RBAC, USER node
└────────┬────────────────┬───────┘
         │                │
         ▼ TCP :3306      ▼ LDAP TCP :389
┌─────────────────┐ ┌──────────────────────────────────────────────┐
│ MariaDB 10.11   │ │ Active Directory Domain Controller           │
│ (InnoDB UTF-8)  │ │ Windows Server 2022 (BSFS.LOCAL - 10.10.19.2)│
└─────────────────┘ └──────────────────────────────────────────────┘
```

- **Frontend**: HTML5 Semântico, CSS3 com variáveis corporativas Boulevard Shopping, Vanilla JavaScript modular (desacoplado em módulos de serviços, utilitários e interface).
- **Backend API**: Node.js 20 LTS, Express 4 estruturado em camadas de Serviço, Controlador e Rota, `mysql2` com pool assíncrono, `ldapjs` v3, `jsonwebtoken`.
- **Banco de Dados**: MariaDB 10.11 LTS com `max_allowed_packet = 256M` e colunas `LONGTEXT` para persistência segura de documentos e cronogramas anuais.
- **Segurança**: Contêiner executando como usuário não privilegiado (`USER node`), proteção contra H2C Smuggling e Host Header Injection no Nginx, gerador criptográfico `window.crypto.getRandomValues()` e zero credenciais hardcoded.

---

## ⚡ Como Configurar e Publicar (Início Rápido)

### Pré-requisitos
- Servidor **Rocky Linux 9**, RHEL 9, CentOS ou **Ubuntu Linux** com **Docker** e **Docker Compose** instalados.
- Acesso à rede corporativa com rota liberada para o Active Directory (`10.10.19.2`).

### Passo a Passo de Instalação

1. **Clonar o repositório no servidor**:
   ```bash
   cd /opt
   sudo git clone https://github.com/caioalef/pmoc_gestor.git
   cd /opt/pmoc_gestor
   ```

2. **Configurar as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Executar o script de provisionamento automatizado**:
   ```bash
   # Em servidores Rocky Linux / RHEL:
   chmod +x setup_server.sh
   ./setup_server.sh

   # Ou em servidores Ubuntu (base de testes):
   chmod +x scripts/*.sh
   ./scripts/setup_ubuntu_test.sh
   ```

4. **Acessar a aplicação**:
   Abra no navegador corporativo:
   ```
   http://10.10.19.4:8081       # Produção (Rocky Linux)
   http://192.168.0.50:8081     # Testes / Homologação (Ubuntu)
   ```

### Atualização Contínua e Rebuild dos Serviços

Para puxar novas versões do repositório e recompilar os contêineres:

```bash
cd /opt/pmoc_gestor
git pull origin main
docker compose up -d --build
```

Para recompilar especificamente a API Node.js após alterações de backend:
```bash
docker compose build api
docker compose up -d --no-deps api
```

### Procedimento de Rollback de Emergência

Caso seja necessário reverter para um commit anterior estável:

```bash
cd /opt/pmoc_gestor
git log --oneline -n 5               # Identificar o hash desejado (ex.: f543dc7)
git reset --hard <HASH_DO_COMMIT>
docker compose up -d --build
docker compose ps                    # Confirmar que todos os 3 serviços estão 'Up'
```

Para instruções detalhadas de backup, restauração e resolução de problemas, consulte o [**Guia de Implantação e Operação**](docs/implantacao-e-operacao.md).

---

## 📊 Estado Atual do Projeto

- ✅ **Produção Ativa**: Aplicação implantada e em operação na infraestrutura de rede do shopping.
- ✅ **Clean Architecture Homologada**: Backend modularizado em Controllers, Services e Middlewares com separação estrita de responsabilidades.
- ✅ **Suíte de Testes Aprovada**: 14 testes automatizados em Vitest cobrindo segurança RBAC, regras de negócio e sanitização de dados.
- ✅ **Design System Modernizado**: Interface dark slate de alto contraste (WCAG AA), cards responsivos e indicadores visuais precisos.
- ✅ **Segurança e Hardening**: Análises estáticas de segurança sem achados pendentes e execução não-root (`USER node`).
- ✅ **Base de Dados Normalizada**: 40 sistemas prediais integrados com suporte a múltiplos exercícios no MariaDB 10.11.
- ✅ **Autenticação Homologada**: Integração validada contra o catálogo global do Active Directory (`BSFS.LOCAL`).
