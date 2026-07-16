import api from "./api";

export const obtenerPublicaciones = async (params) => {
  const res = await api.get("/mercado", { params });
  return res.data;
};

export const crearPublicacion = async (formData) => {
  const res = await api.post("/mercado", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const marcarVendido = async (id) => {
  const res = await api.put(`/mercado/${id}/vendido`);
  return res.data;
};