# 🏛️ Arquitetura e Engenharia de Software — PMOC Gestor 360

Este documento apresenta a arquitetura de sistemas, topologia de rede, modelo de dados, Clean Architecture no backend, modularização do frontend, suíte de testes e diretrizes de segurança aplicadas no **PMOC Gestor 360**.

---

## 1. Topologia de Contêineres (Docker Compose)

O ambiente corporativo é isolado na rede interna Docker `pmoc_network`, expondo para o host apenas a porta HTTP do proxy reverso:

```text
[Cliente / Navegador]
        │
        │ HTTP (Porta 8081)
        ▼
┌────────────────────────────────────────────────────────┐
│ Nginx Reverse Proxy (pmoc_gestor_web)                  │
│ - Servidor de estáticos (HTML5, Vanilla CSS, JS)       │
│ - Buffer / Timeouts estendidos (300s para uploads)     │
│ - Mitigação de H2C Smuggling e Host Header Injection   │
└────────────────────────────────────────────────────────┘
        │
        │ Proxy HTTP /api (Porta 3000 interna)
        ▼
┌────────────────────────────────────────────────────────┐
│ Node.js Backend API (pmoc_gestor_api)                  │
│ - Clean Architecture (Routes, Controllers, Services)   │
│ - Express 4 (ES Modules) com processo `USER node`      │
│ - JWT Auth Middleware & RBAC Declarativo               │
│ - Serialização defensiva e limites de 200MB            │
└──────────────────────────────────────┬─────────────────┘
        │                              │
        │ TCP 3306 (Interno)           │ LDAP TCP 389 (Externo)
        ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│ MariaDB 10.11           │    │ Active Directory DC     │
│ (pmoc_gestor_db)        │    │ Windows Server 2022     │
│ - Volume `mariadb_data` │    │ - IP: 10.10.19.2        │
│ - Packet: 256MB         │    │ - Domínio: BSFS.LOCAL   │
│ - Colunas LONGTEXT      │    │ - Base DN: DC=BSFS,...  │
└─────────────────────────┘    └─────────────────────────┘
```

### Mapeamento de Serviços Docker Compose

| Serviço Compose | Nome do Contêiner | Imagem / Base | Função no Sistema |
| :--- | :--- | :--- | :--- |
| `web` | `pmoc_gestor_web` | `nginx:1.25-alpine` | Proxy reverso, terminação HTTP e entrega de estáticos. |
| `api` | `pmoc_gestor_api` | `node:20-alpine` | API REST em Node.js com execução restrita ao `USER node`. |
| `mariadb` | `pmoc_gestor_db` | `mariadb:10.11` | Banco relacional com persistência no volume `mariadb_data`. |

---

## 2. Tecnologias e Bibliotecas Empregadas

| Camada | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Frontend** | HTML5 Semântico, CSS3 Moderno (Tokens), JavaScript Vanilla Modular | Zero overhead de compilação, carregamento instantâneo em intranet corporativa e manutenibilidade sem fragilidade de frameworks. |
| **Proxy / Web Server** | Nginx 1.25 Alpine | Consumo mínimo de memória (< 15MB), alto throughput para arquivos grandes e controle rigoroso de headers HTTP. |
| **Backend API** | Node.js 20 LTS + Express 4 | Runtime assíncrono de alta performance para operações de I/O intensivas (documentos, laudos e queries relacionais). |
| **Banco de Dados** | MariaDB 10.11 LTS | Conformidade ACID, integridade UTF-8mb4, transações InnoDB e suporte a colunas `LONGTEXT` para arquivos e JSONs. |
| **Autenticação** | `ldapjs` v3 + `jsonwebtoken` | Integração direta com o catálogo do Active Directory da Microsoft e tokens stateless desacoplados. |
| **Testes Automatizados** | Vitest 5.0 | Execução rápida de testes unitários e de integração com cobertura de segurança e integridade de dados. |

---

## 3. Clean Architecture no Backend (`server/src`)

O backend foi reestruturado seguindo os princípios de **Clean Architecture** e separação de responsabilidades em camadas bem delimitadas:

```text
server/src/
├── config/
│   ├── env.js                   <- Leitura e validação centralizada de variáveis de ambiente
│   └── database.js              <- Pool de conexões assíncronas mysql2/promise com UTF-8mb4
├── middlewares/
│   ├── auth.middleware.js       <- Verificação de assinatura e expiração de token JWT
│   ├── rbac.middleware.js       <- Autorização declarativa por perfil (requireSuperAdmin / requireRole)
│   └── errorHandler.middleware.js <- Interceptador global com formato RFC 7807 (Problem Details)
├── services/
│   ├── systems.service.js       <- Regras de negócio, consultas e serialização defensiva de JSON
│   ├── auth.service.js          <- Bind LDAP no AD DC (10.10.19.2) e autenticação de contingência
│   └── audit.service.js         <- Gravação e listagem estruturada de eventos de auditoria
├── controllers/
│   ├── systems.controller.js    <- Extração de parâmetros HTTP e retorno padronizado de inventário
│   ├── auth.controller.js       <- Handler de login e emissão de JWT
│   └── audit.controller.js      <- Handlers de consulta e registro de logs operacionais
├── routes/
│   ├── systems.routes.js        <- Rotas /api/systems protegidas por JWT e RBAC
│   ├── auth.routes.js           <- Rotas /api/auth públicas e de perfil
│   └── audit.routes.js          <- Rotas /api/audit-logs
├── app.js                       <- Fábrica da aplicação Express (middlewares globais, rotas e 404)
└── index.js                     <- Bootstrap limpo do processo, abertura de porta e graceful shutdown
```

### Principais Benefícios da Estrutura:
1. **Desacoplamento de Infraestrutura**: O banco de dados MariaDB e o serviço LDAP são acessados unicamente através de seus respectivos Services.
2. **Tratamento Padronizado de Erros (RFC 7807)**: Todas as exceções não tratadas retornam um JSON estruturado contendo `title`, `status`, `detail` e `timestamp`.
3. **Controle de Acesso Centralizado (RBAC)**: A exclusão de sistemas prediais e operações destrutivas exigem o middleware `requireSuperAdmin`, prevenindo falhas humanas ou bypass no cliente.

---

## 4. Arquitetura Modular do Frontend (`public/js`)

A interface cliente foi desacoplada em módulos utilitários e de infraestrutura, eliminando código duplicado e centralizando regras visuais:

```text
public/js/
├── core/
│   └── constants.js             <- Constantes imutáveis (Status PMOC, cores, periodicidades, enums)
├── services/
│   ├── apiClient.js             <- Cliente HTTP desacoplado com injeção de token JWT e tratamento de erros
│   ├── AuthService.js           <- Gerenciador de sessão, persistência local e grupos de acesso
│   ├── StorageService.js        <- Comunicação com a API REST para persistência dos 40 sistemas
│   └── AuditService.js          <- Envio assíncrono de trilhas de auditoria
├── utils/
│   └── formatters.js            <- Formatação de datas brasileiras, cálculo de KB/MB e escape seguro HTML
├── ui/
│   ├── UI.js                    <- Renderização das tabelas, filtros rápidos e gauge SVG de conformidade
│   ├── Modals.js                <- Modais de edição de mês, inclusão de laudos PMOC/ART e máquina parada
│   └── Components.js            <- Notificações visuais tipo toast e barras de progresso
└── app.js                       <- Orquestrador do ciclo de vida da página e eventos de navegação
```

---

## 5. Suíte de Testes Automatizados (Vitest)

O diretório `server/test/` consolida os testes automatizados da aplicação:

| Arquivo de Teste | Tipo | O que Valida |
| :--- | :--- | :--- |
| `health.test.js` | Integração | Valida o endpoint `/api/health` garantindo HTTP 200 e payload estruturado de diagnóstico. |
| `rbac-auth.test.js` | Unitário / Segurança | Valida bloqueio de rotas protegidas sem token, rejeição de exclusão para usuários comuns e concessão para `BSFS_OPE_SYSADMIN`. |
| `systems-logic.test.js` | Unitário | Valida o cálculo de status de manutenções, serialização de campos complexos (`months_data`, `pmoc_data`) e sanitização de dados. |
| `frontend-utils.test.js` | Unitário | Valida formatação de datas (PT-BR), tamanhos de arquivo e prevenção de injeção XSS através de escape de strings. |

Para rodar os testes:
```bash
cd server
npm test
```

---

## 6. Modelo de Dados Relacional (MariaDB)

### Tabela `systems` (Inventário da Planta & Cronograma)

```sql
CREATE TABLE IF NOT EXISTS systems (
  id VARCHAR(100) PRIMARY KEY,
  shopping VARCHAR(100) DEFAULT 'BSFS',
  programacao VARCHAR(100) DEFAULT 'Finalizada',
  category VARCHAR(100) NOT NULL,
  category_name VARCHAR(150) NOT NULL,
  name VARCHAR(255) NOT NULL,
  periodicity VARCHAR(100) NOT NULL,
  resp_tecnico VARCHAR(255) DEFAULT '',
  na BOOLEAN DEFAULT FALSE,
  pmoc_status VARCHAR(100) DEFAULT 'NOT_REQUIRED',
  pmoc_status_label VARCHAR(255) DEFAULT '',
  standards TEXT,
  description LONGTEXT,
  pmoc_data LONGTEXT,          -- Metadados PMOC & ART (JSON)
  equipamento_parado LONGTEXT, -- Estado de indisponibilidade (JSON)
  months_data LONGTEXT,        -- Cronograma consolidado e histórico anual (JSON)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Estrutura do Campo `months_data`
Armazena a matriz de meses de forma flexível e particionada por ano de exercício:
```json
{
  "_years": {
    "2026": {
      "months": {
        "10": {
          "scheduled": true,
          "status": "DONE",
          "date": "2026-10-05",
          "os": "OS-89421",
          "notes": "Limpeza química das serpentinas concluída sem anomalias.",
          "documents": [
            {
              "id": "doc-1728349281-a1b2c3d4",
              "name": "Relatorio_Mensal_Outubro.pdf",
              "size": 245100,
              "type": "application/pdf",
              "uploadedAt": "05/10/2026 14:32",
              "uploadedBy": "Carlos Santos",
              "dataUrl": "data:application/pdf;base64,..."
            }
          ]
        }
      }
    }
  }
}
```

### Tabela `audit_logs` (Trilha de Auditoria)

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  user_email VARCHAR(150) NOT NULL,
  user_group VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 7. Integração Active Directory (LDAP)

### Fluxo de Autenticação

```text
1. Usuário informa 'caio.alef' e senha na tela de login.
2. Frontend envia POST /api/auth/login com as credenciais.
3. AuthService do backend conecta ao AD via LDAP Bind com UPN 'caio.alef@BSFS.LOCAL'.
4. Se o bind for bem-sucedido, busca os atributos do colaborador:
   Filter: (|(sAMAccountName=caio.alef)(userPrincipalName=caio.alef@BSFS.LOCAL))
   Attributes: ['displayName', 'mail', 'memberOf']
5. O sistema analisa os grupos do AD retornados:
   - BSFS_OPE_SYSADMIN -> Concede SUPERADMIN (canInsert=true, canDelete=true)
   - BSFS_OPE_SYSUSER  -> Concede USER (canInsert=true, canDelete=false)
6. Emite token JWT assinado com algoritmo HMAC SHA-256 e validade de 8 horas.
```

---

## 8. Medidas de Segurança e Hardening Aplicadas

1. **Contêiner com Usuário Não-Root**: O `Dockerfile` da API declara `USER node` antes da inicialização, impedindo escalação de privilégios em caso de comprometimento da aplicação.
2. **Build Determinístico no Docker**: Uso conjunto de `COPY package*.json ./` e flags `--omit=dev --legacy-peer-deps` impedindo falhas de resolução de dependências no Alpine.
3. **Prevenção de H2C Smuggling no Nginx**: Remoção de cabeçalhos genéricos de upgrade desnecessários para tráfego REST.
4. **Mitigação de Host Header Injection**: O proxy Nginx força `$server_name` no cabeçalho `Host` encaminhado para a aplicação.
5. **Gerador Criptograficamente Seguro**: O frontend utiliza `window.crypto.getRandomValues()` em vez de `Math.random()`, garantindo unicidade de IDs de documentos e tokens.
6. **Sanitização contra XSS**: Função `escapeHtml` centralizada em `formatters.js` aplicada em todas as saídas dinâmicas no DOM.
7. **Formatação de Logs Segura**: Strings constantes com especificadores de formato (`%s`) no `console.error` e `console.log`, eliminando vulnerabilidades de *Unsafe Format String*.
8. **Segregação Estrita de Credenciais**: Nenhuma credencial ou chave em texto puro é versionada no código; todas são fornecidas exclusivamente via `.env`.
