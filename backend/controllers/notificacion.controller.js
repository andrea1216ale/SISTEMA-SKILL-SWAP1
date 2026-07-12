const service = require('../services/notificacion.service');

const handleKnownError = (error, res, next) => {
  if (error.success === false) {
    return res.status(error.status || 400).json(error);
  }
  return next(error);
};

exports.listar = async (req, res, next) => {
  try {
    const data = await service.listar(req.user.id_usuario, req.query);
    res.json({
      success: true,
      message: 'Notificaciones obtenidas correctamente.',
      data
    });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.resumen = async (req, res, next) => {
  try {
    const data = await service.resumen(req.user.id_usuario);
    res.json({ success: true, data });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.marcarLeida = async (req, res, next) => {
  try {
    const result = await service.marcarLeida(req.user.id_usuario, req.params.idNotificacion);
    res.json(result);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    const result = await service.marcarTodasLeidas(req.user.id_usuario);
    res.json(result);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const result = await service.eliminar(req.user.id_usuario, req.params.idNotificacion);
    res.json(result);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.obtenerPreferencias = async (req, res, next) => {
  try {
    const data = await service.obtenerPreferencias(req.user.id_usuario);
    res.json({ success: true, data });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.actualizarPreferencias = async (req, res, next) => {
  try {
    const result = await service.actualizarPreferencias(req.user.id_usuario, req.body);
    res.json(result);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};
