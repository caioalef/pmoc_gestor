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
    this.pendingAuthAction = null; // Armazena a ação aguardando aprovação de Administrador

    this.filters = {
      search: '',
      categories: [],
      pmocStatuses: [],
      periodicities: [],
      machineStatuses: [],
      maintenanceStatus: null
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

    // Inicializa Filtros de Múltipla Seleção (Multi-select)
    this.initMultiSelectFilters();

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
    this.setupModalDismiss('modal-maquina-parada', ['btn-close-maquina-modal', 'btn-close-maquina-footer']);

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

    // Presets de Meses no Cadastro de Novo Sistema
    this.setupNewSystemSchedulePresets();

    // Formulário Máquina Parada
    const formMaquina = document.getElementById('form-maquina-parada');
    if (formMaquina) {
      formMaquina.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveMaquinaStatus();
      });
    }

    const cbMaquinaParada = document.getElementById('maquina-is-parada');
    if (cbMaquinaParada) {
      cbMaquinaParada.addEventListener('change', (e) => {
        const details = document.getElementById('maquina-details-fields');
        if (details) details.style.display = e.target.checked ? 'block' : 'none';
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
        Usuário atual: <strong>${user.name}</strong> (${user.roleLabel || 'Operador'}).
        <br><strong>Operação solicitada:</strong> ${actionData.description}
        <br>Para prosseguir, informe as credenciais de um administrador do sistema.
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
    const adminUserInput = document.getElementById('admin-auth-user');
    const reasonInput = document.getElementById('admin-auth-reason');

    const pin = pinInput ? pinInput.value : '';
    const adminUser = adminUserInput ? adminUserInput.value.trim() : '';
    const reason = reasonInput ? reasonInput.value.trim() : 'Exclusão autorizada';

    if (!this.auth.validateAdminAuthorization(pin)) {
      this.showToast('❌ Senha de autorização de administrador inválida!', 'danger');
      return;
    }

    // Autorização concedida!
    const authorizer = {
      email: adminUser || (this.auth.getCurrentUser() && this.auth.getCurrentUser().email) || 'administrador@boulevardfs.com.br',
      group: 'Administrador',
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
          this.db.safeSaveToLocalStorage(this.systems);

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

    // Cálculo e KPI de Máquinas Paradas / Status Operacional
    const stoppedSystems = this.systems.filter(s => s.equipamentoParado && s.equipamentoParado.isParado);
    const stoppedCount = stoppedSystems.length;
    const operationalCount = Math.max(0, this.systems.length - stoppedCount);

    const elMaqCount = document.getElementById('kpi-maquinas-paradas-count');
    const elMaqSysParados = document.getElementById('kpi-sistemas-parados-count');
    const elMaqSysOp = document.getElementById('kpi-sistemas-operacionais-count');
    const elMaqTag = document.getElementById('kpi-maquinas-tag');

    if (elMaqCount) elMaqCount.textContent = stoppedCount;
    if (elMaqSysParados) elMaqSysParados.textContent = stoppedCount;
    if (elMaqSysOp) elMaqSysOp.textContent = operationalCount;
    if (elMaqTag) {
      if (stoppedCount === 0) {
        elMaqTag.textContent = '100% Ativo';
        elMaqTag.style.background = 'rgba(16, 185, 129, 0.16)';
        elMaqTag.style.color = '#10b981';
      } else {
        elMaqTag.textContent = `${stoppedCount} Parada(s)`;
        elMaqTag.style.background = 'rgba(239, 68, 68, 0.16)';
        elMaqTag.style.color = '#ef4444';
      }
    }

    // Gráfico de Pizza Responsivo - Status dos Sistemas
    this.renderSystemStatusPieChart();
  }

  /* ==========================================================================
     Gráfico de Pizza / Rosca Responsivo: Status dos Sistemas
     ========================================================================== */
  renderSystemStatusPieChart() {
    const pieSvg = document.getElementById('systems-status-pie');
    const centerCountEl = document.getElementById('kpi-total-systems');
    const centerTextEl = document.getElementById('pie-center-text');
    const totalBadgeEl = document.getElementById('kpi-pie-total-badge');

    if (!pieSvg) return;

    let scheduledCount = 0;
    let doneCount = 0;
    let unrealizedCount = 0;
    let attentionCount = 0;

    this.systems.forEach(sys => {
      if (sys.na) return;
      const months = this.getSystemMonths(sys, this.currentYear);
      if (!months) return;
      Object.values(months).forEach(m => {
        if (!m || !m.scheduled) return;
        if (m.status === 'DONE') doneCount++;
        else if (m.status === 'UNREALIZED') unrealizedCount++;
        else if (m.status === 'ATTENTION') attentionCount++;
        else scheduledCount++; // status 'SCHEDULED' ou default
      });
    });

    const total = scheduledCount + doneCount + unrealizedCount + attentionCount;

    if (centerCountEl) centerCountEl.textContent = total;
    if (centerTextEl) centerTextEl.textContent = 'Rotinas';
    if (totalBadgeEl) totalBadgeEl.innerHTML = `Ano <span class="year-label">${this.currentYear || '2026'}</span>`;

    const pctScheduled = total > 0 ? Math.round((scheduledCount / total) * 100) : 0;
    const pctDone = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const pctUnrealized = total > 0 ? Math.round((unrealizedCount / total) * 100) : 0;
    const pctAttention = total > 0 ? Math.round((attentionCount / total) * 100) : 0;

    const elCountSched = document.getElementById('legend-count-scheduled');
    const elPctSched = document.getElementById('legend-pct-scheduled');
    const elCountDone = document.getElementById('legend-count-done');
    const elPctDone = document.getElementById('legend-pct-done');
    const elCountUnr = document.getElementById('legend-count-unrealized');
    const elPctUnr = document.getElementById('legend-pct-unrealized');
    const elCountAtt = document.getElementById('legend-count-attention');
    const elPctAtt = document.getElementById('legend-pct-attention');

    if (elCountSched) elCountSched.textContent = scheduledCount;
    if (elPctSched) elPctSched.textContent = `(${pctScheduled}%)`;
    if (elCountDone) elCountDone.textContent = doneCount;
    if (elPctDone) elPctDone.textContent = `(${pctDone}%)`;
    if (elCountUnr) elCountUnr.textContent = unrealizedCount;
    if (elPctUnr) elPctUnr.textContent = `(${pctUnrealized}%)`;
    if (elCountAtt) elCountAtt.textContent = attentionCount;
    if (elPctAtt) elPctAtt.textContent = `(${pctAttention}%)`;

    if (total === 0) {
      pieSvg.innerHTML = `
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--border-subtle)" stroke-width="5.5"></circle>
      `;
      return;
    }

    const slicesData = [
      { key: 'SCHEDULED', label: 'Programado', count: scheduledCount, color: '#e8985e' },
      { key: 'DONE', label: 'Realizado', count: doneCount, color: '#10b981' },
      { key: 'UNREALIZED', label: 'Não Realizado', count: unrealizedCount, color: '#ef4444' },
      { key: 'ATTENTION', label: 'Em Execução', count: attentionCount, color: '#f59e0b' }
    ];

    const activeSlices = slicesData.filter(s => s.count > 0);
    let svgHtml = '';
    svgHtml += `<circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--border-subtle)" stroke-width="5.5" opacity="0.25"></circle>`;

    if (activeSlices.length === 1) {
      const s = activeSlices[0];
      svgHtml += `
        <circle class="pie-slice"
          data-key="${s.key}"
          data-label="${s.label}"
          data-count="${s.count}"
          cx="21" cy="21" r="15.9155"
          fill="none"
          stroke="${s.color}"
          stroke-width="5.5">
          <title>${s.label}: ${s.count} (100%)</title>
        </circle>
      `;
    } else {
      let accumulatedPct = 0;
      activeSlices.forEach(s => {
        const rawPct = (s.count / total) * 100;
        const offset = -accumulatedPct;
        accumulatedPct += rawPct;

        svgHtml += `
          <circle class="pie-slice"
            data-key="${s.key}"
            data-label="${s.label}"
            data-count="${s.count}"
            cx="21" cy="21" r="15.9155"
            fill="none"
            stroke="${s.color}"
            stroke-width="5.5"
            stroke-dasharray="${rawPct.toFixed(2)} ${(100 - rawPct).toFixed(2)}"
            stroke-dashoffset="${offset.toFixed(2)}">
            <title>${s.label}: ${s.count} (${Math.round(rawPct)}%)</title>
          </circle>
        `;
      });
    }

    pieSvg.innerHTML = svgHtml;
    this.bindPieChartInteractions(total);
  }

  bindPieChartInteractions(total) {
    const pieSvg = document.getElementById('systems-status-pie');
    const centerCountEl = document.getElementById('kpi-total-systems');
    const centerTextEl = document.getElementById('pie-center-text');
    if (!pieSvg || !centerCountEl || !centerTextEl) return;

    const resetCenter = () => {
      centerCountEl.textContent = total;
      centerTextEl.textContent = 'Rotinas';
      document.querySelectorAll('.legend-row').forEach(r => r.classList.remove('is-hovered'));
    };

    pieSvg.querySelectorAll('.pie-slice').forEach(slice => {
      slice.addEventListener('mouseenter', () => {
        const count = slice.getAttribute('data-count');
        const label = slice.getAttribute('data-label');
        const key = slice.getAttribute('data-key');
        centerCountEl.textContent = count;
        centerTextEl.textContent = label;
        document.querySelectorAll(`.legend-row[data-status="${key}"]`).forEach(r => r.classList.add('is-hovered'));
      });
      slice.addEventListener('mouseleave', resetCenter);

      slice.addEventListener('click', () => {
        const key = slice.getAttribute('data-key');
        this.filterTableByMaintenanceStatus(key);
      });
    });

    document.querySelectorAll('.legend-row').forEach(row => {
      const statusKey = row.getAttribute('data-status');
      row.onmouseenter = () => {
        const slice = pieSvg.querySelector(`.pie-slice[data-key="${statusKey}"]`);
        if (slice) {
          centerCountEl.textContent = slice.getAttribute('data-count');
          centerTextEl.textContent = slice.getAttribute('data-label');
          slice.style.strokeWidth = '7.2';
        }
      };
      row.onmouseleave = () => {
        const slice = pieSvg.querySelector(`.pie-slice[data-key="${statusKey}"]`);
        if (slice) slice.style.strokeWidth = '5.5';
        resetCenter();
      };
      row.onclick = () => {
        this.filterTableByMaintenanceStatus(statusKey);
      };
    });
  }

  filterTableByMaintenanceStatus(statusKey) {
    const labelMap = {
      SCHEDULED: 'Programado',
      DONE: 'Realizado',
      UNREALIZED: 'Não Realizado / Recusado',
      ATTENTION: 'Atenção / Em Execução'
    };

    if (this.filters.maintenanceStatus === statusKey) {
      this.filters.maintenanceStatus = null;
      document.querySelectorAll('.legend-row').forEach(r => r.classList.remove('is-active'));
      this.showToast('Filtro de status removido (exibindo todos os sistemas).', 'info');
    } else {
      this.filters.maintenanceStatus = statusKey;
      document.querySelectorAll('.legend-row').forEach(r => {
        r.classList.toggle('is-active', r.getAttribute('data-status') === statusKey);
      });
      this.showToast(`Filtrado por status: ${labelMap[statusKey] || statusKey}`, 'info');
    }
    this.renderTableOnly();
  }

  getFilteredSystems() {
    if (!Array.isArray(this.systems)) return [];
    return this.systems.filter(item => {
      if (!item) return false;

      // 1. Busca textual rápida
      if (this.filters.search) {
        const query = this.filters.search;
        const matchesName = (item.name || '').toLowerCase().includes(query);
        const matchesCat = (item.categoryName || item.category || '').toLowerCase().includes(query);
        const matchesResp = (item.respTecnico || '').toLowerCase().includes(query);
        const matchesPeriod = (item.periodicity || '').toLowerCase().includes(query);
        const matchesPmoc = (item.pmocStatusLabel || '').toLowerCase().includes(query);
        const matchesShopping = (item.shopping || '').toLowerCase().includes(query);
        const matchesMaquina = item.equipamentoParado && (
          (item.equipamentoParado.maquina || '').toLowerCase().includes(query) ||
          (item.equipamentoParado.motivo || '').toLowerCase().includes(query)
        );
        if (!matchesName && !matchesCat && !matchesResp && !matchesPeriod && !matchesPmoc && !matchesShopping && !matchesMaquina) {
          return false;
        }
      }

      // 2. Filtro Multi-select de Categoria / Setor
      if (Array.isArray(this.filters.categories) && this.filters.categories.length > 0) {
        const itemCat = String(item.category || '').toUpperCase();
        const itemCatName = String(item.categoryName || '').toUpperCase();
        const matches = this.filters.categories.some(c => {
          const cUpper = String(c).toUpperCase();
          return itemCat === cUpper || itemCatName === cUpper || itemCat.includes(cUpper) || cUpper.includes(itemCat);
        });
        if (!matches) return false;
      }

      // 3. Filtro Multi-select de Status PMOC/ART
      if (Array.isArray(this.filters.pmocStatuses) && this.filters.pmocStatuses.length > 0) {
        const itemStatus = item.pmocStatus || 'NOT_REQUIRED';
        if (!this.filters.pmocStatuses.includes(itemStatus)) {
          return false;
        }
      }

      // 4. Filtro Multi-select de Periodicidade
      if (Array.isArray(this.filters.periodicities) && this.filters.periodicities.length > 0) {
        const itemPeriod = item.periodicity || 'Mensal';
        if (!this.filters.periodicities.includes(itemPeriod)) {
          return false;
        }
      }

      // 5. Filtro Multi-select de Status Operacional (Máquina Parada)
      if (Array.isArray(this.filters.machineStatuses) && this.filters.machineStatuses.length > 0) {
        const isParado = Boolean(item.equipamentoParado && item.equipamentoParado.isParado);
        const matchesStopped = this.filters.machineStatuses.includes('STOPPED') && isParado;
        const matchesOperational = this.filters.machineStatuses.includes('OPERATIONAL') && !isParado;
        if (!matchesStopped && !matchesOperational) {
          return false;
        }
      }

      // 6. Filtro por Status de Manutenção (selecionado no gráfico de pizza)
      if (this.filters.maintenanceStatus) {
        if (item.na) return false;
        const months = this.getSystemMonths(item, this.currentYear);
        if (!months) return false;
        const hasMatchingStatus = Object.values(months).some(m => {
          if (!m || !m.scheduled) return false;
          const st = m.status || 'SCHEDULED';
          return st === this.filters.maintenanceStatus;
        });
        if (!hasMatchingStatus) return false;
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

      // Badge PMOC/ART da planilha conciso e elegante
      let pmocBadgeHtml = '';
      if (system.pmocStatus === 'REQUIRED_NOT_INSERTED') {
        pmocBadgeHtml = `<button type="button" class="pmoc-badge pmoc-badge-red" data-action="open-pmoc" data-sys-id="${system.id}" title="Documentação obrigatória não inserida - Clique para anexar">Pendente</button>`;
      } else if (system.pmocStatus === 'REQUIRED_ATTACHED') {
        pmocBadgeHtml = `<button type="button" class="pmoc-badge pmoc-badge-green" data-action="open-pmoc" data-sys-id="${system.id}" title="Documentação inserida sem pendência - Clique para visualizar">Conforme</button>`;
      } else if (system.pmocStatus === 'REQUIRED_EXPIRED') {
        pmocBadgeHtml = `<button type="button" class="pmoc-badge pmoc-badge-orange" data-action="open-pmoc" data-sys-id="${system.id}" title="Validade vencida - Clique para atualizar">Vencido</button>`;
      } else if (system.pmocStatus === 'NOT_REQUIRED') {
        pmocBadgeHtml = `<span class="pmoc-badge pmoc-badge-gray" data-action="open-pmoc" data-sys-id="${system.id}" title="Não aplicável">N/A</span>`;
      } else {
        const attached = system.pmoc && system.pmoc.attached;
        pmocBadgeHtml = attached
          ? `<button type="button" class="pmoc-badge pmoc-badge-green" data-action="open-pmoc" data-sys-id="${system.id}" title="Documentação inserida sem pendência">Conforme</button>`
          : `<button type="button" class="pmoc-badge pmoc-badge-red" data-action="open-pmoc" data-sys-id="${system.id}" title="Documentação obrigatória não inserida">Pendente</button>`;
      }

      // Status Operacional (Máquina Parada / Normal) - Design Clean e Discreto
      const isParado = Boolean(system.equipamentoParado && system.equipamentoParado.isParado);
      const maquinaBadgeHtml = isParado
        ? `<button type="button" class="btn-op-status is-stopped" data-action="open-maquina" data-sys-id="${system.id}" title="Máquina Parada: ${system.equipamentoParado.maquina || 'Equipamento'} (${system.equipamentoParado.motivo || 'Sem motivo'}) - Clique para gerenciar">
             <span class="status-dot"></span>
             <span>Parada: ${system.equipamentoParado.maquina || 'Equip.'}</span>
           </button>`
        : `<button type="button" class="btn-op-status" data-action="open-maquina" data-sys-id="${system.id}" title="Operação normal - Clique para reportar máquina parada">
             <span class="status-dot"></span>
             <span>Normal</span>
           </button>`;

      // Renderização Estática dos Meses (Calendário Estático: meses não agendados permanecem vazios)
      let monthsHtml = '';
      const systemMonths = this.getSystemMonths(system, this.currentYear);
      for (let m = 1; m <= 12; m++) {
        const monthData = systemMonths ? systemMonths[m] : null;
        const isScheduled = Boolean(monthData && monthData.scheduled);
        const status = monthData ? monthData.status : null;
        const docs = (monthData && monthData.documents) || [];
        const hasDocs = docs.length > 0;

        if (isNa || !isScheduled) {
          // Calendário Estático: mês sem manutenção é inalterável e desabilitado
          monthsHtml += `<td class="td-month td-month-static-empty" aria-disabled="true"></td>`;
        } else {
          // Mês agendado no cadastro: interativo, permite registrar execução e laudos
          const docBadgeHtml = hasDocs ? `<span class="month-doc-indicator" title="${docs.length} documento(s) anexado(s)">📎</span>` : '';
          let boxHtml = '';

          if (status === 'DONE') {
            boxHtml = `
              <div class="month-box month-box-done" title="Realizado${hasDocs ? ` (${docs.length} doc(s))` : ' - Clique para gerenciar'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                ${docBadgeHtml}
              </div>
            `;
          } else if (status === 'SCHEDULED') {
            boxHtml = `
              <div class="month-box month-box-scheduled" title="Programado${hasDocs ? ` (${docs.length} doc(s))` : ' - Clique para gerenciar'}">
                <span class="month-triangle-icon">▲</span>
                ${docBadgeHtml}
              </div>
            `;
          } else if (status === 'UNREALIZED') {
            boxHtml = `
              <div class="month-box month-box-unrealized" title="Não Realizado / Pendência${hasDocs ? ` (${docs.length} doc(s))` : ' - Clique para gerenciar'}">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                ${docBadgeHtml}
              </div>
            `;
          } else if (status === 'ATTENTION') {
            boxHtml = `
              <div class="month-box month-box-attention" title="Atenção / Em Execução${hasDocs ? ` (${docs.length} doc(s))` : ' - Clique para gerenciar'}">
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
            <td class="td-month td-month-interactive" data-sys-id="${system.id}" data-month-index="${m}" title="Clique para gerenciar manutenção">
              ${boxHtml}
            </td>
          `;
        }
      }

      const deleteBtnTitle = isSysAdmin
        ? 'Excluir sistema (Autorização Direta de Administrador)'
        : 'Excluir sistema (Requer Autorização de Administrador)';

      html += `
        <tr class="${isNa ? 'row-na-active' : ''}" id="row-${system.id}">
          <td class="td-shopping"><span class="badge-shopping">${system.shopping || 'BSFS'}</span></td>
          <td class="td-programacao"><span class="badge-programacao">${system.programacao || 'Finalizada'}</span></td>
          <td class="td-sistema-name"><span class="system-cat-text">${system.categoryName || system.category}</span></td>
          <td class="td-manutencao">
            <div class="system-title-cell">
              <span class="system-manutencao-text">${system.name}</span>
              ${maquinaBadgeHtml}
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

    tbody.querySelectorAll('[data-action="open-maquina"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sysId = btn.getAttribute('data-sys-id');
        this.openMaquinaModal(sysId);
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

    const btnToggleSchedule = document.getElementById('btn-toggle-month-schedule');
    if (btnToggleSchedule) {
      btnToggleSchedule.style.display = 'none';
    }

    this.renderMonthDocsList();
    modal.classList.add('is-active');
  }

  async handleToggleMonthSchedule() {
    const system = this.systems.find(s => s.id === this.activeSystemId);
    if (!system) return;

    const yr = String(this.currentYear || '2026');
    if (!system.years) system.years = {};
    if (!system.years[yr]) {
      system.years[yr] = { months: this.getSystemMonths(system, yr) };
    }
    if (!system.years[yr].months) system.years[yr].months = {};

    const monthData = system.years[yr].months[this.activeMonthIndex] || {};
    const currentlyScheduled = Boolean(monthData.scheduled);

    if (currentlyScheduled) {
      if (!confirm(`Deseja realmente desmarcar o agendamento de manutenção do mês ${this.activeMonthIndex}/${yr} para o sistema "${system.name}"?`)) {
        return;
      }
      monthData.scheduled = false;
    } else {
      monthData.scheduled = true;
      if (!monthData.status) monthData.status = 'SCHEDULED';
    }

    system.years[yr].months[this.activeMonthIndex] = monthData;
    if (yr === '2026') {
      if (!system.months) system.months = {};
      system.months[this.activeMonthIndex] = monthData;
    }

    try {
      await this.db.saveSingleSystem(system);
      this.db.logOperation(
        'ALTERAR_AGENDAMENTO_MES',
        'update',
        `${currentlyScheduled ? 'Desmarcado agendamento' : 'Agendada nova manutenção'} para o mês ${this.activeMonthIndex}/${yr} no sistema "${system.name}".`,
        this.auth.getCurrentUser()
      );

      this.updateKPIs();
      this.renderTableOnly();

      const modal = document.getElementById('modal-month-status');
      if (modal) modal.classList.remove('is-active');

      this.showToast(`Mês ${this.activeMonthIndex}/${yr} ${currentlyScheduled ? 'desmarcado' : 'agendado'} com sucesso!`, 'success');
    } catch (err) {
      this.showToast('Erro ao atualizar agendamento no banco: ' + err.message, 'danger');
    }
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
    const validFiles = Array.from(files).filter(file => {
      // Limite individual ampliado para 30MB
      if (file.size > 30 * 1024 * 1024) {
        this.showToast(`Arquivo "${file.name}" ultrapassa 30MB e foi ignorado.`, 'warning');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    let loadedCount = 0;
    validFiles.forEach(file => {
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
          uploadedBy: user.name || user.username || 'Operador',
          dataUrl: event.target.result
        };

        this.currentMonthDocs.push(docItem);
        loadedCount++;
        this.renderMonthDocsList();

        if (loadedCount === validFiles.length) {
          this.showToast(`${loadedCount} documento(s) inserido(s). Clique em Salvar para gravar no MariaDB.`, 'success');
        }
      };

      reader.onerror = () => {
        this.showToast(`Erro ao processar arquivo "${file.name}".`, 'danger');
        loadedCount++;
        this.renderMonthDocsList();
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

    // Sincroniza os checkboxes com a periodicidade padrão (Mensal)
    const periodSelect = document.getElementById('new-sys-period');
    const initialPeriod = (periodSelect && periodSelect.value) || 'Mensal';
    this.applyNewSystemPeriodPreset(initialPeriod);

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

    // Lê estritamente os 12 meses do grid
    const monthsObj = {};
    let scheduledCount = 0;
    for (let m = 1; m <= 12; m++) {
      const cb = document.querySelector(`#new-sys-months-grid input[value="${m}"]`);
      const isChecked = Boolean(cb && cb.checked);
      if (isChecked) scheduledCount++;
      monthsObj[m] = {
        scheduled: isChecked,
        status: isChecked ? 'SCHEDULED' : null,
        documents: []
      };
    }

    const yr = String(this.currentYear || '2026');
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
      equipamentoParado: { isParado: false, maquina: '', motivo: '', dataParada: '', previsaoRetorno: '', observacao: '' },
      months: monthsObj,
      years: {
        [yr]: { months: monthsObj }
      }
    };

    try {
      await this.db.saveSingleSystem(newSys);
      this.systems.push(newSys);
      this.db.safeSaveToLocalStorage(this.systems);

      this.db.logOperation(
        'CRIAR_SISTEMA',
        'create',
        `Novo sistema "${name}" (${period}) cadastrado no setor ${catNames[cat] || cat} com manutenção agendada para ${Object.keys(monthsObj).length} mês(es).`,
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

  /* ==========================================================================
     10. Presets de Agendamento, Máquina Parada & Filtros Multi-Select
     ========================================================================== */
  applyNewSystemPeriodPreset(period) {
    const grid = document.getElementById('new-sys-months-grid');
    if (!grid) return;

    let predicate;
    if (period === 'Mensal') {
      predicate = () => true;
    } else if (period === 'Bimestral') {
      predicate = (m) => m % 2 === 0; // Fev, Abr, Jun, Ago, Out, Dez
    } else if (period === 'Trimestral') {
      predicate = (m) => m % 3 === 0; // Mar, Jun, Set, Dez
    } else if (period === 'Semestral') {
      predicate = (m) => m === 6 || m === 12; // Jun, Dez
    } else if (period === 'Anual') {
      predicate = (m) => m === 12; // Dez
    } else {
      return;
    }

    grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const m = parseInt(cb.value, 10);
      cb.checked = predicate(m);
      const card = cb.closest('.month-checkbox-card');
      if (card) {
        if (cb.checked) card.classList.add('is-selected');
        else card.classList.remove('is-selected');
      }
    });
  }

  setupNewSystemSchedulePresets() {
    const grid = document.getElementById('new-sys-months-grid');
    const periodSelect = document.getElementById('new-sys-period');
    if (!grid) return;

    // Alterna visual dos cards ao marcar/desmarcar manualmente
    grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const card = cb.closest('.month-checkbox-card');
        if (card) {
          if (cb.checked) card.classList.add('is-selected');
          else card.classList.remove('is-selected');
        }
      });
    });

    // Sincroniza imediatamente quando o usuário seleciona uma opção no dropdown Periodicidade
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.applyNewSystemPeriodPreset(e.target.value);
      });
    }

    // Botões de Presets rápidos também atualizam o dropdown e os checkboxes
    const btnAll = document.getElementById('btn-preset-all-months');
    const btnBi = document.getElementById('btn-preset-bimestral');
    const btnTri = document.getElementById('btn-preset-trimestral');
    const btnSem = document.getElementById('btn-preset-semestral');
    const btnAnual = document.getElementById('btn-preset-anual');
    const btnClear = document.getElementById('btn-preset-clear-months');

    if (btnAll) btnAll.addEventListener('click', () => {
      if (periodSelect) periodSelect.value = 'Mensal';
      this.applyNewSystemPeriodPreset('Mensal');
    });
    if (btnBi) btnBi.addEventListener('click', () => {
      if (periodSelect) periodSelect.value = 'Bimestral';
      this.applyNewSystemPeriodPreset('Bimestral');
    });
    if (btnTri) btnTri.addEventListener('click', () => {
      if (periodSelect) periodSelect.value = 'Trimestral';
      this.applyNewSystemPeriodPreset('Trimestral');
    });
    if (btnSem) btnSem.addEventListener('click', () => {
      if (periodSelect) periodSelect.value = 'Semestral';
      this.applyNewSystemPeriodPreset('Semestral');
    });
    if (btnAnual) btnAnual.addEventListener('click', () => {
      if (periodSelect) periodSelect.value = 'Anual';
      this.applyNewSystemPeriodPreset('Anual');
    });
    if (btnClear) btnClear.addEventListener('click', () => {
      grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        const card = cb.closest('.month-checkbox-card');
        if (card) card.classList.remove('is-selected');
      });
    });
  }

  openMaquinaModal(systemId) {
    const system = this.systems.find(s => s.id === systemId);
    if (!system) return;

    this.activeSystemId = systemId;
    const modal = document.getElementById('modal-maquina-parada');
    if (!modal) return;

    const idInput = document.getElementById('maquina-system-id');
    const nameEl = document.getElementById('maquina-system-name');
    const catEl = document.getElementById('maquina-system-category');
    const cbParada = document.getElementById('maquina-is-parada');
    const detailsContainer = document.getElementById('maquina-details-fields');
    const inputNome = document.getElementById('maquina-nome');
    const inputMotivo = document.getElementById('maquina-motivo');
    const inputData = document.getElementById('maquina-data-parada');
    const inputPrevisao = document.getElementById('maquina-previsao-retorno');
    const inputObs = document.getElementById('maquina-observacao');

    if (idInput) idInput.value = system.id;
    if (nameEl) nameEl.textContent = system.name;
    if (catEl) catEl.textContent = system.categoryName || system.category;

    const eq = system.equipamentoParado || {};
    const isParado = Boolean(eq.isParado);

    if (cbParada) cbParada.checked = isParado;
    if (detailsContainer) detailsContainer.style.display = isParado ? 'block' : 'none';

    if (inputNome) inputNome.value = eq.maquina || '';
    if (inputMotivo) inputMotivo.value = eq.motivo || '';
    if (inputData) inputData.value = eq.dataParada || '';
    if (inputPrevisao) inputPrevisao.value = eq.previsaoRetorno || '';
    if (inputObs) inputObs.value = eq.observacao || '';

    modal.classList.add('is-active');
  }

  async handleSaveMaquinaStatus() {
    const system = this.systems.find(s => s.id === this.activeSystemId);
    if (!system) return;

    const cbParada = document.getElementById('maquina-is-parada');
    const isParado = Boolean(cbParada && cbParada.checked);

    const inputNome = document.getElementById('maquina-nome');
    const inputMotivo = document.getElementById('maquina-motivo');
    const inputData = document.getElementById('maquina-data-parada');
    const inputPrevisao = document.getElementById('maquina-previsao-retorno');
    const inputObs = document.getElementById('maquina-observacao');

    if (isParado && (!inputNome || !inputNome.value.trim())) {
      this.showToast('Por favor, informe a identificação da máquina/equipamento parada.', 'warning');
      if (inputNome) inputNome.focus();
      return;
    }

    system.equipamentoParado = {
      isParado: isParado,
      maquina: isParado && inputNome ? inputNome.value.trim() : '',
      motivo: isParado && inputMotivo ? inputMotivo.value.trim() : '',
      dataParada: isParado && inputData ? inputData.value : '',
      previsaoRetorno: isParado && inputPrevisao ? inputPrevisao.value : '',
      observacao: isParado && inputObs ? inputObs.value.trim() : '',
      updatedAt: new Date().toISOString(),
      updatedBy: (this.auth.getCurrentUser() && this.auth.getCurrentUser().name) || 'Operador'
    };

    const saveBtn = document.getElementById('btn-save-maquina');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando no MariaDB...';
    }

    try {
      await this.db.saveSingleSystem(system);

      this.db.logOperation(
        'STATUS_OPERACIONAL',
        'update',
        isParado
          ? `Máquina parada informada no sistema "${system.name}": ${system.equipamentoParado.maquina} (${system.equipamentoParado.motivo || 'Sem motivo'}).`
          : `Sistema "${system.name}" restabelecido como 100% operacional.`,
        this.auth.getCurrentUser()
      );

      this.updateKPIs();
      this.renderTableOnly();

      const modal = document.getElementById('modal-maquina-parada');
      if (modal) modal.classList.remove('is-active');

      this.showToast(
        isParado ? '⚠️ Status de máquina parada registrado com sucesso!' : '✅ Sistema registrado como 100% operacional!',
        'success'
      );
    } catch (err) {
      this.showToast('Erro ao salvar no MariaDB: ' + err.message, 'danger');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Status Operacional';
      }
    }
  }

  initMultiSelectFilters() {
    // 1. Populando opções de Disciplina / Setor
    const catList = document.getElementById('list-filter-category');
    if (catList) {
      const categories = [
        { id: 'AR_CONDICIONADO', label: 'Ar Condicionado' },
        { id: 'ELETRICA', label: 'Elétrica / Sistemas Críticos' },
        { id: 'INCENDIO', label: 'Prevenção Contra Incêndio' },
        { id: 'ELEVADORES', label: 'Elevadores e Escadas' },
        { id: 'HIDRAULICO', label: 'Hidráulica' },
        { id: 'GAS', label: 'Gás' },
        { id: 'ESTRUTURAL', label: 'Estrutural' }
      ];
      catList.innerHTML = categories.map(cat => `
        <label class="multi-option-item">
          <input type="checkbox" class="cb-filter-category" value="${cat.id}">
          <span>${cat.label}</span>
        </label>
      `).join('');
    }

    // 2. Populando opções de Status PMOC
    const pmocList = document.getElementById('list-filter-pmoc');
    if (pmocList) {
      const pmocOptions = [
        { id: 'REQUIRED_ATTACHED', label: '🟢 Inserido sem Pendência' },
        { id: 'REQUIRED_NOT_INSERTED', label: '🔴 Documentação Não Inserida' },
        { id: 'REQUIRED_EXPIRED', label: '🟠 Validade Vencida' },
        { id: 'NOT_REQUIRED', label: '⚪ Não Aplicável' }
      ];
      pmocList.innerHTML = pmocOptions.map(p => `
        <label class="multi-option-item">
          <input type="checkbox" class="cb-filter-pmoc" value="${p.id}">
          <span>${p.label}</span>
        </label>
      `).join('');
    }

    // 3. Populando opções de Periodicidade
    const periodList = document.getElementById('list-filter-periodicity');
    if (periodList) {
      const periods = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Conforme Demanda'];
      periodList.innerHTML = periods.map(p => `
        <label class="multi-option-item">
          <input type="checkbox" class="cb-filter-periodicity" value="${p}">
          <span>${p}</span>
        </label>
      `).join('');
    }

    // Dropdown toggle
    const setupDropdown = (toggleBtnId, menuId) => {
      const btn = document.getElementById(toggleBtnId);
      const menu = document.getElementById(menuId);
      if (!btn || !menu) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('is-open');
        document.querySelectorAll('.multi-dropdown-menu.is-open').forEach(m => {
          if (m !== menu) m.classList.remove('is-open');
        });
        if (!isOpen) {
          menu.classList.add('is-open');
        } else {
          menu.classList.remove('is-open');
        }
      });
    };

    setupDropdown('btn-toggle-filter-category', 'menu-filter-category');
    setupDropdown('btn-toggle-filter-pmoc', 'menu-filter-pmoc');
    setupDropdown('btn-toggle-filter-periodicity', 'menu-filter-periodicity');
    setupDropdown('btn-toggle-filter-maquina', 'menu-filter-maquina');

    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.multi-select-wrapper')) {
        document.querySelectorAll('.multi-dropdown-menu.is-open').forEach(m => m.classList.remove('is-open'));
      }
    });

    // Sincronização dos Filtros e Labels
    const updateCategoryFilter = () => {
      const cbs = document.querySelectorAll('.cb-filter-category:checked');
      const label = document.getElementById('label-filter-category');
      this.filters.categories = Array.from(cbs).map(cb => cb.value);
      if (label) {
        if (this.filters.categories.length === 0) label.textContent = 'Todas';
        else if (this.filters.categories.length === 1) label.textContent = cbs[0].nextElementSibling.textContent;
        else label.textContent = `${this.filters.categories.length} selecionadas`;
      }
      this.renderTableOnly();
    };

    const updatePmocFilter = () => {
      const cbs = document.querySelectorAll('.cb-filter-pmoc:checked');
      const label = document.getElementById('label-filter-pmoc');
      this.filters.pmocStatuses = Array.from(cbs).map(cb => cb.value);
      if (label) {
        if (this.filters.pmocStatuses.length === 0) label.textContent = 'Todos';
        else if (this.filters.pmocStatuses.length === 1) label.textContent = cbs[0].nextElementSibling.textContent.replace(/^[^\w\s]+\s*/, '');
        else label.textContent = `${this.filters.pmocStatuses.length} selecionados`;
      }
      this.renderTableOnly();
    };

    const updatePeriodFilter = () => {
      const cbs = document.querySelectorAll('.cb-filter-periodicity:checked');
      const label = document.getElementById('label-filter-periodicity');
      this.filters.periodicities = Array.from(cbs).map(cb => cb.value);
      if (label) {
        if (this.filters.periodicities.length === 0) label.textContent = 'Todas';
        else if (this.filters.periodicities.length === 1) label.textContent = cbs[0].nextElementSibling.textContent;
        else label.textContent = `${this.filters.periodicities.length} selecionadas`;
      }
      this.renderTableOnly();
    };

    const updateMaquinaFilter = () => {
      const cbs = document.querySelectorAll('.cb-filter-maquina:checked');
      const label = document.getElementById('label-filter-maquina');
      const totalCbs = document.querySelectorAll('.cb-filter-maquina').length;
      if (cbs.length === 0 || cbs.length === totalCbs) {
        this.filters.machineStatuses = [];
        if (label) label.textContent = 'Todas';
      } else {
        this.filters.machineStatuses = Array.from(cbs).map(cb => cb.value);
        if (label) {
          label.textContent = this.filters.machineStatuses.includes('STOPPED') ? '🔴 Paradas' : '🟢 Operacionais';
        }
      }
      this.renderTableOnly();
    };

    // Listeners nos checkboxes
    document.querySelectorAll('.cb-filter-category').forEach(cb => cb.addEventListener('change', updateCategoryFilter));
    document.querySelectorAll('.cb-filter-pmoc').forEach(cb => cb.addEventListener('change', updatePmocFilter));
    document.querySelectorAll('.cb-filter-periodicity').forEach(cb => cb.addEventListener('change', updatePeriodFilter));
    document.querySelectorAll('.cb-filter-maquina').forEach(cb => cb.addEventListener('change', updateMaquinaFilter));

    // Ações de Todas / Limpar
    const setAllCheckboxes = (selector, checked, callback) => {
      document.querySelectorAll(selector).forEach(cb => cb.checked = checked);
      callback();
    };

    const btnAllCat = document.getElementById('btn-all-categories');
    const btnNoneCat = document.getElementById('btn-none-categories');
    if (btnAllCat) btnAllCat.addEventListener('click', () => setAllCheckboxes('.cb-filter-category', true, updateCategoryFilter));
    if (btnNoneCat) btnNoneCat.addEventListener('click', () => setAllCheckboxes('.cb-filter-category', false, updateCategoryFilter));

    const btnAllPmoc = document.getElementById('btn-all-pmoc');
    const btnNonePmoc = document.getElementById('btn-none-pmoc');
    if (btnAllPmoc) btnAllPmoc.addEventListener('click', () => setAllCheckboxes('.cb-filter-pmoc', true, updatePmocFilter));
    if (btnNonePmoc) btnNonePmoc.addEventListener('click', () => setAllCheckboxes('.cb-filter-pmoc', false, updatePmocFilter));

    const btnAllPer = document.getElementById('btn-all-periodicity');
    const btnNonePer = document.getElementById('btn-none-periodicity');
    if (btnAllPer) btnAllPer.addEventListener('click', () => setAllCheckboxes('.cb-filter-periodicity', true, updatePeriodFilter));
    if (btnNonePer) btnNonePer.addEventListener('click', () => setAllCheckboxes('.cb-filter-periodicity', false, updatePeriodFilter));

    // Reset geral de filtros
    const btnReset = document.getElementById('btn-reset-filters');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        document.querySelectorAll('.cb-filter-category, .cb-filter-pmoc, .cb-filter-periodicity').forEach(cb => cb.checked = false);
        document.querySelectorAll('.cb-filter-maquina').forEach(cb => cb.checked = true);
        const searchInput = document.getElementById('filter-search');
        const btnClear = document.getElementById('btn-clear-search');
        if (searchInput) searchInput.value = '';
        if (btnClear) btnClear.style.display = 'none';

        this.filters = { search: '', categories: [], pmocStatuses: [], periodicities: [], machineStatuses: [], maintenanceStatus: null };
        document.querySelectorAll('.legend-row').forEach(r => r.classList.remove('is-active'));

        const labelCat = document.getElementById('label-filter-category');
        const labelPmoc = document.getElementById('label-filter-pmoc');
        const labelPer = document.getElementById('label-filter-periodicity');
        const labelMaq = document.getElementById('label-filter-maquina');

        if (labelCat) labelCat.textContent = 'Todas';
        if (labelPmoc) labelPmoc.textContent = 'Todos';
        if (labelPer) labelPer.textContent = 'Todas';
        if (labelMaq) labelMaq.textContent = 'Todas';

        this.renderTableOnly();
      });
    }
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
