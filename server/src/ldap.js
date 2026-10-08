import ldap from 'ldapjs';

function parseEntryAttributes(entry) {
  if (!entry) return null;
  const result = {};

  // 1. Suporte a ldapjs v2 (caso exista .object)
  if (entry.object && typeof entry.object === 'object') {
    Object.assign(result, entry.object);
  }

  // 2. Suporte nativo a ldapjs v3 (.attributes array)
  if (Array.isArray(entry.attributes)) {
    for (const attr of entry.attributes) {
      const key = attr.type || attr.name;
      const vals = attr.values || attr.vals || [];
      if (key) {
        result[key] = vals.length === 1 ? vals[0] : vals;
        result[key.toLowerCase()] = result[key];
      }
    }
  }

  // 3. Suporte a ldapjs v3 POJO (.pojo.attributes)
  if (entry.pojo && Array.isArray(entry.pojo.attributes)) {
    for (const attr of entry.pojo.attributes) {
      const key = attr.type || attr.name;
      const vals = attr.values || attr.vals || [];
      if (key && !result[key]) {
        result[key] = vals.length === 1 ? vals[0] : vals;
        result[key.toLowerCase()] = result[key];
      }
    }
  }

  return result;
}

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
        console.warn('[LDAP] Falha de autenticação para %s:', upn, bindErr.message);
        client.unbind(() => { });
        return resolve({
          success: false,
          error: 'Credenciais inválidas no Active Directory ou conta bloqueada.'
        });
      }

      console.log(`[LDAP] Bind com sucesso para ${upn}. Buscando atributos do usuário...`);

      // Busca dados do usuário (grupos, nome de exibição, e-mail)
      const searchOptions = {
        scope: 'sub',
        filter: `(|(sAMAccountName=${cleanUser})(userPrincipalName=${upn})(userPrincipalName=${cleanUser}@*))`,
        attributes: ['sAMAccountName', 'displayName', 'cn', 'mail', 'memberOf']
      };

      client.search(adBaseDN, searchOptions, (searchErr, res) => {
        if (searchErr) {
          console.error('[LDAP] Erro na busca de grupos:', searchErr.message);
          client.unbind(() => { });
          return resolve({
            success: false,
            error: `Falha ao consultar permissões do usuário no Active Directory: ${searchErr.message}`
          });
        }

        let userData = null;

        res.on('searchEntry', (entry) => {
          userData = parseEntryAttributes(entry);
        });

        res.on('searchReference', (referral) => {
          // Ignora referrals do Active Directory (ForestDnsZones, DomainDnsZones)
        });

        res.on('error', (err) => {
          if (err && err.message && err.message.toLowerCase().includes('referral')) {
            console.log('[LDAP] Referral do AD ignorado:', err.message);
            return;
          }
          console.warn('[LDAP Search Stream Error]:', err.message);
        });

        res.on('end', () => {
          client.unbind(() => { });

          if (!userData) {
            console.warn(`[LDAP] Usuário ${cleanUser} autenticou no bind, mas objeto não foi encontrado na base ${adBaseDN}`);
            return resolve({
              success: false,
              error: `Usuário autenticado no AD, mas o registro do usuário "${cleanUser}" não foi localizado na árvore (${adBaseDN}).`
            });
          }

          const displayName = userData.displayName || userData.displayname || userData.cn || cleanUser;
          const email = userData.mail || `${cleanUser}@${adDomain.toLowerCase()}`;

          let memberOf = [];
          const rawMemberOf = userData.memberOf || userData.memberof;
          if (rawMemberOf) {
            memberOf = Array.isArray(rawMemberOf) ? rawMemberOf : [rawMemberOf];
          }

          console.log('[LDAP] Usuário %s - Grupos identificados (%d):', cleanUser, memberOf.length, memberOf);

          // Verifica se pertence aos grupos autorizados
          const isSysAdmin = memberOf.some(g => String(g).toUpperCase().includes(adminGroup.toUpperCase()));
          const isSysUser = memberOf.some(g => String(g).toUpperCase().includes(userGroup.toUpperCase()));

          console.log(`[LDAP] Verificação de autorização: isSysAdmin=${isSysAdmin}, isSysUser=${isSysUser}`);

          // BLOQUEIO ESTRITO: Apenas membros autorizados têm permissão
          if (!isSysAdmin && !isSysUser) {
            console.warn(`[LDAP] ACESSO NEGADO: Usuário "${cleanUser}" (${displayName}) não possui autorização nos grupos permitidos.`);
            return resolve({
              success: false,
              error: `Acesso negado: o usuário "${cleanUser}" não possui autorização para acessar o sistema. Solicite permissão à equipe técnica/administração.`
            });
          }

          const role = isSysAdmin ? 'SUPERADMIN' : 'USER';
          const roleLabel = isSysAdmin ? 'Administrador' : 'Operador';
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
              authSource: 'AD_LDAP'
            }
          });
        });
      });
    });
  });
}
