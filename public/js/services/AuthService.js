/* ==========================================================================
   1. Local Authentication Service & Role Based Access Control
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
        roleLabel: '🛡️ Superadmin',
        canDelete: true,
        canInsert: true
      },
      'pedro.lucas': {
        id: 'pedro.lucas',
        name: 'Pedro Lucas',
        password: 'Boulevard@1234',
        role: 'USER',
        roleLabel: '👤 User',
        canDelete: false,
        canInsert: true
      },
      'renato.santos': {
        id: 'renato.santos',
        name: 'Renato Santos',
        password: 'Boulevard@1234',
        role: 'USER',
        roleLabel: '👤 User',
        canDelete: false,
        canInsert: true
      },
      'matheus.lima': {
        id: 'matheus.lima',
        name: 'Matheus Lima',
        password: 'Boulevard@1234',
        role: 'USER',
        roleLabel: '👤 User',
        canDelete: false,
        canInsert: true
      },
      'gilson.souza': {
        id: 'gilson.souza',
        name: 'Gilson Souza',
        password: 'Boulevard@1234',
        role: 'USER',
        roleLabel: '👤 User',
        canDelete: false,
        canInsert: true
      }
    };

    this.users = this.loadUsers();

    // Load saved auth state or default to unauthenticated
    const savedUser = localStorage.getItem('auth_current_user');
    if (savedUser && this.users[savedUser]) {
      this.currentUser = this.users[savedUser];
    } else {
      // Temporariamente logado como caio.alef por padrão para evitar a tela de login
      this.currentUser = this.users['caio.alef'];
      localStorage.setItem('auth_current_user', 'caio.alef');
    }
  }

  loadUsers() {
    try {
      const data = localStorage.getItem(this.usersKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar usuarios:', e);
    }
    return JSON.parse(JSON.stringify(this.defaultUsers));
  }

  saveUsers() {
    localStorage.setItem(this.usersKey, JSON.stringify(this.users));
  }


  login(username, password) {
    if (this.users[username] && this.users[username].password === password) {
      this.currentUser = this.users[username];
      localStorage.setItem('auth_current_user', username);
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('auth_current_user');
  }

  getCurrentUser() {
    return this.currentUser;
  }

  hasAccess() {
    return this.currentUser !== null;
  }

  canDirectDelete() {
    return this.currentUser && this.currentUser.canDelete;
  }

  validateAdminAuthorization(pin) {
    return pin === 'ADMIN123' || pin === '1234';
  }
}

/* ==========================================================================
   2. Serviço de Banco de Dados & Registro de Auditoria (Audit Log)
   ========================================================================== */