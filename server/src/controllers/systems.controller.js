import {
  getAllSystems,
  upsertSystemsBatch,
  upsertSingleSystem,
  deleteSystemById
} from '../services/systems.service.js';

export async function getSystemsHandler(req, res, next) {
  try {
    const systems = await getAllSystems();
    res.json(systems);
  } catch (err) {
    next(err);
  }
}

export async function putSystemsBatchHandler(req, res, next) {
  try {
    const systems = req.body;
    if (!Array.isArray(systems)) {
      return res.status(400).json({
        success: false,
        error: 'Formato inválido. Esperado um array de sistemas.'
      });
    }

    const result = await upsertSystemsBatch(systems);
    res.json({
      success: true,
      message: `${result.count} sistemas sincronizados no MariaDB.`
    });
  } catch (err) {
    next(err);
  }
}

export async function putSingleSystemHandler(req, res, next) {
  try {
    const { id } = req.params;
    const sys = req.body;
    if (!sys) {
      return res.status(400).json({
        success: false,
        error: 'Dados do sistema são obrigatórios.'
      });
    }

    await upsertSingleSystem(id, sys);
    res.json({
      success: true,
      message: `Sistema ${id} salvo com sucesso no MariaDB.`
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSystemHandler(req, res, next) {
  try {
    const { id } = req.params;
    await deleteSystemById(id);
    res.json({
      success: true,
      message: `Sistema ${id} excluído com sucesso.`
    });
  } catch (err) {
    next(err);
  }
}
