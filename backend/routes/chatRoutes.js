const express = require('express');
const controller = require('../controllers/chatController');
const currentUser = require('../middlewares/current-user.middleware');

const router = express.Router();
router.use(currentUser);
router.get('/conversaciones/:idUsuario', controller.obtenerConversaciones);
router.get('/mensajes/:idConversacion', controller.obtenerMensajes);
router.post('/mensajes', controller.guardarMensaje);
router.patch('/mensajes/:idMensaje/leido', controller.marcarLeido);

module.exports = router;
