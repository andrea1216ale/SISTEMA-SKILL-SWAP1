const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/registro', userController.register);
router.post('/login', userController.login);
router.post('/verificar-email', userController.verifyEmail);
router.post('/reenviar-codigo', userController.resendVerificationCode);

module.exports = router;
