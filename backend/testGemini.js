const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function probarGemini() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Responde únicamente: API funcionando correctamente",
    });

    console.log(response.text);
  } catch (error) {
    console.error("Error probando Gemini:", error.message);
  }
}

probarGemini();
