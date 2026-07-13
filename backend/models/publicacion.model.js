const db = require('../database');

const baseSelect = `
  SELECT p.*, CONCAT_WS(' ', u.nombres, u.apellido_paterno) AS usuario_nombre,
    ROUND(COALESCE((SELECT AVG(c.puntuacion) FROM calificaciones c WHERE c.usuario_evaluado = u.id_usuario), 0), 1) AS usuario_puntuacion,
    (SELECT COUNT(*) FROM intercambios i WHERE (i.usuario_envia = u.id_usuario OR i.usuario_recibe = u.id_usuario)
      AND UPPER(i.estado) IN ('FINALIZADO','FINALIZADA','COMPLETADO','COMPLETADA')) AS usuario_intercambios,
    (SELECT COUNT(*) FROM comentarios co WHERE co.id_publicacion = p.id_publicacion) AS total_comentarios,
    (SELECT COUNT(*) FROM reacciones r WHERE r.id_publicacion = p.id_publicacion) AS total_reacciones,
    (SELECT r.tipo FROM reacciones r WHERE r.id_publicacion = p.id_publicacion AND r.id_usuario = ? LIMIT 1) AS mi_reaccion,
    EXISTS(SELECT 1 FROM publicaciones_guardadas pg WHERE pg.id_publicacion = p.id_publicacion AND pg.id_usuario = ?) AS guardada
  FROM publicaciones p INNER JOIN usuarios u ON u.id_usuario = p.id_usuario`;

async function enrich(rows, connection = db.promise()) {
  if (!rows.length) return rows;
  const ids = rows.map((row) => row.id_publicacion);
  const placeholders = ids.map(() => '?').join(',');
  const [skills] = await connection.query(`SELECT ph.id_publicacion, h.id_habilidad, h.nombre, h.categoria FROM publicacion_habilidad ph INNER JOIN habilidades h ON h.id_habilidad = ph.id_habilidad WHERE ph.id_publicacion IN (${placeholders}) ORDER BY h.nombre`, ids);
  const [files] = await connection.query(`SELECT id_archivo, id_publicacion, url_archivo, tipo, fecha_subida FROM publicacion_archivos WHERE id_publicacion IN (${placeholders}) ORDER BY id_archivo`, ids);
  return rows.map((row) => ({
    ...row,
    mi_reaccion: row.mi_reaccion ? String(row.mi_reaccion) : null,
    guardada: Boolean(row.guardada),
    habilidades: skills.filter((item) => item.id_publicacion === row.id_publicacion).map(({ id_publicacion, ...item }) => item),
    archivos: files.filter((item) => item.id_publicacion === row.id_publicacion).map(({ id_publicacion, ...item }) => item)
  }));
}

exports.list = async ({ userId = 0, tipo, habilidad, categoria, limit = 20, offset = 0 }) => {
  const where = ["p.estado = 'ACTIVA'"];
  const params = [userId, userId];
  if (tipo) { where.push('p.tipo = ?'); params.push(tipo); }
  if (habilidad) { where.push('EXISTS (SELECT 1 FROM publicacion_habilidad fx WHERE fx.id_publicacion = p.id_publicacion AND fx.id_habilidad = ?)'); params.push(habilidad); }
  if (categoria) { where.push('EXISTS (SELECT 1 FROM publicacion_habilidad fx INNER JOIN habilidades hx ON hx.id_habilidad = fx.id_habilidad WHERE fx.id_publicacion = p.id_publicacion AND hx.categoria = ?)'); params.push(categoria); }
  params.push(limit, offset);
  const [rows] = await db.promise().query(`${baseSelect} WHERE ${where.join(' AND ')} ORDER BY p.fecha_creacion DESC LIMIT ? OFFSET ?`, params);
  return enrich(rows);
};

exports.findById = async (id, userId = 0) => {
  const [rows] = await db.promise().query(`${baseSelect} WHERE p.id_publicacion = ? AND p.estado <> 'ELIMINADA' LIMIT 1`, [userId, userId, id]);
  const result = await enrich(rows);
  return result[0] || null;
};

exports.create = async (userId, data) => {
  const connection = db.promise();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query('INSERT INTO publicaciones (id_usuario, tipo, titulo, descripcion, nivel, modalidad, disponibilidad) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, data.tipo, data.titulo, data.descripcion, data.nivel || null, data.modalidad || null, data.disponibilidad || null]);
    const id = result.insertId;
    if (data.habilidades.length) await connection.query('INSERT INTO publicacion_habilidad (id_publicacion, id_habilidad) VALUES ?', [data.habilidades.map((skillId) => [id, skillId])]);
    if (data.archivos.length) await connection.query('INSERT INTO publicacion_archivos (id_publicacion, url_archivo, tipo) VALUES ?', [data.archivos.map((file) => [id, file.url_archivo, file.tipo])]);
    await connection.commit();
    return id;
  } catch (error) { await connection.rollback(); throw error; }
};

exports.update = async (id, userId, data) => {
  const connection = db.promise();
  try {
    await connection.beginTransaction();
    const [owner] = await connection.query("SELECT id_usuario FROM publicaciones WHERE id_publicacion = ? AND estado <> 'ELIMINADA' FOR UPDATE", [id]);
    if (!owner[0]) { await connection.rollback(); return { status: 'missing' }; }
    if (owner[0].id_usuario !== userId) { await connection.rollback(); return { status: 'forbidden' }; }
    await connection.query('UPDATE publicaciones SET tipo=?, titulo=?, descripcion=?, nivel=?, modalidad=?, disponibilidad=? WHERE id_publicacion=?', [data.tipo, data.titulo, data.descripcion, data.nivel || null, data.modalidad || null, data.disponibilidad || null, id]);
    await connection.query('DELETE FROM publicacion_habilidad WHERE id_publicacion = ?', [id]);
    await connection.query('DELETE FROM publicacion_archivos WHERE id_publicacion = ?', [id]);
    if (data.habilidades.length) await connection.query('INSERT INTO publicacion_habilidad (id_publicacion, id_habilidad) VALUES ?', [data.habilidades.map((skillId) => [id, skillId])]);
    if (data.archivos.length) await connection.query('INSERT INTO publicacion_archivos (id_publicacion, url_archivo, tipo) VALUES ?', [data.archivos.map((file) => [id, file.url_archivo, file.tipo])]);
    await connection.commit();
    return { status: 'updated' };
  } catch (error) { await connection.rollback(); throw error; }
};

exports.softDelete = async (id, userId) => {
  const [result] = await db.promise().query("UPDATE publicaciones SET estado = 'ELIMINADA' WHERE id_publicacion = ? AND id_usuario = ? AND estado <> 'ELIMINADA'", [id, userId]);
  if (result.affectedRows) return 'deleted';
  const [rows] = await db.promise().query('SELECT id_usuario FROM publicaciones WHERE id_publicacion = ? LIMIT 1', [id]);
  return rows[0] && rows[0].id_usuario !== userId ? 'forbidden' : 'missing';
};

exports.comments = async (id) => {
  const [rows] = await db.promise().query(`SELECT c.id_comentario, c.id_publicacion, c.id_usuario, c.comentario, c.fecha_comentario, CONCAT_WS(' ', u.nombres, u.apellido_paterno) AS usuario_nombre FROM comentarios c INNER JOIN usuarios u ON u.id_usuario = c.id_usuario INNER JOIN publicaciones p ON p.id_publicacion = c.id_publicacion WHERE c.id_publicacion = ? AND p.estado = 'ACTIVA' ORDER BY c.fecha_comentario ASC`, [id]);
  return rows;
};

exports.addComment = async (id, userId, comment) => {
  const [post] = await db.promise().query("SELECT id_publicacion FROM publicaciones WHERE id_publicacion = ? AND estado = 'ACTIVA'", [id]);
  if (!post[0]) return null;
  const [result] = await db.promise().query('INSERT INTO comentarios (id_publicacion, id_usuario, comentario) VALUES (?, ?, ?)', [id, userId, comment]);
  return result.insertId;
};

exports.deleteComment = async (id, userId) => {
  const [result] = await db.promise().query('DELETE FROM comentarios WHERE id_comentario = ? AND id_usuario = ?', [id, userId]);
  if (result.affectedRows) return 'deleted';
  const [rows] = await db.promise().query('SELECT id_usuario FROM comentarios WHERE id_comentario = ?', [id]);
  return rows[0] && rows[0].id_usuario !== userId ? 'forbidden' : 'missing';
};

exports.toggleReaction = async (id, userId, type) => {
  const connection = db.promise();
  try {
    await connection.beginTransaction();
    const [post] = await connection.query("SELECT id_publicacion FROM publicaciones WHERE id_publicacion=? AND estado='ACTIVA'", [id]);
    if (!post[0]) { await connection.rollback(); return null; }
    const [current] = await connection.query('SELECT id_reaccion, tipo FROM reacciones WHERE id_publicacion=? AND id_usuario=? FOR UPDATE', [id, userId]);
    let reaction = type;
    if (current[0]?.tipo === type) { await connection.query('DELETE FROM reacciones WHERE id_reaccion=?', [current[0].id_reaccion]); reaction = null; }
    else if (current[0]) await connection.query('UPDATE reacciones SET tipo=?, fecha_reaccion=CURRENT_TIMESTAMP WHERE id_reaccion=?', [type, current[0].id_reaccion]);
    else await connection.query('INSERT INTO reacciones (id_publicacion,id_usuario,tipo) VALUES (?,?,?)', [id, userId, type]);
    const [[count]] = await connection.query('SELECT COUNT(*) AS total FROM reacciones WHERE id_publicacion=?', [id]);
    await connection.commit(); return { reaccion: reaction, total: count.total };
  } catch (error) { await connection.rollback(); throw error; }
};

exports.toggleSaved = async (id, userId) => {
  const connection = db.promise();
  try {
    await connection.beginTransaction();
    const [post] = await connection.query("SELECT id_publicacion FROM publicaciones WHERE id_publicacion=? AND estado='ACTIVA'", [id]);
    if (!post[0]) { await connection.rollback(); return null; }
    const [current] = await connection.query('SELECT id_guardado FROM publicaciones_guardadas WHERE id_publicacion=? AND id_usuario=? FOR UPDATE', [id, userId]);
    const saved = !current[0];
    if (current[0]) await connection.query('DELETE FROM publicaciones_guardadas WHERE id_guardado=?', [current[0].id_guardado]);
    else await connection.query('INSERT INTO publicaciones_guardadas (id_publicacion,id_usuario) VALUES (?,?)', [id,userId]);
    await connection.commit(); return saved;
  } catch (error) { await connection.rollback(); throw error; }
};

exports.savedByUser = async (ownerId, currentUserId, limit = 50) => {
  const [rows] = await db.promise().query(`${baseSelect} INNER JOIN publicaciones_guardadas saved ON saved.id_publicacion=p.id_publicacion AND saved.id_usuario=? WHERE p.estado='ACTIVA' ORDER BY saved.fecha_guardado DESC LIMIT ?`, [currentUserId, currentUserId, ownerId, limit]);
  return enrich(rows);
};

exports.skills = async () => {
  const [rows] = await db.promise().query('SELECT id_habilidad, nombre, categoria FROM habilidades ORDER BY categoria, nombre');
  return rows;
};

exports.idiomas = async () => {
  const [rows] = await db.promise().query('SELECT id_idioma, nombre FROM idiomas ORDER BY nombre');
  return rows;
};
