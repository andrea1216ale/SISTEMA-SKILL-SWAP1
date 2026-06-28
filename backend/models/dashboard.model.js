const db = require('../database');

exports.getDashboard = async (userId) => {
  const connection = db.promise();
  const [[userRows], [metricRows], [popularSkills], [recommendedUsers]] = await Promise.all([
    connection.query('SELECT id_usuario, nombre, correo FROM usuarios WHERE id_usuario = ? LIMIT 1', [userId]),
    connection.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) AS usuarios,
        (SELECT COUNT(*) FROM habilidades) AS habilidades,
        (SELECT COUNT(*) FROM intercambios WHERE DATE(fecha) = CURDATE()) AS intercambios_hoy,
        (SELECT ROUND(COALESCE(AVG(puntuacion), 0), 1) FROM calificaciones) AS rating_promedio
    `),
    connection.query(`
      SELECT h.id_habilidad, h.nombre, h.categoria, COUNT(DISTINCT uh.id_usuario) AS usuarios
      FROM habilidades h
      LEFT JOIN usuario_habilidad uh ON uh.id_habilidad = h.id_habilidad AND uh.tipo = 'ofrece'
      GROUP BY h.id_habilidad, h.nombre, h.categoria
      ORDER BY usuarios DESC, h.nombre ASC
      LIMIT 4
    `),
    connection.query(`
      SELECT u.id_usuario, u.nombre,
        COALESCE(GROUP_CONCAT(DISTINCT h.nombre ORDER BY h.nombre SEPARATOR ', '), 'Nuevo miembro') AS habilidades,
        ROUND(COALESCE(AVG(c.puntuacion), 0), 1) AS rating,
        COUNT(DISTINCT CASE WHEN i.estado IN ('completado', 'completada', 'finalizado') THEN i.id_intercambio END) AS intercambios
      FROM usuarios u
      LEFT JOIN usuario_habilidad uh ON uh.id_usuario = u.id_usuario AND uh.tipo = 'ofrece'
      LEFT JOIN habilidades h ON h.id_habilidad = uh.id_habilidad
      LEFT JOIN calificaciones c ON c.usuario_evaluado = u.id_usuario
      LEFT JOIN intercambios i ON i.usuario_envia = u.id_usuario OR i.usuario_recibe = u.id_usuario
      WHERE u.id_usuario <> ?
      GROUP BY u.id_usuario, u.nombre
      ORDER BY rating DESC, intercambios DESC, u.fecha_registro DESC
      LIMIT 4
    `, [userId])
  ]);

  if (!userRows[0]) return null;
  return { user: userRows[0], metrics: metricRows[0], popularSkills, recommendedUsers };
};
