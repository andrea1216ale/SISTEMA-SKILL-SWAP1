const express = require('express');
const { enviarMensajeChatbot } = require('../controllers/chatbot.controller');

const router = express.Router();

router.post('/mensaje', enviarMensajeChatbot);

module.exports = router;
