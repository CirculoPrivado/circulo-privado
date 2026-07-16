import api from "./api";

export const enviarMensajeAsistente = async (mensaje, historial = []) => {
  const respuesta = await api.post("/asistente/chat", {
    mensaje,
    historial
  });

  return respuesta.data;
};