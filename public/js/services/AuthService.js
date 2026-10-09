/* ==========================================================================
   1. Active Directory LDAP & Local Authentication Service
   ========================================================================== */
class AuthService {
  constructor() {
    this.usersKey = 'bsfs_db_users';
    this.defaultUsers = {
      'admin.teste': {
        username: 'admin.teste',
        name: 'Administrador Local (Homologação)',
        email: 'admin.teste@boulevardfs.com.br',
        role: 'SUPERADMIN',
        roleLabel: 'Administrador de Domínio (Contingência)',
        password: 'admin',
        canInsert: true,
        canDelete: true
      },
      'operador.teste': {
        username: 'operador.teste',
        name: 'Operador Local (Homologação)',
        email: 'operador.teste@boulevardfs.com.br',
        role: 'USER',
        roleLabel: 'Operador de Sistemas (Contingência)',
        password: '123',
        canInsert: true,
        canDelete: false
      }
    };
    this.users = this.loadUsers();

    // Carrega usuário salvo da sessão
    const savedUser = localStorage.getItem('auth_current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  loadUsers() {
    let stored = {};
    try {
      const data = localStorage.getItem(this.usersKey);
      if (data) {
        stored = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar usuarios locais:', e);
    }
    return { ...this.defaultUsers, ...stored };
  }

  saveUsers() {
    localStorage.setItem(this.usersKey, JSON.stringify(this.users));
  }

  /**
   * Realiza login no Active Directory via backend /api/auth/login
   * com fallback local caso a API esteja temporariamente offline.
   */
  async login(username, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        data = {
          success: false,
          error: `Erro no servidor web (Status HTTP ${response.status} - ${response.statusText}). O container da API pode estar iniciando ou fora do ar.`
        };
      }

      if (response.ok && data.success) {
        this.currentUser = data.user;
        localStorage.setItem('auth_current_user', JSON.stringify(data.user));
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        return { success: true, user: data.user };
      } else {
        return {
          success: false,
          error: data.error || `Falha na autenticação (HTTP ${response.status})`
        };
      }
    } catch (netErr) {
      console.warn('[AuthService] Backend API indisponível, tentando autenticação local de contingência:', netErr.message);

      // Contingência local se a API estiver fora do ar
      const cleanUser = username.toLowerCase().trim();
      if (this.users[cleanUser] && this.users[cleanUser].password === password) {
        this.currentUser = this.users[cleanUser];
        localStorage.setItem('auth_current_user', JSON.stringify(this.currentUser));
        return { success: true, user: this.currentUser, fallback: true };
      }

      return {
        success: false,
        error: 'Servidor de autenticação inacessível. Verifique a conexão com o servidor e o AD.'
      };
    }
  }

  async validateSession() {
    const token = this.getToken();
    if (!token) {
      this.currentUser = null;
      localStorage.removeItem('auth_current_user');
      return false;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user && (data.user.role === 'SUPERADMIN' || data.user.role === 'USER')) {
          this.currentUser = data.user;
          localStorage.setItem('auth_current_user', JSON.stringify(data.user));
          return true;
        }
      }
    } catch (e) {
      console.warn('Erro ao validar sessão no servidor:', e);
    }
    this.logout();
    return false;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('auth_current_user');
    localStorage.removeItem('auth_token');
  }

  getToken() {
    return localStorage.getItem('auth_token') || '';
  }

  getCurrentUser() {
    return this.currentUser;
  }

  hasAccess() {
    return this.currentUser !== null && (this.currentUser.role === 'SUPERADMIN' || this.currentUser.role === 'USER');
  }

  canDirectDelete() {
    return this.currentUser && (this.currentUser.canDelete || this.currentUser.role === 'SUPERADMIN');
  }

  validateAdminAuthorization(pin) {
    return pin === 'ADMIN123' || pin === '1234' || (this.currentUser && this.currentUser.role === 'SUPERADMIN');
  }
}