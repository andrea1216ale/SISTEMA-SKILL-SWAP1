const db = require('../database');

const ChatModel = {
  usuarioActivoExiste: async (idUsuario) => {
    const [rows] = await db.promise().query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND estado = 'ACTIVO' LIMIT 1",
      [idUsuario]
    );
    return Boolean(rows[0]);
  },

  perteneceAConversacion: async (idConversacion, idUsuario) => {
    const [rows] = await db.promise().query(
      `SELECT c.id_conversacion
       FROM conversaciones c
       INNER JOIN intercambios i ON i.id_intercambio = c.id_intercambio
       WHERE c.id_conversacion = ?
         AND (i.usuario_envia = ? OR i.usuario_recibe = ?)
       LIMIT 1`,
      [idConversacion, idUsuario, idUsuario]
    );
    return Boolean(rows[0]);
  },

  obtenerConversaciones: async (idUsuario) => {
    const [rows] = await db.promise().query(
      `SELECT
         c.id_conversacion, c.id_intercambio, c.estado, c.fecha_creacion,
         CASE WHEN i.usuario_envia = ? THEN i.usuario_recibe ELSE i.usuario_envia END AS id_otro_usuario,
         CONCAT_WS(' ', u.nombres, u.apellido_paterno, u.apellido_materno) AS otro_usuario,
         h.nombre AS habilidad,
         ultimo.mensaje AS ultimo_mensaje,
         ultimo.fecha_envio AS ultima_fecha,
         COALESCE(no_leidos.total, 0) AS mensajes_no_leidos
       FROM conversaciones c
       INNER JOIN intercambios i ON i.id_intercambio = c.id_intercambio
       INNER JOIN usuarios u ON u.id_usuario = CASE
         WHEN i.usuario_envia = ? THEN i.usuario_recibe ELSE i.usuario_envia END
       LEFT JOIN habilidades h ON h.id_habilidad = i.id_habilidad
       LEFT JOIN mensajes ultimo ON ultimo.id_mensaje = (
         SELECT m.id_mensaje FROM mensajes m
         WHERE m.id_conversacion = c.id_conversacion
         ORDER BY m.fecha_envio DESC, m.id_mensaje DESC LIMIT 1
       )
       LEFT JOIN (
         SELECT id_conversacion, COUNT(*) AS total FROM mensajes
         WHERE id_emisor <> ? AND leido = 0 GROUP BY id_conversacion
       ) no_leidos ON no_leidos.id_conversacion = c.id_conversacion
       WHERE i.usuario_envia = ? OR i.usuario_recibe = ?
       ORDER BY COALESCE(ultimo.fecha_envio, c.fecha_creacion) DESC`,
      [idUsuario, idUsuario, idUsuario, idUsuario, idUsuario]
    );
    return rows;
  },

  obtenerMensajes: async (idConversacion) => {
    const [rows] = await db.promise().query(
      `SELECT m.id_mensaje, m.id_conversacion, m.id_emisor, m.mensaje,
              m.leido, m.fecha_envio,
              CONCAT_WS(' ', u.nombres, u.apellido_paterno, u.apellido_materno) AS emisor
       FROM mensajes m
       INNER JOIN usuarios u ON u.id_usuario = m.id_emisor
       WHERE m.id_conversacion = ?
       ORDER BY m.fecha_envio ASC, m.id_mensaje ASC`,
      [idConversacion]
    );
    return rows;
  },

  crearMensaje: async ({ idConversacion, idEmisor, mensaje }) => {
    const [result] = await db.promise().query(
      `INSERT INTO mensajes (id_conversacion, id_emisor, mensaje, leido, fecha_envio)
       VALUES (?, ?, ?, 0, NOW())`,
      [idConversacion, idEmisor, mensaje]
    );
    const [rows] = await db.promise().query(
      `SELECT id_mensaje, id_conversacion, id_emisor, mensaje, leido, fecha_envio
       FROM mensajes WHERE id_mensaje = ? LIMIT 1`,
      [result.insertId]
    );
    return rows[0];
  },

  obtenerMensaje: async (idMensaje) => {
    const [rows] = await db.promise().query(
      `SELECT id_mensaje, id_conversacion, id_emisor, mensaje, leido, fecha_envio
       FROM mensajes WHERE id_mensaje = ? LIMIT 1`,
      [idMensaje]
    );
    return rows[0] || null;
  },

  marcarLeido: async (idMensaje, idUsuario) => {
    const [result] = await db.promise().query(
      `UPDATE mensajes m
       INNER JOIN conversaciones c ON c.id_conversacion = m.id_conversacion
       INNER JOIN intercambios i ON i.id_intercambio = c.id_intercambio
       SET m.leido = 1
       WHERE m.id_mensaje = ? AND m.id_emisor <> ?
         AND (i.usuario_envia = ? OR i.usuario_recibe = ?)`,
      [idMensaje, idUsuario, idUsuario, idUsuario]
    );
    return result.affectedRows > 0;
  }
};

module.exports = ChatModel;
