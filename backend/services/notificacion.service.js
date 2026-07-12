const Notificacion = require('../models/notificacion.model');

const createError = (status, message) => ({
  success: false,
  message,
  data: null,
  status
});

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

exports.listar = async (idUsuario, query = {}) => {
  const filtros = {
    estado: query.estado === 'no_leidas' ? 'no_leidas' : 'todas',
    tipo: String(query.tipo || '').toUpperCase(),
    buscar: String(query.buscar || '').trim(),
    limit: query.limit,
    offset: query.offset
  };

  const [notificaciones, resumen] = await Promise.all([
    Notificacion.listar(idUsuario, filtros),
    Notificacion.resumen(idUsuario)
  ]);

  return { notificaciones, resumen };
};

exports.resumen = async (idUsuario) => Notificacion.resumen(idUsuario);

exports.marcarLeida = async (idUsuario, idNotificacion) => {
  const id = parseId(idNotificacion);
  if (!id) throw createError(400, 'Notificacion invalida.');

  const updated = await Notificacion.marcarLeida(idUsuario, id);
  if (!updated) throw createError(404, 'No se encontro la notificacion.');

  return {
    success: true,
    message: 'Notificacion marcada como leida.'
  };
};

exports.marcarTodasLeidas = async (idUsuario) => {
  const total = await Notificacion.marcarTodasLeidas(idUsuario);
  return {
    success: true,
    message: 'Notificaciones marcadas como leidas.',
    data: { actualizadas: total }
  };
};

exports.eliminar = async (idUsuario, idNotificacion) => {
  const id = parseId(idNotificacion);
  if (!id) throw createError(400, 'Notificacion invalida.');

  const deleted = await Notificacion.eliminar(idUsuario, id);
  if (!deleted) throw createError(404, 'No se encontro la notificacion.');

  return {
    success: true,
    message: 'Notificacion eliminada.'
  };
};

exports.obtenerPreferencias = async (idUsuario) => {
  const preferencias = await Notificacion.obtenerPreferencias(idUsuario);
  return preferencias;
};

exports.actualizarPreferencias = async (idUsuario, payload) => {
  const preferencias = await Notificacion.actualizarPreferencias(idUsuario, payload || {});
  return {
    success: true,
    message: 'Preferencias actualizadas.',
    data: preferencias
  };
};

exports.crearNotificacion = async (payload) => Notificacion.crear(payload);
