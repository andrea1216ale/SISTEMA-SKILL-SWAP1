const Publicacion = require('../models/publicacion.model');
const { ALLOWED_MIMES } = require('../middlewares/upload.middleware');

const TYPES = ['OFREZCO', 'BUSCO', 'CONSULTA', 'RECURSO', 'LOGRO'];
const LEVELS = ['PRINCIPIANTE', 'INTERMEDIO', 'AVANZADO'];
const MODES = ['VIRTUAL', 'PRESENCIAL', 'AMBAS'];
const FILE_TYPES = ['IMAGEN', 'CERTIFICADO', 'DOCUMENTO'];
const REACTIONS = ['LIKE', 'ME_INTERESA', 'APOYO'];

function httpError(status, message) { const error = new Error(message); error.status = status; return error; }
function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function validUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol); } catch { return false; } }

function mimeToFileType(mimetype) { return ALLOWED_MIMES[mimetype] || 'DOCUMENTO'; }

function validatePost(body = {}, files = [], baseUrl = '') {
  const habilidades = typeof body.habilidades === 'string'
    ? body.habilidades.split(',').filter(Boolean).map(Number)
    : Array.isArray(body.habilidades)
      ? [...new Set(body.habilidades.map(Number))]
      : [];

  const data = {
    tipo: text(body.tipo).toUpperCase(), titulo: text(body.titulo), descripcion: text(body.descripcion),
    nivel: text(body.nivel).toUpperCase(),
    disponibilidad: text(body.disponibilidad), habilidades,
    archivos: Array.isArray(body.archivos) ? body.archivos : []
  };

  if (!TYPES.includes(data.tipo)) throw httpError(400, 'Selecciona un tipo de publicacion valido.');
  if (!data.titulo || data.titulo.length > 180) throw httpError(400, 'El titulo es obligatorio y admite hasta 180 caracteres.');
  if (!data.descripcion || data.descripcion.length > 10000) throw httpError(400, 'La descripcion es obligatoria y admite hasta 10000 caracteres.');
  if (data.nivel && !LEVELS.includes(data.nivel)) throw httpError(400, 'El nivel no es valido.');
  if (data.disponibilidad.length > 255) throw httpError(400, 'La disponibilidad admite hasta 255 caracteres.');
  if (data.habilidades.some((id) => !Number.isInteger(id) || id < 1)) throw httpError(400, 'Las habilidades no son validas.');

  const archivos = [];

  for (const file of files) {
    const tipo = mimeToFileType(file.mimetype);
    const url_archivo = `${baseUrl}/uploads/${file.filename}`;
    archivos.push({ url_archivo, tipo });
  }

  if (Array.isArray(body.archivos)) {
    for (const file of body.archivos) {
      if (file?.url_archivo) {
        if (!validUrl(file.url_archivo)) throw httpError(400, 'Las URLs de archivos deben ser http(s) validas.');
        const tipo = FILE_TYPES.includes(text(file.tipo).toUpperCase()) ? text(file.tipo).toUpperCase() : 'DOCUMENTO';
        archivos.push({ url_archivo: file.url_archivo.trim(), tipo });
      }
    }
  }

  if (archivos.length > 10) throw httpError(400, 'Maximo 10 archivos por publicacion.');
  data.archivos = archivos;

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
exports.create = async (userId, body, files, baseUrl) => Publicacion.create(userId, validatePost(body, files, baseUrl));
exports.update = async (id, userId, body, files, baseUrl) => Publicacion.update(id, userId, validatePost(body, files, baseUrl));
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
exports.idiomas = () => Publicacion.idiomas();
