class DatabaseService {
  constructor() {
    this.systemsKey = 'bsfs_db_systems_v4';
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
      const token = localStorage.getItem('auth_token') || '';
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/systems', { headers });
      if (res.ok) {
        const systems = await res.json();
        if (Array.isArray(systems) && systems.length > 0) {
          localStorage.setItem(this.systemsKey, JSON.stringify(systems));
          return systems;
        }
      } else {
        console.warn(`[DatabaseService] GET /api/systems retornou status ${res.status}`);
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
      const token = localStorage.getItem('auth_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/systems', {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(systems)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error || `Erro HTTP ${res.status}: ${res.statusText}`;
        console.error('[DatabaseService] Servidor retornou erro ao salvar no MariaDB:', msg);
        throw new Error(msg);
      }

      // Persistência confirmada pelo banco: atualiza cache local
      localStorage.setItem(this.systemsKey, JSON.stringify(systems));
      return true;
    } catch (e) {
      console.error('[DatabaseService] Erro ao salvar sistemas no MariaDB:', e);
      throw e;
    }
  }

  /**
   * Salva um único sistema de forma atômica no MariaDB (mais rápido e sem conflitos)
   */
  async saveSingleSystem(system) {
    if (!system || !system.id) return false;
    try {
      const token = localStorage.getItem('auth_token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/systems/${encodeURIComponent(system.id)}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(system)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error || `Erro HTTP ${res.status}: ${res.statusText}`;
        console.error(`[DatabaseService] Servidor retornou erro ao salvar sistema ${system.id}:`, msg);
        throw new Error(msg);
      }

      // Atualiza o sistema modificado no cache local
      const local = this.getSystems();
      const idx = local.findIndex(s => s.id === system.id);
      if (idx !== -1) {
        local[idx] = system;
      } else {
        local.push(system);
      }
      localStorage.setItem(this.systemsKey, JSON.stringify(local));
      return true;
    } catch (e) {
      console.error(`[DatabaseService] Erro ao salvar sistema ${system.id}:`, e);
      throw e;
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
        group: (user && (user.roleLabel || user.role)) || 'Operador',
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