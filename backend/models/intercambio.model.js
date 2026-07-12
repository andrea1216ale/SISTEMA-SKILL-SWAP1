const db = require('../database');

const nombreUsuarioSql = (alias) => `CONCAT_WS(' ', ${alias}.nombres, ${alias}.apellido_paterno, ${alias}.apellido_materno)`;

const solicitudSelect = `
  SELECT
    i.id_intercambio,
    i.usuario_envia,
    i.usuario_recibe,
    i.id_habilidad,
    i.mensaje_solicitud,
    UPPER(i.estado) AS estado,
    i.fecha AS fecha_solicitud,
    i.fecha_respuesta,
    u.nombres AS nombre,
    CONCAT_WS(' ', u.apellido_paterno, u.apellido_materno) AS apellido,
    ${nombreUsuarioSql('u')} AS usuario_nombre,
    h.nombre AS nombre_habilidad,
    (
      SELECT ROUND(COALESCE(AVG(c.puntuacion), 0), 1)
      FROM calificaciones c
      WHERE c.usuario_evaluado = u.id_usuario
    ) AS rating
  FROM intercambios i
  INNER JOIN usuarios u ON i.usuario_envia = u.id_usuario
  LEFT JOIN habilidades h ON i.id_habilidad = h.id_habilidad
`;

const Intercambio = {
  usuarioActivoExiste: async (idUsuario) => {
    const [rows] = await db.promise().query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND estado = 'ACTIVO' LIMIT 1",
      [idUsuario]
    );

    return Boolean(rows[0]);
  },

  habilidadExiste: async (idHabilidad) => {
    const [rows] = await db.promise().query(
      'SELECT id_habilidad FROM habilidades WHERE id_habilidad = ? LIMIT 1',
      [idHabilidad]
    );

    return Boolean(rows[0]);
  },

  existeSolicitudPendiente: async (usuarioEnvia, usuarioRecibe, idHabilidad) => {
    const [rows] = await db.promise().query(
      `SELECT id_intercambio
       FROM intercambios
       WHERE UPPER(estado) = 'PENDIENTE'
         AND (
           (usuario_envia = ? AND usuario_recibe = ?)
           OR (usuario_envia = ? AND usuario_recibe = ?)
         )
       LIMIT 1`,
      [usuarioEnvia, usuarioRecibe, usuarioRecibe, usuarioEnvia]
    );

    return Boolean(rows[0]);
  },

  haChateadoConUsuario: async (usuarioEnvia, usuarioRecibe) => {
    const [rows] = await db.promise().query(
      `SELECT m.id_mensaje
       FROM mensajes m
       INNER JOIN conversaciones c ON c.id_conversacion = m.id_conversacion
       INNER JOIN intercambios i ON i.id_intercambio = c.id_intercambio
       WHERE (
         (i.usuario_envia = ? AND i.usuario_recibe = ?)
         OR (i.usuario_envia = ? AND i.usuario_recibe = ?)
       )
       LIMIT 1`,
      [usuarioEnvia, usuarioRecibe, usuarioRecibe, usuarioEnvia]
    );

    return Boolean(rows[0]);
  },

  obtenerContactosDisponibles: async (idUsuario) => {
    const [rows] = await db.promise().query(
      `SELECT DISTINCT
         u.id_usuario,
         ${nombreUsuarioSql('u')} AS nombre,
         u.descripcion,
         u.nivel
       FROM mensajes m
       INNER JOIN conversaciones c ON c.id_conversacion = m.id_conversacion
       INNER JOIN intercambios i ON i.id_intercambio = c.id_intercambio
       INNER JOIN usuarios u ON u.id_usuario = CASE
         WHEN i.usuario_envia = ? THEN i.usuario_recibe
         ELSE i.usuario_envia
       END
       WHERE (i.usuario_envia = ? OR i.usuario_recibe = ?)
         AND u.id_usuario <> ?
         AND u.estado = 'ACTIVO'
       ORDER BY nombre`,
      [idUsuario, idUsuario, idUsuario, idUsuario]
    );

    return rows;
  },

  obtenerSolicitudPendiente: async (usuarioEnvia, usuarioRecibe) => {
    const [rows] = await db.promise().query(
      `SELECT id_intercambio
       FROM intercambios
       WHERE UPPER(estado) = 'PENDIENTE'
         AND (
           (usuario_envia = ? AND usuario_recibe = ?)
           OR (usuario_envia = ? AND usuario_recibe = ?)
         )
       LIMIT 1`,
      [usuarioEnvia, usuarioRecibe, usuarioRecibe, usuarioEnvia]
    );

    return rows[0] || null;
  },

  crearSolicitud: async ({ usuarioEnvia, usuarioRecibe, idHabilidad, mensaje }) => {
    const [result] = await db.promise().query(
      `INSERT INTO intercambios
        (usuario_envia, usuario_recibe, id_habilidad, mensaje_solicitud)
       VALUES (?, ?, ?, ?)`,
      [usuarioEnvia, usuarioRecibe, idHabilidad, mensaje || null]
    );

    return { id_intercambio: result.insertId, estado: 'PENDIENTE' };
  },

  listarRecibidos: async (idUsuario) => {
    const [rows] = await db.promise().query(
      `SELECT
         i.id_intercambio,
         i.mensaje_solicitud,
         UPPER(i.estado) AS estado,
         i.fecha,
         i.fecha_respuesta,
         u.id_usuario AS id_usuario_envia,
         ${nombreUsuarioSql('u')} AS nombre_usuario_envia,
         h.id_habilidad,
         h.nombre AS nombre_habilidad,
         h.categoria
       FROM intercambios i
       INNER JOIN usuarios u ON u.id_usuario = i.usuario_envia
       INNER JOIN habilidades h ON h.id_habilidad = i.id_habilidad
       WHERE i.usuario_recibe = ?
       ORDER BY i.fecha DESC`,
      [idUsuario]
    );

    return rows;
  },

  listarEnviados: async (idUsuario) => {
    const [rows] = await db.promise().query(
      `SELECT
         i.id_intercambio,
         i.mensaje_solicitud,
         UPPER(i.estado) AS estado,
         i.fecha,
         i.fecha_respuesta,
         u.id_usuario AS id_usuario_recibe,
         ${nombreUsuarioSql('u')} AS nombre_usuario_recibe,
         h.id_habilidad,
         h.nombre AS nombre_habilidad,
         h.categoria
       FROM intercambios i
       INNER JOIN usuarios u ON u.id_usuario = i.usuario_recibe
       INNER JOIN habilidades h ON h.id_habilidad = i.id_habilidad
       WHERE i.usuario_envia = ?
       ORDER BY i.fecha DESC`,
      [idUsuario]
    );

    return rows;
  },

  obtenerSolicitudes: async (usuarioRecibe) => {
    const [rows] = await db.promise().query(
      `${solicitudSelect}
       WHERE i.usuario_recibe = ?
       ORDER BY
         CASE UPPER(i.estado)
           WHEN 'PENDIENTE' THEN 0
           WHEN 'ACEPTADA' THEN 1
           WHEN 'FINALIZADA' THEN 2
           WHEN 'RECHAZADA' THEN 3
           WHEN 'CANCELADA' THEN 4
           ELSE 5
         END,
         i.fecha DESC`,
      [usuarioRecibe]
    );

    return rows || [];
  },

  obtenerDetalle: async (idIntercambio, idUsuario) => {
    const params = [idIntercambio];
    const userFilter = idUsuario ? 'AND (i.usuario_envia = ? OR i.usuario_recibe = ?)' : '';
    if (idUsuario) params.push(idUsuario, idUsuario);

    const [rows] = await db.promise().query(
      `${solicitudSelect}
       WHERE i.id_intercambio = ?
       ${userFilter}
       LIMIT 1`,
      params
    );

    return rows[0] || null;
  },

  cambiarEstado: async (idIntercambio, usuarioRecibe, estado) => {
    const [result] = await db.promise().query(
      `UPDATE intercambios
       SET estado = ?, fecha_respuesta = NOW()
       WHERE id_intercambio = ?
         AND usuario_recibe = ?
         AND UPPER(estado) = 'PENDIENTE'`,
      [estado, idIntercambio, usuarioRecibe]
    );

    return result.affectedRows > 0;
  },

  finalizar: async (idIntercambio, idUsuario) => {
    const [result] = await db.promise().query(
      `UPDATE intercambios
       SET estado = 'FINALIZADA'
       WHERE id_intercambio = ?
         AND UPPER(estado) = 'ACEPTADA'
         AND (usuario_envia = ? OR usuario_recibe = ?)`,
      [idIntercambio, idUsuario, idUsuario]
    );

    return result.affectedRows > 0;
  },

  obtenerOCrearConversacion: async (idIntercambio) => {
    const connection = db.promise();
    try {
      await connection.beginTransaction();
      const [intercambios] = await connection.query(
        'SELECT id_intercambio FROM intercambios WHERE id_intercambio = ? FOR UPDATE',
        [idIntercambio]
      );
      if (!intercambios[0]) {
        await connection.rollback();
        return null;
      }
      const [existentes] = await connection.query(
        `SELECT id_conversacion, id_intercambio, estado, fecha_creacion
         FROM conversaciones WHERE id_intercambio = ? LIMIT 1`,
        [idIntercambio]
      );
      if (existentes[0]) {
        await connection.commit();
        return existentes[0];
      }
      const [result] = await connection.query(
        `INSERT INTO conversaciones (id_intercambio, estado, fecha_creacion)
         VALUES (?, 'ACTIVA', NOW())`,
        [idIntercambio]
      );
      const [creadas] = await connection.query(
        `SELECT id_conversacion, id_intercambio, estado, fecha_creacion
         FROM conversaciones WHERE id_conversacion = ? LIMIT 1`,
        [result.insertId]
      );
      await connection.commit();
      return creadas[0] || null;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  },

  obtenerOCrearSesion: async (idIntercambio) => {
    const [sesiones] = await db.promise().query(
      `SELECT
         id_sesion,
         id_intercambio,
         fecha_sesion,
         duracion_minutos,
         modalidad,
         enlace_reunion,
         lugar,
         estado,
         fecha_creacion
       FROM sesiones_intercambio
       WHERE id_intercambio = ?
       ORDER BY fecha_sesion ASC
       LIMIT 1`,
      [idIntercambio]
    );

    if (sesiones[0]) return sesiones[0];

    const [result] = await db.promise().query(
      `INSERT INTO sesiones_intercambio
        (id_intercambio, fecha_sesion, duracion_minutos, modalidad, estado)
       VALUES (?, DATE_ADD(NOW(), INTERVAL 7 DAY), 60, 'VIRTUAL', 'PROGRAMADA')`,
      [idIntercambio]
    );

    const [created] = await db.promise().query(
      `SELECT
         id_sesion,
         id_intercambio,
         fecha_sesion,
         duracion_minutos,
         modalidad,
         enlace_reunion,
         lugar,
         estado,
         fecha_creacion
       FROM sesiones_intercambio
       WHERE id_sesion = ?
       LIMIT 1`,
      [result.insertId]
    );

    return created[0] || null;
  }
};

module.exports = Intercambio;
