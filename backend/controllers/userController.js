const bcrypt = require('bcrypt');
const db = require('../database');
const User = require('../models/userModel');

exports.register = async (req, res) => {
  try {
    const user = await User.createWithProfile(req.body);
    res.status(201).json({ mensaje: 'Usuario registrado correctamente', user });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    }
    res.status(500).json({ error: 'No se pudo registrar el usuario.' });
  }
};

exports.login = async (req, res) => {
  try {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!correo || !password) {
      return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
    }
    const user = await User.findByEmail(correo);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas.' });

    const isHash = user.password.startsWith('$2');
    const valid = isHash ? await bcrypt.compare(password, user.password) : password === user.password;
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas.' });

    if (!isHash) {
      const passwordHash = await bcrypt.hash(password, 10);
      await db.promise().query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [passwordHash, user.id_usuario]);
    }

    res.json({
      mensaje: `Bienvenido ${user.nombre}`,
      user: { id_usuario: user.id_usuario, nombre: user.nombre, correo: user.correo }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
};
