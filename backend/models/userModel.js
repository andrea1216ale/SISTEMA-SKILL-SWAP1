const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../database');
const emailService = require('../services/email.service');

exports.createWithProfile = async (user) => {
  const connection = db.promise();
  await connection.beginTransaction();

  try {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const [result] = await connection.query(
      `INSERT INTO usuarios
       (nombres, apellido_paterno, apellido_materno, correo, password, fecha_nacimiento, nivel)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.nombres, user.apellido_paterno, user.apellido_materno || null,
        user.correo, passwordHash, user.fecha_nacimiento || null, user.nivel || null]
    );

    const userId = result.insertId;
    const codigo = crypto.randomInt(100000, 1000000).toString();
    await connection.query(
      `INSERT INTO codigos_verificacion (id_usuario, codigo, fecha_expiracion)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [userId, codigo]
    );

    const idiomas = Array.isArray(user.idiomas) ? user.idiomas : [];
    const habilidades = Array.isArray(user.habilidades) ? user.habilidades : [];
    if (idiomas.length) {
      const [rows] = await connection.query('SELECT id_idioma FROM idiomas WHERE nombre IN (?)', [idiomas]);
      for (const item of rows) {
        await connection.query('INSERT INTO usuario_idioma (id_usuario, id_idioma) VALUES (?, ?)', [userId, item.id_idioma]);
      }
    }
    if (habilidades.length) {
      const [rows] = await connection.query('SELECT id_habilidad FROM habilidades WHERE nombre IN (?)', [habilidades]);
      for (const item of rows) {
        await connection.query("INSERT INTO usuario_habilidad (id_usuario, id_habilidad, tipo) VALUES (?, ?, 'ofrece')", [userId, item.id_habilidad]);
      }
    }

    await emailService.sendVerificationCode({ correo: user.correo, nombres: user.nombres, codigo });
    await connection.commit();
    return { id_usuario: userId, correo: user.correo };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};

exports.findByEmail = async (correo) => {
  const [rows] = await db.promise().query(
    `SELECT id_usuario, nombres, apellido_paterno, apellido_materno, correo, password,
            email_verificado, estado
     FROM usuarios WHERE LOWER(TRIM(correo)) = ? LIMIT 1`,
    [correo]
  );
  return rows[0] || null;
};

exports.verifyEmail = async (correo, codigo) => {
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    const [rows] = await connection.query(
      `SELECT cv.id_codigo, cv.id_usuario
       FROM codigos_verificacion cv
       INNER JOIN usuarios u ON u.id_usuario = cv.id_usuario
       WHERE LOWER(TRIM(u.correo)) = ? AND cv.codigo = ? AND cv.usado = FALSE
         AND cv.fecha_expiracion > NOW()
       ORDER BY cv.fecha_creacion DESC LIMIT 1 FOR UPDATE`,
      [correo, codigo]
    );
    if (!rows[0]) {
      await connection.rollback();
      return null;
    }

    await connection.query(
      "UPDATE usuarios SET email_verificado = TRUE, estado = 'ACTIVO' WHERE id_usuario = ?",
      [rows[0].id_usuario]
    );
    await connection.query('UPDATE codigos_verificacion SET usado = TRUE WHERE id_codigo = ?', [rows[0].id_codigo]);
    await connection.commit();
    return rows[0].id_usuario;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};

exports.resendVerificationCode = async (correo) => {
  const connection = db.promise();
  await connection.beginTransaction();
  try {
    const [users] = await connection.query(
      `SELECT id_usuario, nombres, correo, email_verificado, estado
       FROM usuarios WHERE LOWER(TRIM(correo)) = ? LIMIT 1 FOR UPDATE`,
      [correo]
    );
    const user = users[0];
    if (!user || user.email_verificado || user.estado !== 'PENDIENTE') {
      await connection.rollback();
      return false;
    }

    await connection.query('UPDATE codigos_verificacion SET usado = TRUE WHERE id_usuario = ? AND usado = FALSE', [user.id_usuario]);
    const codigo = crypto.randomInt(100000, 1000000).toString();
    await connection.query(
      `INSERT INTO codigos_verificacion (id_usuario, codigo, fecha_expiracion)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [user.id_usuario, codigo]
    );
    await emailService.sendVerificationCode({ correo: user.correo, nombres: user.nombres, codigo });
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
};
