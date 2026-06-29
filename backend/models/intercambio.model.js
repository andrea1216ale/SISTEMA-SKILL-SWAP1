const db = require('../database');

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
    CONCAT_WS(' ', u.nombres, u.apellido_paterno, u.apellido_materno) AS usuario_nombre,
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
       WHERE usuario_envia = ?
         AND usuario_recibe = ?
         AND id_habilidad = ?
         AND UPPER(estado) = 'PENDIENTE'
       LIMIT 1`,
      [usuarioEnvia, usuarioRecibe, idHabilidad]
    );

    return Boolean(rows[0]);
  },

  crearSolicitud: async ({ usuarioEnvia, usuarioRecibe, idHabilidad, mensaje }) => {
    const [result] = await db.promise().query(
      `INSERT INTO intercambios
        (usuario_envia, usuario_recibe, id_habilidad, mensaje_solicitud, estado, fecha)
       VALUES (?, ?, ?, ?, 'PENDIENTE', NOW())`,
      [usuarioEnvia, usuarioRecibe, idHabilidad, mensaje || null]
    );

    return Intercambio.obtenerDetalle(result.insertId, usuarioEnvia);
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
