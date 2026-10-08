# PMOC Gestor 360 — Boulevard Shopping Feira de Santana

> Portal corporativo para gestão unificada do **PMOC** (Plano de Manutenção, Operação e Controle — Lei Federal nº 13.589/2018), controle regulatório de **ART** (CREA-BA), **Calendário Anual de Manutenções** de 40 sistemas prediais, monitoramento operacional de equipamentos e controle de acesso integrado ao **Active Directory (LDAP)**.

Este repositório consolida todo o ecossistema da aplicação: interface web cliente de alta performance (Vanilla JS/CSS), API REST em Node.js (Express), modelagem relacional MariaDB, proxy reverso Nginx com hardening de segurança e orquestração completa em contêineres Docker para ambientes corporativos (Rocky Linux / RHEL).

---

## 📚 Conteúdo da Documentação

| Pasta ou Arquivo | O que é |
| :--- | :--- |
| [**docs/funcionalidades.md**](docs/funcionalidades.md) | Detalhamento tela a tela: regras de negócio do PMOC, calendário estático, manutenções extraordinárias, permissões por perfil e auditoria. |
| [**docs/arquitetura.md**](docs/arquitetura.md) | Topologia de contêineres, modelo de dados do MariaDB, integração LDAP com Active Directory, fluxo de autenticação e medidas de hardening. |
| [**docs/implantacao-e-operacao.md**](docs/implantacao-e-operacao.md) | Guia de instalação e deploy no Rocky Linux, configuração do `.env`, rotinas de backup com `mysqldump`, firewall e solução de problemas. |
| [**public/**](public/) | Interface web cliente responsiva, tokens visuais corporativos Boulevard Shopping e manipulação do DOM sem dependências externas. |
| [**server/**](server/) | Backend REST em Node.js (ES Modules), middlewares de autorização JWT, conexão pool MariaDB e drivers de rede LDAP. |
| [**nginx.conf**](nginx.conf) | Configuração de proxy reverso com proteção contra H2C smuggling, prevenção de Host header injection e timeouts de upload. |
| [**docker-compose.yml**](docker-compose.yml) | Definição dos três serviços orquestrados: `pmoc_gestor_web`, `pmoc_gestor_api` e `pmoc_gestor_db`. |
| [**setup_server.sh**](setup_server.sh) | Script bash automatizado para deploy, configuração de permissões, SELinux e liberação de portas no `firewalld`. |
| [**scripts/**](scripts/) | Utilitários operacionais para rotinas de backup e restauração em ambientes de teste e produção. |

---

## 🖥️ Módulos e Telas do Sistema

### 1. Acesso & Autenticação (Active Directory)
- **Login Corporativo**: Autenticação direta com credenciais do domínio `BSFS.LOCAL` (ex.: `caio.alef`, `pedro.oliveira`).
- **Segregação de Grupos de Domínio**:
  - `BSFS_OPE_SYSUSER`: Acesso de **Operador** — visualização, preenchimento de rotinas mensais, inserção de laudos e reporte de máquina parada.
  - `BSFS_OPE_SYSADMIN`: Acesso de **Administrador** — todas as permissões de operador + autorização mandatória para exclusão definitiva de sistemas.
- **Sessão Segura**: Emissão de token JWT assinado (validade de 8 horas) transmitido via cabeçalho `Authorization: Bearer`.

### 2. Painel Executivo & Indicadores (Dashboard & KPIs)
- **Gráfico de Rosca / Status dos Sistemas**: Visualização gráfica interativa com a contagem e percentual em tempo real das rotinas do ano selecionado:
  - 🟠 *Programado (SCHEDULED)*
  - 🟢 *Realizado (DONE)*
  - 🔴 *Não Realizado (UNREALIZED)*
  - 🟡 *Em Execução (ATTENTION)*
- **Índice de Conformidade PMOC & ART**: Percentual da planta predial com documentação obrigatória regularizada em conformidade com a Lei 13.589/2018.
- **Filtros em Tempo Real**: Filtros rápidos por disciplina/categoria, periodicidade técnica, conformidade documental e busca textual instantânea.
- **Seletor de Ano de Exercício**: Alternância dinâmica entre **2025**, **2026** e **2027**, garantindo histórico isolado e persistido por exercício.

### 3. Calendário Master de Manutenções (40 Sistemas Prediais)
- **Estrutura Fiel à Planilha de Engenharia**: Consolidação dos 40 sistemas da planta do Boulevard Shopping com periodicidades técnicas (Mensal, Bimestral, Trimestral, Quadrimestral, Semestral, Anual, Conforme Instrutivo e Não Aplicável).
- **Células Mensais Interativas**: Exibição clara de status (*▲ Programado*, *✓ Realizado*, *✗ Não Realizado*, *! Em Execução*) e indicador de arquivos anexados (📎).
- **Manutenções Extraordinárias**: Ao clicar em um mês sem previsão original na planilha mestre, o sistema orienta o operador e permite registrar uma intervenção avulsa com laudo, preservando a matriz original.

### 4. Central de Documentos & Laudos Mensais
- Registro detalhado de data de execução, número da Ordem de Serviço (OS) e parecer técnico de campo.
- Suporte a múltiplos anexos por mês (PDF, DOCX, XLSX, imagens) com pré-visualização em modal e download com um clique.

### 5. Controle Regulatório PMOC & ART (Lei 13.589/2018)
- **Estado Verde (Conforme & Anexado)**: Documentação regularizada, exibindo arquivos comprobatórios, data de emissão, ART registrada no CREA-BA e engenheiro responsável.
- **Estado Vermelho (Pendente)**: Alerta imediato de risco técnico com formulário direto para inserção dos laudos e ARTs.

### 6. Monitoramento de Máquina Parada (Status Operacional)
- Sinalizador visual em cada ativo da planta predial (*Normal* vs. *Máquina Parada*).
- Modal dedicado para registro de data, hora e justificativa técnica da interrupção (ex.: aguardo de sobressalentes).

### 7. Trilha de Auditoria & Conformidade (Audit Logs)
- Log contínuo e estruturado no MariaDB de todas as inclusões, alterações e exclusões, vinculando timestamp oficial (`America/Bahia`), operador de rede e justificativa.
- Bloqueio estrito de ações destrutivas para usuários comuns, exigindo autorização formal de membro do grupo `BSFS_OPE_SYSADMIN`.

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
│ Node.js 20 LTS (Express API)    │ -> Autenticação JWT, Regras de Negócio, USER node
└────────┬────────────────┬───────┘
         │                │
         ▼ TCP :3306      ▼ LDAP TCP :389
┌─────────────────┐ ┌──────────────────────────────────────────────┐
│ MariaDB 10.11   │ │ Active Directory Domain Controller           │
│ (InnoDB UTF-8)  │ │ Windows Server 2022 (BSFS.LOCAL - 10.10.19.2)│
└─────────────────┘ └──────────────────────────────────────────────┘
```

- **Frontend**: HTML5 Semântico, CSS3 com variáveis corporativas Boulevard Shopping (Marsala `#8C4748`, Âmbar `#E8985E`, Areia `#FAF3EB`), Vanilla JavaScript modular.
- **Backend API**: Node.js 20, Express 4, `mysql2` com pool assíncrono, `ldapjs` v3, `jsonwebtoken`.
- **Banco de Dados**: MariaDB 10.11 LTS com `max_allowed_packet = 256M` e colunas `LONGTEXT` para persistência segura de documentos e cronogramas.
- **Segurança**: Contêiner executando como usuário não privilegiado (`USER node`), proteção contra H2C Smuggling e Host Header Injection no Nginx, gerador criptográfico `window.crypto.getRandomValues()` e zero credenciais hardcoded.

---

## ⚡ Como Configurar e Publicar (Início Rápido)

### Pré-requisitos
- Servidor **Rocky Linux 9**, RHEL 9 ou CentOS com **Docker** e **Docker Compose** instalados.
- Acesso à rede corporativa com rota liberada para o Active Directory (`10.10.19.2`).

### Passo a Passo

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
   chmod +x setup_server.sh
   ./setup_server.sh
   ```

4. **Acessar a aplicação**:
   Abra no navegador corporativo:
   ```
   http://10.10.19.4:8081
   ```

Para instruções detalhadas de backup, restauração e resolução de problemas, consulte o [**Guia de Implantação e Operação**](docs/implantacao-e-operacao.md).

---

## 📊 Estado Atual do Projeto

- ✅ **Produção Ativa**: Aplicação implantada e em operação na infraestrutura de rede do shopping.
- ✅ **Segurança Verificada**: 16 achados de análise estática e auditoria de vulnerabilidades totalmente corrigidos e homologados na branch `main`.
- ✅ **Base de Dados Normalizada**: 40 sistemas prediais integrados com suporte a múltiplos exercícios e persistência no MariaDB.
- ✅ **Autenticação Homologada**: Integração validada contra o catálogo global do Active Directory (`BSFS.LOCAL`).
