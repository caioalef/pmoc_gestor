const INITIAL_SYSTEMS_DATA = [
  // --- DISCIPLINA: ELÉTRICA / SISTEMAS CRÍTICOS ---
  {
    id: 'elet-1',
    category: 'ELETRICA',
    categoryName: 'ELÉTRICA / SISTEMAS CRÍTICOS',
    name: 'Paineis elétricos - Sistema Críticos',
    periodicity: 'Bimestral',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 5410, NR-10, NR-12',
    description: 'Inspeção termográfica detalhada, reaperto com torquímetro calibrado, verificação de aquecimento em barramentos e testes de disjuntores de entrada e saídas de cargas prioritárias do shopping.',
    pmoc: { attached: false },
    months: {}
    }
  },
  {
    id: 'elet-2',
    category: 'ELETRICA',
    categoryName: 'ELÉTRICA / SISTEMAS CRÍTICOS',
    name: 'Painel de QGBT/QTA e Banco de capacitores (externo)',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 5410, IEC 60439',
    description: 'Manutenção preventiva e corretiva anual do Quadro Geral de Baixa Tensão, Quadro de Transferência Automática rede/gerador e células capacitivas para correção de fator de potência.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'elet-3',
    category: 'ELETRICA',
    categoryName: 'ELÉTRICA / SISTEMAS CRÍTICOS',
    name: 'Busway',
    periodicity: 'Anual',
    pendencias: '',
    na: true, // Conforme foto do modelo
    standards: 'ABNT NBR IEC 60439-2',
    description: 'Barramento blindado para distribuição de alta amperagem. Não aplicável para esta instalação específica.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'elet-4',
    category: 'ELETRICA',
    categoryName: 'ELÉTRICA / SISTEMAS CRÍTICOS',
    name: 'SPDA',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 5419:2015 Partes 1 a 4',
    description: 'Sistema de Proteção contra Descargas Atmosféricas e Malha de Aterramento. Medição ôhmica de aterramento, continuidade das descidas, gaiola de Faraday e captores.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'elet-5',
    category: 'ELETRICA',
    categoryName: 'ELÉTRICA / SISTEMAS CRÍTICOS',
    name: 'Teste de nobreaks',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 15014, NR-10',
    description: 'Ensaio com carga real/resistiva de bancos de nobreaks UPS centrais da automação e CFTV, verificação de ripple e baterias.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'elet-6',
    category: 'ELETRICA',
    categoryName: 'ELÉTRICA / SISTEMAS CRÍTICOS',
    name: 'Teste de baterias',
    periodicity: 'Trimestral',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 14197, NBR 14198',
    description: 'Medição da condutância interna, impedância e tensão individual de flutuação dos acumuladores dos grupos geradores e nobreaks.',
    pmoc: { attached: false },
    months: {}
    }
  },

  // --- DISCIPLINA: HIDRÁULICO / HIDROSSANITÁRIAS ---
  {
    id: 'hid-1',
    category: 'HIDRAULICO',
    categoryName: 'HIDRÁULICO / HIDROSSANITÁRIAS',
    name: 'Bombas de recalque (Esgoto / Pluvial)',
    periodicity: 'Mensal',
    pendencias: '',
    na: true,
    standards: 'ABNT NBR 5626, NBR 8160',
    description: 'Conjuntos motobombas submersíveis de esgoto e águas pluviais do fosso de recalque.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'hid-2',
    category: 'HIDRAULICO',
    categoryName: 'HIDRÁULICO / HIDROSSANITÁRIAS',
    name: 'Bombas de pressurização - Análise de Vibração',
    periodicity: 'Semestral',
    pendencias: '',
    na: false,
    standards: 'ISO 10816-3',
    description: 'Análise preditiva de vibração espectral nos mancais das motobombas e motores de pressurização de água potável.',
    pmoc: { attached: false },
    months: {}
    }
  },
  {
    id: 'hid-3',
    category: 'HIDRAULICO',
    categoryName: 'HIDRÁULICO / HIDROSSANITÁRIAS',
    name: 'Limpeza dos Reservatórios',
    periodicity: 'Semestral',
    pendencias: '',
    na: false,
    standards: 'Portaria GM/MS nº 888, CVS-5',
    description: 'Higienização, desinfecção com cloro ativo e laudo bacteriológico e físico-químico da água das caixas superior e inferior do shopping.',
    pmoc: { attached: false },
    months: {}
    }
  },
  {
    id: 'hid-4',
    category: 'HIDRAULICO',
    categoryName: 'HIDRÁULICO / HIDROSSANITÁRIAS',
    name: 'Manutenção ETE/ETAR',
    periodicity: 'Mensal',
    pendencias: '',
    na: true,
    standards: 'Resolução CONAMA nº 430',
    description: 'Estação de Tratamento de Efluentes Sanitários e Água de Reúso.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'hid-5',
    category: 'HIDRAULICO',
    categoryName: 'HIDRÁULICO / HIDROSSANITÁRIAS',
    name: 'Manutenção ETA',
    periodicity: 'Mensal',
    pendencias: '',
    na: false,
    standards: 'Portaria Ministério da Saúde 888',
    description: 'Estação de Tratamento de Água (dosagem de produtos químicos e retrolavagem de leitos filtrantes).',
    pmoc: { attached: false },
    months: {}
    }
  },

  // --- DISCIPLINA: ELEVADORES E ESCADAS ROLANTES ---
  {
    id: 'elev-1',
    category: 'ELEVADORES',
    categoryName: 'ELEVADORES E ESCADAS ROLANTES',
    name: 'Elevadores',
    periodicity: 'Mensal',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR NM 207, NM 313',
    description: 'Manutenção preventiva mensal obrigatória dos elevadores sociais e de serviço, freios de emergência, portas e cabos de tração.',
    pmoc: { attached: false },
    months: {}
    }
  },
  {
    id: 'elev-2',
    category: 'ELEVADORES',
    categoryName: 'ELEVADORES E ESCADAS ROLANTES',
    name: 'Escadas Rolantes',
    periodicity: 'Mensal',
    pendencias: '',
    na: true,
    standards: 'ABNT NBR NM 195',
    description: 'Escadas rolantes e esteiras mecânicas de circulação do público.',
    pmoc: { attached: false },
    months: {}
  },

  // --- DISCIPLINA: GÁS ---
  {
    id: 'gas-1',
    category: 'GAS',
    categoryName: 'GÁS',
    name: 'Teste de Estanqueidade de Gás',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 15526, NBR 15358',
    description: 'Ensaio pneumático com manômetro diferencial calibrado para teste de vazamentos na rede de GLP/GN da praça de alimentação.',
    pmoc: { attached: false },
    months: {}
  },

  // --- DISCIPLINA: ESTRUTURAL ---
  {
    id: 'est-1',
    category: 'ESTRUTURAL',
    categoryName: 'ESTRUTURAL',
    name: 'Talude',
    periodicity: 'Conforme Instrutivo',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 11682',
    description: 'Vistoria geotécnica periódica de encostas e contenção do estacionamento externo.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'est-2',
    category: 'ESTRUTURAL',
    categoryName: 'ESTRUTURAL',
    name: 'Cobertura',
    periodicity: 'Semestral',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 9575, NBR 9574',
    description: 'Inspeção minuciosa das mantas impermeabilizantes, telhas metálicas, calhas e rufos contra infiltrações.',
    pmoc: { attached: false },
    months: {}
  },

  // --- DISCIPLINA: PREVENÇÃO CONTRA INCÊNDIO ---
  {
    id: 'inc-1',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Aferição dos pressostatos',
    periodicity: 'Semestral',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 10897, NBR 13714',
    description: 'Calibração dos pressostatos das bombas Jockey e Principal de combate a incêndio.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-2',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Aferição dos manômetros',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 14105-1',
    description: 'Calibração em bancada com padrão RBC dos manômetros dos barriletes de incêndio.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-3',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Bombas de SPK e Hidrantes',
    periodicity: 'Mensal',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 13714, IT-22 CB',
    description: 'Acionamento semanal e ensaio funcional mensal das motobombas de Sprinklers e Hidrantes.',
    pmoc: { attached: false },
    months: {}
    }
  },
  {
    id: 'inc-4',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Bombas de SPK e Hidrantes - Análise de Vibração',
    periodicity: 'Semestral',
    pendencias: '',
    na: false,
    standards: 'ISO 10816-3',
    description: 'Análise de vibração preditiva dos mancais das motobombas de incêndio.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-5',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Pressurização de escadas e extração de fumaça',
    periodicity: 'Bimestral',
    pendencias: '',
    na: true,
    standards: 'ABNT NBR 14880, IT-13 CB',
    description: 'Ventiladores centrífugos de pressurização das rotas de fuga do shopping.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-6',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Pressurização de escadas e extração de fumaça',
    periodicity: 'Anual',
    pendencias: '',
    na: true,
    standards: 'ABNT NBR 14880',
    description: 'Ensaio de diferencial estático de pressão com portas abertas e fechadas.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-7',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Detecção de fumaça',
    periodicity: 'Mensal',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 7240, IT-19 CB',
    description: 'Teste funcional com gás aerossol nos detectores de fumaça e acionadores manuais dos malls e lojas.',
    pmoc: { attached: false },
    months: {}
    }
  },
  {
    id: 'inc-8',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Teste de hidrantes (com água)',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 13714',
    description: 'Ensaio prático com mangueira desenrolada, medição de pressão residual e vazão dinâmica.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-9',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Teste hidrostático em mangueiras de incêndio',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 12779',
    description: 'Ensaio de estanqueidade e pressão de ruptura hidrostática com laudo individual.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-10',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Certificado de Recarga de Extintores',
    periodicity: 'Anual',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 12962, Portaria INMETRO',
    description: 'Inspeção de 1º, 2º e 3º níveis dos extintores portáteis e carretas de PQS, CO2 e Água com selo INMETRO.',
    pmoc: { attached: false },
    months: {}
  },
  {
    id: 'inc-11',
    category: 'INCENDIO',
    categoryName: 'PREVENÇÃO CONTRA INCÊNDIO',
    name: 'Verificação dos registro de SPK (lojas)',
    periodicity: 'Trimestral',
    pendencias: '',
    na: false,
    standards: 'ABNT NBR 10897',
    description: 'Vistoria e checagem visual das válvulas de governo e registros de gaveta abertos e lacrados dos ramais de sprinkler das lojas.',
    pmoc: { attached: false },
    months: {}
    }
  }
];

/* ==========================================================================
   4. Classe Principal da Aplicação
   ========================================================================== */