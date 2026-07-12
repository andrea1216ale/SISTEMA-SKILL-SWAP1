const express = require('express');
const router = express.Router();
const intercambioController = require('../controllers/intercambio.controller');
const currentUserMiddleware = require('../middlewares/current-user.middleware');

router.use(currentUserMiddleware);

router.post('/', intercambioController.solicitarIntercambio);
router.post('/solicitar', intercambioController.solicitarIntercambio);
router.get('/solicitudes', intercambioController.obtenerSolicitudes);
router.get('/recibidos', intercambioController.listarRecibidos);
router.get('/enviados', intercambioController.listarEnviados);
router.get('/contactos-disponibles', intercambioController.obtenerContactosDisponibles);
router.get('/verificar/:idUsuario', intercambioController.verificarSolicitud);
router.get('/:id', intercambioController.obtenerDetalle);
router.get('/:id/sesion', intercambioController.obtenerSesion);
router.post('/:id/conversacion', intercambioController.obtenerOCrearConversacion);
router.patch('/:id/aceptar', intercambioController.aceptarSolicitud);
router.patch('/:id/rechazar', intercambioController.rechazarSolicitud);
router.patch('/:idIntercambio/finalizar', intercambioController.finalizarIntercambio);

module.exports = router;
