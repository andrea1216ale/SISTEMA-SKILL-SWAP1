const Calificacion = require('../models/calificacion.model');

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

exports.obtenerCalificacionesUsuario = async (idUsuario) => {
  const id = parseId(idUsuario);
  if (!id) throw createError(400, 'ID de usuario invalido.');

  const data = await Calificacion.obtenerPorUsuario(id);
  if (!data) throw createError(404, 'Usuario no encontrado.');
  return data;
};

exports.obtenerMisCalificaciones = async (idUsuarioAutenticado) => {
  return exports.obtenerCalificacionesUsuario(idUsuarioAutenticado);
};

exports.listarCalificaciones = async (idUsuarioAutenticado) => {
  return Calificacion.listarUsuariosConResumen(idUsuarioAutenticado);
};

exports.crearCalificacion = async (usuarioCalificador, payload) => {
  const idIntercambio = parseId(payload.id_intercambio || payload.idIntercambio);
  const usuarioEvaluado = parseId(payload.usuario_evaluado || payload.usuarioEvaluado);
  const puntuacion = Number(payload.puntuacion);
  const comentario = String(payload.comentario || '').trim();

  if (!idIntercambio) throw createError(400, 'Selecciona un intercambio valido.');
  if (!usuarioEvaluado) throw createError(400, 'Selecciona un usuario valido para calificar.');
  if (Number(usuarioCalificador) === Number(usuarioEvaluado)) {
    throw createError(400, 'No puedes calificarte a ti mismo.');
  }
  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    throw createError(400, 'La puntuacion debe estar entre 1 y 5.');
  }
  if (comentario.length > 1000) {
    throw createError(400, 'El comentario no puede superar 1000 caracteres.');
  }

  const intercambio = await Calificacion.obtenerIntercambioParaCalificar(
    idIntercambio,
    usuarioCalificador,
    usuarioEvaluado
  );

  if (!intercambio) {
    throw createError(403, 'Solo puedes calificar a usuarios con quienes hayas tenido una conversacion.');
  }

  if (Number(intercambio.total_mensajes || 0) < 1) {
    throw createError(403, 'Debe existir al menos un mensaje antes de calificar.');
  }

  const duplicada = await Calificacion.existeCalificacion(idIntercambio, usuarioCalificador, usuarioEvaluado);
  if (duplicada) {
    throw createError(409, 'Ya calificaste a este usuario en este intercambio.');
  }

  const calificacion = await Calificacion.crear({
    idIntercambio,
    usuarioCalificador,
    usuarioEvaluado,
    puntuacion,
    comentario
  });

  return {
    success: true,
    message: 'Calificacion registrada correctamente.',
    data: calificacion
  };
};
