const INITIAL_SYSTEMS_DATA = [
  {
    "id": "sys-1",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Chiller/Centrifugas Anual",
    "periodicity": "Anual",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-2",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Dutos de refrigeração / ventilação",
    "periodicity": "Anual",
    "respTecnico": "Pedro Lucas",
    "na": true,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {}
  },
  {
    "id": "sys-3",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Cabine primária / SE",
    "periodicity": "Anual",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-4",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Painel de QGBT/QTA e Banco de capacitores (externo)",
    "periodicity": "Anual",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-5",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Busway  ",
    "periodicity": "Anual",
    "respTecnico": "Pedro Lucas",
    "na": true,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {}
  },
  {
    "id": "sys-6",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "SPDA  ",
    "periodicity": "Anual",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-7",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Teste de nobreaks",
    "periodicity": "Anual",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-8",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Aferição dos manômetros",
    "periodicity": "Anual",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-9",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Pressurização de escadas e extração de fumaça",
    "periodicity": "Anual",
    "respTecnico": "Renato Santos",
    "na": true,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {}
  },
  {
    "id": "sys-10",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Teste de hidrantes (com água)",
    "periodicity": "Anual",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-11",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Teste hidrostático em mangueiras de incêndio",
    "periodicity": "Anual",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-12",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Certificado de Recarga de Extintores",
    "periodicity": "Anual",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-13",
    "category": "GÁS",
    "categoryName": "GÁS",
    "name": "Teste de Estanqueidade de Gás",
    "periodicity": "Anual",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-14",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Paineis elétricos - Sistema Críticos",
    "periodicity": "Bimestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-15",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Pressurização de escadas e extração de fumaça",
    "periodicity": "Bimestral",
    "respTecnico": "Renato Santos",
    "na": true,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {}
  },
  {
    "id": "sys-16",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Chiller/Centrifugas Conforme Instrutivo",
    "periodicity": "Conforme Instrutivo",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-17",
    "category": "ESTRUTURAL",
    "categoryName": "ESTRUTURAL",
    "name": "Talude",
    "periodicity": "Conforme Instrutivo",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-18",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Tratamento de AG e AC",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-19",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Fan coils/UTA/Ventiladores/ Exaustores/Selfs/Roof top/Split",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-20",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Limpeza dos filtros de linha de AG e AC",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-21",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Gerador de emergência e ponta (teste)",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-22",
    "category": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Bombas de recalque (Esgoto / Pluvial)",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": true,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {}
  },
  {
    "id": "sys-23",
    "category": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Manutenção ETE/ETAR",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": true,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {}
  },
  {
    "id": "sys-24",
    "category": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Manutenção ETA",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-25",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Bombas de SPK e Hidrantes",
    "periodicity": "Mensal",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-26",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Detecção de fumaça",
    "periodicity": "Mensal",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-27",
    "category": "ELEVADORES_E_ESCADAS_ROLANTES",
    "categoryName": "ELEVADORES E ESCADAS ROLANTES",
    "name": "Elevadores",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-28",
    "category": "ELEVADORES_E_ESCADAS_ROLANTES",
    "categoryName": "ELEVADORES E ESCADAS ROLANTES",
    "name": "Escadas Rolantes",
    "periodicity": "Mensal",
    "respTecnico": "Pedro Lucas",
    "na": true,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {}
  },
  {
    "id": "sys-29",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Gerador de emergência e ponta (manutenção)",
    "periodicity": "Quadrimestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-30",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Torre de resfriamento",
    "periodicity": "Semestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-31",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Bombas de AG e AC",
    "periodicity": "Semestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-32",
    "category": "AR_CONDICIONADO",
    "categoryName": "AR CONDICIONADO",
    "name": "Teste de Qualidade do Ar",
    "periodicity": "Semestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-33",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Termografia (BT/MT)",
    "periodicity": "Semestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-34",
    "category": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Bombas de pressurização - Análise de Vibração",
    "periodicity": "Semestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-35",
    "category": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "categoryName": "HIDRÁULICO/HIDROSSANITÁRIAS",
    "name": "Limpeza dos Reservatórios",
    "periodicity": "Semestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "1": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "7": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-36",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Aferição dos pressostatos",
    "periodicity": "Semestral",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-37",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Bombas de SPK e Hidrantes – Análise de Vibração  ",
    "periodicity": "Semestral",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "4": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "10": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-38",
    "category": "ESTRUTURAL",
    "categoryName": "ESTRUTURAL",
    "name": "Cobertura",
    "periodicity": "Semestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-39",
    "category": "ELÉTRICO",
    "categoryName": "ELÉTRICO",
    "name": "Teste de baterias",
    "periodicity": "Trimestral",
    "respTecnico": "Pedro Lucas",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "3": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "6": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "9": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "12": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  },
  {
    "id": "sys-40",
    "category": "PREVENÇÃO_CONTRA_INCÊNDIO",
    "categoryName": "PREVENÇÃO CONTRA INCÊNDIO",
    "name": "Verificação dos registro de SPK (lojas)",
    "periodicity": "Trimestral",
    "respTecnico": "Renato Santos",
    "na": false,
    "standards": "SLA Boulevard",
    "description": "",
    "pmoc": {
      "attached": false
    },
    "equipamentoParado": {
      "isParado": false,
      "dataParada": null
    },
    "months": {
      "2": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "5": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "8": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      },
      "11": {
        "scheduled": true,
        "status": "PENDING",
        "executedDate": null,
        "executionReport": null,
        "justification": null
      }
    }
  }
];
