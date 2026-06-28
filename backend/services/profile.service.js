const Profile = require('../models/profile.model');

exports.get = (userId) => Profile.findByUserId(userId);

function normalizeSkillIds(value, fieldName) {
  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} debe ser una lista.`);
    error.status = 400;
    throw error;
  }
  const ids = [...new Set(value.map(Number))];
  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    const error = new Error(`${fieldName} contiene una habilidad inválida.`);
    error.status = 400;
    throw error;
  }
  return ids;
}

exports.update = async (userId, data) => {
  const description = String(data.descripcion ?? '').trim();
  if (description.length > 500) {
    const error = new Error('La descripción no puede superar los 500 caracteres.');
    error.status = 400;
    throw error;
  }
  const offeredIds = normalizeSkillIds(data.habilidadesOfrece, 'habilidadesOfrece');
  const wantedIds = normalizeSkillIds(data.habilidadesBusca, 'habilidadesBusca');
  return Profile.update(userId, description, offeredIds, wantedIds);
};
