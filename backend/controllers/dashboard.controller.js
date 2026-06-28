const Dashboard = require('../models/dashboard.model');

exports.get = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) return res.status(400).json({ error: 'Usuario inválido.' });
    const dashboard = await Dashboard.getDashboard(userId);
    if (!dashboard) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo cargar el panel.' });
  }
};
