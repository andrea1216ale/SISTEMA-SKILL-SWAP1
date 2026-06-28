const searchService = require('../services/search.service');

exports.search = async (req, res) => {
  try {
    res.json(await searchService.search(req.query));
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      error: error.status ? error.message : 'No se pudo realizar la búsqueda.'
    });
  }
};
