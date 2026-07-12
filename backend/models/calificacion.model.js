const db = require('../database');

async function columnsFor(connection, table) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
  return new Set(columns.map((column) => column.Field));
}

function userNameExpression(alias, userColumns) {
  if (userColumns.has('nombre')) return `${alias}.nombre`;
  if (userColumns.has('nombres')) {
    const parts = [`${alias}.nombres`];
    if (userColumns.has('apellido_paterno')) parts.push(`${alias}.apellido_paterno`);
    if (userColumns.has('apellido_materno')) parts.push(`${alias}.apellido_materno`);
    return `CONCAT_WS(' ', ${parts.join(', ')})`;
  }
  return `CONCAT('Usuario ', ${alias}.id_usuario)`;
}

function existingColumn(columns, names) {
  return names.find((name) => columns.has(name)) || null;
}

function chatExistsExpression(messageColumns) {
  if (messageColumns.has('emisor') && messageColumns.has('receptor')) {
    return `EXISTS (
      SELECT 1
      FROM mensajes m
      WHERE (m.emisor = ? AND m.receptor = u.id_usuario)
         OR (m.emisor = u.id_usuario AND m.receptor = ?)
    )`;
  }

  if (messageColumns.has('id_emisor') && messageColumns.has('id_conversacion')) {
    return `EXISTS (
      SELECT 1
      FROM mensajes m
      INNER JOIN conversaciones conv ON conv.id_conversacion = m.id_conversacion
      INNER JOIN intercambios inter ON inter.id_intercambio = conv.id_intercambio
      WHERE (
        (inter.usuario_envia = ? AND inter.usuario_recibe = u.id_usuario)
        OR (inter.usuario_recibe = ? AND inter.usuario_envia = u.id_usuario)
      )
    )`;
  }

  return 'FALSE';
}

const calificableExchangeSql = `
  SELECT inter.id_intercambio
  FROM intercambios inter
  INNER JOIN conversaciones conv ON conv.id_intercambio = inter.id_intercambio
  INNER JOIN mensajes msg ON msg.id_conversacion = conv.id_conversacion
  WHERE (
    (inter.usuario_envia = ? AND inter.usuario_recibe = u.id_usuario)
    OR (inter.usuario_recibe = ? AND inter.usuario_envia = u.id_usuario)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM calificaciones cal
    WHERE cal.id_intercambio = inter.id_intercambio
      AND cal.usuario_calificador = ?
      AND cal.usuario_evaluado = u.id_usuario
  )
  ORDER BY
    CASE UPPER(inter.estado)
      WHEN 'FINALIZADA' THEN 0
      WHEN 'ACEPTADA' THEN 1
      ELSE 2
    END,
    inter.fecha DESC
  LIMIT 1
`;

const Calificacion = {
  obtenerPorUsuario: async (idUsuario) => {
    const connection = db.promise();
    const [userColumns, ratingColumns] = await Promise.all([
      columnsFor(connection, 'usuarios'),
      columnsFor(connection, 'calificaciones')
    ]);

    const userName = userNameExpression('u', userColumns);
    const qualifierName = userNameExpression('calificador', userColumns);
    const descriptionColumn = userColumns.has('descripcion') ? 'u.descripcion' : 'NULL';
    const levelColumn = userColumns.has('nivel') ? 'u.nivel' : 'NULL';
    const exchangeColumn = ratingColumns.has('id_intercambio') ? 'c.id_intercambio' : 'NULL';
    const commentColumn = existingColumn(ratingColumns, ['comentario', 'resena', 'opinion']);
    const dateColumn = existingColumn(ratingColumns, ['fecha', 'fecha_calificacion', 'created_at', 'fecha_creacion']);
    const qualifierColumn = existingColumn(ratingColumns, ['usuario_calificador', 'usuario_evaluador']);

    const commentSelect = commentColumn ? `c.\`${commentColumn}\`` : 'NULL';
    const dateSelect = dateColumn ? `c.\`${dateColumn}\`` : 'NULL';
    const qualifierJoin = qualifierColumn
      ? `LEFT JOIN usuarios calificador ON calificador.id_usuario = c.\`${qualifierColumn}\``
      : '';
    const qualifierIdSelect = qualifierColumn ? `c.\`${qualifierColumn}\`` : 'NULL';
    const qualifierNameSelect = qualifierColumn ? qualifierName : 'NULL';
    const orderByDate = dateColumn ? `c.\`${dateColumn}\` DESC,` : '';

    const [[usuarioRows], [resumenRows], [calificaciones]] = await Promise.all([
      connection.query(
        `SELECT
           u.id_usuario,
           ${userName} AS nombre,
           ${descriptionColumn} AS descripcion,
           ${levelColumn} AS nivel
         FROM usuarios u
         WHERE u.id_usuario = ? AND u.estado = 'ACTIVO'
         LIMIT 1`,
        [idUsuario]
      ),
      connection.query(
        `SELECT
           COALESCE(ROUND(AVG(puntuacion), 1), 0) AS promedio,
           COUNT(*) AS total_calificaciones
         FROM calificaciones
         WHERE usuario_evaluado = ?`,
        [idUsuario]
      ),
      connection.query(
        `SELECT
           c.id_calificacion,
           ${exchangeColumn} AS id_intercambio,
           c.puntuacion,
           ${commentSelect} AS comentario,
           ${dateSelect} AS fecha,
           ${qualifierIdSelect} AS id_usuario_calificador,
           ${qualifierNameSelect} AS nombre_calificador
         FROM calificaciones c
         ${qualifierJoin}
         WHERE c.usuario_evaluado = ?
         ORDER BY ${orderByDate} c.id_calificacion DESC`,
        [idUsuario]
      )
    ]);

    if (!usuarioRows[0]) return null;

    return {
      usuario: usuarioRows[0],
      resumen: {
        promedio: Number(resumenRows[0]?.promedio || 0),
        total_calificaciones: Number(resumenRows[0]?.total_calificaciones || 0)
      },
      calificaciones: calificaciones.map((item) => ({
        id_calificacion: item.id_calificacion,
        id_intercambio: item.id_intercambio,
        puntuacion: item.puntuacion,
        comentario: item.comentario,
        fecha: item.fecha,
        usuario_calificador: {
          id_usuario: item.id_usuario_calificador,
          nombre: item.nombre_calificador || 'No registrado'
        }
      }))
    };
  },

  listarUsuariosConResumen: async (idUsuarioActual) => {
    const connection = db.promise();
    const userColumns = await columnsFor(connection, 'usuarios');
    const userName = userNameExpression('u', userColumns);
    const descriptionColumn = userColumns.has('descripcion') ? 'u.descripcion' : 'NULL';
    const levelColumn = userColumns.has('nivel') ? 'u.nivel' : 'NULL';
    const chatExists = `EXISTS (
      SELECT 1
      FROM mensajes msg_chat
      INNER JOIN conversaciones conv_chat ON conv_chat.id_conversacion = msg_chat.id_conversacion
      INNER JOIN intercambios inter_chat ON inter_chat.id_intercambio = conv_chat.id_intercambio
      WHERE (
        (inter_chat.usuario_envia = ? AND inter_chat.usuario_recibe = u.id_usuario)
        OR (inter_chat.usuario_recibe = ? AND inter_chat.usuario_envia = u.id_usuario)
      )
    )`;
    const params = [
      idUsuarioActual, idUsuarioActual,
      idUsuarioActual, idUsuarioActual, idUsuarioActual,
      idUsuarioActual, idUsuarioActual, idUsuarioActual,
      idUsuarioActual, idUsuarioActual, idUsuarioActual,
      idUsuarioActual
    ];

    const [rows] = await connection.query(
      `SELECT
         u.id_usuario,
         ${userName} AS nombre,
         ${descriptionColumn} AS descripcion,
         ${levelColumn} AS nivel,
         COALESCE(ROUND(AVG(c.puntuacion), 1), 0) AS promedio,
         COUNT(c.id_calificacion) AS total_calificaciones,
         ${chatExists} AS han_chateado,
         (${calificableExchangeSql}) AS id_intercambio_calificable,
         EXISTS (
           SELECT 1
           FROM calificaciones cal_done
           INNER JOIN intercambios inter_done ON inter_done.id_intercambio = cal_done.id_intercambio
           WHERE cal_done.usuario_calificador = ?
             AND cal_done.usuario_evaluado = u.id_usuario
             AND (
               (inter_done.usuario_envia = ? AND inter_done.usuario_recibe = u.id_usuario)
               OR (inter_done.usuario_recibe = ? AND inter_done.usuario_envia = u.id_usuario)
             )
         ) AS ya_calificado_por_mi,
         (
           SELECT h.id_habilidad
           FROM usuario_habilidad uh
           INNER JOIN habilidades h ON h.id_habilidad = uh.id_habilidad
           WHERE uh.id_usuario = u.id_usuario AND uh.tipo = 'ofrece'
           ORDER BY h.nombre
           LIMIT 1
         ) AS id_habilidad,
         (
           SELECT h.nombre
           FROM usuario_habilidad uh
           INNER JOIN habilidades h ON h.id_habilidad = uh.id_habilidad
           WHERE uh.id_usuario = u.id_usuario AND uh.tipo = 'ofrece'
           ORDER BY h.nombre
           LIMIT 1
         ) AS habilidad
       FROM usuarios u
       LEFT JOIN calificaciones c ON c.usuario_evaluado = u.id_usuario
       WHERE u.estado = 'ACTIVO'
         AND (
           u.id_usuario = ?
           OR EXISTS (
             SELECT 1
             FROM mensajes msg_rel
             INNER JOIN conversaciones conv_rel ON conv_rel.id_conversacion = msg_rel.id_conversacion
             INNER JOIN intercambios rel ON rel.id_intercambio = conv_rel.id_intercambio
             WHERE (
               (rel.usuario_envia = ? AND rel.usuario_recibe = u.id_usuario)
               OR (rel.usuario_recibe = ? AND rel.usuario_envia = u.id_usuario)
             )
           )
         )
       GROUP BY u.id_usuario, nombre, descripcion, nivel
       ORDER BY
         CASE WHEN u.id_usuario = ? THEN 0 ELSE 1 END,
         promedio DESC,
         total_calificaciones DESC,
         nombre ASC`,
      params
    );

    return rows;
  },

  obtenerIntercambioParaCalificar: async (idIntercambio, usuarioCalificador, usuarioEvaluado) => {
    const [rows] = await db.promise().query(
      `SELECT
         inter.id_intercambio,
         inter.usuario_envia,
         inter.usuario_recibe,
         UPPER(inter.estado) AS estado,
         COUNT(msg.id_mensaje) AS total_mensajes
       FROM intercambios inter
       INNER JOIN conversaciones conv ON conv.id_intercambio = inter.id_intercambio
       INNER JOIN mensajes msg ON msg.id_conversacion = conv.id_conversacion
       WHERE inter.id_intercambio = ?
         AND (
           (inter.usuario_envia = ? AND inter.usuario_recibe = ?)
           OR (inter.usuario_envia = ? AND inter.usuario_recibe = ?)
         )
       GROUP BY inter.id_intercambio, inter.usuario_envia, inter.usuario_recibe, inter.estado
       LIMIT 1`,
      [idIntercambio, usuarioCalificador, usuarioEvaluado, usuarioEvaluado, usuarioCalificador]
    );

    return rows[0] || null;
  },

  existeCalificacion: async (idIntercambio, usuarioCalificador, usuarioEvaluado) => {
    const [rows] = await db.promise().query(
      `SELECT id_calificacion
       FROM calificaciones
       WHERE id_intercambio = ?
         AND usuario_calificador = ?
         AND usuario_evaluado = ?
       LIMIT 1`,
      [idIntercambio, usuarioCalificador, usuarioEvaluado]
    );

    return Boolean(rows[0]);
  },

  crear: async ({ idIntercambio, usuarioCalificador, usuarioEvaluado, puntuacion, comentario }) => {
    const [result] = await db.promise().query(
      `INSERT INTO calificaciones
        (id_intercambio, usuario_calificador, usuario_evaluado, puntuacion, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [idIntercambio, usuarioCalificador, usuarioEvaluado, puntuacion, comentario || null]
    );

    const [rows] = await db.promise().query(
      `SELECT id_calificacion, id_intercambio, usuario_calificador, usuario_evaluado,
              puntuacion, comentario, fecha
       FROM calificaciones
       WHERE id_calificacion = ?
       LIMIT 1`,
      [result.insertId]
    );

    return rows[0] || null;
  }
};

module.exports = Calificacion;
