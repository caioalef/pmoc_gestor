class DatabaseService {
  constructor() {
    this.systemsKey = 'bsfs_db_systems_v2';
    this.auditKey = 'bsfs_db_audit_logs';
  }

  getSystems() {
    try {
      const data = localStorage.getItem(this.systemsKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar banco de dados local:', e);
    }
    // Dados padrão iniciais (Fiel aos modelos)
    return JSON.parse(JSON.stringify(INITIAL_SYSTEMS_DATA));
  }

  saveSystems(systems) {
    try {
      localStorage.setItem(this.systemsKey, JSON.stringify(systems));
      return true;
    } catch (e) {
      console.error('Erro ao salvar sistemas no banco de dados:', e);
      return false;
    }
  }

  getAuditLogs() {
    try {
      const logs = localStorage.getItem(this.auditKey);
      if (logs) {
        return JSON.parse(logs);
      }
    } catch (e) {
      console.warn('Erro ao ler logs de auditoria:', e);
    }
    // Logs iniciais de demonstração
    return [
      {
        id: 'log-01',
        timestamp: '2025-01-15 09:30:12',
        user: 'emily.farias@boulevardfs.com.br',
        group: 'BSFS_OPE_SYSADMIN',
        action: 'CRIAR_SISTEMA',
        actionType: 'create',
        details: 'Carga inicial do Cronograma Master de Manutenções do Boulevard Shopping Feira de Santana.'
      },
      {
        id: 'log-02',
        timestamp: '2025-01-18 14:15:40',
        user: 'emily.farias@boulevardfs.com.br',
        group: 'BSFS_OPE_SYSADMIN',
        action: 'ANEXAR_PMOC_ART',
        actionType: 'update',
        details: 'Anexação de PMOC e ART (CREA 5062831) para o sistema SPDA.'
      }
    ];
  }

  logOperation(action, actionType, details, user, authorizedBy = null) {
    try {
      const logs = this.getAuditLogs();
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      let detailsFinal = details;
      if (authorizedBy) {
        detailsFinal += ` [Autorizado por: ${authorizedBy.email} (${authorizedBy.group})]`;
      }

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: timestamp,
        user: user.email,
        group: user.primaryRole,
        action: action,
        actionType: actionType, // 'create', 'update', 'delete'
        details: detailsFinal
      };

      logs.unshift(newLog);
      localStorage.setItem(this.auditKey, JSON.stringify(logs.slice(0, 150))); // Manter os 150 logs mais recentes
      return newLog;
    } catch (e) {
      console.error('Erro ao registrar log de auditoria:', e);
      return null;
    }
  }

  clearLogs() {
    localStorage.removeItem(this.auditKey);
  }
}

/* ==========================================================================
   3. Base de Dados Inicial dos 27 Sistemas (Boulevard Shopping Feira de Santana)
   ========================================================================== */