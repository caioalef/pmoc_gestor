# 📋 Funcionalidades e Regras de Negócio — PMOC Gestor 360

Este documento detalha cada tela, módulo, fluxo operacional e regra de conformidade do **PMOC Gestor 360** no **Boulevard Shopping Feira de Santana**.

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
| **Usuário sem grupo** | **Acesso Negado**: A autenticação no bind pode ser válida, mas o acesso à interface e à API é bloqueado com mensagem orientativa. | Tela de Acesso Negado |

### Segurança da Sessão
- Emissão de token **JWT (JSON Web Token)** assinado no backend com validade de 8 horas.
- Header HTTP `Authorization: Bearer <token>` exigido nas rotas `/api/systems` e `/api/audit-logs`.
- Sessão persistida em `localStorage` com renovação e logout manual.

---

## 2. Dashboard e Indicadores Executivos (KPIs)

### 1. Gráfico de Rosca / Status dos Sistemas
- Renderização vetorial responsiva (SVG) com distribuição percentual e contagem absoluta das rotinas de manutenção agendadas no ano selecionado:
  - 🟠 **Programado (SCHEDULED)**: Rotinas com data prevista aguardando execução.
  - 🟢 **Realizado (DONE)**: Manutenções executadas com comprovação.
  - 🔴 **Não Realizado (UNREALIZED)**: Rotinas vencidas ou pendências técnicas.
  - 🟡 **Em Execução (ATTENTION)**: Ordens de serviço em andamento no shopping.
- Totalizador central no centro da rosca exibindo a quantidade total de rotinas do ano.

### 2. Índice de Conformidade PMOC & ART (Lei 13.589/2018)
- Cálculo dinâmico em tempo real da proporção de sistemas com documentação obrigatória regularizada:
  $$\text{Conformidade} = \left(\frac{\text{Sistemas com PMOC e ART Válidos}}{\text{Total de Sistemas Regulamentados}}\right) \times 100$$
- Barra de progresso visual com codificação de cores:
  - Acima de 90%: Verde (Alta Conformidade)
  - 70% a 89%: Âmbar (Atenção / Regularização em Andamento)
  - Abaixo de 70%: Vermelho (Crítico / Risco Regulatório)

### 3. Filtros Rápidos e Busca
- **Busca Textual**: Localização instantânea por nome do sistema, tag técnica ou responsável.
- **Filtro de Categoria**: HVAC (Ar Condicionado), Elétrica, Hidráulica, Combate a Incêndio, Transporte Vertical, etc.
- **Filtro de Periodicidade**: Mensal, Bimestral, Trimestral, Quadrimestral, Semestral, Anual.
- **Filtro de Status PMOC**: Conforme, Pendente, Vencido ou N.A.
- **Seletor de Ano de Exercício**: Alternância dinâmica entre 2025, 2026 e 2027 com histórico independente persistido no MariaDB.

---

## 3. Calendário Master de Manutenções (40 Sistemas Prediais)

### Estrutura Fiel à Planilha Mestre de Engenharia
A tabela principal consolida 40 rotinas prediais com colunas dedicadas para:
1. **Shopping**: Identificador da unidade (`BSFS`).
2. **Programação**: Estado do cronograma (`Finalizada`).
3. **Categoria**: Disciplina de engenharia.
4. **Sistema / Manutenção**: Denominação do ativo e botão de máquina parada.
5. **Responsável Técnico**: Engenheiro ou empresa terceirizada designada.
6. **Periodicidade**: Ciclo de intervenção técnica.
7. **N.A.**: Indicador de Não Aplicável.
8. **Status PMOC / ART**: Botão com indicador visual do documento legal.
9. **Meses (Jan a Dez)**: Células com marcação de rotina técnica.
10. **Ações**: Exclusão protegida por autorização de SYSADMIN.

### Comportamento das Células Mensais

```text
[Célula Programada] ----> Clique direto ----> Abre Modal de Status & Documentos
[Célula Sem Previsão] --> Pergunta confirmação -> Permite Manutenção Extraordinária
[Célula Sistema N.A.] -> Bloqueio amigável -> Informa que o sistema é Não Aplicável
```

- **Símbolos Visuais**:
  - ▲ (Triângulo laranja): Programado
  - ✓ (Check verde): Realizado
  - ✗ (X vermelho): Não Realizado
  - ! (Ponto amarelo): Em Execução / Atenção
  - 📎 (Ícone de clipe): Indica anexos inseridos (laudos, notas fiscais, fotos, relatórios)

---

## 4. Central de Documentação Mensal (Modal de Mês)

Ao clicar em um mês programado ou extraordinário de qualquer sistema:
1. **Definição de Status**: Seleção entre Programado, Realizado, Não Realizado ou Em Execução.
2. **Dados da Ordem de Serviço (OS)**:
   - Data real de execução técnica.
   - Número da Ordem de Serviço corporativa.
   - Observações técnicas e parecer de campo.
3. **Upload e Gestão de Arquivos**:
   - Arrastar e soltar (drag & drop) ou seleção manual de arquivos.
   - Formatos suportados: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG.
   - Pré-visualização com ícone de tipo de arquivo, tamanho formatado e metadados de upload (data/hora e operador responsável).
   - Ações por arquivo: **Visualizar em modal**, **Download direto** e **Exclusão**.

---

## 5. Módulo Regulatório PMOC & ART (Lei Federal 13.589/2018)

Ao clicar no badge de status PMOC de qualquer linha:

### Estado Verde (Conforme & Anexado)
- Exibido quando o sistema possui o Plano de Manutenção (PMOC) e a ART devidamente registrados.
- Permite visualizar o nome do arquivo, data de emissão, tamanho, número de ART CREA-BA e engenheiro responsável.

### Estado Vermelho (Pendente / Não Anexado)
- Alerta visual enfático indicando pendência documental.
- Formulário para anexar os arquivos de PMOC e ART (via dropzone ou clique).
- Registro do número da ART no CREA, nome do engenheiro responsável e descrição técnica do plano.
- Transição automática para o **Estado Verde** imediatamente após salvar no banco.

---

## 6. Monitoramento de Equipamento Parado (Status Operacional)

Integrado à célula de cada sistema na tabela:
- **Botão "Normal"**: Operação plena do equipamento no shopping.
- **Botão "Parada: [Máquina]"**: Alerta visual em vermelho indicando indisponibilidade.
- **Modal de Gestão**:
  - Checkbox para alternar estado de funcionamento.
  - Nome do equipamento específico paralisado (ex.: *Chiller 02*, *Escada Rolante Sul*).
  - Data e horário da interrupção.
  - Motivo detalhado (ex.: *Aguardando troca de rolamento pelo fornecedor*).

---

## 7. Trilha de Auditoria e Conformidade (Audit Logs)

Todas as ações relevantes são registradas no MariaDB com os seguintes atributos:
- `id`: Identificador único da transação.
- `timestamp`: Data e hora exata no fuso horário `America/Bahia`.
- `user`: E-mail ou login de rede do operador responsável.
- `group`: Grupo do Active Directory (`BSFS_OPE_SYSUSER` ou `BSFS_OPE_SYSADMIN`).
- `action`: Código da operação (`ATUALIZAR_MES`, `ANEXAR_PMOC_ART`, `CRIAR_SISTEMA`, `EXCLUIR_SISTEMA`, `STATUS_MAQUINA`).
- `action_type`: Tipo estruturado (`create`, `update`, `delete`).
- `details`: Descrição legível da alteração realizada, incluindo autorizadores quando aplicável.
