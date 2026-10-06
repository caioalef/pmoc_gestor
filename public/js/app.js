/**
 * PMOC Gestor 360 - BOULEVARD SHOPPING FEIRA DE SANTANA
 * Sistema Corporativo de Gestão de Manutenção, Calendário Master e Controle de PMOC/ART.
 *
 * Integrações:
 * 1. Active Directory (AD) com grupos de domínio:
 *    - BSFS_OPE_SYSUSER: Acesso ao sistema e inserção de informações.
 *    - BSFS_OPE_SYSADMIN: Acesso total e autorização mandatória para EXCLUSÃO de informações.
 * 2. Banco de Dados Estruturado (com coleções de Sistemas e Log de Auditoria de Operações).
 * 3. Identidade Visual Boulevard Shopping Feira de Santana:
 *    - Marsala Vinho (#8C4748), Tangerina Âmbar (#E8985E), Areia (#FAF3EB).
 * 4. Modal PMOC/ART dinâmico: VERDE quando anexado, VERMELHO quando pendente.
 */

document.addEventListener('DOMContentLoaded', () => {
  initBoulevardMaintenanceApp();
});


class BoulevardMaintenanceApp {
  constructor() {
    this.auth = new AuthService();
    this.db = new DatabaseService();

    this.systems = this.db.getSystems();
    this.currentYear = '2026';
    this.activeSystemId = null;
    this.activeMonthIndex = null;
    this.currentMonthDocs = []; // Documentos em edição no modal do mês
    this.pendingAuthAction = null; // Armazena a ação aguardando aprovação do SYSADMIN

    this.filters = {
      search: '',
      category: 'ALL',
      pmocStatus: 'ALL',
      periodicity: 'ALL'
    };

    this.init();
    this.initAuthUI();
  }

  initAuthUI() {
    const overlay = document.getElementById('login-overlay');
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error');

    if (this.auth.hasAccess()) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
      this.updateAuthWidget();
    } else {
      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = document.getElementById('login-username').value.trim();
      const pass = document.getElementById('login-password').value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Autenticando no AD...';
      }
      errorMsg.style.display = 'none';

      try {
        const result = await this.auth.login(user, pass);
        if (result && result.success) {
          overlay.classList.add('hidden');
          overlay.style.display = 'none';
          errorMsg.style.display = 'none';
          this.updateAuthWidget();

          const mainView = document.getElementById('main-authorized-view');
          if (mainView) {
            mainView.style.display = 'block';
          }

          // Busca IMEDIATAMENTE os dados frescos do MariaDB
          try {
            const fresh = await this.db.fetchSystemsFromAPI();
            if (fresh && fresh.length > 0) {
              this.systems = fresh;
            }
          } catch (fetchErr) {
            console.warn('Erro ao atualizar dados do MariaDB após login:', fetchErr);
          }

          this.render();
          this.showToast(`Bem-vindo, ${result.user.name}! Dados sincronizados com o servidor.`, 'success');
        } else {
          errorMsg.textContent = (result && result.error) || 'Acesso negado: usuário não autorizado.';
          errorMsg.style.display = 'block';
        }
      } catch (err) {
        errorMsg.textContent = 'Erro ao conectar ao servidor: ' + err.message;
        errorMsg.style.display = 'block';
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar';
        }
      }
    });

    document.getElementById('btn-login-modal').addEventListener('click', () => {
      this.auth.logout();
      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');
      const mainView = document.getElementById('main-authorized-view');
      if (mainView) mainView.style.display = 'none';
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
    });
  }

  updateAuthWidget() {
    const user = this.auth.getCurrentUser();
    if (user) {
      document.getElementById('auth-user-name').textContent = user.name;
      const roleBadge = document.getElementById('auth-badge-role');
      roleBadge.textContent = user.roleLabel;
      if (user.role === 'SUPERADMIN') {
        roleBadge.className = 'ad-badge-admin';
        const btnManage = document.getElementById('btn-manage-users');
        if (btnManage) btnManage.style.display = 'inline-block';
      } else {
        roleBadge.className = 'ad-badge-user';
        const btnManage = document.getElementById('btn-manage-users');
        if (btnManage) btnManage.style.display = 'none';
      }
    }
  }

  getSystemMonths(system, year = this.currentYear) {
    if (!system) return {};
    const yr = String(year || this.currentYear || '2026');

    // 1. Se já existir registro para este ano específico
    if (system.years && system.years[yr] && system.years[yr].months) {
      return system.years[yr].months;
    }
    if (system.years && system.years[yr] && typeof system.years[yr] === 'object' && !system.years[yr].months) {
      return system.years[yr];
    }

    // 2. Se for o ano 2026 e tiver system.months, usa system.months
    if (yr === '2026' && system.months && Object.keys(system.months).length > 0) {
      return system.months;
    }

    // 3. Se for outro ano (ex: 2025, 2027), cria o cronograma baseado no padrão estático do sistema
    const yearSchedule = {};
    const baseMonths = system.months || {};
    for (let m = 1; m <= 12; m++) {
      const base = baseMonths[m];
      if (base && base.scheduled) {
        yearSchedule[m] = {
          scheduled: true,
          status: 'SCHEDULED',
          date: '',
          os: '',
          notes: '',
          documents: []
        };
      }
    }
    return yearSchedule;
  }

  async init() {
    this.bindTheme();
    this.bindEventListeners();

    // 1. Validação mandatória de sessão do usuário no servidor
    const valid = await this.auth.validateSession();
    if (!valid) {
      this.checkAccessAndRender();
      this.updateAuthWidget();
      const overlay = document.getElementById('login-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.remove('hidden');
      }
    } else {
      this.updateAuthWidget();
      this.checkAccessAndRender();
    }

    // 2. Busca dados frescos do MariaDB para qualquer acesso
    try {
      const fresh = await this.db.fetchSystemsFromAPI();
      if (fresh && fresh.length > 0) {
        this.systems = fresh;
        if (this.auth.hasAccess()) {
          this.render();
        }
      }
    } catch (e) {
      console.warn('Sincronização inicial com MariaDB falhou:', e);
    }

    // 3. Configura sincronização em background e no foco da aba
    this.setupSyncListeners();
  }

  /* ==========================================================================
     Controle de Acesso do Domínio AD
     ========================================================================== */
  checkAccessAndRender() {
    const mainView = document.getElementById('main-authorized-view');
    const deniedView = document.getElementById('access-denied-view');

    if (!this.auth.hasAccess()) {
      if (mainView) mainView.style.display = 'none';
      return;
    }

    if (mainView) mainView.style.display = 'block';
    this.render();
  }

  /* ==========================================================================
     Gerenciamento de Tema
     ========================================================================== */
  bindTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;

    const savedTheme = localStorage.getItem('theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const currentTheme = savedTheme || 'light';

    root.setAttribute('data-theme', currentTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const activeTheme = root.getAttribute('data-theme');
        const newTheme = activeTheme === 'light' ? 'dark' : 'light';
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.showToast(`Tema alterado para modo ${newTheme === 'light' ? 'claro' : 'escuro'}.`, 'info');
      });
    }
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */
  bindEventListeners() {
    // Seletor de Ano
    const yearSelector = document.getElementById('year-selector');
    if (yearSelector) {
      yearSelector.addEventListener('change', (e) => {
        this.currentYear = e.target.value;
        const previousYear = parseInt(this.currentYear, 10) - 1;
        document.querySelectorAll('.year-label').forEach(el => el.textContent = this.currentYear);
        const thPendencias = document.getElementById('th-pendencias-title');
        if (thPendencias) {
          thPendencias.textContent = `Pendências de ${previousYear}`;
        }
        this.showToast(`Ano de referência alterado para ${this.currentYear}.`, 'info');
        this.render();
      });
    }

    // Busca e Filtros
    const searchInput = document.getElementById('filter-search');
    const btnClearSearch = document.getElementById('btn-clear-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value.toLowerCase().trim();
        if (btnClearSearch) {
          btnClearSearch.style.display = this.filters.search ? 'block' : 'none';
        }
        this.renderTableOnly();
      });
    }

    if (btnClearSearch && searchInput) {
      btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        this.filters.search = '';
        btnClearSearch.style.display = 'none';
        this.renderTableOnly();
      });
    }

    const filterCategory = document.getElementById('filter-category');
    if (filterCategory) {
      filterCategory.addEventListener('change', (e) => {
        this.filters.category = e.target.value;
        this.renderTableOnly();
      });
    }

    const filterPmoc = document.getElementById('filter-pmoc');
    if (filterPmoc) {
      filterPmoc.addEventListener('change', (e) => {
        this.filters.pmocStatus = e.target.value;
        this.renderTableOnly();
      });
    }

    const filterPeriodicity = document.getElementById('filter-periodicity');
    if (filterPeriodicity) {
      filterPeriodicity.addEventListener('change', (e) => {
        this.filters.periodicity = e.target.value;
        this.renderTableOnly();
      });
    }

    const btnResetFilters = document.getElementById('btn-reset-filters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterCategory) filterCategory.value = 'ALL';
        if (filterPmoc) filterPmoc.value = 'ALL';
        if (filterPeriodicity) filterPeriodicity.value = 'ALL';
        this.filters = { search: '', category: 'ALL', pmocStatus: 'ALL', periodicity: 'ALL' };
        if (btnClearSearch) btnClearSearch.style.display = 'none';
        this.renderTableOnly();
        this.showToast('Filtros redefinidos.', 'info');
      });
    }

    // Botões do Header
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => this.exportCsv());
    }

    const btnPrintReport = document.getElementById('btn-print-report');
    if (btnPrintReport) {
      btnPrintReport.addEventListener('click', () => window.print());
    }

    const btnAddSystem = document.getElementById('btn-add-system');
    if (btnAddSystem) {
      btnAddSystem.addEventListener('click', () => this.openNewSystemModal());
    }

    // Modal de Auditoria
    const btnViewAudit = document.getElementById('btn-view-audit');
    const btnOpenDbModal = document.getElementById('btn-open-db-modal');
    if (btnViewAudit) {
      btnViewAudit.addEventListener('click', () => this.openAuditLogsModal());
    }
    if (btnOpenDbModal) {
      btnOpenDbModal.addEventListener('click', () => this.openAuditLogsModal());
    }

    const btnClearLogs = document.getElementById('btn-clear-logs-test');
    if (btnClearLogs) {
      btnClearLogs.addEventListener('click', () => {
        if (confirm('Deseja redefinir os logs de auditoria do banco de dados?')) {
          this.db.clearLogs();
          this.renderAuditLogsList();
          this.showToast('Logs de auditoria redefinidos.', 'info');
        }
      });
    }

    // Setup de fechamento de modais
    this.setupModalDismiss('modal-pmoc-art', ['btn-close-pmoc-modal', 'btn-footer-close-pmoc']);
    this.setupModalDismiss('modal-sistema-info', ['btn-close-info-modal', 'btn-close-info-footer']);
    this.setupModalDismiss('modal-month-status', ['btn-close-month-modal', 'btn-close-month-footer']);
    this.setupModalDismiss('modal-new-system', ['btn-close-new-modal', 'btn-close-new-footer']);
    this.setupModalDismiss('modal-preview-doc', ['btn-close-preview-modal', 'btn-close-preview-footer']);
    this.setupModalDismiss('modal-admin-auth', ['btn-close-auth-modal', 'btn-cancel-auth']);
    this.setupModalDismiss('modal-audit-logs', ['btn-close-audit-modal', 'btn-close-audit-footer']);
    this.setupModalDismiss('modal-switch-ad-user', ['btn-close-switch-modal', 'btn-close-switch-footer']);

    // Formulário PMOC / ART Upload
    const formUpload = document.getElementById('form-upload-pmoc-art');
    if (formUpload) {
      formUpload.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleUploadPmocArt();
      });
    }

    // Formulário Mês Status
    const formMonth = document.getElementById('form-update-month');
    if (formMonth) {
      formMonth.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveMonthStatus();
      });
    }

    // Eventos de Upload de Documentos no Modal de Mês
    this.bindMonthDocUploadEvents();

    // Formulário Novo Sistema
    const formNewSys = document.getElementById('form-new-system');
    if (formNewSys) {
      formNewSys.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateNewSystem();
      });
    }

    // Formulário de Autorização de Exclusão SYSADMIN
    const formAdminAuth = document.getElementById('form-admin-auth');
    if (formAdminAuth) {
      formAdminAuth.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProcessAdminAuth();
      });
    }

    // Ações internas do Modal PMOC / ART
    const btnQuickFill = document.getElementById('btn-quick-fill-sample');
    if (btnQuickFill) {
      btnQuickFill.addEventListener('click', () => this.quickFillPmocSample());
    }

    const btnToggleReplace = document.getElementById('btn-toggle-replace');
    if (btnToggleReplace) {
      btnToggleReplace.addEventListener('click', () => {
        const uploadView = document.getElementById('pmoc-upload-view');
        if (uploadView) {
          uploadView.style.display = uploadView.style.display === 'none' ? 'block' : 'none';
        }
      });
    }

    // Desanexar PMOC/ART: REGRA DE EXCLUSÃO (Requer SYSADMIN)
    const btnDeleteAttachments = document.getElementById('btn-delete-attachments');
    if (btnDeleteAttachments) {
      btnDeleteAttachments.addEventListener('click', () => {
        this.triggerProtectedAction({
          type: 'DETACH_PMOC',
          systemId: this.activeSystemId,
          description: 'Desanexação de documentos comprobatórios de PMOC e ART.'
        });
      });
    }

    const btnCancelUpload = document.getElementById('btn-cancel-upload');
    if (btnCancelUpload) {
      btnCancelUpload.addEventListener('click', () => {
        const modal = document.getElementById('modal-pmoc-art');
        if (modal) modal.classList.remove('is-active');
      });
    }

    // Drag and Drop e Seleção de Arquivos
    this.setupDropZone('dropzone-pmoc', 'file-pmoc-input', 'preview-file-pmoc', 'name-file-pmoc', 'btn-remove-pmoc-sel');
    this.setupDropZone('dropzone-art', 'file-art-input', 'preview-file-art', 'name-file-art', 'btn-remove-art-sel');

    // Botões de Preview de Documentos
    const btnPrevPmoc = document.getElementById('btn-preview-pmoc');
    const btnPrevArt = document.getElementById('btn-preview-art');
    if (btnPrevPmoc) {
      btnPrevPmoc.addEventListener('click', () => this.openDocPreview('pmoc'));
    }
    if (btnPrevArt) {
      btnPrevArt.addEventListener('click', () => this.openDocPreview('art'));
    }

    const btnDownPmoc = document.getElementById('btn-download-pmoc');
    const btnDownArt = document.getElementById('btn-download-art');
    if (btnDownPmoc) {
      btnDownPmoc.addEventListener('click', () => {
        this.showToast('Download do PMOC iniciado com autenticação corporativa.', 'success');
      });
    }
    if (btnDownArt) {
      btnDownArt.addEventListener('click', () => {
        this.showToast('Download da ART registrada iniciado com autenticação corporativa.', 'success');
      });
    }

    // Ação do Modal de Detalhes -> Abrir PMOC
    const btnOpenPmocFromInfo = document.getElementById('btn-open-pmoc-from-info');
    if (btnOpenPmocFromInfo) {
      btnOpenPmocFromInfo.addEventListener('click', () => {
        const infoModal = document.getElementById('modal-sistema-info');
        if (infoModal) infoModal.classList.remove('is-active');
        if (this.activeSystemId) {
          this.openPmocModal(this.activeSystemId);
        }
      });
    }
  }

  setupModalDismiss(modalId, buttonIds) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    buttonIds.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => modal.classList.remove('is-active'));
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-active');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        modal.classList.remove('is-active');
      }
    });
  }

  setupDropZone(dropZoneId, inputId, previewId, nameId, removeBtnId) {
    const dropZone = document.getElementById(dropZoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const nameEl = document.getElementById(nameId);
    const removeBtn = document.getElementById(removeBtnId);

    if (!dropZone || !input || !preview || !nameEl) return;

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        input.files = e.dataTransfer.files;
        handleFileSelected(e.dataTransfer.files[0].name);
      }
    });

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) {
        handleFileSelected(input.files[0].name);
      }
    });

    function handleFileSelected(fileName) {
      nameEl.textContent = fileName;
      preview.style.display = 'flex';
      const content = dropZone.querySelector('.drop-zone-content');
      if (content) content.style.display = 'none';
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = '';
        preview.style.display = 'none';
        const content = dropZone.querySelector('.drop-zone-content');
        if (content) content.style.display = 'flex';
      });
    }
  }

  /* ==========================================================================
     5. Fluxo de Exclusão Protegido por BSFS_OPE_SYSADMIN
     ========================================================================== */
  triggerProtectedAction(actionData) {
    const user = this.auth.getCurrentUser();

    // Se for SYSADMIN: exclusão autorizada diretamente com confirmação
    if (this.auth.canDirectDelete()) {
      if (confirm(`Ação Administrativa: Confirma ${actionData.description.toLowerCase()}?`)) {
        this.executeAuthorizedAction(actionData, user);
      }
      return;
    }

    // Se for SYSUSER (ou sem permissão direta): EXIGIR AUTORIZAÇÃO DE SYSADMIN
    this.pendingAuthAction = actionData;
    const authModal = document.getElementById('modal-admin-auth');
    const authDesc = document.getElementById('auth-action-description');
    const authPin = document.getElementById('admin-auth-pin');
    const authReason = document.getElementById('admin-auth-reason');

    if (authDesc) {
      authDesc.innerHTML = `
        O usuário atual está no grupo <code>BSFS_OPE_SYSUSER</code> (${user.name}).
        <br><strong>Operação solicitada:</strong> ${actionData.description}
        <br>Para prosseguir, insira o PIN ou credencial de um membro do grupo <code>BSFS_OPE_SYSADMIN</code>.
      `;
    }

    if (authPin) authPin.value = '';
    if (authReason) authReason.value = '';

    if (authModal) {
      authModal.classList.add('is-active');
    }
  }

  handleProcessAdminAuth() {
    const pinInput = document.getElementById('admin-auth-pin');
    const adminSelect = document.getElementById('admin-auth-user');
    const reasonInput = document.getElementById('admin-auth-reason');

    const pin = pinInput ? pinInput.value : '';
    const adminEmail = adminSelect ? adminSelect.value : 'emily.farias@boulevardfs.com.br';
    const reason = reasonInput ? reasonInput.value.trim() : 'Exclusão autorizada';

    if (!this.auth.validateAdminAuthorization(pin)) {
      this.showToast('❌ PIN de autorização de SYSADMIN inválido! (Dica de teste: ADMIN123)', 'danger');
      return;
    }

    // Autorização concedida!
    const authorizer = {
      email: adminEmail,
      group: 'BSFS_OPE_SYSADMIN',
      reason: reason
    };

    const actionData = this.pendingAuthAction;
    this.pendingAuthAction = null;

    const authModal = document.getElementById('modal-admin-auth');
    if (authModal) authModal.classList.remove('is-active');

    this.executeAuthorizedAction(actionData, this.auth.getCurrentUser(), authorizer);
  }

  async executeAuthorizedAction(actionData, requestUser, authorizer = null) {
    if (!actionData) return;

    if (actionData.type === 'DELETE_SYSTEM') {
      const systemIndex = this.systems.findIndex(s => s.id === actionData.systemId);
      if (systemIndex !== -1) {
        const sysId = actionData.systemId;
        const sysName = this.systems[systemIndex].name;
        this.systems.splice(systemIndex, 1);

        try {
          const token = localStorage.getItem('auth_token') || '';
          await fetch(`/api/systems/${encodeURIComponent(sysId)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          localStorage.setItem(this.db.systemsKey, JSON.stringify(this.systems));

          this.db.logOperation(
            'EXCLUIR_SISTEMA',
            'delete',
            `Sistema "${sysName}" excluído do cronograma.`,
            requestUser,
            authorizer
          );

          this.updateKPIs();
          this.renderTableOnly();
          this.showToast(`Sistema "${sysName}" excluído com sucesso do MariaDB.`, 'success');
        } catch (err) {
          this.showToast('Erro ao excluir sistema no MariaDB: ' + err.message, 'danger');
        }
      }
    } else if (actionData.type === 'DETACH_PMOC') {
      const system = this.systems.find(s => s.id === actionData.systemId);
      if (system) {
        system.pmoc = { attached: false };
        system.pmocStatus = 'REQUIRED_NOT_INSERTED';
        system.pmocStatusLabel = 'Documentação obrigatória não inserida';

        try {
          await this.db.saveSingleSystem(system);

          this.db.logOperation(
            'DESANEXAR_PMOC_ART',
            'delete',
            `Documentos PMOC e ART desanexados do sistema "${system.name}".`,
            requestUser,
            authorizer
          );

          this.updateKPIs();
          this.renderTableOnly();
          this.openPmocModal(actionData.systemId); // Atualiza modal para VERMELHO
          this.showToast('Documentos desanexados no MariaDB. Sistema agora está pendente (Vermelho).', 'danger');
        } catch (err) {
          this.showToast('Erro ao desanexar PMOC no banco: ' + err.message, 'danger');
        }
      }
    }
  }

  /* ==========================================================================
     6. Renderização & KPIs
     ========================================================================== */
  render() {
    this.updateKPIs();
    this.renderTableOnly();
  }

  renderTable() {
    this.renderTableOnly();
  }

  updateKPIs() {
    const applicableSystems = this.systems.filter(s => !s.na && s.pmocStatus !== 'NOT_REQUIRED');
    const totalApplicable = applicableSystems.length;

    // Conforme: sistema com status anexado, flag PMOC anexada ou documentos anexados no cronograma
    const pmocOk = applicableSystems.filter(s => {
      if (s.pmocStatus === 'REQUIRED_ATTACHED') return true;
      if (s.pmoc && s.pmoc.attached) return true;
      const yrMonths = this.getSystemMonths(s, this.currentYear);
      const hasYrDocs = Object.values(yrMonths).some(m => m && Array.isArray(m.documents) && m.documents.length > 0);
      if (hasYrDocs) return true;
      if (s.months && Object.values(s.months).some(m => m && Array.isArray(m.documents) && m.documents.length > 0)) return true;
      return false;
    }).length;

    const pmocPending = Math.max(0, totalApplicable - pmocOk);
    const pmocPercent = totalApplicable > 0 ? Math.round((pmocOk / totalApplicable) * 100) : 0;

    const elPmocPercent = document.getElementById('kpi-pmoc-percent');
    const elPmocBar = document.getElementById('kpi-pmoc-bar');
    const elPmocOk = document.getElementById('kpi-pmoc-ok');
    const elPmocPending = document.getElementById('kpi-pmoc-pending');
    const elComplianceTag = document.getElementById('kpi-compliance-tag');

    if (elPmocPercent) elPmocPercent.textContent = `${pmocPercent}%`;
    if (elPmocBar) elPmocBar.style.width = `${pmocPercent}%`;
    if (elPmocOk) elPmocOk.textContent = pmocOk;
    if (elPmocPending) elPmocPending.textContent = pmocPending;

    if (elComplianceTag) {
      if (pmocPercent >= 80) {
        elComplianceTag.textContent = 'Excelente';
        elComplianceTag.style.background = 'rgba(16, 185, 129, 0.16)';
        elComplianceTag.style.color = '#10b981';
      } else if (pmocPercent >= 50) {
        elComplianceTag.textContent = 'Regular';
        elComplianceTag.style.background = 'rgba(245, 158, 11, 0.16)';
        elComplianceTag.style.color = '#F59E0B';
      } else {
        elComplianceTag.textContent = 'Atenção';
        elComplianceTag.style.background = 'rgba(239, 68, 68, 0.16)';
        elComplianceTag.style.color = '#ef4444';
      }
    }

    let doneCount = 0;
    let scheduledCount = 0;
    let attentionCount = 0;
    let unrealizedCount = 0;

    this.systems.forEach(sys => {
      if (sys.na) return;
      const months = this.getSystemMonths(sys, this.currentYear);
      if (!months) return;
      Object.values(months).forEach(m => {
        if (!m || !m.status) return;
        if (m.status === 'DONE') doneCount++;
        else if (m.status === 'SCHEDULED') scheduledCount++;
        else if (m.status === 'ATTENTION') attentionCount++;
        else if (m.status === 'UNREALIZED') unrealizedCount++;
      });
    });

    const elDone = document.getElementById('kpi-done-count');
    const elSched = document.getElementById('kpi-scheduled-count');
    const elAtt = document.getElementById('kpi-attention-count');
    const elUnr = document.getElementById('kpi-unrealized-count');
    const elTotSys = document.getElementById('kpi-total-systems');

    if (elDone) elDone.textContent = doneCount;
    if (elSched) elSched.textContent = scheduledCount;
    if (elAtt) elAtt.textContent = attentionCount;
    if (elUnr) elUnr.textContent = unrealizedCount;
    if (elTotSys) elTotSys.textContent = this.systems.length;

    const categoryChipsContainer = document.getElementById('category-breakdown-chips');
    if (categoryChipsContainer) {
      const counts = {};
      this.systems.forEach(s => {
        const cat = s.category || 'GERAL';
        counts[cat] = (counts[cat] || 0) + 1;
      });

      const catNames = {
        AR_CONDICIONADO: 'Ar Condicionado',
        ELÉTRICO: 'Elétrico',
        ELETRICA: 'Elétrica',
        PREVENÇÃO_CONTRA_INCÊNDIO: 'Incêndio',
        INCENDIO: 'Incêndio',
        GÁS: 'Gás',
        GAS: 'Gás',
        ESTRUTURAL: 'Estrutural',
        HIDRÁULICO: 'Hidráulica',
        HIDRAULICO: 'Hidráulica',
        ELEVADORES: 'Elevadores'
      };

      categoryChipsContainer.innerHTML = Object.entries(counts).map(([catKey, cnt]) => `
        <span class="cat-pill">${catNames[catKey] || catKey}: <strong>${cnt}</strong></span>
      `).join('');
    }
  }

  getFilteredSystems() {
    if (!Array.isArray(this.systems)) return [];
    return this.systems.filter(item => {
      if (!item) return false;

      if (this.filters.search) {
        const query = this.filters.search;
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesCat = (item.categoryName || item.category || '').toLowerCase().includes(query);
        const matchesResp = (item.respTecnico || '').toLowerCase().includes(query);
        const matchesPeriod = (item.periodicity || '').toLowerCase().includes(query);
        const matchesPmoc = (item.pmocStatusLabel || '').toLowerCase().includes(query);
        const matchesShopping = (item.shopping || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesResp && !matchesPeriod && !matchesPmoc && !matchesShopping) {
          return false;
        }
      }

      if (this.filters.category !== 'ALL') {
        const itemCat = item.category || '';
        const itemCatName = item.categoryName || '';
        if (itemCat !== this.filters.category && itemCatName !== this.filters.category) {
          return false;
        }
      }

      if (this.filters.pmocStatus !== 'ALL') {
        if (item.pmocStatus !== this.filters.pmocStatus) {
          // Compatibilidade reversa
          if (this.filters.pmocStatus === 'ATTACHED' && item.pmocStatus === 'REQUIRED_ATTACHED') return true;
          if (this.filters.pmocStatus === 'PENDING' && (item.pmocStatus === 'REQUIRED_NOT_INSERTED' || item.pmocStatus === 'REQUIRED_EXPIRED')) return true;
          return false;
        }
      }

      if (this.filters.periodicity !== 'ALL' && item.periodicity !== this.filters.periodicity) {
        return false;
      }

      return true;
    });
  }

  renderTableOnly() {
    const tbody = document.getElementById('maintenance-tbody');
    const visibleCountEl = document.getElementById('visible-systems-count');
    if (!tbody) return;

    const filtered = this.getFilteredSystems();
    if (visibleCountEl) {
      visibleCountEl.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="21" style="padding: 40px; text-align: center; color: var(--text-muted);">
            Nenhum sistema de manutenção encontrado para os filtros selecionados.
          </td>
        </tr>
      `;
      return;
    }

    const isSysAdmin = this.auth.canDirectDelete();
    let html = '';

    filtered.forEach(system => {
      const isNa = Boolean(system.na);

      // Badge PMOC/ART da planilha
      let pmocBadgeHtml = '';
      if (system.pmocStatus === 'REQUIRED_NOT_INSERTED') {
        pmocBadgeHtml = `<button type="button" class="pmoc-badge pmoc-badge-red" data-action="open-pmoc" data-sys-id="${system.id}" title="Documentação obrigatória não inserida - Clique para anexar">${system.pmocStatusLabel || 'Documentação obrigatória não inserida'}</button>`;
      } else if (system.pmocStatus === 'REQUIRED_ATTACHED') {
        pmocBadgeHtml = `<button type="button" class="pmoc-badge pmoc-badge-green" data-action="open-pmoc" data-sys-id="${system.id}" title="Documentação inserida sem pendência - Clique para visualizar">${system.pmocStatusLabel || 'Documentação obrigatória inserida sem pendência'}</button>`;
      } else if (system.pmocStatus === 'REQUIRED_EXPIRED') {
        pmocBadgeHtml = `<button type="button" class="pmoc-badge pmoc-badge-orange" data-action="open-pmoc" data-sys-id="${system.id}" title="Validade vencida - Clique para atualizar">${system.pmocStatusLabel || 'Documentação obrigatória inserida com data de validade vencida'}</button>`;
      } else if (system.pmocStatus === 'NOT_REQUIRED') {
        pmocBadgeHtml = system.pmocStatusLabel ? `<span class="pmoc-badge pmoc-badge-gray" data-action="open-pmoc" data-sys-id="${system.id}">${system.pmocStatusLabel}</span>` : '';
      } else {
        const attached = system.pmoc && system.pmoc.attached;
        pmocBadgeHtml = attached
          ? `<button type="button" class="pmoc-badge pmoc-badge-green" data-action="open-pmoc" data-sys-id="${system.id}">Documentação obrigatória inserida sem pendência</button>`
          : `<button type="button" class="pmoc-badge pmoc-badge-red" data-action="open-pmoc" data-sys-id="${system.id}">Documentação obrigatória não inserida</button>`;
      }

      // Renderização estática dos meses
      let monthsHtml = '';
      const systemMonths = this.getSystemMonths(system, this.currentYear);
      for (let m = 1; m <= 12; m++) {
        const monthData = systemMonths ? systemMonths[m] : null;
        const isScheduled = Boolean(monthData && monthData.scheduled);
        const status = monthData ? monthData.status : null;
        const docs = (monthData && monthData.documents) || [];
        const hasDocs = docs.length > 0;

        if (isNa || !isScheduled) {
          // Campo estático: totalmente desabilitado e inalterável
          monthsHtml += `<td class="td-month td-month-static-empty" aria-disabled="true"></td>`;
        } else {
          // Campo marcado: interativo, permite alteração e inserção de documentos
          const docBadgeHtml = hasDocs ? `<span class="month-doc-indicator" title="${docs.length} documento(s) anexado(s)">📎</span>` : '';
          let boxHtml = '';

          if (status === 'DONE') {
            boxHtml = `
              <div class="month-box month-box-done" title="Realizado${hasDocs ? ` (${docs.length} documento(s) anexado(s))` : ' - Clique para gerenciar e anexar documentos'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ${docBadgeHtml}
              </div>
            `;
          } else if (status === 'SCHEDULED') {
            boxHtml = `
              <div class="month-box month-box-scheduled" title="Programado${hasDocs ? ` (${docs.length} documento(s) anexado(s))` : ' - Clique para gerenciar e anexar documentos'}">
                <span class="month-triangle-icon">▲</span>
                ${docBadgeHtml}
              </div>
            `;
          } else if (status === 'UNREALIZED') {
            boxHtml = `
              <div class="month-box month-box-unrealized" title="Não Realizado / Pendência${hasDocs ? ` (${docs.length} documento(s) anexado(s))` : ' - Clique para gerenciar e anexar documentos'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                ${docBadgeHtml}
              </div>
            `;
          } else if (status === 'ATTENTION') {
            boxHtml = `
              <div class="month-box month-box-attention" title="Atenção / Em Execução${hasDocs ? ` (${docs.length} documento(s) anexado(s))` : ' - Clique para gerenciar e anexar documentos'}">
                <span style="font-weight: 800; font-size: 13px;">!</span>
                ${docBadgeHtml}
              </div>
            `;
          } else {
            boxHtml = `
              <div class="month-box month-box-scheduled" title="Programado">
                <span class="month-triangle-icon">▲</span>
                ${docBadgeHtml}
              </div>
            `;
          }

          monthsHtml += `
            <td class="td-month td-month-interactive" data-sys-id="${system.id}" data-month-index="${m}" title="Clique para gerenciar e anexar documentos">
              ${boxHtml}
            </td>
          `;
        }
      }

      const deleteBtnTitle = isSysAdmin
        ? 'Excluir sistema (Autorização Direta SYSADMIN)'
        : 'Excluir sistema (Requer Autorização do BSFS_OPE_SYSADMIN)';

      html += `
        <tr class="${isNa ? 'row-na-active' : ''}" id="row-${system.id}">
          <td class="td-shopping"><span class="badge-shopping">${system.shopping || 'BSFS'}</span></td>
          <td class="td-programacao"><span class="badge-programacao">${system.programacao || 'Finalizada'}</span></td>
          <td class="td-sistema-name"><span class="system-cat-text">${system.categoryName || system.category}</span></td>
          <td class="td-manutencao">
            <div class="system-title-cell">
              <span class="system-manutencao-text">${system.name}</span>
              <button type="button" class="btn-info-system" data-action="open-sys-info" data-sys-id="${system.id}" title="Detalhes técnicos do sistema">i</button>
            </div>
          </td>
          <td class="td-resp-tecnico">${system.respTecnico || '-'}</td>
          <td class="td-period">${system.periodicity}</td>
          <td class="td-na">${system.na ? '<span class="badge-na-sim">Sim</span>' : '<span class="badge-na-nao">Não</span>'}</td>
          <td class="td-pmoc-status">${pmocBadgeHtml}</td>
          ${monthsHtml}
          <td class="td-actions">
            <button type="button" class="btn-delete-row" data-action="delete-system" data-sys-id="${system.id}" title="${deleteBtnTitle}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
    this.bindTableDynamicEvents();
  }

  bindTableDynamicEvents() {
    const tbody = document.getElementById('maintenance-tbody');
    if (!tbody) return;

    tbody.querySelectorAll('[data-action="open-pmoc"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sysId = btn.getAttribute('data-sys-id');
        this.openPmocModal(sysId);
      });
    });

    tbody.querySelectorAll('[data-action="open-sys-info"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sysId = btn.getAttribute('data-sys-id');
        this.openSystemInfoModal(sysId);
      });
    });

    tbody.querySelectorAll('.td-month-interactive').forEach(td => {
      td.addEventListener('click', () => {
        const sysId = td.getAttribute('data-sys-id');
        const monthIndex = td.getAttribute('data-month-index');
        const system = this.systems.find(s => s.id === sysId);
        if (system && !system.na) {
          this.openMonthStatusModal(sysId, parseInt(monthIndex, 10));
        }
      });
    });

    tbody.querySelectorAll('[data-action="delete-system"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sysId = btn.getAttribute('data-sys-id');
        const system = this.systems.find(s => s.id === sysId);
        const sysName = system ? system.name : 'Sistema';

        this.triggerProtectedAction({
          type: 'DELETE_SYSTEM',
          systemId: sysId,
          description: `Exclusão definitiva do sistema "${sysName}" da planta do shopping.`
        });
      });
    });
  }

  /* ==========================================================================
     7. Modal PMOC / ART: REQUISITO CENTRAL DO USUÁRIO
     (VERDE SE ANEXADO / VERMELHO SE NÃO ANEXADO)
     ========================================================================== */
  openPmocModal(systemId) {
    const system = this.systems.find(s => s.id === systemId);
    if (!system) return;

    this.activeSystemId = systemId;
    const modal = document.getElementById('modal-pmoc-art');
    const headerIcon = document.getElementById('pmoc-header-icon');
    const sysCat = document.getElementById('pmoc-system-category');
    const sysName = document.getElementById('pmoc-modal-system-name');
    const statusBadge = document.getElementById('pmoc-status-badge');
    const statusMsg = document.getElementById('pmoc-status-message');

    const attachedView = document.getElementById('pmoc-attached-view');
    const uploadView = document.getElementById('pmoc-upload-view');

    if (!modal) return;

    if (sysCat) sysCat.textContent = system.categoryName;
    if (sysName) sysName.textContent = system.name;

    const isAttached = system.pmoc && system.pmoc.attached;

    modal.classList.remove('modal-state-green', 'modal-state-red');

    if (isAttached) {
      /* ==========================================================================
         ESTADO VERDE: ARQUIVOS ANEXADOS E VÁLIDOS
         ========================================================================== */
      modal.classList.add('modal-state-green');

      if (headerIcon) {
        headerIcon.innerHTML = `
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        `;
      }

      if (statusBadge) statusBadge.textContent = 'STATUS: CONFORME & ANEXADO';
      if (statusMsg) {
        statusMsg.innerHTML = 'Documentação regularizada! PMOC e ART anexados e válidos no banco de dados conforme Lei 13.589/2018.';
      }

      const viewPmocName = document.getElementById('view-pmoc-filename');
      const viewPmocDate = document.getElementById('view-pmoc-date');
      const viewPmocSize = document.getElementById('view-pmoc-size');
      const viewArtName = document.getElementById('view-art-filename');
      const viewArtNumber = document.getElementById('view-art-number');
      const viewArtEngineer = document.getElementById('view-art-engineer');

      if (viewPmocName) viewPmocName.textContent = system.pmoc.pmocFile || 'PMOC_Boulevard_Feira.pdf';
      if (viewPmocDate) viewPmocDate.textContent = `Anexado em: ${system.pmoc.pmocDate || '15/01/2025'}`;
      if (viewPmocSize) viewPmocSize.textContent = system.pmoc.pmocSize || '2.1 MB';

      if (viewArtName) viewArtName.textContent = system.pmoc.artFile || 'ART_CREA_Registrada.pdf';
      if (viewArtNumber) viewArtNumber.textContent = system.pmoc.artNumber || 'ART-BA-2025-08912';
      if (viewArtEngineer) viewArtEngineer.textContent = system.pmoc.engineer || 'Eng. Ricardo Silveira (CREA-BA 5062831)';

      if (attachedView) attachedView.style.display = 'block';
      if (uploadView) uploadView.style.display = 'none';

    } else {
      /* ==========================================================================
         ESTADO VERMELHO: ARQUIVOS NÃO ANEXADOS (PENDENTE)
         ========================================================================== */
      modal.classList.add('modal-state-red');

      if (headerIcon) {
        headerIcon.innerHTML = `
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        `;
      }

      if (statusBadge) statusBadge.textContent = 'STATUS: NÃO ANEXADO (PENDENTE)';
      if (statusMsg) {
        statusMsg.innerHTML = 'ATENÇÃO: Este sistema ainda não possui os arquivos comprobatórios obrigatórios anexados!';
      }

      const formUpload = document.getElementById('form-upload-pmoc-art');
      if (formUpload) formUpload.reset();

      const prevPmoc = document.getElementById('preview-file-pmoc');
      const prevArt = document.getElementById('preview-file-art');
      if (prevPmoc) prevPmoc.style.display = 'none';
      if (prevArt) prevArt.style.display = 'none';

      const dropPmocCont = document.querySelector('#dropzone-pmoc .drop-zone-content');
      const dropArtCont = document.querySelector('#dropzone-art .drop-zone-content');
      if (dropPmocCont) dropPmocCont.style.display = 'flex';
      if (dropArtCont) dropArtCont.style.display = 'flex';

      if (attachedView) attachedView.style.display = 'none';
      if (uploadView) uploadView.style.display = 'block';
    }

    modal.classList.add('is-active');
  }

  async handleUploadPmocArt() {
    const system = this.systems.find(s => s.id === this.activeSystemId);
    if (!system) return;

    const pmocInput = document.getElementById('file-pmoc-input');
    const artInput = document.getElementById('file-art-input');
    const pmocDesc = document.getElementById('input-pmoc-desc');
    const artNumber = document.getElementById('input-art-number');
    const artEngineer = document.getElementById('input-art-engineer');

    const pmocFileName = (pmocInput && pmocInput.files && pmocInput.files[0])
      ? pmocInput.files[0].name
      : `PMOC_${system.name.replace(/[^a-zA-Z0-9]/g, '_')}_Boulevard.pdf`;

    const artFileName = (artInput && artInput.files && artInput.files[0])
      ? artInput.files[0].name
      : `ART_CREA_${system.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    system.pmoc = {
      attached: true,
      pmocFile: pmocFileName,
      pmocDate: formattedDate,
      pmocSize: '2.3 MB',
      pmocDesc: pmocDesc && pmocDesc.value.trim() ? pmocDesc.value.trim() : `Plano de Manutenção Preventiva do ${system.name} - Boulevard Feira`,
      artFile: artFileName,
      artNumber: artNumber && artNumber.value.trim() ? artNumber.value.trim() : `ART-BA-${this.currentYear}-${Math.floor(100000 + Math.random() * 900000)}`,
      engineer: artEngineer && artEngineer.value.trim() ? artEngineer.value.trim() : 'Eng. Ricardo Silveira (CREA-BA 5062831)'
    };
    system.pmocStatus = 'REQUIRED_ATTACHED';
    system.pmocStatusLabel = 'Documentação obrigatória inserida sem pendência';

    const saveBtn = document.getElementById('btn-save-pmoc-modal');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando no MariaDB...';
    }

    try {
      await this.db.saveSingleSystem(system);

      this.db.logOperation(
        'ANEXAR_PMOC_ART',
        'update',
        `Documentos PMOC (${pmocFileName}) e ART (${system.pmoc.artNumber}) anexados ao sistema "${system.name}".`,
        this.auth.getCurrentUser()
      );

      this.updateKPIs();
      this.renderTableOnly();

      // Transição imediata para o modal VERDE
      this.openPmocModal(this.activeSystemId);
      this.showToast('✅ Arquivos PMOC e ART gravados no MariaDB com sucesso! Sistema regularizado (Verde).', 'success');
    } catch (err) {
      this.showToast('❌ Erro ao salvar PMOC no MariaDB: ' + err.message, 'danger');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar e Regularizar PMOC/ART';
      }
    }
  }

  quickFillPmocSample() {
    const system = this.systems.find(s => s.id === this.activeSystemId);
    const sysNameClean = system ? system.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Sistema';

    const pmocDesc = document.getElementById('input-pmoc-desc');
    const artNumber = document.getElementById('input-art-number');
    const artEngineer = document.getElementById('input-art-engineer');

    if (pmocDesc) pmocDesc.value = `PMOC Conforme Normas ABNT e Lei 13.589/2018 para ${system ? system.name : 'Sistema'} - Boulevard Shopping`;
    if (artNumber) artNumber.value = `ART-BA-${this.currentYear}-${Math.floor(100000 + Math.random() * 900000)}`;
    if (artEngineer) artEngineer.value = 'Eng. Ricardo Silveira (CREA-BA 5062831)';

    const prevPmoc = document.getElementById('preview-file-pmoc');
    const namePmoc = document.getElementById('name-file-pmoc');
    const dropPmocCont = document.querySelector('#dropzone-pmoc .drop-zone-content');
    if (prevPmoc && namePmoc && dropPmocCont) {
      namePmoc.textContent = `PMOC_${sysNameClean}_Boulevard.pdf`;
      prevPmoc.style.display = 'flex';
      dropPmocCont.style.display = 'none';
    }

    const prevArt = document.getElementById('preview-file-art');
    const nameArt = document.getElementById('name-file-art');
    const dropArtCont = document.querySelector('#dropzone-art .drop-zone-content');
    if (prevArt && nameArt && dropArtCont) {
      nameArt.textContent = `ART_CREA_${sysNameClean}_Registrada.pdf`;
      prevArt.style.display = 'flex';
      dropArtCont.style.display = 'none';
    }

    this.showToast('Dados de teste preenchidos. Clique em "Salvar e Anexar Documentos no Banco".', 'info');
  }

  /* ==========================================================================
     8. Modal de Auditoria e Logs do Banco de Dados
     ========================================================================== */
  async openAuditLogsModal() {
    this.renderAuditLogsList();
    const modal = document.getElementById('modal-audit-logs');
    if (modal) modal.classList.add('is-active');

    try {
      await this.db.fetchAuditLogsFromAPI();
      this.renderAuditLogsList();
    } catch (e) {
      console.warn('Erro ao atualizar logs:', e);
    }
  }

  renderAuditLogsList() {
    const container = document.getElementById('audit-logs-container');
    if (!container) return;

    const logs = this.db.getAuditLogs();
    if (!logs || logs.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum log registrado.</div>';
      return;
    }

    container.innerHTML = logs.map(l => {
      const typeClass = l.actionType === 'delete' ? 'action-delete' : (l.actionType === 'create' ? 'action-create' : 'action-update');
      return `
        <div class="audit-log-item">
          <div>
            <span class="audit-action-badge ${typeClass}">${l.action}</span>
            <div class="audit-details-text" style="margin-top: 4px;">
              <strong>${l.user}</strong> (${l.group})
              <span>${l.details}</span>
            </div>
          </div>
          <div class="audit-meta-time">${l.timestamp}</div>
        </div>
      `;
    }).join('');
  }

  /* ==========================================================================
     9. Outros Modais (Detalhes, Mês, Novo Sistema, Preview)
     ========================================================================== */
  openSystemInfoModal(systemId) {
    const system = this.systems.find(s => s.id === systemId);
    if (!system) return;

    this.activeSystemId = systemId;
    const modal = document.getElementById('modal-sistema-info');
    if (!modal) return;

    document.getElementById('info-modal-category').textContent = system.categoryName;
    document.getElementById('info-detail-name').textContent = system.name;
    document.getElementById('info-detail-period').textContent = system.periodicity;
    document.getElementById('info-detail-standards').textContent = system.standards || 'Normas ABNT Vigentes e Diretrizes do Boulevard Shopping';
    document.getElementById('info-detail-desc').textContent = system.description || 'Rotinas preventivas do Boulevard Shopping Feira de Santana.';

    const pmocStatusEl = document.getElementById('info-detail-pmoc-status');
    if (pmocStatusEl) {
      const isAttached = system.pmoc && system.pmoc.attached;
      pmocStatusEl.innerHTML = isAttached
        ? '<span class="status-chip chip-green">✓ PMOC e ART Anexados no Banco (Conforme)</span>'
        : '<span class="status-chip chip-red">⚠️ PMOC e ART Pendentes de Anexação</span>';
    }

    modal.classList.add('is-active');
  }

  openMonthStatusModal(systemId, monthIndex) {
    const system = this.systems.find(s => s.id === systemId);
    if (!system) return;

    this.activeSystemId = systemId;
    this.activeMonthIndex = monthIndex;

    const modal = document.getElementById('modal-month-status');
    if (!modal) return;

    const monthNames = [
      '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    document.getElementById('month-modal-pretitle').textContent = `${system.categoryName || system.category} - BOULEVARD SHOPPING`;
    document.getElementById('month-modal-title').textContent = `Manutenção de ${monthNames[monthIndex]} de ${this.currentYear}`;
    document.getElementById('month-modal-system-name').textContent = system.name;

    const systemMonths = this.getSystemMonths(system, this.currentYear);
    const monthData = systemMonths ? systemMonths[monthIndex] : null;
    const currentStatus = monthData ? monthData.status : 'SCHEDULED';

    const radios = document.querySelectorAll('input[name="month_status_radio"]');
    radios.forEach(r => {
      r.checked = (r.value === currentStatus);
    });

    const dateInput = document.getElementById('month-exec-date');
    const osInput = document.getElementById('month-os-number');
    const notesInput = document.getElementById('month-notes');

    if (dateInput) dateInput.value = (monthData && monthData.date) || '';
    if (osInput) osInput.value = (monthData && monthData.os) || '';
    if (notesInput) notesInput.value = (monthData && monthData.notes) || '';

    // Carrega documentos anexados deste mês
    this.currentMonthDocs = (monthData && Array.isArray(monthData.documents)) 
      ? JSON.parse(JSON.stringify(monthData.documents))
      : [];

    this.renderMonthDocsList();
    modal.classList.add('is-active');
  }

  async handleSaveMonthStatus() {
    const system = this.systems.find(s => s.id === this.activeSystemId);
    if (!system) return;

    const selectedRadio = document.querySelector('input[name="month_status_radio"]:checked');
    const newStatus = selectedRadio ? selectedRadio.value : 'SCHEDULED';

    const dateVal = document.getElementById('month-exec-date').value;
    const osVal = document.getElementById('month-os-number').value.trim();
    const notesVal = document.getElementById('month-notes').value.trim();

    // Inicializa estrutura de anos
    const yr = String(this.currentYear || '2026');
    if (!system.years) system.years = {};
    if (!system.years[yr]) {
      system.years[yr] = { months: this.getSystemMonths(system, yr) };
    }
    if (!system.years[yr].months) {
      system.years[yr].months = {};
    }

    const prevMonthData = system.years[yr].months[this.activeMonthIndex] || {};
    const updatedMonth = {
      ...prevMonthData,
      scheduled: true,
      status: newStatus,
      date: dateVal,
      os: osVal,
      notes: notesVal,
      documents: this.currentMonthDocs || []
    };

    system.years[yr].months[this.activeMonthIndex] = updatedMonth;

    // Compatibilidade reversa: se for 2026, espelha no system.months
    if (yr === '2026') {
      if (!system.months) system.months = {};
      system.months[this.activeMonthIndex] = updatedMonth;
    }

    // Se foram anexados arquivos neste card mensal e a documentação PMOC estiver pendente,
    // atualiza o status do sistema para CONFORME/ANEXADO
    if (this.currentMonthDocs && this.currentMonthDocs.length > 0) {
      if (!system.pmoc || !system.pmoc.attached) {
        system.pmoc = system.pmoc || {};
        system.pmoc.attached = true;
        system.pmoc.pmocFile = this.currentMonthDocs[0].name;
        system.pmoc.pmocDate = new Date().toLocaleDateString('pt-BR');
        system.pmocStatus = 'REQUIRED_ATTACHED';
        system.pmocStatusLabel = 'Documentação obrigatória inserida sem pendência';
      }
    }

    const saveBtn = document.getElementById('btn-save-month-status');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando no MariaDB...';
    }

    try {
      await this.db.saveSingleSystem(system);

      this.db.logOperation(
        'ATUALIZAR_MES',
        'update',
        `Status do mês ${this.activeMonthIndex}/${this.currentYear} atualizado para ${newStatus} com ${(this.currentMonthDocs || []).length} documento(s) no sistema "${system.name}".`,
        this.auth.getCurrentUser()
      );

      this.updateKPIs();
      this.renderTableOnly();

      const modal = document.getElementById('modal-month-status');
      if (modal) modal.classList.remove('is-active');

      this.showToast('✅ Manutenção gravada com sucesso no MariaDB!', 'success');
    } catch (err) {
      this.showToast('❌ Erro ao gravar manutenção no MariaDB: ' + err.message, 'danger');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Alterações';
      }
    }
  }

  bindMonthDocUploadEvents() {
    const dropzone = document.getElementById('month-doc-dropzone');
    const fileInput = document.getElementById('month-doc-file-input');
    const triggerBtn = document.getElementById('btn-trigger-month-upload');

    if (triggerBtn && fileInput) {
      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        this.handleProcessMonthFiles(files);
        fileInput.value = '';
      });
    }

    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.style.borderColor = 'var(--bsfs-marsala)';
          dropzone.style.backgroundColor = 'rgba(250, 243, 235, 1)';
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.style.borderColor = '';
          dropzone.style.backgroundColor = '';
        }, false);
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt ? Array.from(dt.files) : [];
        if (files.length > 0) {
          this.handleProcessMonthFiles(files);
        }
      });
    }
  }

  handleProcessMonthFiles(files) {
    if (!this.currentMonthDocs) this.currentMonthDocs = [];
    let loadedCount = 0;

    files.forEach(file => {
      // Limite individual de 15MB
      if (file.size > 15 * 1024 * 1024) {
        this.showToast(`Arquivo "${file.name}" ultrapassa 15MB e foi ignorado.`, 'warning');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const user = this.auth.getCurrentUser() || { name: 'Operador' };
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const docItem = {
          id: 'doc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          uploadedAt: dateStr,
          uploadedBy: user.name,
          dataUrl: event.target.result
        };

        this.currentMonthDocs.push(docItem);
        loadedCount++;

        if (loadedCount === files.length) {
          this.renderMonthDocsList();
          this.showToast(`${loadedCount} documento(s) inserido(s). Clique em Salvar para gravar no banco.`, 'success');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  renderMonthDocsList() {
    const container = document.getElementById('month-docs-list');
    const counter = document.getElementById('month-docs-counter');
    if (!container) return;

    const docs = this.currentMonthDocs || [];
    if (counter) {
      counter.textContent = `${docs.length} ${docs.length === 1 ? 'arquivo' : 'arquivos'}`;
    }

    if (docs.length === 0) {
      container.innerHTML = `
        <div class="empty-docs-notice">
          Nenhum documento anexado para este mês ainda. Utilize a área acima para inserir laudos, ordens de serviço ou relatórios.
        </div>
      `;
      return;
    }

    container.innerHTML = docs.map(doc => {
      const sizeFormatted = doc.size ? (doc.size > 1024 * 1024 ? `${(doc.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(doc.size / 1024)} KB`) : '';
      const isPdf = doc.name.toLowerCase().endsWith('.pdf') || (doc.type && doc.type.includes('pdf'));
      const isImg = doc.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) || (doc.type && doc.type.includes('image'));
      const isDoc = doc.name.toLowerCase().match(/\.(doc|docx)$/);
      const isXls = doc.name.toLowerCase().match(/\.(xls|xlsx)$/);
      const typeLabel = isPdf ? 'PDF' : (isImg ? 'IMG' : (isDoc ? 'DOC' : (isXls ? 'XLS' : 'ARQ')));

      return `
        <div class="month-doc-card" id="card-doc-${doc.id}">
          <div class="month-doc-left">
            <div class="month-doc-icon">${typeLabel}</div>
            <div class="month-doc-meta">
              <span class="month-doc-name" title="${doc.name}">${doc.name}</span>
              <span class="month-doc-sub">${sizeFormatted} &bull; Anexado em ${doc.uploadedAt || ''} por ${doc.uploadedBy || 'Operador'}</span>
            </div>
          </div>
          <div class="month-doc-actions">
            <button type="button" class="btn-doc-action" data-action="view-month-doc" data-doc-id="${doc.id}" title="Visualizar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Ver</span>
            </button>
            <button type="button" class="btn-doc-action" data-action="download-month-doc" data-doc-id="${doc.id}" title="Baixar">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="15"></line>
              </svg>
              <span>Baixar</span>
            </button>
            <button type="button" class="btn-doc-action btn-doc-delete" data-action="delete-month-doc" data-doc-id="${doc.id}" title="Excluir documento">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-action="view-month-doc"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const docId = btn.getAttribute('data-doc-id');
        this.viewMonthDocument(docId);
      });
    });

    container.querySelectorAll('[data-action="download-month-doc"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const docId = btn.getAttribute('data-doc-id');
        this.downloadMonthDocument(docId);
      });
    });

    container.querySelectorAll('[data-action="delete-month-doc"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const docId = btn.getAttribute('data-doc-id');
        this.deleteMonthDocument(docId);
      });
    });
  }

  viewMonthDocument(docId) {
    const doc = (this.currentMonthDocs || []).find(d => d.id === docId);
    if (!doc || !doc.dataUrl) return;

    const isImg = doc.dataUrl.startsWith('data:image/');
    const isPdf = doc.dataUrl.startsWith('data:application/pdf');

    if (isImg || isPdf) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>${doc.name} - Boulevard Shopping</title>
              <style>
                body { margin: 0; background: #0f172a; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; }
                img { max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
                iframe { width: 100vw; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              ${isImg ? `<img src="${doc.dataUrl}" alt="${doc.name}">` : `<iframe src="${doc.dataUrl}"></iframe>`}
            </body>
          </html>
        `);
        return;
      }
    }

    this.downloadMonthDocument(docId);
  }

  downloadMonthDocument(docId) {
    const doc = (this.currentMonthDocs || []).find(d => d.id === docId);
    if (!doc || !doc.dataUrl) return;

    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.name || 'documento-manutencao.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  deleteMonthDocument(docId) {
    if (!confirm('Deseja realmente remover este documento anexado desta manutenção?')) return;
    this.currentMonthDocs = (this.currentMonthDocs || []).filter(d => d.id !== docId);
    this.renderMonthDocsList();
    this.showToast('Documento removido da lista. Clique em Salvar para consolidar.', 'info');
  }

  async toggleSystemNa(systemId, isChecked) {
    const system = this.systems.find(s => s.id === systemId);
    if (!system) return;

    system.na = isChecked;
    try {
      await this.db.saveSingleSystem(system);

      this.db.logOperation(
        'ALTERAR_APLICABILIDADE',
        'update',
        `Sistema "${system.name}" alterado para ${isChecked ? 'Não se Aplica (NA)' : 'Aplicável'}.`,
        this.auth.getCurrentUser()
      );

      this.updateKPIs();
      this.renderTableOnly();
      this.showToast(`${system.name}: marcado como ${isChecked ? 'Não se Aplica' : 'Aplicável'} e salvo no MariaDB.`, 'info');
    } catch (err) {
      this.showToast('Erro ao salvar no MariaDB: ' + err.message, 'danger');
    }
  }

  openNewSystemModal() {
    const modal = document.getElementById('modal-new-system');
    const form = document.getElementById('form-new-system');
    if (form) form.reset();
    if (modal) modal.classList.add('is-active');
  }

  async handleCreateNewSystem() {
    const cat = document.getElementById('new-sys-category').value;
    const name = document.getElementById('new-sys-name').value.trim();
    const period = document.getElementById('new-sys-period').value;
    const pendencias = document.getElementById('new-sys-pendencias').value.trim();
    const desc = document.getElementById('new-sys-desc').value.trim();
    const na = document.getElementById('new-sys-na').checked;

    if (!name) return;

    const catNames = {
      ELETRICA: 'ELÉTRICA / SISTEMAS CRÍTICOS',
      HIDRAULICO: 'HIDRÁULICO / HIDROSSANITÁRIAS',
      ELEVADORES: 'ELEVADORES E ESCADAS ROLANTES',
      GAS: 'GÁS',
      ESTRUTURAL: 'ESTRUTURAL',
      INCENDIO: 'PREVENÇÃO CONTRA INCÊNDIO'
    };

    const newSys = {
      id: `sys-${Date.now()}`,
      category: cat,
      categoryName: catNames[cat] || cat,
      name: name,
      periodicity: period,
      pendencias: pendencias,
      na: na,
      standards: 'Normas ABNT aplicáveis e diretrizes do Boulevard Shopping',
      description: desc || 'Rotinas preventivas do sistema.',
      pmoc: { attached: false },
      months: {}
    };

    try {
      await this.db.saveSingleSystem(newSys);
      this.systems.push(newSys);
      localStorage.setItem(this.db.systemsKey, JSON.stringify(this.systems));

      this.db.logOperation(
        'CRIAR_SISTEMA',
        'create',
        `Novo sistema "${name}" (${period}) cadastrado no setor ${catNames[cat] || cat}.`,
        this.auth.getCurrentUser()
      );

      this.render();

      const modal = document.getElementById('modal-new-system');
      if (modal) modal.classList.remove('is-active');

      this.showToast(`Sistema "${name}" gravado com sucesso no MariaDB!`, 'success');
    } catch (err) {
      this.showToast('Erro ao cadastrar novo sistema no MariaDB: ' + err.message, 'danger');
    }
  }

  openDocPreview(docType) {
    const system = this.systems.find(s => s.id === this.activeSystemId);
    if (!system || !system.pmoc) return;

    const modal = document.getElementById('modal-preview-doc');
    if (!modal) return;

    const titleEl = document.getElementById('preview-doc-title');
    const filenameEl = document.getElementById('preview-filename-text');
    const sysNameEl = document.getElementById('preview-system-name');
    const periodEl = document.getElementById('preview-system-period');
    const artNumEl = document.getElementById('preview-art-num');
    const engNameEl = document.getElementById('preview-eng-name');

    if (docType === 'pmoc') {
      if (titleEl) titleEl.textContent = 'Visualização do PMOC (Plano de Manutenção)';
      if (filenameEl) filenameEl.textContent = system.pmoc.pmocFile || 'PMOC_Boulevard_Feira.pdf';
    } else {
      if (titleEl) titleEl.textContent = 'Visualização da ART (Anotação de Resp. Técnica)';
      if (filenameEl) filenameEl.textContent = system.pmoc.artFile || 'ART_CREA_BA.pdf';
    }

    if (sysNameEl) sysNameEl.textContent = system.name;
    if (periodEl) periodEl.textContent = system.periodicity;
    if (artNumEl) artNumEl.textContent = system.pmoc.artNumber || 'ART-BA-2025-098231';
    if (engNameEl) engNameEl.textContent = system.pmoc.engineer || 'Eng. Ricardo Silveira (CREA-BA 5062831)';

    modal.classList.add('is-active');
  }

  exportCsv() {
    const headers = [
      'Empreendimento',
      'Disciplina',
      'Sistema',
      'Periodicidade',
      'Pendências',
      'NA',
      'Status_PMOC_ART',
      'Arquivo_PMOC',
      'Arquivo_ART',
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const statusLabels = {
      DONE: 'Realizado',
      ATTENTION: 'Atencao',
      SCHEDULED: 'Programado',
      UNREALIZED: 'Nao Realizado'
    };

    const rows = this.systems.map(s => {
      const pmocStatus = (s.pmoc && s.pmoc.attached) ? 'Anexado_Conforme' : 'Pendente_Nao_Anexado';
      const pmocFile = (s.pmoc && s.pmoc.pmocFile) || '';
      const artFile = (s.pmoc && s.pmoc.artFile) || '';

      const monthCols = [];
      for (let m = 1; m <= 12; m++) {
        const mData = s.months ? s.months[m] : null;
        monthCols.push(mData ? (statusLabels[mData.status] || '') : '');
      }

      return [
        `"Boulevard Shopping Feira de Santana"`,
        `"${s.categoryName}"`,
        `"${s.name}"`,
        `"${s.periodicity}"`,
        `"${s.pendencias || ''}"`,
        s.na ? 'SIM' : 'NAO',
        `"${pmocStatus}"`,
        `"${pmocFile}"`,
        `"${artFile}"`,
        ...monthCols.map(col => `"${col}"`)
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Boulevard_Feira_Cronograma_Manutencao_${this.currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('Planilha CSV do Boulevard Shopping exportada com sucesso!', 'success');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  isAnyModalOpen() {
    const modals = document.querySelectorAll('.modal.is-active, .modal-custom.is-active');
    return modals.length > 0;
  }

  setupSyncListeners() {
    // 1. Botão do Header para sincronizar manualmente
    const dbBtn = document.getElementById('btn-open-db-modal');
    if (dbBtn) {
      dbBtn.addEventListener('click', async () => {
        this.showToast('Sincronizando com o banco MariaDB...', 'info');
        try {
          const fresh = await this.db.fetchSystemsFromAPI();
          if (fresh && fresh.length > 0) {
            this.systems = fresh;
            this.render();
            this.showToast('✅ Banco MariaDB sincronizado com sucesso!', 'success');
          }
        } catch (e) {
          this.showToast('Falha na sincronização: ' + e.message, 'warning');
        }
      });
    }

    // 2. Sincronização ao retornar o foco à aba
    window.addEventListener('focus', async () => {
      if (this.auth.hasAccess() && !this.isAnyModalOpen()) {
        try {
          const fresh = await this.db.fetchSystemsFromAPI();
          if (fresh && fresh.length > 0) {
            const currentStr = JSON.stringify(this.systems);
            const freshStr = JSON.stringify(fresh);
            if (currentStr !== freshStr) {
              this.systems = fresh;
              this.render();
              console.log('[AutoSync] Dados atualizados do MariaDB sincronizados.');
            }
          }
        } catch (e) {}
      }
    });

    // 3. Polling em background a cada 20 segundos
    setInterval(async () => {
      if (this.auth.hasAccess() && !this.isAnyModalOpen()) {
        try {
          const fresh = await this.db.fetchSystemsFromAPI();
          if (fresh && fresh.length > 0) {
            const currentStr = JSON.stringify(this.systems);
            const freshStr = JSON.stringify(fresh);
            if (currentStr !== freshStr) {
              this.systems = fresh;
              this.render();
              console.log('[AutoSync] Alterações de outros usuários refletidas na tela.');
            }
          }
        } catch (e) {}
      }
    }, 20000);
  }
}

function initBoulevardMaintenanceApp() {
  window.boulevardApp = new BoulevardMaintenanceApp();
}
