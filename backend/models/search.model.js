const db = require('../database');

exports.findPeopleBySkill = async ({ userId, term, category, page, limit }) => {
  const connection = db.promise();
  const [userColumns] = await connection.query('SHOW COLUMNS FROM usuarios');
  const columnNames = new Set(userColumns.map((column) => column.Field));
  const nameExpression = columnNames.has('nombre')
    ? 'u.nombre'
    : "CONCAT_WS(' ', u.nombres, u.apellido_paterno, u.apellido_materno)";
  const filters = [userId];
  let where = `WHERE u.id_usuario <> ? AND u.estado = 'ACTIVO'
    AND u.email_verificado = TRUE AND uh.tipo = 'ofrece'`;

  if (term) {
    const likeTerm = `%${term}%`;
    where += ` AND (h.nombre LIKE ? OR h.categoria LIKE ? OR ${nameExpression} LIKE ?)`;
    filters.push(likeTerm, likeTerm, likeTerm);
  }
  if (category) {
    where += ' AND h.categoria = ?';
    filters.push(category);
  }

  const offset = (page - 1) * limit;
  const [countRows] = await connection.query(
    `SELECT COUNT(*) AS total FROM usuarios u
     INNER JOIN usuario_habilidad uh ON uh.id_usuario = u.id_usuario
     INNER JOIN habilidades h ON h.id_habilidad = uh.id_habilidad ${where}`,
    filters
  );
  const [results] = await connection.query(
    `SELECT u.id_usuario, ${nameExpression} AS nombre, u.nivel AS nivel_usuario, u.descripcion,
      h.id_habilidad, h.nombre AS habilidad, h.categoria, uh.nivel,
      ROUND(COALESCE(AVG(c.puntuacion), 0), 1) AS puntuacion,
      COUNT(DISTINCT c.id_calificacion) AS total_calificaciones,
      COUNT(DISTINCT CASE WHEN i.estado = 'FINALIZADO' THEN i.id_intercambio END) AS intercambios
     FROM usuarios u
     INNER JOIN usuario_habilidad uh ON uh.id_usuario = u.id_usuario
     INNER JOIN habilidades h ON h.id_habilidad = uh.id_habilidad
     LEFT JOIN calificaciones c ON c.usuario_evaluado = u.id_usuario
     LEFT JOIN intercambios i ON i.usuario_envia = u.id_usuario OR i.usuario_recibe = u.id_usuario
     ${where}
     GROUP BY u.id_usuario, ${nameExpression}, u.nivel, u.descripcion,
       h.id_habilidad, h.nombre, h.categoria, uh.nivel
     ORDER BY puntuacion DESC, intercambios DESC, nombre ASC, h.nombre ASC
     LIMIT ? OFFSET ?`,
    [...filters, limit, offset]
  );
  return { results, total: Number(countRows[0].total) };
};

exports.findCategories = async () => {
  const [rows] = await db.promise().query(
    `SELECT DISTINCT categoria FROM habilidades
     WHERE categoria IS NOT NULL AND TRIM(categoria) <> '' ORDER BY categoria`
  );
  return rows.map((row) => row.categoria);
};
