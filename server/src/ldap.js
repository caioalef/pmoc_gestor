import ldap from 'ldapjs';

export async function authenticateWithAD(username, password) {
  const adHost = process.env.AD_HOST || '10.10.19.2';
  const adPort = parseInt(process.env.AD_PORT || '389', 10);
  const adDomain = (process.env.AD_DOMAIN || 'BSFS.LOCAL').toUpperCase();
  const adBaseDN = process.env.AD_BASE_DN || adDomain.split('.').map(part => `DC=${part}`).join(',');
  const adminGroup = process.env.AD_ADMIN_GROUP || 'BSFS_OPE_SYSADMIN';
  const userGroup = process.env.AD_USER_GROUP || 'BSFS_OPE_SYSUSER';

  // 1. Fallback / Usuário local de emergência (opcional, para manutenção)
  if (process.env.ENABLE_LOCAL_FALLBACK !== 'false') {
    const localUsers = {
      'caio.alef': {
        name: 'Caio Alef',
        password: process.env.LOCAL_ADMIN_PASS || 'Boulevard@1234',
        role: 'SUPERADMIN',
        roleLabel: 'Superadmin (Local)',
        canDelete: true,
        canInsert: true,
        email: 'caio.alef@boulevardfs.com.br'
      }
    };

    const cleanUser = username.toLowerCase().trim();
    if (localUsers[cleanUser] && localUsers[cleanUser].password === password) {
      console.log(`[Auth] Login efetuado via conta local de emergência: ${cleanUser}`);
      const u = localUsers[cleanUser];
      return {
        success: true,
        user: {
          id: cleanUser,
          username: cleanUser,
          name: u.name,
          email: u.email,
          role: u.role,
          roleLabel: u.roleLabel,
          canDelete: u.canDelete,
          canInsert: u.canInsert,
          authSource: 'LOCAL'
        }
      };
    }
  }

  // 2. Autenticação no Active Directory via LDAP
  return new Promise((resolve) => {
    let cleanUser = username.trim();
    if (cleanUser.includes('@')) {
      cleanUser = cleanUser.split('@')[0];
    }
    if (cleanUser.includes('\\')) {
      cleanUser = cleanUser.split('\\')[1];
    }

    const upn = `${cleanUser}@${adDomain}`;
    const ldapUrl = `ldap://${adHost}:${adPort}`;

    console.log(`[LDAP] Tentando autenticar ${upn} em ${ldapUrl}...`);

    let client;
    try {
      client = ldap.createClient({
        url: ldapUrl,
        timeout: 5000,
        connectTimeout: 7000
      });
    } catch (err) {
      console.error('[LDAP] Erro ao criar cliente LDAP:', err.message);
      return resolve({
        success: false,
        error: `Não foi possível inicializar conexão com o AD (${adHost}): ${err.message}`
      });
    }

    // Tratamento de erros de conexão/socket
    client.on('error', (err) => {
      console.error('[LDAP Error Event]:', err.message);
    });

    // Realiza o Bind com as credenciais do usuário
    client.bind(upn, password, (bindErr) => {
      if (bindErr) {
        console.warn(`[LDAP] Falha de autenticação para ${upn}:`, bindErr.message);
        client.unbind(() => {});
        return resolve({
          success: false,
          error: 'Credenciais inválidas no Active Directory ou conta bloqueada.'
        });
      }

      console.log(`[LDAP] Bind com sucesso para ${upn}. Buscando atributos do usuário...`);

      // Busca dados do usuário (grupos, nome de exibição, e-mail)
      const searchOptions = {
        scope: 'sub',
        filter: `(&(objectCategory=person)(objectClass=user)(|(sAMAccountName=${cleanUser})(userPrincipalName=${upn})))`,
        attributes: ['sAMAccountName', 'displayName', 'cn', 'mail', 'memberOf']
      };

      client.search(adBaseDN, searchOptions, (searchErr, res) => {
        if (searchErr) {
          console.error('[LDAP] Erro na busca de grupos:', searchErr.message);
          client.unbind(() => {});
          return resolve({
            success: false,
            error: `Falha ao consultar permissões do usuário no Active Directory: ${searchErr.message}`
          });
        }

        let userData = null;

        res.on('searchEntry', (entry) => {
          userData = entry.object;
        });

        res.on('error', (err) => {
          console.warn('[LDAP Search Stream Error]:', err.message);
        });

        res.on('end', () => {
          client.unbind(() => {});

          if (!userData) {
            console.warn(`[LDAP] Usuário ${cleanUser} autenticou no bind, mas objeto não foi encontrado na base ${adBaseDN}`);
            return resolve({
              success: false,
              error: `Usuário autenticado, mas suas informações de grupo não foram localizadas no Active Directory (${adBaseDN}).`
            });
          }

          const displayName = userData.displayName || userData.cn || cleanUser;
          const email = userData.mail || `${cleanUser}@${adDomain.toLowerCase()}`;
          
          let memberOf = [];
          if (userData && userData.memberOf) {
            memberOf = Array.isArray(userData.memberOf) ? userData.memberOf : [userData.memberOf];
          }

          console.log(`[LDAP] Usuário ${cleanUser} - Grupos identificados (${memberOf.length}):`, memberOf);

          // Verifica se pertence aos grupos autorizados
          const isSysAdmin = memberOf.some(g => String(g).toUpperCase().includes(adminGroup.toUpperCase()));
          const isSysUser = memberOf.some(g => String(g).toUpperCase().includes(userGroup.toUpperCase()));

          console.log(`[LDAP] Verificação de autorização: isSysAdmin=${isSysAdmin}, isSysUser=${isSysUser}`);

          // BLOQUEIO ESTRITO: Apenas membros de BSFS_OPE_SYSADMIN ou BSFS_OPE_SYSUSER têm permissão
          const requireGroup = process.env.AD_REQUIRE_GROUP !== 'false';
          if (requireGroup && !isSysAdmin && !isSysUser) {
            console.warn(`[LDAP] ACESSO NEGADO: ${cleanUser} não pertence aos grupos ${adminGroup} ou ${userGroup}`);
            return resolve({
              success: false,
              error: `Acesso negado: o usuário "${cleanUser}" não possui permissão de acesso. É obrigatório fazer parte do grupo ${userGroup} ou ${adminGroup} no Active Directory.`
            });
          }

          const role = isSysAdmin ? 'SUPERADMIN' : 'USER';
          const roleLabel = isSysAdmin ? 'Superadmin (AD)' : 'User (AD)';
          const canDelete = isSysAdmin;

          console.log(`[LDAP] Login concluído e autorizado para ${cleanUser} [Perfil: ${role}]`);

          return resolve({
            success: true,
            user: {
              id: cleanUser,
              username: cleanUser,
              name: displayName,
              email: email,
              role: role,
              roleLabel: roleLabel,
              canDelete: canDelete,
              canInsert: true,
              authSource: 'AD_LDAP',
              groups: memberOf
            }
          });
        });
      });
    });
  });
}
