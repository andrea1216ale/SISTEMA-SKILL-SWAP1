const db = require('../database');

exports.create = (user, callback) => {
  const sql = `
    INSERT INTO usuarios
      (nombre, correo, password, edad, nivel)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [user.nombre, user.correo, user.password, user.edad, user.nivel];
  db.query(sql, params, callback);
};

exports.findByCredentials = (correo, password, callback) => {
  const sql = `
    SELECT *
    FROM usuarios
    WHERE correo = ? AND password = ?
  `;
  db.query(sql, [correo, password], callback);
};
