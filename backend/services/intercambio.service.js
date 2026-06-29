const Intercambio = require('../models/intercambio.model');

const createError = (status, message) => ({
  success: false,
  message,
  data: null,
  status
});

exports.obtenerSolicitudes = async (usuarioRecibe) => {
  return Intercambio.obtenerSolicitudes(usuarioRecibe);
};

exports.solicitarIntercambio = async (usuarioEnvia, payload) => {
  const idUsuarioRecibe = Number(payload.idUsuarioRecibe);
  const idHabilidad = Number(payload.idHabilidad);
  const mensaje = String(payload.mensaje || '').trim();

  if (!Number.isInteger(idUsuarioRecibe) || idUsuarioRecibe < 1) {
    throw createError(400, 'Selecciona un usuario valido para solicitar el intercambio.');
  }

  if (!Number.isInteger(idHabilidad) || idHabilidad < 1) {
    throw createError(400, 'Selecciona una habilidad valida para el intercambio.');
  }

  if (Number(usuarioEnvia) === idUsuarioRecibe) {
    throw createError(400, 'No puedes enviarte una solicitud a ti mismo.');
  }

  const usuarioExiste = await Intercambio.usuarioActivoExiste(idUsuarioRecibe);
  if (!usuarioExiste) {
    throw createError(404, 'El usuario receptor no existe o no esta activo.');
  }

  const habilidadExiste = await Intercambio.habilidadExiste(idHabilidad);
  if (!habilidadExiste) {
    throw createError(404, 'La habilidad seleccionada no existe.');
  }

  const duplicada = await Intercambio.existeSolicitudPendiente(usuarioEnvia, idUsuarioRecibe, idHabilidad);
  if (duplicada) {
    throw createError(409, 'Ya tienes una solicitud pendiente para esta habilidad con este usuario.');
  }

  const solicitud = await Intercambio.crearSolicitud({
    usuarioEnvia,
    usuarioRecibe: idUsuarioRecibe,
    idHabilidad,
    mensaje
  });

  return {
    success: true,
    message: 'Solicitud enviada correctamente',
    data: solicitud
  };
};

exports.aceptarSolicitud = async (idIntercambio, usuarioRecibe) => {
  const solicitud = await Intercambio.obtenerDetalle(idIntercambio, usuarioRecibe);

  if (!solicitud) {
    throw createError(404, 'Solicitud no encontrada.');
  }

  if (Number(solicitud.usuario_recibe) !== Number(usuarioRecibe)) {
    throw createError(403, 'Solo el usuario receptor puede aceptar esta solicitud.');
  }

  if (solicitud.estado !== 'PENDIENTE') {
    throw createError(409, 'Solo se pueden aceptar solicitudes pendientes.');
  }

  const actualizada = await Intercambio.cambiarEstado(idIntercambio, usuarioRecibe, 'ACEPTADA');
  if (!actualizada) {
    throw createError(409, 'No se pudo aceptar la solicitud.');
  }

  return {
    success: true,
    message: 'Solicitud aceptada correctamente.',
    data: await Intercambio.obtenerDetalle(idIntercambio, usuarioRecibe)
  };
};

exports.rechazarSolicitud = async (idIntercambio, usuarioRecibe) => {
  const solicitud = await Intercambio.obtenerDetalle(idIntercambio, usuarioRecibe);

  if (!solicitud) {
    throw createError(404, 'Solicitud no encontrada.');
  }

  if (Number(solicitud.usuario_recibe) !== Number(usuarioRecibe)) {
    throw createError(403, 'Solo el usuario receptor puede rechazar esta solicitud.');
  }

  if (solicitud.estado !== 'PENDIENTE') {
    throw createError(409, 'Solo se pueden rechazar solicitudes pendientes.');
  }

  const actualizada = await Intercambio.cambiarEstado(idIntercambio, usuarioRecibe, 'RECHAZADA');
  if (!actualizada) {
    throw createError(409, 'No se pudo rechazar la solicitud.');
  }

  return {
    success: true,
    message: 'Solicitud rechazada correctamente.',
    data: await Intercambio.obtenerDetalle(idIntercambio, usuarioRecibe)
  };
};

exports.obtenerDetalle = async (idIntercambio, idUsuario) => {
  return Intercambio.obtenerDetalle(idIntercambio, idUsuario);
};

exports.obtenerSesion = async (idIntercambio, idUsuario) => {
  const solicitud = await Intercambio.obtenerDetalle(idIntercambio, idUsuario);

  if (!solicitud) {
    throw createError(404, 'Solicitud no encontrada.');
  }

  if (solicitud.estado !== 'ACEPTADA') {
    throw createError(409, 'El calendario solo esta disponible para solicitudes aceptadas.');
  }

  return Intercambio.obtenerOCrearSesion(idIntercambio);
};

exports.obtenerOCrearConversacion = async (idIntercambio, idUsuario) => {
  const solicitud = await Intercambio.obtenerDetalle(idIntercambio, idUsuario);
  if (!solicitud) throw createError(404, 'Solicitud no encontrada.');
  if (solicitud.estado !== 'ACEPTADA') {
    throw createError(409, 'El chat solo esta disponible para intercambios aceptados.');
  }
  return Intercambio.obtenerOCrearConversacion(idIntercambio);
};
