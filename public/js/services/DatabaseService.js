class DatabaseService {
  constructor() {
    this.systemsKey = 'bsfs_db_systems_v2';
    this.auditKey = 'bsfs_db_audit_logs';
  }

  /* ==========================================================================
     Sistemas e Cronograma (MariaDB + Cache Local)
     ========================================================================== */

  /**
   * Retorna os sistemas do cache local para renderização imediata sem travar a interface.
   */
  getSystems() {
    try {
      const data = localStorage.getItem(this.systemsKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar banco de dados local:', e);
    }
    // Dados padrão iniciais
    if (typeof INITIAL_SYSTEMS_DATA !== 'undefined') {
      return JSON.parse(JSON.stringify(INITIAL_SYSTEMS_DATA));
    }
    return [];
  }

  /**
   * Sincroniza e busca a versão mais recente dos sistemas no MariaDB via API.
   */
  async fetchSystemsFromAPI() {
    try {
      const res = await fetch('/api/systems');
      if (res.ok) {
        const systems = await res.json();
        if (Array.isArray(systems) && systems.length > 0) {
          localStorage.setItem(this.systemsKey, JSON.stringify(systems));
          return systems;
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] Falha ao sincronizar com MariaDB (usando cache local):', err.message);
    }
    return this.getSystems();
  }

  /**
   * Salva os sistemas no MariaDB via API e atualiza o cache local.
   */
  async saveSystems(systems) {
    try {
      // 1. Atualização otimista no cache local
      localStorage.setItem(this.systemsKey, JSON.stringify(systems));

      // 2. Persistência real no MariaDB via API
      const res = await fetch('/api/systems', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(systems)
      });

      if (!res.ok) {
        console.warn('[DatabaseService] Servidor retornou erro ao salvar no MariaDB:', res.statusText);
      }
      return true;
    } catch (e) {
      console.error('Erro ao salvar sistemas no MariaDB:', e);
      return false;
    }
  }

  /* ==========================================================================
     Logs de Auditoria (MariaDB + Cache Local)
     ========================================================================== */

  getAuditLogs() {
    try {
      const logs = localStorage.getItem(this.auditKey);
      if (logs) {
        return JSON.parse(logs);
      }
    } catch (e) {
      console.warn('Erro ao ler logs de auditoria locais:', e);
    }
    return [];
  }

  async fetchAuditLogsFromAPI() {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const logs = await res.json();
        if (Array.isArray(logs)) {
          localStorage.setItem(this.auditKey, JSON.stringify(logs));
          return logs;
        }
      }
    } catch (err) {
      console.warn('[DatabaseService] Falha ao buscar logs no MariaDB:', err.message);
    }
    return this.getAuditLogs();
  }

  async logOperation(action, actionType, details, user, authorizedBy = null) {
    try {
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      let detailsFinal = details;
      if (authorizedBy) {
        detailsFinal += ` [Autorizado por: ${authorizedBy.email || authorizedBy.name} (${authorizedBy.group || authorizedBy.role || 'SYSADMIN'})]`;
      }

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: timestamp,
        user: (user && (user.email || user.username || user.name)) || 'sistema@boulevardfs.com.br',
        group: (user && (user.role || user.primaryRole || user.group)) || 'BSFS_OPE_SYSUSER',
        action: action,
        actionType: actionType, // 'create', 'update', 'delete'
        details: detailsFinal
      };

      // 1. Atualizar cache local
      const logs = this.getAuditLogs();
      logs.unshift(newLog);
      localStorage.setItem(this.auditKey, JSON.stringify(logs.slice(0, 150)));

      // 2. Persistir no MariaDB
      fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(newLog)
      }).catch(err => console.warn('[DatabaseService] Falha ao enviar log para MariaDB:', err.message));

      return newLog;
    } catch (e) {
      console.error('Erro ao registrar log de auditoria:', e);
      return null;
    }
  }

  async clearLogs() {
    localStorage.removeItem(this.auditKey);
    try {
      await fetch('/api/audit-logs', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
    } catch (e) {
      console.warn('[DatabaseService] Falha ao limpar logs no MariaDB:', e.message);
    }
  }
}