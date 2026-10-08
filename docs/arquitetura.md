# 🏛️ Arquitetura e Engenharia de Software — PMOC Gestor 360

Este documento apresenta a arquitetura de sistemas, topologia de rede, modelo de dados e diretrizes de segurança aplicadas no **PMOC Gestor 360**.

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
│ - Express (ES Modules) com processo `USER node`        │
│ - JWT Auth Middleware & Grupos AD                      │
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

---

## 2. Tecnologias e Bibliotecas Empregadas

| Camada | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Frontend** | HTML5 Semântico, CSS3 Moderno, JavaScript Vanilla | Zero overhead de compilação, carregamento ultra veloz em intranet, sem dependências frágeis de framework. |
| **Proxy / Web Server** | Nginx Alpine | Consumo mínimo de memória (< 15MB), alto throughput para arquivos e segurança perimetral. |
| **Backend API** | Node.js 20 LTS + Express 4 | Runtime assíncrono de alta performance para operações de I/O intensivas (arquivos e queries). |
| **Banco de Dados** | MariaDB 10.11 LTS | Conformidade ACID, suporte robusto a transações InnoDB, integridade UTF-8mb4 e colunas JSON/LONGTEXT. |
| **Autenticação** | `ldapjs` + `jsonwebtoken` | Integração nativa com Kerberos/Active Directory Microsoft e tokens stateless desacoplados. |
| **Emailing** | `nodemailer` | Disparo assíncrono via SMTP para alertas preditivos de vencimento de PMOC. |

---

## 3. Modelo de Dados Relacional (MariaDB)

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

## 4. Integração Active Directory (LDAP)

### Fluxo de Autenticação

```text
1. Usuário informa 'caio.alef' e senha na tela de login.
2. Frontend envia POST /api/auth/login.
3. Backend conecta ao AD via LDAP Bind com UPN 'caio.alef@BSFS.LOCAL'.
4. Se o bind tiver sucesso, executa busca de atributos:
   Filter: (|(sAMAccountName=caio.alef)(userPrincipalName=caio.alef@BSFS.LOCAL))
   Attributes: ['displayName', 'mail', 'memberOf']
5. Backend valida se os grupos contêm:
   - BSFS_OPE_SYSADMIN -> Atribui SUPERADMIN (canInsert=true, canDelete=true)
   - BSFS_OPE_SYSUSER  -> Atribui USER (canInsert=true, canDelete=false)
6. Retorna JWT com payload assinado e validade de 8 horas.
```

---

## 5. Medidas de Segurança e Hardening Aplicadas

1. **Contêiner com Usuário Não-Root**: O `Dockerfile` da API declara `USER node` antes da inicialização, impedindo escalação de privilégios em caso de comprometimento da aplicação.
2. **Prevenção de H2C Smuggling no Nginx**: Remoção de cabeçalhos genéricos de upgrade desnecessários para tráfego REST.
3. **Mitigação de Host Header Injection**: O proxy Nginx força `$server_name` no cabeçalho `Host` encaminhado para a aplicação.
4. **Gerador Criptograficamente Seguro**: O frontend utiliza `window.crypto.getRandomValues()` em vez de `Math.random()`, impedindo previsibilidade de identificadores de documentos e números de protocolo.
5. **Formatação de Logs Segura**: Strings constantes com especificadores de formato (`%s`) no `console.error` e `console.log`, eliminando vulnerabilidades de *Unsafe Format String*.
6. **Segregação Estrita de Credenciais**: Nenhuma chave ou senha em texto puro é versionada no código-fonte; todas são injetadas exclusivamente via `.env`.
