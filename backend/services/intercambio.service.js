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

exports.obtenerContactosDisponibles = async (idUsuario) => {
  return Intercambio.obtenerContactosDisponibles(idUsuario);
};

exports.verificarSolicitud = async (usuarioEnvia, idUsuarioRecibe) => {
  const idDestino = Number(idUsuarioRecibe);
  if (!Number.isInteger(idDestino) || idDestino < 1) {
    throw createError(400, 'ID de usuario invalido.');
  }

  if (Number(usuarioEnvia) === idDestino) {
    return {
      puede_solicitar: false,
      han_chateado: false,
      solicitud_pendiente: false,
      motivo: 'No puedes solicitar un intercambio contigo mismo.'
    };
  }

  const usuarioExiste = await Intercambio.usuarioActivoExiste(idDestino);
  if (!usuarioExiste) {
    throw createError(404, 'El usuario destino no existe o no esta activo.');
  }

  const solicitudPendiente = Boolean(await Intercambio.obtenerSolicitudPendiente(usuarioEnvia, idDestino));
  const puedeSolicitar = !solicitudPendiente;

  let motivo = null;
  if (solicitudPendiente) motivo = 'Ya existe una solicitud de intercambio pendiente entre ambos usuarios.';

  return {
    puede_solicitar: puedeSolicitar,
    han_chateado: await Intercambio.haChateadoConUsuario(usuarioEnvia, idDestino),
    solicitud_pendiente: solicitudPendiente,
    ...(motivo ? { motivo } : {})
  };
};

exports.solicitarIntercambio = async (usuarioEnvia, payload) => {
  const idUsuarioRecibe = Number(payload.usuario_recibe || payload.idUsuarioRecibe);
  const idHabilidad = Number(payload.id_habilidad || payload.idHabilidad);
  const mensaje = String(payload.mensaje_solicitud || payload.mensaje || '').trim();

  if (!Number.isInteger(idUsuarioRecibe) || idUsuarioRecibe < 1) {
    throw createError(400, 'Selecciona un usuario valido para solicitar el intercambio.');
  }

  if (!Number.isInteger(idHabilidad) || idHabilidad < 1) {
    throw createError(400, 'Selecciona una habilidad valida para el intercambio.');
  }

  if (Number(usuarioEnvia) === idUsuarioRecibe) {
    throw createError(400, 'No puedes solicitar un intercambio contigo mismo.');
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
    throw createError(409, 'Ya existe una solicitud de intercambio pendiente entre ambos usuarios.');
  }

  const solicitud = await Intercambio.crearSolicitud({
    usuarioEnvia,
    usuarioRecibe: idUsuarioRecibe,
    idHabilidad,
    mensaje
  });

  return {
    success: true,
    message: 'Solicitud de intercambio enviada correctamente.',
    data: solicitud
  };
};

exports.listarRecibidos = async (idUsuario) => {
  return Intercambio.listarRecibidos(idUsuario);
};

exports.listarEnviados = async (idUsuario) => {
  return Intercambio.listarEnviados(idUsuario);
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

exports.finalizarIntercambio = async (idIntercambio, idUsuario) => {
  const solicitud = await Intercambio.obtenerDetalle(idIntercambio, idUsuario);
  if (!solicitud) throw createError(404, 'Intercambio no encontrado.');
  if (solicitud.estado !== 'ACEPTADA') {
    throw createError(409, 'Solo se pueden finalizar intercambios aceptados.');
  }

  const finalizado = await Intercambio.finalizar(idIntercambio, idUsuario);
  if (!finalizado) throw createError(409, 'No se pudo finalizar el intercambio.');

  return {
    success: true,
    message: 'Intercambio finalizado correctamente.',
    data: await Intercambio.obtenerDetalle(idIntercambio, idUsuario)
  };
};
