const db = require('../database');

const TIPOS = new Set([
  'INTERCAMBIO',
  'CHAT',
  'SESION',
  'CALIFICACION',
  'PUBLICACION',
  'SISTEMA',
  'SEGURIDAD',
  'RECOMENDACION',
  'RESUMEN'
]);

const PREFERENCIAS = [
  'notificar_intercambios',
  'notificar_mensajes',
  'notificar_sesiones',
  'notificar_calificaciones',
  'notificar_publicaciones',
  'notificar_recomendaciones',
  'notificar_seguridad',
  'notificar_sistema',
  'recibir_en_aplicacion',
  'recibir_por_correo',
  'recibir_push',
  'recordar_sesion_24_horas',
  'recordar_sesion_1_hora',
  'recordar_sesion_10_minutos',
  'recibir_resumen_diario',
  'hora_resumen'
];

async function columnsFor(connection, table) {
  const [rows] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
  return new Set(rows.map((row) => row.Field));
}

async function tableExists(connection, table) {
  const [rows] = await connection.query('SHOW TABLES LIKE ?', [table]);
  return rows.length > 0;
}

function userNameExpression(alias, columns) {
  if (columns.has('nombre')) return `${alias}.nombre`;
  if (columns.has('nombres')) {
    const parts = [`${alias}.nombres`];
    if (columns.has('apellido_paterno')) parts.push(`${alias}.apellido_paterno`);
    if (columns.has('apellido_materno')) parts.push(`${alias}.apellido_materno`);
    return `CONCAT_WS(' ', ${parts.join(', ')})`;
  }
  return `CONCAT('Usuario ', ${alias}.id_usuario)`;
}

function normalizeNotification(row, actions = []) {
  const metadata = typeof row.metadata === 'string' ? safeJson(row.metadata) : row.metadata;
  const fallbackActions = row.texto_accion && row.ruta
    ? [{ etiqueta: row.texto_accion, ruta: row.ruta, estilo: 'PRIMARIA', orden: 1 }]
    : [];

  return {
    ...row,
    leida: Boolean(row.leida),
    fijada: Boolean(row.fijada),
    cantidad_agrupada: Number(row.cantidad_agrupada || 1),
    metadata: metadata || null,
    acciones: actions.length ? actions : fallbackActions
  };
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

const Notificacion = {
  listar: async (idUsuario, filtros = {}) => {
    const connection = db.promise();
    const [notificationColumns, userColumns] = await Promise.all([
      columnsFor(connection, 'notificaciones'),
      columnsFor(connection, 'usuarios')
    ]);
    const hasActions = await tableExists(connection, 'notificacion_acciones');
    const originName = userNameExpression('origen', userColumns);
    const where = ['n.id_usuario = ?'];
    const params = [idUsuario];

    if (filtros.estado === 'no_leidas') where.push('n.leida = 0');
    if (filtros.tipo && TIPOS.has(filtros.tipo)) {
      where.push('n.tipo = ?');
      params.push(filtros.tipo);
    }
    if (filtros.buscar) {
      where.push('(n.titulo LIKE ? OR n.mensaje LIKE ?)');
      const term = `%${filtros.buscar}%`;
      params.push(term, term);
    }
    if (notificationColumns.has('fecha_expiracion')) {
      where.push('(n.fecha_expiracion IS NULL OR n.fecha_expiracion > NOW())');
    }

    const limit = Math.min(Math.max(Number(filtros.limit) || 80, 1), 150);
    const offset = Math.max(Number(filtros.offset) || 0, 0);
    params.push(limit, offset);

    const [rows] = await connection.query(
      `SELECT n.*, ${originName} AS usuario_origen_nombre
       FROM notificaciones n
       LEFT JOIN usuarios origen ON origen.id_usuario = n.usuario_origen
       WHERE ${where.join(' AND ')}
       ORDER BY n.fijada DESC, n.leida ASC, n.fecha_creacion DESC
       LIMIT ? OFFSET ?`,
      params
    );

    let actionsByNotification = new Map();
    if (hasActions && rows.length) {
      const ids = rows.map((row) => row.id_notificacion);
      const placeholders = ids.map(() => '?').join(',');
      const [actions] = await connection.query(
        `SELECT id_notificacion, etiqueta, ruta, estilo, orden
         FROM notificacion_acciones
         WHERE id_notificacion IN (${placeholders})
         ORDER BY id_notificacion, orden`,
        ids
      );
      actionsByNotification = actions.reduce((map, action) => {
        const list = map.get(action.id_notificacion) || [];
        list.push(action);
        map.set(action.id_notificacion, list);
        return map;
      }, new Map());
    }

    return rows.map((row) => normalizeNotification(row, actionsByNotification.get(row.id_notificacion) || []));
  },

  resumen: async (idUsuario) => {
    const [rows] = await db.promise().query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN leida = 0 THEN 1 ELSE 0 END) AS no_leidas,
         SUM(CASE WHEN fijada = 1 THEN 1 ELSE 0 END) AS fijadas,
         SUM(CASE WHEN prioridad IN ('ALTA', 'URGENTE') AND leida = 0 THEN 1 ELSE 0 END) AS importantes
       FROM notificaciones
       WHERE id_usuario = ?
         AND (fecha_expiracion IS NULL OR fecha_expiracion > NOW())`,
      [idUsuario]
    );

    return {
      total: Number(rows[0]?.total || 0),
      no_leidas: Number(rows[0]?.no_leidas || 0),
      fijadas: Number(rows[0]?.fijadas || 0),
      importantes: Number(rows[0]?.importantes || 0)
    };
  },

  marcarLeida: async (idUsuario, idNotificacion) => {
    const [result] = await db.promise().query(
      `UPDATE notificaciones
       SET leida = 1, fecha_lectura = COALESCE(fecha_lectura, NOW())
       WHERE id_notificacion = ? AND id_usuario = ?`,
      [idNotificacion, idUsuario]
    );
    return result.affectedRows > 0;
  },

  marcarTodasLeidas: async (idUsuario) => {
    const [result] = await db.promise().query(
      `UPDATE notificaciones
       SET leida = 1, fecha_lectura = COALESCE(fecha_lectura, NOW())
       WHERE id_usuario = ? AND leida = 0`,
      [idUsuario]
    );
    return result.affectedRows;
  },

  eliminar: async (idUsuario, idNotificacion) => {
    const [result] = await db.promise().query(
      'DELETE FROM notificaciones WHERE id_notificacion = ? AND id_usuario = ?',
      [idNotificacion, idUsuario]
    );
    return result.affectedRows > 0;
  },

  obtenerPreferencias: async (idUsuario) => {
    const connection = db.promise();
    await connection.query(
      'INSERT IGNORE INTO preferencias_notificaciones (id_usuario) VALUES (?)',
      [idUsuario]
    );
    const [rows] = await connection.query(
      'SELECT * FROM preferencias_notificaciones WHERE id_usuario = ? LIMIT 1',
      [idUsuario]
    );
    return rows[0] || null;
  },

  actualizarPreferencias: async (idUsuario, cambios) => {
    const connection = db.promise();
    const columns = await columnsFor(connection, 'preferencias_notificaciones');
    const entries = Object.entries(cambios || {})
      .filter(([key]) => PREFERENCIAS.includes(key) && columns.has(key))
      .map(([key, value]) => [key, key === 'hora_resumen' ? String(value || '20:00:00') : Boolean(value) ? 1 : 0]);

    await Notificacion.obtenerPreferencias(idUsuario);
    if (!entries.length) return Notificacion.obtenerPreferencias(idUsuario);

    const setSql = entries.map(([key]) => `\`${key}\` = ?`).join(', ');
    await connection.query(
      `UPDATE preferencias_notificaciones SET ${setSql} WHERE id_usuario = ?`,
      [...entries.map(([, value]) => value), idUsuario]
    );
    return Notificacion.obtenerPreferencias(idUsuario);
  },

  crear: async (payload) => {
    const connection = db.promise();
    const columns = await columnsFor(connection, 'notificaciones');
    const values = {
      id_usuario: payload.id_usuario,
      usuario_origen: payload.usuario_origen || null,
      tipo: payload.tipo,
      evento: payload.evento || 'OTRO',
      titulo: payload.titulo,
      mensaje: payload.mensaje,
      detalle: payload.detalle || null,
      prioridad: payload.prioridad || 'MEDIA',
      leida: payload.leida ? 1 : 0,
      fijada: payload.fijada ? 1 : 0,
      ruta: payload.ruta || null,
      texto_accion: payload.texto_accion || null,
      imagen_url: payload.imagen_url || null,
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      id_intercambio: payload.id_intercambio || null,
      id_mensaje: payload.id_mensaje || null,
      id_sesion: payload.id_sesion || null,
      id_calificacion: payload.id_calificacion || null,
      id_publicacion: payload.id_publicacion || null,
      id_comentario: payload.id_comentario || null,
      clave_agrupacion: payload.clave_agrupacion || null,
      cantidad_agrupada: payload.cantidad_agrupada || 1,
      fecha_expiracion: payload.fecha_expiracion || null
    };
    const entries = Object.entries(values).filter(([key]) => columns.has(key));
    const fields = entries.map(([key]) => `\`${key}\``).join(', ');
    const placeholders = entries.map(() => '?').join(', ');

    const [result] = await connection.query(
      `INSERT INTO notificaciones (${fields}) VALUES (${placeholders})`,
      entries.map(([, value]) => value)
    );

    return result.insertId;
  }
};

module.exports = Notificacion;
