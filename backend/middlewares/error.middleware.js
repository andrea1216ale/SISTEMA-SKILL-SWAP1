module.exports = (err, req, res, next) => {
  console.error(err);
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Una habilidad o usuario indicado no existe.' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El registro ya existe.' });
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Ha ocurrido un error en el servidor' });
};
