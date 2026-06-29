const { GoogleGenAI } = require('@google/genai');

const generarRespuestaGemini = async (mensaje) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no esta configurada');
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
Eres SkillBot, el asistente virtual del sistema Skill Swap.

Skill Swap permite:
- publicar habilidades que un usuario enseña,
- indicar habilidades que desea aprender,
- buscar usuarios compatibles,
- crear intercambios,
- programar sesiones,
- usar chat entre usuarios.

Responde en español, de forma clara, breve y amigable. Si la pregunta no esta
relacionada con Skill Swap, orienta amablemente al usuario hacia las funciones
de la plataforma. No inventes datos de usuarios, intercambios o sesiones.

Pregunta del usuario:
${mensaje}
    `
  });

  return response.text;
};

module.exports = {
  generarRespuestaGemini
};
