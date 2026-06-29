const { generarRespuestaGemini } = require('../services/gemini.service');

const enviarMensajeChatbot = async (req, res) => {
  try {
    const { mensaje } = req.body;

    if (typeof mensaje !== 'string' || mensaje.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El mensaje es obligatorio'
      });
    }

    const respuesta = await generarRespuestaGemini(mensaje.trim());

    return res.json({
      success: true,
      respuesta
    });
  } catch (error) {
    console.error('Error en chatbot:', error);

    return res.status(500).json({
      success: false,
      message: 'Error al generar respuesta del chatbot'
    });
  }
};

module.exports = {
  enviarMensajeChatbot
};
