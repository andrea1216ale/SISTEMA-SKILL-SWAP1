const db = require('../database');

exports.create = (user) => {
  const sql = `INSERT INTO usuarios (nombre, correo, password, edad, nivel) VALUES (?, ?, ?, ?, ?)`;
  return new Promise((resolve, reject) => {
    db.query(sql, [user.nombre, user.correo, user.password, user.edad, user.nivel], (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

exports.findByCredentials = (correo, password) => {
  const sql = `SELECT * FROM usuarios WHERE correo = ? AND password = ?`;
  return new Promise((resolve, reject) => {
    db.query(sql, [correo, password], (error, results) => {
      if (error) return reject(error);
      resolve(results[0] || null);
    });
  });
};
