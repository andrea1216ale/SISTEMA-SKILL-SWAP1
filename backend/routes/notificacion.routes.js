const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificacion.controller');
const currentUserMiddleware = require('../middlewares/current-user.middleware');

router.use(currentUserMiddleware);

router.get('/', controller.listar);
router.get('/resumen', controller.resumen);
router.get('/preferencias', controller.obtenerPreferencias);
router.put('/preferencias', controller.actualizarPreferencias);
router.patch('/leer-todas', controller.marcarTodasLeidas);
router.patch('/:idNotificacion/leida', controller.marcarLeida);
router.delete('/:idNotificacion', controller.eliminar);

module.exports = router;
