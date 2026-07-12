const express = require('express');
const router = express.Router();
const controller = require('../controllers/calificacion.controller');
const currentUserMiddleware = require('../middlewares/current-user.middleware');

router.use(currentUserMiddleware);

router.get('/', controller.listarCalificaciones);
router.get('/mis-calificaciones', controller.obtenerMisCalificaciones);
router.get('/usuario/:idUsuario', controller.obtenerCalificacionesUsuario);
router.post('/', controller.crearCalificacion);

module.exports = router;
