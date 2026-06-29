const express = require('express');
const router = express.Router();
const intercambioController = require('../controllers/intercambio.controller');
const currentUserMiddleware = require('../middlewares/current-user.middleware');

router.use(currentUserMiddleware);

router.post('/solicitar', intercambioController.solicitarIntercambio);
router.get('/solicitudes', intercambioController.obtenerSolicitudes);
router.get('/:id', intercambioController.obtenerDetalle);
router.get('/:id/sesion', intercambioController.obtenerSesion);
router.patch('/:id/aceptar', intercambioController.aceptarSolicitud);
router.patch('/:id/rechazar', intercambioController.rechazarSolicitud);

module.exports = router;
