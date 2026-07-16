import api from "./api";

export const obtenerResumenComunidad = async () => {
  const respuesta = await api.get("/comunidad/resumen");
  return respuesta.data;
};
