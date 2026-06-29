const Publicacion = require('../models/publicacion.model');

const TYPES = ['OFREZCO', 'BUSCO', 'CONSULTA', 'RECURSO', 'LOGRO'];
const LEVELS = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'];
const MODES = ['VIRTUAL', 'PRESENCIAL', 'AMBAS'];
const FILE_TYPES = ['IMAGEN', 'CERTIFICADO', 'DOCUMENTO'];
const REACTIONS = ['LIKE', 'ME_INTERESA', 'APOYO'];

function httpError(status, message) { const error = new Error(message); error.status = status; return error; }
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function validUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol); } catch { return false; } }

function validatePost(body = {}) {
  const data = {
    tipo: text(body.tipo).toUpperCase(), titulo: text(body.titulo), descripcion: text(body.descripcion),
    nivel: text(body.nivel).toUpperCase(), modalidad: text(body.modalidad).toUpperCase(),
    disponibilidad: text(body.disponibilidad), habilidades: Array.isArray(body.habilidades) ? [...new Set(body.habilidades.map(Number))] : [],
    archivos: Array.isArray(body.archivos) ? body.archivos : []
  };
  if (!TYPES.includes(data.tipo)) throw httpError(400, 'Selecciona un tipo de publicacion valido.');
  if (!data.titulo || data.titulo.length > 180) throw httpError(400, 'El titulo es obligatorio y admite hasta 180 caracteres.');
  if (!data.descripcion || data.descripcion.length > 10000) throw httpError(400, 'La descripcion es obligatoria y admite hasta 10000 caracteres.');
  if (data.nivel && !LEVELS.includes(data.nivel)) throw httpError(400, 'El nivel no es valido.');
  if (data.modalidad && !MODES.includes(data.modalidad)) throw httpError(400, 'La modalidad no es valida.');
  if (data.disponibilidad.length > 255) throw httpError(400, 'La disponibilidad admite hasta 255 caracteres.');
  if (data.habilidades.some((id) => !Number.isInteger(id) || id < 1)) throw httpError(400, 'Las habilidades no son validas.');
  if (data.archivos.length > 10 || data.archivos.some((file) => !validUrl(file?.url_archivo) || !FILE_TYPES.includes(text(file?.tipo).toUpperCase()))) throw httpError(400, 'Los archivos deben tener una URL http(s) y un tipo valido (maximo 10).');
  data.archivos = data.archivos.map((file) => ({ url_archivo: file.url_archivo.trim(), tipo: file.tipo.trim().toUpperCase() }));
  return data;
}

exports.list = (query, userId) => {
  const tipo = text(query.tipo).toUpperCase();
  if (tipo && !TYPES.includes(tipo)) throw httpError(400, 'El tipo de publicacion no es valido.');
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return Publicacion.list({ userId, tipo, habilidad: Number(query.habilidad) || null, categoria: text(query.categoria), limit, offset: (page - 1) * limit });
};
exports.get = async (id, userId) => Publicacion.findById(id, userId);
exports.create = async (userId, body) => Publicacion.create(userId, validatePost(body));
exports.update = async (id, userId, body) => Publicacion.update(id, userId, validatePost(body));
exports.remove = (id, userId) => Publicacion.softDelete(id, userId);
exports.comments = (id) => Publicacion.comments(id);
exports.addComment = async (id, userId, body) => {
  const comment = text(body?.comentario);
  if (!comment || comment.length > 1000) throw httpError(400, 'El comentario es obligatorio y admite hasta 1000 caracteres.');
  return Publicacion.addComment(id, userId, comment);
};
exports.deleteComment = (id, userId) => Publicacion.deleteComment(id, userId);
exports.react = (id, userId, body) => {
  const type = text(body?.tipo).toUpperCase();
  if (!REACTIONS.includes(type)) throw httpError(400, 'La reaccion no es valida.');
  return Publicacion.toggleReaction(id, userId, type);
};
exports.save = (id, userId) => Publicacion.toggleSaved(id, userId);
exports.saved = (ownerId, currentUserId) => {
  if (ownerId !== currentUserId) throw httpError(403, 'Solo puedes consultar tus publicaciones guardadas.');
  return Publicacion.savedByUser(ownerId, currentUserId);
};
exports.skills = () => Publicacion.skills();
