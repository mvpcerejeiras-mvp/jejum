# Dashboard Analytics (Relógio de Oração & Jejum)

## Visão Geral
Criação dos gráficos de acompanhamento baseados na referência (Termômetro da Semana, Modalidades Escolhidas, Horário de Início).

## Fase 1: Análise e Discovery (Socratic Gate)
Aguardando respostas do usuário para as seguintes questões estratégicas:

1. **Origem dos Dados (`participations`)**: 
   Os dados para os gráficos devem ser consultados "ao vivo" a partir da tabela `participations`? Existe alguma lógica específica de agrupamento (ex: apenas participações ativas da campanha atual) que devemos seguir?

2. **Diretriz de Design (The "Purple Ban" check)**:
   A referência enviada usa gradientes azul/roxo (ex: a barra de "TER"). O nosso manual `.agent/agents/frontend-specialist.md` tem uma regra estrita ("Purple Ban") desencorajando roxo/violeta genérico a menos que seja intencional e premium. Devemos seguir exatamente o esquema de cores da imagem ou adaptar para a paleta principal do projeto (mantendo o aspecto premium/Dark Mode)?

3. **Posicionamento na UI**:
   Estes gráficos de análise devem ser integrados diretamente na página `AdminDashboard.tsx` principal (talvez no topo) ou devemos criar uma visualização separada/aba específica (ex: `AnalyticsDashboard`) para não sobrecarregar a visão principal dos administradores?

## Fase 2: Planejamento Backend (Pendente)
- [ ] Criação de query/função Supabase para cruzar dados.
- [ ] Endpoint/Hook para retornar os agrupamentos (por dia, por modalidade, por horário).

## Fase 3: UI/Frontend (Pendente)
- [ ] Componente `TermometroSemana` (Gráfico de barras vertical)
- [ ] Componente `ModalidadesEscolhidas` (Barras de progresso horizontal)
- [ ] Componente `HorarioInicio` (Barras de progresso horizontal)
- [ ] Integração no Dashboard.
