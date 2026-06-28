const db = require('../database');
const bcrypt = require('bcrypt');

exports.createWithProfile = async (user) => {
  const connection = db.promise();
  await connection.beginTransaction();

  try {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const [result] = await connection.query(
      'INSERT INTO usuarios (nombre, correo, password, edad, nivel) VALUES (?, ?, ?, ?, ?)',
      [user.nombre, user.correo, passwordHash, user.edad, user.nivel]
    );

    const userId = result.insertId;
    const idiomas = Array.isArray(user.idiomas) ? user.idiomas : [];
    const habilidades = Array.isArray(user.habilidades) ? user.habilidades : [];

    if (idiomas.length) {
      const [rows] = await connection.query('SELECT id_idioma FROM idiomas WHERE nombre IN (?)', [idiomas]);
      for (const language of rows) {
        await connection.query('INSERT INTO usuario_idioma (id_usuario, id_idioma) VALUES (?, ?)', [userId, language.id_idioma]);
      }
    }

    if (habilidades.length) {
      const [rows] = await connection.query('SELECT id_habilidad FROM habilidades WHERE nombre IN (?)', [habilidades]);
      for (const skill of rows) {
        await connection.query("INSERT INTO usuario_habilidad (id_usuario, id_habilidad, tipo) VALUES (?, ?, 'ofrece')", [userId, skill.id_habilidad]);
      }
    }

    await connection.commit();
    return { id_usuario: userId, nombre: user.nombre, correo: user.correo };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};

exports.findByEmail = async (correo) => {
  const [rows] = await db.promise().query(
    'SELECT id_usuario, nombre, correo, password FROM usuarios WHERE correo = ? LIMIT 1',
    [correo]
  );
  return rows[0] || null;
};
