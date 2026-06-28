const db = require('../database');

const skillQuery = `
  SELECT h.id_habilidad, h.nombre, h.categoria
  FROM usuario_habilidad uh
  INNER JOIN habilidades h ON h.id_habilidad = uh.id_habilidad
  WHERE uh.id_usuario = ? AND uh.tipo = ?
  ORDER BY h.nombre`;

exports.findByUserId = async (userId) => {
  const connection = db.promise();
  const [[profileRows], [offeredSkills], [wantedSkills], [availableSkills]] = await Promise.all([
    connection.query(
      `SELECT u.id_usuario, u.nombres, u.apellido_paterno, u.apellido_materno,
              u.correo, u.fecha_nacimiento, u.nivel, u.descripcion, u.fecha_registro,
              (SELECT ROUND(COALESCE(AVG(c.puntuacion), 0), 1)
                 FROM calificaciones c WHERE c.usuario_evaluado = u.id_usuario) AS puntuacion,
              (SELECT COUNT(*) FROM intercambios i
                 WHERE i.usuario_envia = u.id_usuario OR i.usuario_recibe = u.id_usuario) AS total_intercambios
       FROM usuarios u
       WHERE u.id_usuario = ? AND u.estado = 'ACTIVO'
       LIMIT 1`,
      [userId]
    ),
    connection.query(skillQuery, [userId, 'ofrece']),
    connection.query(skillQuery, [userId, 'busca']),
    connection.query('SELECT id_habilidad, nombre, categoria FROM habilidades ORDER BY categoria, nombre')
  ]);

  if (!profileRows[0]) return null;
  return {
    ...profileRows[0],
    habilidadesOfrece: offeredSkills,
    habilidadesBusca: wantedSkills,
    habilidadesDisponibles: availableSkills
  };
};

exports.update = async (userId, description, offeredIds, wantedIds) => {
  const connection = db.promise();
  try {
    await connection.beginTransaction();
    const [users] = await connection.query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND estado = 'ACTIVO' LIMIT 1 FOR UPDATE",
      [userId]
    );
    if (!users[0]) {
      await connection.rollback();
      return false;
    }

    const selectedIds = [...new Set([...offeredIds, ...wantedIds])];
    if (selectedIds.length) {
      const [validSkills] = await connection.query(
        'SELECT id_habilidad FROM habilidades WHERE id_habilidad IN (?)',
        [selectedIds]
      );
      if (validSkills.length !== selectedIds.length) {
        const error = new Error('Una o más habilidades seleccionadas no existen.');
        error.status = 400;
        throw error;
      }
    }

    await connection.query('UPDATE usuarios SET descripcion = ? WHERE id_usuario = ?', [description || null, userId]);
    await connection.query('DELETE FROM usuario_habilidad WHERE id_usuario = ?', [userId]);

    const relations = [
      ...offeredIds.map((skillId) => [userId, skillId, 'ofrece']),
      ...wantedIds.map((skillId) => [userId, skillId, 'busca'])
    ];
    if (relations.length) {
      await connection.query(
        'INSERT INTO usuario_habilidad (id_usuario, id_habilidad, tipo) VALUES ?',
        [relations]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};
