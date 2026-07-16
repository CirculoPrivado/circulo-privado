const OpenAI = require("openai");
const { ASISTENTE_PROMPT } = require("../../prompts/asistentePrompt");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generarRespuestaAsistente({ mensaje, historial = [] }) {
  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: ASISTENTE_PROMPT
      },
      ...historial,
      {
        role: "user",
        content: mensaje
      }
    ]
  });

  return response.output_text || "";
}

module.exports = {
  generarRespuestaAsistente,
};