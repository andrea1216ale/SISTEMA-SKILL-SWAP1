const bcrypt = require('bcrypt');
const User = require('../models/userModel');

exports.register = async (req, res) => {
  try {
    const data = {
      ...req.body,
      nombres: String(req.body.nombres || '').trim(),
      apellido_paterno: String(req.body.apellido_paterno || '').trim(),
      apellido_materno: String(req.body.apellido_materno || '').trim(),
      correo: String(req.body.correo || '').trim().toLowerCase(),
      password: String(req.body.password || ''),
      fecha_nacimiento: String(req.body.fecha_nacimiento || '').trim(),
    };

    if (!data.nombres || !data.apellido_paterno || !data.correo || data.password.length < 8) {
      return res.status(400).json({ error: 'Completa los campos obligatorios. La contraseña debe tener al menos 8 caracteres.' });
    }

    const user = await User.createWithProfile(data);
    res.status(201).json({
      mensaje: 'Cuenta creada. Revisa tu correo para activarla.',
      correo: user.correo,
      requiere_verificacion: true,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    if (error.code === 'EMAIL_NOT_CONFIGURED') return res.status(503).json({ error: error.message });
    res.status(500).json({ error: 'No se pudo registrar el usuario ni enviar el código.' });
  }
};

exports.login = async (req, res) => {
  try {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!correo || !password) return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });

    const user = await User.findByEmail(correo);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    if (user.estado === 'BLOQUEADO') return res.status(403).json({ error: 'Tu cuenta está bloqueada.' });
    if (!user.email_verificado || user.estado !== 'ACTIVO') {
      return res.status(403).json({
        error: 'Debes verificar tu correo antes de iniciar sesión.',
        requiere_verificacion: true,
        correo: user.correo,
      });
    }

    res.json({
      mensaje: `Bienvenido ${user.nombres}`,
      user: {
        id_usuario: user.id_usuario,
        nombre: `${user.nombres} ${user.apellido_paterno}`.trim(),
        correo: user.correo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo iniciar sesión.' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    const codigo = String(req.body.codigo || '').trim();
    if (!correo || !/^\d{6}$/.test(codigo)) {
      return res.status(400).json({ error: 'Correo y código de 6 dígitos son obligatorios.' });
    }
    if (!(await User.verifyEmail(correo, codigo))) {
      return res.status(400).json({ error: 'El código es inválido, ya fue usado o expiró.' });
    }
    res.json({ mensaje: 'Correo verificado. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo verificar el correo.' });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const correo = String(req.body.correo || '').trim().toLowerCase();
    if (!correo) return res.status(400).json({ error: 'El correo es obligatorio.' });

    await User.resendVerificationCode(correo);
    // Una respuesta neutra evita revelar qué correos están registrados.
    res.json({ mensaje: 'Si la cuenta está pendiente, recibirás un código nuevo.' });
  } catch (error) {
    console.error(error);
    if (error.code === 'EMAIL_NOT_CONFIGURED') return res.status(503).json({ error: error.message });
    res.status(500).json({ error: 'No se pudo reenviar el código.' });
  }
};
