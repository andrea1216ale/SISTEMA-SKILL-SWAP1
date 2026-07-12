const Intercambio = require('../models/intercambio.model');
const notificacionService = require('./notificacion.service');

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

  notificacionService.crearNotificacion({
    id_usuario: idUsuarioRecibe,
    usuario_origen: usuarioEnvia,
    tipo: 'INTERCAMBIO',
    evento: 'SOLICITUD_INTERCAMBIO',
    titulo: 'Nuevo intercambio solicitado',
    mensaje: mensaje || 'Quiere iniciar un intercambio contigo.',
    prioridad: 'MEDIA',
    ruta: 'exchanges.html',
    texto_accion: 'Ver solicitud',
    id_intercambio: solicitud.id_intercambio,
    clave_agrupacion: `INTERCAMBIO_SOLICITUD:${idUsuarioRecibe}:${usuarioEnvia}`
  }).catch((error) => console.error('No se pudo crear notificacion de intercambio:', error.message));

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

  const data = await Intercambio.obtenerDetalle(idIntercambio, usuarioRecibe);
  notificacionService.crearNotificacion({
    id_usuario: data.usuario_envia,
    usuario_origen: usuarioRecibe,
    tipo: 'INTERCAMBIO',
    evento: 'INTERCAMBIO_ACEPTADO',
    titulo: 'Intercambio aceptado',
    mensaje: `Tu solicitud de ${data.nombre_habilidad || 'habilidad'} fue aceptada.`,
    prioridad: 'ALTA',
    ruta: 'chat.html',
    texto_accion: 'Ver chat',
    id_intercambio: idIntercambio
  }).catch((error) => console.error('No se pudo crear notificacion de aceptacion:', error.message));

  return {
    success: true,
    message: 'Solicitud aceptada correctamente.',
    data
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

  const data = await Intercambio.obtenerDetalle(idIntercambio, usuarioRecibe);
  notificacionService.crearNotificacion({
    id_usuario: data.usuario_envia,
    usuario_origen: usuarioRecibe,
    tipo: 'INTERCAMBIO',
    evento: 'INTERCAMBIO_RECHAZADO',
    titulo: 'Intercambio rechazado',
    mensaje: `Tu solicitud de ${data.nombre_habilidad || 'habilidad'} fue rechazada.`,
    prioridad: 'BAJA',
    ruta: 'exchanges.html',
    texto_accion: 'Ver intercambios',
    id_intercambio: idIntercambio
  }).catch((error) => console.error('No se pudo crear notificacion de rechazo:', error.message));

  return {
    success: true,
    message: 'Solicitud rechazada correctamente.',
    data
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

  const sesion = await Intercambio.obtenerOCrearSesion(idIntercambio);
  const otroUsuario = Number(solicitud.usuario_envia) === Number(idUsuario)
    ? solicitud.usuario_recibe
    : solicitud.usuario_envia;

  notificacionService.crearNotificacion({
    id_usuario: otroUsuario,
    usuario_origen: idUsuario,
    tipo: 'SESION',
    evento: 'SESION_PROGRAMADA',
    titulo: 'Sesion programada',
    mensaje: 'Ya tienes una sesion asociada a tu intercambio.',
    prioridad: 'ALTA',
    ruta: 'exchanges.html',
    texto_accion: 'Ver detalles',
    id_intercambio: idIntercambio,
    id_sesion: sesion.id_sesion,
    clave_agrupacion: `SESION:${sesion.id_sesion}`
  }).catch((error) => console.error('No se pudo crear notificacion de sesion:', error.message));

  return sesion;
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

  const data = await Intercambio.obtenerDetalle(idIntercambio, idUsuario);
  const otroUsuario = Number(data.usuario_envia) === Number(idUsuario)
    ? data.usuario_recibe
    : data.usuario_envia;

  notificacionService.crearNotificacion({
    id_usuario: otroUsuario,
    usuario_origen: idUsuario,
    tipo: 'INTERCAMBIO',
    evento: 'INTERCAMBIO_FINALIZADO',
    titulo: 'Intercambio finalizado',
    mensaje: 'Tu intercambio fue marcado como finalizado. Puedes dejar una calificacion.',
    prioridad: 'MEDIA',
    ruta: 'ratings.html',
    texto_accion: 'Calificar',
    id_intercambio: idIntercambio
  }).catch((error) => console.error('No se pudo crear notificacion de finalizacion:', error.message));

  return {
    success: true,
    message: 'Intercambio finalizado correctamente.',
    data
  };
};
