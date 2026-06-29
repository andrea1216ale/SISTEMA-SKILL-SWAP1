const ChatModel = require('../models/chatModel');

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const socketError = (message, code = 'BAD_REQUEST') => ({ success: false, error: message, code });

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const idUsuario = parseId(socket.handshake.auth?.idUsuario);
      if (!idUsuario || !await ChatModel.usuarioActivoExiste(idUsuario)) {
        return next(new Error('Usuario no autenticado.'));
      }
      socket.userId = idUsuario;
      next();
    } catch (error) { next(error); }
  });

  io.on('connection', (socket) => {
    const withConversation = async (payload, callback, action) => {
      try {
        const idConversacion = parseId(payload?.id_conversacion ?? payload?.idConversacion);
        if (!idConversacion) return callback?.(socketError('Conversacion no valida.'));
        if (!await ChatModel.perteneceAConversacion(idConversacion, socket.userId)) {
          return callback?.(socketError('No tienes acceso a esta conversacion.', 'FORBIDDEN'));
        }
        await action(idConversacion);
      } catch (error) {
        console.error('Error de Socket.IO:', error);
        callback?.(socketError('No se pudo procesar la solicitud.', 'SERVER_ERROR'));
      }
    };

    socket.on('joinConversation', (payload, callback) => withConversation(payload, callback, async (id) => {
      await socket.join(`conversation_${id}`);
      callback?.({ success: true, id_conversacion: id });
    }));

    socket.on('leaveConversation', (payload, callback) => withConversation(payload, callback, async (id) => {
      await socket.leave(`conversation_${id}`);
      callback?.({ success: true });
    }));

    socket.on('sendMessage', (payload, callback) => withConversation(payload, callback, async (idConversacion) => {
      const idEmisor = parseId(payload?.id_emisor);
      const mensaje = String(payload?.mensaje || '').trim();
      if (idEmisor !== socket.userId) return callback?.(socketError('Emisor no valido.', 'FORBIDDEN'));
      if (!mensaje || mensaje.length > 5000) return callback?.(socketError('El mensaje debe tener entre 1 y 5000 caracteres.'));
      const guardado = await ChatModel.crearMensaje({ idConversacion, idEmisor, mensaje });
      io.to(`conversation_${idConversacion}`).emit('newMessage', guardado);
      callback?.({ success: true, data: guardado });
    }));

    socket.on('messageRead', async (payload, callback) => {
      try {
        const idMensaje = parseId(payload?.id_mensaje);
        const mensaje = idMensaje && await ChatModel.obtenerMensaje(idMensaje);
        if (!mensaje || !await ChatModel.perteneceAConversacion(mensaje.id_conversacion, socket.userId)) {
          return callback?.(socketError('Mensaje no encontrado o sin acceso.', 'FORBIDDEN'));
        }
        await ChatModel.marcarLeido(idMensaje, socket.userId);
        io.to(`conversation_${mensaje.id_conversacion}`).emit('messageRead', {
          id_mensaje: idMensaje, id_conversacion: mensaje.id_conversacion, id_usuario: socket.userId
        });
        callback?.({ success: true });
      } catch (error) { callback?.(socketError('No se pudo marcar el mensaje.', 'SERVER_ERROR')); }
    });

    for (const event of ['typing', 'stopTyping']) {
      socket.on(event, (payload, callback) => withConversation(payload, callback, async (id) => {
        socket.to(`conversation_${id}`).emit(event, { id_conversacion: id, id_usuario: socket.userId });
        callback?.({ success: true });
      }));
    }

    socket.on('disconnect', () => {});
  });
};
