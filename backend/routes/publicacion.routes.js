const express = require('express');
const controller = require('../controllers/publicacion.controller');
const currentUser = require('../middlewares/current-user.middleware');
const { upload } = require('../middlewares/upload.middleware');
const router = express.Router();

router.get('/habilidades-feed', controller.skills);
router.get('/idiomas', controller.idiomas);
router.get('/publicaciones', controller.list);
router.get('/publicaciones/:id', controller.get);
router.post('/publicaciones', currentUser, upload.array('archivos', 10), controller.create);
router.put('/publicaciones/:id', currentUser, upload.array('archivos', 10), controller.update);
router.delete('/publicaciones/:id', currentUser, controller.remove);
router.get('/publicaciones/:id/comentarios', controller.comments);
router.post('/publicaciones/:id/comentarios', currentUser, controller.addComment);
router.delete('/comentarios/:id', currentUser, controller.deleteComment);
router.post('/publicaciones/:id/reacciones', currentUser, controller.react);
router.post('/publicaciones/:id/guardar', currentUser, controller.save);
router.get('/usuarios/:id/publicaciones-guardadas', currentUser, controller.saved);

module.exports = router;
