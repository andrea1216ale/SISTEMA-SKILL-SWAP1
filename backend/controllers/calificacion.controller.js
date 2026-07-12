const service = require('../services/calificacion.service');

const handleKnownError = (error, res, next) => {
  if (error.success === false) {
    return res.status(error.status || 400).json(error);
  }
  return next(error);
};

exports.listarCalificaciones = async (req, res, next) => {
  try {
    const calificaciones = await service.listarCalificaciones(req.user.id_usuario);
    res.json({
      success: true,
      message: 'Calificaciones obtenidas correctamente.',
      data: calificaciones
    });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.obtenerMisCalificaciones = async (req, res, next) => {
  try {
    const data = await service.obtenerMisCalificaciones(req.user.id_usuario);
    res.json({ success: true, data });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.obtenerCalificacionesUsuario = async (req, res, next) => {
  try {
    const data = await service.obtenerCalificacionesUsuario(req.params.idUsuario);
    res.json({ success: true, data });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.crearCalificacion = async (req, res, next) => {
  try {
    const resultado = await service.crearCalificacion(req.user.id_usuario, req.body || {});
    res.status(201).json(resultado);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};
