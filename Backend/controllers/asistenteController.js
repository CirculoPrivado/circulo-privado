const { generarRespuestaAsistente } = require("../services/integrations/openaiService");

const respuestasLocal = (mensaje) => {
  const texto = mensaje.toLowerCase();

  if (texto.includes("incidente")) {
    return "Para reportar un incidente, ve al módulo de Incidentes y registra uno nuevo.";
  }

  if (texto.includes("emergencia")) {
    return "El botón de emergencia sirve para registrar una alerta inmediata dentro del sistema.";
  }

  if (texto.includes("pago")) {
    return "Puedes revisar tus pagos en el módulo de Pagos.";
  }

  return "Puedo ayudarte con incidentes, emergencias, pagos, avisos, perfil y mercado vecinal.";
};

const chatAsistente = async (req, res) => {
  try {
    const { mensaje, historial = [] } = req.body;

    if (!mensaje || !mensaje.trim()) {
      return res.status(400).json({
        message: "El mensaje es obligatorio"
      });
    }

    try {
      const reply = await generarRespuestaAsistente({ mensaje, historial });

      return res.json({
        reply: reply || respuestasLocal(mensaje)
      });
    } catch (error) {
      console.error("Error OpenAI:", error.message);

      return res.json({
        reply: respuestasLocal(mensaje)
      });
    }
  } catch (error) {
    console.error("Error en controlador:", error.message);

    return res.status(500).json({
      message: "Error al procesar la consulta"
    });
  }
};

module.exports = {
  chatAsistente
};