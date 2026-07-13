module.exports = (err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido de 10 MB.' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ error: 'Demasiados archivos o campo inesperado.' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Una habilidad o usuario indicado no existe.' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El registro ya existe.' });
  if (err.message?.startsWith('Tipo de archivo no permitido')) return res.status(400).json({ error: err.message });
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Ha ocurrido un error en el servidor' });
};
