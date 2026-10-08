export function requireCanInsert(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado. É necessário estar autenticado no sistema com usuário de rede.'
    });
  }
  if (!req.user.canInsert && req.user.role !== 'SUPERADMIN' && req.user.role !== 'USER') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado: seu usuário não possui permissão para salvar alterações no cronograma.'
    });
  }
  next();
}

export function requireCanDelete(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado. É necessário estar autenticado no sistema com usuário de rede.'
    });
  }
  if (!req.user.canDelete && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado: apenas administradores possuem permissão para excluir informações.'
    });
  }
  next();
}
