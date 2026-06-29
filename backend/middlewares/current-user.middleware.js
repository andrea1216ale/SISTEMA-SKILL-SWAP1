const db = require('../database');

module.exports = async (req, res, next) => {
  const userId = Number(req.get('X-User-Id'));
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(401).json({ error: 'Debes iniciar sesion para realizar esta accion.' });
  }
  try {
    const [rows] = await db.promise().query(
      "SELECT id_usuario FROM usuarios WHERE id_usuario = ? AND estado = 'ACTIVO' LIMIT 1",
      [userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'La sesion no es valida.' });
    req.user = { id_usuario: userId };
    next();
  } catch (error) {
    next(error);
  }
};
