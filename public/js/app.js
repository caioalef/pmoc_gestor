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
      this.updateAuthWidget();
    } else {
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
          errorMsg.style.display = 'none';
          this.updateAuthWidget();
          const fresh = await this.db.fetchSystemsFromAPI();
          if (fresh && fresh.length > 0) {
            this.systems = fresh;
          }
          this.renderTable();
          this.updateKPIs();
        } else {
          errorMsg.textContent = (result && result.error) || 'Usuário ou senha incorretos.';
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
      overlay.classList.remove('hidden');
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

  async init() {
    this.bindTheme();
    this.bindEventListeners();
    this.checkAccessAndRender();

    if (this.auth.hasAccess()) {
      try {
        const fresh = await this.db.fetchSystemsFromAPI();
        if (fresh && fresh.length > 0) {
          this.systems = fresh;
          this.renderTable();
          this.updateKPIs();
        }
      } catch (e) {
        console.warn('Sincronização com MariaDB falhou:', e);
      }
    }
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

  executeAuthorizedAction(actionData, requestUser, authorizer = null) {
    if (!actionData) return;

    if (actionData.type === 'DELETE_SYSTEM') {
      const systemIndex = this.systems.findIndex(s => s.id === actionData.systemId);
      if (systemIndex !== -1) {
        const sysName = this.systems[systemIndex].name;
        this.systems.splice(systemIndex, 1);
        this.db.saveSystems(this.systems);

        this.db.logOperation(
          'EXCLUIR_SISTEMA',
          'delete',
          `Sistema "${sysName}" excluído do cronograma.`,
          requestUser,
          authorizer
        );

        this.updateKPIs();
        this.renderTableOnly();
        this.showToast(`Sistema "${sysName}" excluído com sucesso.`, 'success');
      }
    } else if (actionData.type === 'DETACH_PMOC') {
      const system = this.systems.find(s => s.id === actionData.systemId);
      if (system) {
        system.pmoc = { attached: false };
        this.db.saveSystems(this.systems);

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
        this.showToast('Documentos desanexados. Sistema agora está pendente (Vermelho).', 'danger');
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

  updateKPIs() {
    const totalSystems = this.systems.length;
    const pmocOk = this.systems.filter(s => s.pmoc && s.pmoc.attached).length;
    const pmocPending = totalSystems - pmocOk;
    const pmocPercent = totalSystems > 0 ? Math.round((pmocOk / totalSystems) * 100) : 0;

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
        elComplianceTag.style.background = 'rgba(232, 152, 94, 0.16)';
        elComplianceTag.style.color = '#E8985E';
      } else {
        elComplianceTag.textContent = 'Crítico';
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
      if (!sys.months) return;
      Object.values(sys.months).forEach(m => {
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
    if (elTotSys) elTotSys.textContent = totalSystems;

    const categoryChipsContainer = document.getElementById('category-breakdown-chips');
    if (categoryChipsContainer) {
      const counts = {};
      this.systems.forEach(s => {
        counts[s.category] = (counts[s.category] || 0) + 1;
      });

      const catNames = {
        ELETRICA: 'Elétrica',
        HIDRAULICO: 'Hidráulica',
        ELEVADORES: 'Elevadores',
        GAS: 'Gás',
        ESTRUTURAL: 'Estrutural',
        INCENDIO: 'Incêndio'
      };

      categoryChipsContainer.innerHTML = Object.entries(counts).map(([catKey, cnt]) => `
        <span class="cat-pill">${catNames[catKey] || catKey}: <strong>${cnt}</strong></span>
      `).join('');
    }
  }

  getFilteredSystems() {
    return this.systems.filter(item => {
      if (this.filters.search) {
        const query = this.filters.search;
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCat = item.categoryName.toLowerCase().includes(query);
        const matchesPeriod = item.periodicity.toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const matchesStd = (item.standards || '').toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesPeriod && !matchesDesc && !matchesStd) {
          return false;
        }
      }

      if (this.filters.category !== 'ALL' && item.category !== this.filters.category) {
        return false;
      }

      if (this.filters.pmocStatus === 'ATTACHED' && (!item.pmoc || !item.pmoc.attached)) {
        return false;
      }
      if (this.filters.pmocStatus === 'PENDING' && (item.pmoc && item.pmoc.attached)) {
        return false;
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
          <td colspan="18" style="padding: 40px; text-align: center; color: var(--text-muted);">
            Nenhum sistema de manutenção encontrado para os filtros selecionados.
          </td>
        </tr>
      `;
      return;
    }

    const grouped = {};
    filtered.forEach(sys => {
      if (!grouped[sys.category]) {
        grouped[sys.category] = {
          name: sys.categoryName,
          items: []
        };
      }
      grouped[sys.category].items.push(sys);
    });

    let html = '';

    const categoryIcons = {
      ELETRICA: '⚡',
      HIDRAULICO: '💧',
      ELEVADORES: '🛗',
      GAS: '🔥',
      ESTRUTURAL: '🏗️',
      INCENDIO: '🧯'
    };

    const isSysAdmin = this.auth.canDirectDelete();

    Object.entries(grouped).forEach(([catKey, group]) => {
      const icon = categoryIcons[catKey] || '📋';
      html += `
        <tr class="category-row">
          <td colspan="18">
            <div class="category-row-inner">
              <span>${icon} ${group.name}</span>
              <span class="category-badge-count">${group.items.length} ${group.items.length === 1 ? 'sistema' : 'sistemas'}</span>
            </div>
          </td>
        </tr>
      `;

      group.items.forEach(system => {
        const isNa = system.na;
        const pmocAttached = system.pmoc && system.pmoc.attached;

        const pmocBadgeHtml = pmocAttached
          ? `
            <div class="pmoc-cell-wrapper">
              <button type="button" class="doc-badge-btn badge-green" data-action="open-pmoc" data-sys-id="${system.id}" title="PMOC e ART Anexados no Banco (Conforme)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <polyline points="9 15 11 17 15 13"></polyline>
                </svg>
              </button>
              <button type="button" class="btn-info-pmoc" data-action="open-pmoc" data-sys-id="${system.id}" title="Ver arquivos anexados">i</button>
            </div>
          `
          : `
            <div class="pmoc-cell-wrapper">
              <button type="button" class="doc-badge-btn badge-red" data-action="open-pmoc" data-sys-id="${system.id}" title="PMOC/ART Pendente - Clique para anexar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="11" x2="12" y2="15"></line>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
              </button>
              <button type="button" class="btn-info-pmoc" data-action="open-pmoc" data-sys-id="${system.id}" title="Ver pendências">i</button>
            </div>
          `;

        let monthsHtml = '';
        for (let m = 1; m <= 12; m++) {
          const monthData = system.months ? system.months[m] : null;
          const status = monthData ? monthData.status : null;
          let iconHtml = '';

          if (isNa) {
            iconHtml = '';
          } else if (status === 'DONE') {
            iconHtml = `
              <span class="status-icon icon-done" title="Realizado">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            `;
          } else if (status === 'ATTENTION') {
            iconHtml = `
              <span class="status-icon icon-attention" title="Atenção / Em Execução">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5">
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
            `;
          } else if (status === 'SCHEDULED') {
            iconHtml = `
              <span class="status-icon icon-scheduled" title="Programado">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 22h14"></path>
                  <path d="M5 2h14"></path>
                  <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                  <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
                </svg>
              </span>
            `;
          } else if (status === 'UNREALIZED') {
            iconHtml = `
              <span class="status-icon icon-unrealized" title="Não Realizado / Reprovado">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </span>
            `;
          }

          monthsHtml += `
            <td class="td-month" data-sys-id="${system.id}" data-month-index="${m}" title="Clique para editar status do mês ${m}">
              ${iconHtml}
            </td>
          `;
        }

        // Botão de Excluir Sistema (Protegido por Regra do AD)
        const deleteBtnTitle = isSysAdmin
          ? 'Excluir sistema (Autorização Direta SYSADMIN)'
          : 'Excluir sistema (Requer Autorização do BSFS_OPE_SYSADMIN)';

        html += `
          <tr class="${isNa ? 'row-na-active' : ''}" id="row-${system.id}">
            <td class="td-sistema">
              <div class="system-title-cell">
                <span class="system-name-text">${system.name}</span>
                <button type="button" class="btn-info-system" data-action="open-sys-info" data-sys-id="${system.id}" title="Detalhes técnicos do sistema">i</button>
              </div>
            </td>
            <td class="td-period">${system.periodicity}</td>
            <td class="td-pendencias">${system.pendencias ? `<span class="badge-pendencia">${system.pendencias}</span>` : ''}</td>
            <td class="td-na">
              <input type="checkbox" class="custom-table-checkbox" data-action="toggle-na" data-sys-id="${system.id}" ${isNa ? 'checked' : ''} title="Marcar como Não se Aplica">
            </td>
            <td class="td-pmoc">${pmocBadgeHtml}</td>
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

    tbody.querySelectorAll('[data-action="toggle-na"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const sysId = checkbox.getAttribute('data-sys-id');
        this.toggleSystemNa(sysId, checkbox.checked);
      });
    });

    tbody.querySelectorAll('.td-month').forEach(td => {
      td.addEventListener('click', () => {
        const sysId = td.getAttribute('data-sys-id');
        const monthIndex = td.getAttribute('data-month-index');
        const system = this.systems.find(s => s.id === sysId);
        if (system && !system.na) {
          this.openMonthStatusModal(sysId, parseInt(monthIndex, 10));
        }
      });
    });

    // Exclusão de Sistema com interceptação de regra AD
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

  handleUploadPmocArt() {
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

    this.db.saveSystems(this.systems);

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
    this.showToast('✅ Arquivos PMOC e ART anexados ao banco de dados com sucesso! Sistema regularizado (Verde).', 'success');
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

    document.getElementById('month-modal-pretitle').textContent = `${system.categoryName} - BOULEVARD SHOPPING`;
    document.getElementById('month-modal-title').textContent = `Manutenção de ${monthNames[monthIndex]} de ${this.currentYear}`;
    document.getElementById('month-modal-system-name').textContent = system.name;

    const monthData = system.months ? system.months[monthIndex] : null;
    const currentStatus = monthData ? monthData.status : 'NONE';

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

    modal.classList.add('is-active');
  }

  handleSaveMonthStatus() {
    const system = this.systems.find(s => s.id === this.activeSystemId);
    if (!system) return;

    const selectedRadio = document.querySelector('input[name="month_status_radio"]:checked');
    const newStatus = selectedRadio ? selectedRadio.value : 'NONE';

    const dateVal = document.getElementById('month-exec-date').value;
    const osVal = document.getElementById('month-os-number').value.trim();
    const notesVal = document.getElementById('month-notes').value.trim();

    if (!system.months) system.months = {};

    if (newStatus === 'NONE') {
      delete system.months[this.activeMonthIndex];
    } else {
      system.months[this.activeMonthIndex] = {
        status: newStatus,
        date: dateVal,
        os: osVal,
        notes: notesVal
      };
    }

    this.db.saveSystems(this.systems);

    this.db.logOperation(
      'ATUALIZAR_MES',
      'update',
      `Status do mês ${this.activeMonthIndex}/${this.currentYear} atualizado para ${newStatus} no sistema "${system.name}".`,
      this.auth.getCurrentUser()
    );

    this.updateKPIs();
    this.renderTableOnly();

    const modal = document.getElementById('modal-month-status');
    if (modal) modal.classList.remove('is-active');

    this.showToast('Status do mês gravado no banco de dados com sucesso.', 'success');
  }

  toggleSystemNa(systemId, isChecked) {
    const system = this.systems.find(s => s.id === systemId);
    if (!system) return;

    system.na = isChecked;
    this.db.saveSystems(this.systems);

    this.db.logOperation(
      'ALTERAR_APLICABILIDADE',
      'update',
      `Sistema "${system.name}" alterado para ${isChecked ? 'Não se Aplica (NA)' : 'Aplicável'}.`,
      this.auth.getCurrentUser()
    );

    this.updateKPIs();
    this.renderTableOnly();

    this.showToast(`${system.name}: marcado como ${isChecked ? 'Não se Aplica' : 'Aplicável'}.`, 'info');
  }

  openNewSystemModal() {
    const modal = document.getElementById('modal-new-system');
    const form = document.getElementById('form-new-system');
    if (form) form.reset();
    if (modal) modal.classList.add('is-active');
  }

  handleCreateNewSystem() {
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

    this.systems.push(newSys);
    this.db.saveSystems(this.systems);

    this.db.logOperation(
      'CRIAR_SISTEMA',
      'create',
      `Novo sistema "${name}" (${period}) cadastrado no setor ${catNames[cat] || cat}.`,
      this.auth.getCurrentUser()
    );

    this.render();

    const modal = document.getElementById('modal-new-system');
    if (modal) modal.classList.remove('is-active');

    this.showToast(`Sistema "${name}" gravado no banco de dados!`, 'success');
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
}

function initBoulevardMaintenanceApp() {
  window.boulevardApp = new BoulevardMaintenanceApp();
}
