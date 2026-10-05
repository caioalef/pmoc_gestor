const INITIAL_SYSTEMS_DATA = [
  {
    "id": "sys-1",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Chiller/Centrifugas Anual",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_NOT_INSERTED",
    "pmocStatusLabel": "Documentação obrigatória não inserida",
    "months": {
      "6": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      }
    }
  },
  {
    "id": "sys-2",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Dutos de refrigeração / ventilação",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Anual",
    "na": true,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "",
    "months": {}
  },
  {
    "id": "sys-3",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Cabine primária / SE",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-4",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Painel de QGBT/QTA e Banco de capacitores (externo)",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-5",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Busway",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Anual",
    "na": true,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "",
    "months": {}
  },
  {
    "id": "sys-6",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "SPDA",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-7",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Teste de nobreaks",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-8",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Aferição dos manômetros",
    "respTecnico": "Renato Santos",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      }
    }
  },
  {
    "id": "sys-9",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Pressurização de escadas e extração de fumaça",
    "respTecnico": "Renato Santos",
    "periodicity": "Anual",
    "na": true,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "",
    "months": {}
  },
  {
    "id": "sys-10",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Teste de hidrantes (com água)",
    "respTecnico": "Renato Santos",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      }
    }
  },
  {
    "id": "sys-11",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Teste hidrostático em mangueiras de incêndio",
    "respTecnico": "Renato Santos",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_EXPIRED",
    "pmocStatusLabel": "Documentação obrigatória inserida com data de validade vencida",
    "months": {
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-12",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Certificado de Recarga de Extintores",
    "respTecnico": "Renato Santos",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-13",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "GÁS",
    "categoryName": "GÁS",
    "name": "Teste de Estanqueidade de Gás",
    "respTecnico": "Renato Santos",
    "periodicity": "Anual",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "6": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      }
    }
  },
  {
    "id": "sys-14",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Painéis elétricos - Sistema Críticos",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Bimestral",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-15",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Pressurização de escadas e extração de fumaça",
    "respTecnico": "Renato Santos",
    "periodicity": "Bimestral",
    "na": true,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "",
    "months": {}
  },
  {
    "id": "sys-16",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Chiller/Centrifugas Conforme Instrutivo",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Conforme Instrutivo",
    "na": false,
    "pmocStatus": "REQUIRED_NOT_INSERTED",
    "pmocStatusLabel": "Documentação obrigatória não inserida",
    "months": {
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-17",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ESTRUTURAL",
    "categoryName": "ESTRUTURAL",
    "name": "Talude",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Conforme Instrutivo",
    "na": false,
    "pmocStatus": "REQUIRED_NOT_INSERTED",
    "pmocStatusLabel": "Documentação obrigatória não inserida",
    "months": {
      "4": {
        "scheduled": true,
        "status": "UNREALIZED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-18",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Tratamento de AG e AC",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-19",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Fan coils/UTA/Ventiladores/Exaustores/Selfs/Roof top/Split",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-20",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Limpeza dos filtros de linha de AG e AC",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-21",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Gerador de emergência e ponta (teste)",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-22",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "HIDRÁULICO",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Bombas de recalque (Esgoto / Pluvial)",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": true,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "",
    "months": {}
  },
  {
    "id": "sys-23",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "HIDRÁULICO",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Manutenção ETE/ETAR",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": true,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "",
    "months": {}
  },
  {
    "id": "sys-24",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "HIDRÁULICO",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Manutenção ETA",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-25",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Bombas de SPK e Hidrantes",
    "respTecnico": "Renato Santos",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-26",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Detecção de fumaça",
    "respTecnico": "Renato Santos",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-27",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELEVADORES",
    "categoryName": "ELEVADORES E ESCADAS ROLANTES",
    "name": "Elevadores",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "6": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "9": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "12": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-28",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELEVADORES",
    "categoryName": "ELEVADORES E ESCADAS ROLANTES",
    "name": "Escadas Rolantes",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Mensal",
    "na": true,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "",
    "months": {}
  },
  {
    "id": "sys-29",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Gerador de emergência e ponta (manutenção)",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Quadrimestral",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "3": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-30",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Torre de resfriamento",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "REQUIRED_NOT_INSERTED",
    "pmocStatusLabel": "Documentação obrigatória não inserida",
    "months": {
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-31",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Bombas de AG e AC",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-32",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Teste de Qualidade de Ar",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "REQUIRED_NOT_INSERTED",
    "pmocStatusLabel": "Documentação obrigatória não inserida",
    "months": {
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-33",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Termografia (BT/MT)",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-34",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "HIDRÁULICO",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Bombas de pressurização - Análise de Vibração",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "REQUIRED_NOT_INSERTED",
    "pmocStatusLabel": "Documentação obrigatória não inserida",
    "months": {
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-35",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "HIDRÁULICO",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Limpeza dos Reservatórios",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "REQUIRED_NOT_INSERTED",
    "pmocStatusLabel": "Documentação obrigatória não inserida",
    "months": {
      "1": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "7": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-36",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Aferição dos pressostatos",
    "respTecnico": "Renato Santos",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-37",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Bombas de SPK e Hidrantes - Análise de Vibração",
    "respTecnico": "Renato Santos",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "REQUIRED_ATTACHED",
    "pmocStatusLabel": "Documentação obrigatória inserida sem pendência",
    "months": {
      "4": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "10": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-38",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ESTRUTURAL",
    "categoryName": "ESTRUTURAL",
    "name": "Cobertura",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Semestral",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-39",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Teste de baterias",
    "respTecnico": "Pedro Lucas",
    "periodicity": "Trimestral",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  },
  {
    "id": "sys-40",
    "shopping": "BSFS",
    "programacao": "Finalizada",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Verificação dos registro de SPK (lojas)",
    "respTecnico": "Renato Santos",
    "periodicity": "Trimestral",
    "na": false,
    "pmocStatus": "NOT_REQUIRED",
    "pmocStatusLabel": "Não exigido",
    "months": {
      "2": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "5": {
        "scheduled": true,
        "status": "DONE",
        "documents": []
      },
      "8": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      },
      "11": {
        "scheduled": true,
        "status": "SCHEDULED",
        "documents": []
      }
    }
  }
];
