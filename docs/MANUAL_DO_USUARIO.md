# 📖 Manual Operacional e Guia de Treinamento — PMOC Gestor 360
**Boulevard Shopping Feira de Santana**  
*Controle de Engenharia, Cronograma de Manutenções Prediais e Conformidade Legal (PMOC / ART)*

---

## 🎯 Apresentação e Objetivo do Sistema

O **PMOC Gestor 360** é a plataforma corporativa da equipe de Engenharia e Operações do Boulevard Shopping Feira de Santana. Seu propósito é centralizar, rastrear e comprovar com validade jurídica todas as manutenções preventivas, corretivas e preditivas dos 40 sistemas prediais do empreendimento, garantindo conformidade com a **Lei Federal 13.589/2018 (PMOC)** e as resoluções do CREA/CFT (ART/TRT).

Este manual foi elaborado para orientar tanto novos colaboradores quanto operadores veteranos, descrevendo minuciosamente o significado de cada indicador, botão, modal e fluxo operacional do sistema.

---

## 🔐 1. Acesso ao Sistema e Perfis de Usuário (Active Directory)

O sistema é integrado diretamente ao Active Directory corporativo (`BSFS.LOCAL`). Isso significa que você utiliza o mesmo usuário e senha do seu computador de trabalho.

```
+--------------------------------------------------------------------------+
|                       TELA DE LOGIN CORPORATIVO                          |
|                                                                          |
|   Usuário de Rede: [ gustavo.santos              ]                       |
|   Senha do Domínio: [ ******************          ]                       |
|                                                                          |
|                      [  ENTRAR NO SISTEMA  ]                             |
+--------------------------------------------------------------------------+
```

### Perfis de Acesso e Permissões:

| Grupo de Domínio | Perfil no Sistema | Badge Visual | O que pode fazer |
| :--- | :--- | :--- | :--- |
| `BSFS_OPE_SYSUSER` | **Operador de Manutenção** | Badge Azul (`OPERADOR`) | • Consultar todo o calendário anual<br>• Cadastrar novos serviços/sistemas<br>• Atualizar o status mensal de manutenções<br>• Fazer upload de relatórios, fotos e Ordens de Serviço<br>• Sinalizar e remover status de Máquina Parada<br>• Exportar relatórios e planilhas em CSV |
| `BSFS_OPE_SYSADMIN` | **Administrador / Engenharia** | Badge Roxo (`ADMINISTRADOR`) | • Todas as permissões de Operador<br>• Autorização mandatória para exclusão de sistemas<br>• Desanexação e exclusão de PMOC e ART<br>• Acesso à visualização do log de auditoria técnica |

> ⚠️ **Importante sobre Segurança:**  
> Ações de exclusão de registros ou remoção de laudos técnicos exigem a senha de um usuário `SYSADMIN`. Todas as operações (criação, edição, upload e exclusão) são carimbadas no log com o nome do usuário, data e hora.

---

## 📊 2. Barra Superior e Indicadores do Painel (Dashboard)

Ao entrar na aplicação, a tela principal é dividida em: Barra Superior (Header), Indicadores Executivos (KPIs), Barra de Ferramentas/Filtros e Matriz Principal (Calendário Master).

```
+-------------------------------------------------------------------------------------------------------+
| [LOGO BOULEVARD] PMOC Gestor 360 | Boulevard Feira      (2026 v)   [+ Novo Sistema]   [User: Roberto] |
+-------------------------------------------------------------------------------------------------------+
|  [ GAUGE CONFORMIDADE ]    [ GRÁFICO DE ROSCA ]       [ RESUMO DE OPERAÇÃO E MÁQUINAS PARADAS ]       |
|         92%                Total: 248 Eventos          0 Máquinas Críticas Paradas                    |
|   Alta Conformidade        Realizados: 180 (73%)       40 Ativos Cadastrados                          |
+-------------------------------------------------------------------------------------------------------+
```

### 2.1 Botões da Barra Superior

- **Seletor de Ano (`2025`, `2026`, `2027`, `2028`):**  
  Permite alternar entre os exercícios. O sistema isola o histórico de cada ano: alterações de status ou documentos anexados em 2026 não afetam o histórico de 2025.
- **Botão `+ Novo Sistema`:**  
  Abre o formulário de cadastro de um novo equipamento ou serviço de engenharia.
- **Identificação do Usuário / Botão `Sair`:**  
  Mostra o nome do colaborador logado, seu perfil (`OPERADOR` ou `ADMINISTRADOR`) e o botão para encerrar a sessão.

### 2.2 Painel de Indicadores (KPIs)

1. **Medidor Circular de Conformidade Legal (Gauge PMOC/ART):**
   - **Verde Esmeralda (> 90%):** O shopping está em conformidade com as normas regulamentadoras.
   - **Laranja Âmbar (70% a 89%):** Existem sistemas operando com PMOC ou ART pendentes de renovação/anexo.
   - **Vermelho Alerta (< 70%):** Risco de não conformidade legal ou fiscalização.
2. **Gráfico de Rosca (Status Anual das Rotinas):**
   - Mostra a distribuição de todas as manutenções previstas no ano:
     - 🟢 **Realizado (Verde):** Manutenção concluída e atestada com documentação.
     - 🟠 **Programado (Laranja):** Manutenção agendada para meses futuros.
     - 🟡 **Atenção / Em Execução (Azul/Amarelo):** Serviço em andamento.
     - 🔴 **Não Realizado (Vermelho):** Manutenção não executada no mês previsto.
   - *Dica:* Clicar em uma fatia da rosca filtra instantaneamente a tabela para exibir apenas os sistemas com aquele status.
3. **Card de Máquinas Paradas:**
   - Exibe em destaque se existe algum equipamento fora de operação no shopping, permitindo ação imediata da equipe técnica.

---

## 🔍 3. Barra de Busca e Filtros Inteligentes

A barra de filtros permite encontrar qualquer sistema ou rotina em segundos:

```
+---------------------------------------------------------------------------------------------------------+
| [Buscar por nome, tag ou norma...] | Disciplina [v] | Status PMOC [v] | Periodicidade [v] | Operação [v]|
+---------------------------------------------------------------------------------------------------------+
```

1. **Campo de Busca Livre:**  
   Digite qualquer termo: nome do equipamento (*ex: Chiller, Transformador, Elevador 03*), nome do engenheiro responsável, código de norma ABNT ou número de ART.
2. **Filtro de Disciplina / Setor:**  
   Permite isolar especialidades: *Elétrica / Sistemas Críticos, Hidráulico, Elevadores e Escadas Rolantes, Gás, Estrutural ou Prevenção Contra Incêndio*.
3. **Filtro de Status PMOC:**  
   Filtra sistemas que já possuem o laudo inserido (`🟢 Conforme`), pendente (`🔴 Pendente`), vencido ou não aplicável.
4. **Filtro de Periodicidade:**  
   Filtra por *Mensal, Bimestral, Trimestral, Semestral, Anual, Personalizado* ou *Conforme Demanda*.
5. **Filtro de Operação (Máquinas):**  
   Filtra entre máquinas que estão em pleno funcionamento ou com parada registrada.
6. **Botão `Limpar Filtros`:**  
   Restaura a visualização completa de todos os sistemas.

---

## 📅 4. Calendário Master: Compreendendo a Tabela Principal

A tabela central é o espelho fiel do plano diretor de engenharia do shopping:

| Coluna | Descrição | O que você pode fazer nela |
| :--- | :--- | :--- |
| **SHOPPING** | Código da unidade (`BSFS` - Boulevard Shopping Feira de Santana). | Informativa. |
| **PROGRAMAÇÃO** | Estado geral do cronograma anual do ativo. | Informativa. |
| **DISCIPLINA** | Categoria técnica do sistema (Elétrica, Ar Condicionado, etc.). | Identificação visual rápida. |
| **SISTEMA / EQUIPAMENTO** | Nome do ativo predial e indicador de máquina parada. | Clique no nome para abrir a **Ficha Completa de Detalhes** do sistema. Se houver ícone de alerta vermelho, indica máquina parada. |
| **RESPONSÁVEL** | Nome do engenheiro ou empresa contratada executante. | Informativa. |
| **PERIODICIDADE** | Resumo da frequência programada (ex: *Mensal*, *Trimestral*, *Mar, Jul, Nov*). | Informativa. |
| **NA (Não Aplica)** | Indica se a rotina é isenta de PMOC formal. | Indicador visual (`SIM` ou `-`). |
| **PMOC / ART** | Botão colorido que indica o status documental legal. | **Clique no botão** para abrir o modal de visualização, download ou anexo de PMOC e ART. |
| **MESES (JAN a DEZ)** | 12 colunas contendo as células de agendamento mensal. | **Clique em qualquer célula de mês** para lançar a execução, alterar status ou anexar ordens de serviço. |
| **AÇÕES** | Botão de lixeira (exclusão). | Exclusão do sistema (requer aprovação de senha `SYSADMIN`). |

### 4.1 Entendendo os Símbolos nas Células dos Meses:

```
[  ▲  ] -> PROGRAMADO (Laranja) : A manutenção deve ser realizada neste mês.
[  ✓  ] -> REALIZADO (Verde)    : Manutenção concluída com laudo ou OS.
[  ✗  ] -> NÃO REALIZADO (Verm.) : Prazo encerrado sem execução.
[  !  ] -> EM ANDAMENTO (Azul)  : Serviço em execução pela equipe/terceira.
[  -  ] -> MÊS SEM PREVISÃO     : Célula vazia (sem programação prevista).
[ 📎 ] -> ÍCONE DE CLIPE        : Indica que há documentos/fotos anexados no mês.
```

---

## 📝 5. Passo a Passo Operacional: Como Executar Cada Tarefa

### 5.1 Cadastrando um Novo Serviço / Sistema de Manutenção

> 💡 **Novo Recurso:** Não é mais necessário escolher termos fixos como "Semestral" ou "Trimestral". Você seleciona livremente quais meses o serviço será realizado!

```
Passo a Passo:
1. Clique no botão [+ Novo Sistema] no topo da tela.
2. Selecione a Disciplina (ex: PREVENÇÃO CONTRA INCÊNDIO).
3. Preencha o Nome do Sistema (ex: "Teste Hidrostático de Mangueiras de Incêndio").
4. Informe se há Pendências do Ano Anterior (opcional).
5. Na seção "Meses de Realização do Serviço", marque diretamente os meses em que
   a atividade deve acontecer:
   • Você pode clicar diretamente nas caixas dos meses desejados (ex: Março e Setembro).
   • Ou usar os atalhos rápidos: [Todos os Meses], [Bimestral], [Trimestral], [Semestral], [Anual (Dez)] ou [Limpar Seleção].
6. Observe o indicador em tempo real ao lado do título: ele mostra exatamente quantos
   meses estão agendados e a periodicidade deduzida automaticamente!
7. Digite a Descrição Técnica e Escopo Preventivo (orientações para a equipe).
8. Se for um item isento de PMOC, marque a opção "Marcar como NA".
9. Clique em [Gravar no Banco de Dados].
```

---

### 5.2 Lançando uma Manutenção Mensal e Anexando Comprovantes

Quando a equipe ou empresa terceira realizar a manutenção preventiva de um mês:

```
Passo a Passo:
1. Localize a linha do equipamento na tabela.
2. Clique na célula correspondente ao mês realizado (ex: linha "Chiller 01", coluna "MAR").
3. O "Modal de Acompanhamento Mensal" será aberto na tela:
   a. Selecione o Status: escolha "Realizado" (ou "Em Andamento", "Não Realizado").
   b. Informe a Data da Execução (ex: 15/03/2026).
   c. Nome do Responsável / Técnico (ex: "Eng. Lucas Silva - Empresa ClimaTech").
   d. Observações Técnicas (resumo dos serviços executados, medições, peças trocadas).
4. Anexo de Documentos Comprobatórios (Laudo, Relatório, Fotos ou OS):
   • Arraste o arquivo em PDF ou imagem para o campo demarcado ou clique para selecionar do computador.
   • Clique em [+ Anexar Documento]. O arquivo aparecerá na lista de anexos do mês.
5. Clique no botão [Salvar Informações do Mês].
6. A célula na tabela se tornará verde com o símbolo de atestado [ ✓ ] e o clipe de anexo [ 📎 ].
```

> ❓ **E se eu clicar em um mês que não estava previsto originalmente?**  
> O sistema exibirá uma mensagem perguntando se você deseja abrir uma **Manutenção Extraordinária / Corretiva**. Se você confirmar, o modal abrirá normalmente e você poderá registrar o serviço normalmente!

---

### 5.3 Anexando o PMOC e a ART do Sistema

O PMOC e a ART são os documentos mestres de responsabilidade técnica perante os órgãos fiscalizadores.

```
Passo a Passo:
1. Na linha do sistema desejado, clique no botão da coluna "PMOC / ART" 
   (se estiver vermelho [Pendente], clique nele).
2. Será exibido o modal de auditoria legal do sistema:
   a. Informe o Número da ART/TRT registrada no CREA/CFT (ex: "ART-BA-2026-98124").
   b. Nome do Responsável Técnico Habilitado.
   c. Registro Profissional (número do CREA ou CFT).
   d. Data de Validade da ART (o sistema alertará se estiver próxima de vencer).
   e. Arraste ou selecione o arquivo do PMOC em PDF.
   f. Arraste ou selecione o arquivo da ART em PDF.
3. Clique em [Salvar e Autenticar Documentos].
4. O botão na tabela mudará imediatamente para VERDE [Conforme], e o medidor de
   conformidade geral do shopping será recalculado para cima em tempo real.
```

---

### 5.4 Reportando e Gerenciando "Máquina Parada"

Se algum equipamento quebrar ou necessitar de intervenção de emergência:

```
Passo a Passo:
1. Na tabela, localize a coluna "Sistema / Equipamento" e clique no botão [Reportar Parada]
   ou clique no ícone de engrenagem do ativo.
2. Marque a opção "Equipamento com Parada Crítica em Andamento".
3. Preencha os campos obrigatórios:
   • Qual máquina ou componente parou (ex: "Compressor B do Chiller 02").
   • Motivo da parada (ex: "Queima do contator elétrico principal").
   • Data da paralisação.
   • Previsão de retorno à operação.
   • Observações / Peças já solicitadas.
4. Clique em [Gravar Status de Operação].
5. O sistema receberá um destaque em vermelho na tabela e o contador de máquinas paradas
   no topo da tela alertará toda a equipe.
6. Assim que a máquina voltar a operar, basta abrir o mesmo modal, desmarcar a opção e salvar.
```

---

### 5.5 Exportando Dados em Planilha (CSV / Excel)

No canto inferior ou no menu superior de ferramentas:
- Clique no botão **`Exportar CSV`**.
- O sistema gerará instantaneamente um arquivo compatível com o Microsoft Excel contendo todos os 40 sistemas, responsáveis técnicos, periodicidades, status de cada um dos 12 meses e status do PMOC.

---

## 🛡️ 6. Boas Práticas e Regras de Engenharia do Boulevard

1. **Nunca deixe de anexar a Ordem de Serviço (OS):**  
   Ao marcar uma manutenção como `Realizada`, anexe sempre o relatório assinado ou a foto da medição. É isso que resguarda a equipe em caso de vistorias prediais.
2. **Atualização em Tempo Real:**  
   Não acumule lançamentos para o final do mês. Assim que a empresa terceira finalizar a rotina, lance no sistema para manter o painel executivo atualizado para a gerência geral.
3. **Validade das ARTs:**  
   Fique atento aos alertas de validade de ART. Renovações de contratos com empresas de elevadores, geradores e ar condicionado exigem nova ART emitida no início de cada ciclo.

---
*Manual elaborado pela Equipe de Tecnologia e Engenharia — Boulevard Shopping Feira de Santana.*
