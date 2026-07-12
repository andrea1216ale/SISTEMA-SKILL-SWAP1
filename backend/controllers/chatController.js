const ChatModel = require('../models/chatModel');
const notificacionService = require('../services/notificacion.service');

const httpError = (status, message) => Object.assign(new Error(message), { status });
const positiveId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, `${label} no es valido.`);
  return id;
};

const ensureMembership = async (idConversacion, idUsuario) => {
  if (!await ChatModel.perteneceAConversacion(idConversacion, idUsuario)) {
    throw httpError(403, 'No tienes acceso a esta conversacion.');
  }
};

exports.obtenerConversaciones = async (req, res, next) => {
  try {
    const idUsuario = positiveId(req.params.idUsuario, 'El usuario');
    if (idUsuario !== req.user.id_usuario) throw httpError(403, 'No puedes consultar conversaciones ajenas.');
    res.json({ success: true, data: await ChatModel.obtenerConversaciones(idUsuario) });
  } catch (error) { next(error); }
};

exports.obtenerMensajes = async (req, res, next) => {
  try {
    const idConversacion = positiveId(req.params.idConversacion, 'La conversacion');
    await ensureMembership(idConversacion, req.user.id_usuario);
    res.json({ success: true, data: await ChatModel.obtenerMensajes(idConversacion) });
  } catch (error) { next(error); }
};

exports.guardarMensaje = async (req, res, next) => {
  try {
    const idConversacion = positiveId(req.body.id_conversacion, 'La conversacion');
    const idEmisor = positiveId(req.body.id_emisor, 'El emisor');
    const mensaje = String(req.body.mensaje || '').trim();
    if (idEmisor !== req.user.id_usuario) throw httpError(403, 'No puedes enviar mensajes como otro usuario.');
    if (!mensaje) throw httpError(400, 'El mensaje no puede estar vacio.');
    if (mensaje.length > 5000) throw httpError(400, 'El mensaje supera los 5000 caracteres.');
    await ensureMembership(idConversacion, idEmisor);
    const guardado = await ChatModel.crearMensaje({ idConversacion, idEmisor, mensaje });
    const participantes = await ChatModel.obtenerParticipantes(idConversacion);
    const receptor = participantes
      ? (Number(participantes.usuario_envia) === idEmisor ? participantes.usuario_recibe : participantes.usuario_envia)
      : null;
    if (receptor) {
      notificacionService.crearNotificacion({
        id_usuario: receptor,
        usuario_origen: idEmisor,
        tipo: 'CHAT',
        evento: 'NUEVO_MENSAJE',
        titulo: 'Nuevo mensaje',
        mensaje: mensaje.length > 120 ? `${mensaje.slice(0, 117)}...` : mensaje,
        prioridad: 'MEDIA',
        ruta: 'chat.html',
        texto_accion: 'Ver chat',
        id_intercambio: participantes.id_intercambio,
        id_mensaje: guardado.id_mensaje,
        clave_agrupacion: `CHAT:${idConversacion}:${idEmisor}`
      }).catch((error) => console.error('No se pudo crear notificacion de chat:', error.message));
    }
    res.status(201).json({ success: true, data: guardado });
  } catch (error) { next(error); }
};

exports.marcarLeido = async (req, res, next) => {
  try {
    const idMensaje = positiveId(req.params.idMensaje, 'El mensaje');
    const mensaje = await ChatModel.obtenerMensaje(idMensaje);
    if (!mensaje) throw httpError(404, 'Mensaje no encontrado.');
    await ensureMembership(mensaje.id_conversacion, req.user.id_usuario);
    await ChatModel.marcarLeido(idMensaje, req.user.id_usuario);
    res.json({ success: true, data: { id_mensaje: idMensaje, leido: true } });
  } catch (error) { next(error); }
};

exports.ensureMembership = ensureMembership;
exports.positiveId = positiveId;
