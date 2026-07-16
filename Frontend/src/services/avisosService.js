import api from "./api";

export const obtenerAvisos = async () => {
  const respuesta = await api.get("/avisos");
  return respuesta.data;
};

export const crearAviso = async (datos) => {
  const respuesta = await api.post("/avisos", datos);
  return respuesta.data;
};

export const actualizarAviso = async (id, datos) => {
  const respuesta = await api.put(`/avisos/${id}`, datos);
  return respuesta.data;
};

export const fijarAviso = async (id, fijado) => {
  const respuesta = await api.patch(`/avisos/${id}/fijado`, { fijado });
  return respuesta.data;
};

export const eliminarAviso = async (id) => {
  const respuesta = await api.delete(`/avisos/${id}`);
  return respuesta.data;
};
