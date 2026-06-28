const User = require('../models/userModel');

exports.register = (req, res) => {
  const user = req.body;

  User.create(user, (error, result) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }

    res.json({ mensaje: 'Usuario registrado correctamente' });
  });
};

exports.login = (req, res) => {
  const { correo, password } = req.body;

  User.findByCredentials(correo, password, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al iniciar sesión' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = results[0];
    res.json({ mensaje: `Bienvenido ${user.nombre}` });
  });
};
