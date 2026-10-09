# 📋 Funcionalidades e Regras de Negócio — PMOC Gestor 360

Este documento detalha cada tela, módulo, fluxo operacional, regras regulatórias e elementos do Design System do **PMOC Gestor 360** no **Boulevard Shopping Feira de Santana**.

---

## 1. Módulo de Autenticação e Controle de Acesso (Active Directory)

### Objetivo
Garantir que apenas colaboradores autorizados da equipe de Operações e Engenharia acessem a aplicação, utilizando suas credenciais de rede corporativa (`BSFS.LOCAL`).

### Regras e Perfis de Acesso
A aplicação consulta o Controlador de Domínio (AD DC em `10.10.19.2:389`) e extrai os grupos de segurança do atributo `memberOf`:

| Perfil / Grupo AD | Permissões no Sistema | Indicador na Interface |
| :--- | :--- | :--- |
| **BSFS_OPE_SYSUSER** | **Operador**: Visualizar todo o calendário, consultar documentos, alterar status mensal das manutenções, anexar laudos/OS e reportar máquina parada. | Badge azul `Operador` |
| **BSFS_OPE_SYSADMIN** | **Administrador**: Todas as permissões de operador + autorização mandatória para exclusão de sistemas e parametrização. | Badge roxo `Administrador` |
| **Usuário sem grupo** | **Acesso Negado**: A autenticação no bind pode ser válida, mas o acesso à interface e à API é bloqueado com mensagem orientativa. | Modal de Acesso Negado |

### Autenticação de Contingência (Fallback)
Em ambientes de testes isolados ou momentos de manutenção na controladora de domínio, o backend suporta um perfil administrativo de contingência configurado via variáveis de ambiente no `.env` (ex.: `FALLBACK_USER` e `FALLBACK_PASS_HASH`), sem credenciais hardcoded no código-fonte.

### Segurança da Sessão
- Emissão de token **JWT (JSON Web Token)** assinado no backend com validade de 8 horas.
- Header HTTP `Authorization: Bearer <token>` exigido em todas as rotas da API REST (`/api/systems`, `/api/audit-logs`).
- Sessão persistida em `localStorage` com controle de expiração e logout manual.

---

## 2. Dashboard e Indicadores Executivos (KPIs)

### 1. Design System Dark Slate & Contraste WCAG AA
A interface adota uma paleta moderna em tons ardósia escuros com alto contraste:
- Fundo principal: Ardósia escuro profundo (`#080D18`).
- Superfícies dos cards: Ardósia escuro intermediário (`#0E1626`) com bordas suaves (`#1E2C48`).
- Acentos corporativos do Boulevard Shopping: Marsala (`#8C4748`), Âmbar (`#E8985E`) e Areia (`#FAF3EB`).
- Tipografia moderna com legibilidade refinada para visualização em telões e desktops operacionais.

### 2. Medidor Circular Radiante de Conformidade (Gauge SVG)
- Componente vetorial responsivo baseado em SVG que calcula em tempo real o percentual de sistemas da planta que possuem PMOC e ART válidos e cadastrados.
- **Anel Dinâmico**: Deslocamento do traço SVG (`stroke-dashoffset`) proporcional ao percentual apurado.
- **Gradiente Radiante**:
  - Acima de 90%: Esmeralda brilhante (`#10B981` / `#059669`) — Alta Conformidade.
  - 70% a 89%: Âmbar vívido (`#F59E0B` / `#D97706`) — Atenção / Regularização em Andamento.
  - Abaixo de 70%: Rubi crítico (`#EF4444` / `#DC2626`) — Alerta Regulatório.

### 3. Gráfico de Rosca / Status dos Sistemas
- Distribuição percentual e quantitativa das rotinas de manutenção programadas no ano de exercício:
  - 🟠 **Programado (SCHEDULED)**: Rotinas com data prevista aguardando execução de campo.
  - 🟢 **Realizado (DONE)**: Manutenções executadas com Ordem de Serviço ou laudo anexado.
  - 🔴 **Não Realizado (UNREALIZED)**: Rotinas vencidas ou não executadas no mês de competência.
  - 🟡 **Em Execução (ATTENTION)**: Ordens de serviço em andamento pelas equipes do shopping.
- Totalizador central no miolo da rosca com a contagem total de eventos anuais.

### 4. Filtros Rápidos e Busca Instantânea
- **Busca Textual**: Localização em tempo real por nome do equipamento, tag técnica ou responsável.
- **Filtro de Categoria**: HVAC (Ar Condicionado), Elétrica, Hidráulica, Combate a Incêndio, Transporte Vertical, Civil, etc.
- **Filtro de Periodicidade**: Mensal, Bimestral, Trimestral, Quadrimestral, Semestral, Anual, Conforme Instrutivo.
- **Filtro de Conformidade PMOC**: Conforme, Pendente, Vencido ou Não Aplicável (N.A.).
- **Seletor de Ano de Exercício**: Alternância dinâmica entre **2025**, **2026** e **2027**, garantindo persistência isolada e histórico independente por exercício.

---

## 3. Calendário Master de Manutenções (40 Sistemas Prediais)

### Estrutura Fiel à Planilha de Engenharia do Shopping
A matriz principal consolida os 40 sistemas da planta do Boulevard Shopping com as seguintes colunas:
1. **Shopping**: Identificador da unidade (`BSFS`).
2. **Programação**: Estado do cronograma (`Finalizada`).
3. **Categoria**: Disciplina técnica de engenharia.
4. **Sistema / Manutenção**: Denominação do ativo e botão de máquina parada.
5. **Responsável Técnico**: Engenheiro ou empresa terceirizada contratada.
6. **Periodicidade**: Ciclo de intervenção técnica.
7. **N.A.**: Indicador de Não Aplicável.
8. **Status PMOC / ART**: Botão de auditoria com indicador de conformidade legal.
9. **Meses (Jan a Dez)**: Células com marcação de rotina técnica (`.month-box`).
10. **Ações**: Exclusão protegida por autorização de SYSADMIN.

### Comportamento e Estilo das Células Mensais (`.month-box`)

```text
[Célula Programada] ----> Clique direto ---------> Abre Modal de Status & Documentos
[Célula Sem Previsão] --> Pergunta confirmação -> Permite Manutenção Extraordinária
[Célula Sistema N.A.] -> Bloqueio amigável -----> Informa que o sistema é Não Aplicável
```

- **Símbolos e Estilização Visual**:
  - ▲ (Triângulo laranja): Programado
  - ✓ (Check esmeralda): Realizado
  - ✗ (X rubi): Não Realizado
  - ! (Ponto âmbar): Em Execução / Atenção
  - 📎 (Ícone de clipe): Sinaliza a existência de laudos, fotos, notas fiscais ou Ordens de Serviço anexadas.

---

## 4. Central de Documentação Mensal (Modal de Mês)

Ao clicar em um mês programado ou extraordinário de qualquer sistema predial:
1. **Definição de Status**: Seleção entre Programado, Realizado, Não Realizado ou Em Execução.
2. **Dados da Ordem de Serviço (OS)**:
   - Data real de execução técnica no shopping.
   - Número da Ordem de Serviço corporativa.
   - Observações técnicas e parecer de campo do operador/engenheiro.
3. **Upload e Gestão de Documentos**:
   - Arrastar e soltar (drag & drop) ou seleção manual de arquivos.
   - Suporte a PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG (limite de até 200MB por requisição).
   - Pré-visualização com ícone por extensão, tamanho legível (KB/MB) e metadados de upload (data/hora oficial da Bahia e operador de rede).
   - Ações por arquivo: **Visualizar em modal**, **Download direto** e **Exclusão segura**.

---

## 5. Módulo Regulatório PMOC & ART (Lei Federal nº 13.589/2018)

Ao clicar no badge de status PMOC de qualquer linha do inventário:

### Estado Verde (Conforme & Anexado)
- Indicador luminoso verde sinalizando que o sistema possui documentação aprovada.
- Exibe nome do arquivo do plano, data de emissão, tamanho, número de registro da ART no CREA-BA e nome do engenheiro responsável.
- Botão direto para download do laudo e opção de substituição documental.

### Estado Vermelho (Pendente / Não Anexado)
- Alerta visual enfático destacando o risco de não conformidade legal.
- Formulário direto para inserção dos laudos e ARTs do CREA.
- Registro obrigatório de número de ART, engenheiro responsável e descrição técnica do plano.
- Transição automática e em tempo real para o **Estado Verde** imediatamente após salvar.

---

## 6. Monitoramento de Máquina Parada (Status Operacional)

Integrado à célula de cada sistema predial na tabela:
- **Botão "Normal"**: Sinalizador neutro indicando operação plena do equipamento no shopping.
- **Botão "Parada: [Máquina]"**: Alerta visual em rubi indicando indisponibilidade operativa.
- **Modal de Gestão**:
  - Checkbox para alternar estado de funcionamento operacional.
  - Identificação da máquina específica (ex.: *Chiller 02*, *Bomba de Recalque 01*, *Escada Rolante Sul*).
  - Data e horário da paralisação.
  - Motivo técnico detalhado (ex.: *Aguardando substituição de selo mecânico pelo fornecedor*).

---

## 7. Trilha de Auditoria e Conformidade (Audit Logs)

Todas as ações críticas são gravadas de forma estruturada no MariaDB:
- `id`: Identificador único da transação gerado criptograficamente.
- `timestamp`: Data e hora exata no fuso horário oficial `America/Bahia`.
- `user`: E-mail ou login corporativo do colaborador responsável (`sAMAccountName`).
- `group`: Grupo de segurança no Active Directory (`BSFS_OPE_SYSUSER` ou `BSFS_OPE_SYSADMIN`).
- `action`: Código da operação (`ATUALIZAR_MES`, `ANEXAR_PMOC_ART`, `CRIAR_SISTEMA`, `EXCLUIR_SISTEMA`, `STATUS_MAQUINA`).
- `action_type`: Tipo estruturado de evento (`create`, `update`, `delete`).
- `details`: Descrição legível da alteração realizada, incluindo justificativas e dados anteriores.
