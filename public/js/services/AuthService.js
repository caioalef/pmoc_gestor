/* ==========================================================================
   1. Active Directory LDAP & Local Authentication Service
   ========================================================================== */
class AuthService {
  constructor() {
    this.usersKey = 'bsfs_db_users';
    this.defaultUsers = {
      'caio.alef': {
        id: 'caio.alef',
        name: 'Caio Alef',
        password: 'Boulevard@1234',
        role: 'SUPERADMIN',
        roleLabel: 'Superadmin',
        canDelete: true,
        canInsert: true
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
    try {
      const data = localStorage.getItem(this.usersKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar usuarios locais:', e);
    }
    return JSON.parse(JSON.stringify(this.defaultUsers));
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
    return this.currentUser !== null;
  }

  canDirectDelete() {
    return this.currentUser && (this.currentUser.canDelete || this.currentUser.role === 'SUPERADMIN');
  }

  validateAdminAuthorization(pin) {
    return pin === 'ADMIN123' || pin === '1234' || (this.currentUser && this.currentUser.role === 'SUPERADMIN');
  }
}