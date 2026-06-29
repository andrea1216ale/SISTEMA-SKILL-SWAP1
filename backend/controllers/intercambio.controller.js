const service = require('../services/intercambio.service');

const idFrom = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const invalidId = (res) => res.status(400).json({
  success: false,
  message: 'ID invalido.',
  data: null
});

const handleKnownError = (error, res, next) => {
  if (error.success === false) {
    return res.status(error.status || 400).json(error);
  }
  return next(error);
};

exports.obtenerSolicitudes = async (req, res, next) => {
  try {
    const solicitudes = await service.obtenerSolicitudes(req.user.id_usuario);
    res.json({
      success: true,
      message: 'Solicitudes obtenidas correctamente.',
      data: solicitudes
    });
  } catch (error) {
    next(error);
  }
};

exports.solicitarIntercambio = async (req, res, next) => {
  try {
    const resultado = await service.solicitarIntercambio(req.user.id_usuario, req.body || {});
    res.status(201).json(resultado);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.aceptarSolicitud = async (req, res, next) => {
  const id = idFrom(req.params.id);
  if (!id) return invalidId(res);

  try {
    const resultado = await service.aceptarSolicitud(id, req.user.id_usuario);
    res.json(resultado);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.rechazarSolicitud = async (req, res, next) => {
  const id = idFrom(req.params.id);
  if (!id) return invalidId(res);

  try {
    const resultado = await service.rechazarSolicitud(id, req.user.id_usuario);
    res.json(resultado);
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.obtenerDetalle = async (req, res, next) => {
  const id = idFrom(req.params.id);
  if (!id) return invalidId(res);

  try {
    const detalle = await service.obtenerDetalle(id, req.user.id_usuario);
    if (!detalle) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada.',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Solicitud obtenida correctamente.',
      data: detalle
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenerSesion = async (req, res, next) => {
  const id = idFrom(req.params.id);
  if (!id) return invalidId(res);

  try {
    const sesion = await service.obtenerSesion(id, req.user.id_usuario);
    res.json({
      success: true,
      message: 'Sesion obtenida correctamente.',
      data: sesion
    });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};

exports.obtenerOCrearConversacion = async (req, res, next) => {
  const id = idFrom(req.params.id);
  if (!id) return invalidId(res);
  try {
    const conversacion = await service.obtenerOCrearConversacion(id, req.user.id_usuario);
    res.status(201).json({ success: true, message: 'Conversacion lista.', data: conversacion });
  } catch (error) {
    handleKnownError(error, res, next);
  }
};
