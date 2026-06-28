const profileService = require('../services/profile.service');

function validUserId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

exports.get = async (req, res) => {
  try {
    const userId = validUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'Usuario inválido.' });

    const profile = await profileService.get(userId);
    if (!profile) return res.status(404).json({ error: 'Perfil no encontrado.' });
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo cargar el perfil.' });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = validUserId(req.params.userId);
    if (!userId) return res.status(400).json({ error: 'Usuario inválido.' });
    const requiredFields = ['descripcion', 'habilidadesOfrece', 'habilidadesBusca'];
    if (requiredFields.some((field) => !Object.prototype.hasOwnProperty.call(req.body, field))) {
      return res.status(400).json({ error: 'Envía la descripción y ambas listas de habilidades.' });
    }
    const updated = await profileService.update(userId, req.body);
    if (!updated) return res.status(404).json({ error: 'Perfil no encontrado.' });
    const profile = await profileService.get(userId);
    res.json({ mensaje: 'Perfil actualizado correctamente.', profile });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'No se pudo actualizar el perfil.' });
  }
};
