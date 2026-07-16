import api from "./api";

export const obtenerIncidentes = async () => {
  const respuesta = await api.get("/incidentes");
  return respuesta.data;
};

export const crearIncidente = async (datos) => {
  const respuesta = await api.post("/incidentes", datos);
  return respuesta.data;
};

export const obtenerIncidentePorId = async (id) => {
  const respuesta = await api.get(`/incidentes/${id}`);
  return respuesta.data;
};

export const actualizarEstadoIncidente = async (id, estado, comentario = "") => {
  const respuesta = await api.patch(`/incidentes/${id}/estado`, { estado, comentario });
  return respuesta.data;
};