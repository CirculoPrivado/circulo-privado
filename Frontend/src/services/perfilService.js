import axios from "axios";

const API_URL = "http://localhost:3001/api/perfil";

const getAuthConfig = (extraHeaders = {}) => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    ...extraHeaders,
  },
});

export const obtenerMiPerfil = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

export const actualizarMiPerfil = async (data) => {
  const response = await axios.put(
    API_URL,
    data,
    getAuthConfig({
      "Content-Type": "multipart/form-data",
    })
  );
  return response.data;
};

export const actualizarUbicacionActual = async (payload) => {
  const response = await axios.put(
    `${API_URL}/ubicacion`,
    payload,
    getAuthConfig({
      "Content-Type": "application/json",
    })
  );
  return response.data;
};

export const obtenerPreferenciasAccesibilidad = async () => {
  const response = await axios.get(
    `${API_URL}/accesibilidad`,
    getAuthConfig()
  );
  return response.data;
};

export const actualizarPreferenciasAccesibilidad = async (payload) => {
  const response = await axios.put(
    `${API_URL}/accesibilidad`,
    payload,
    getAuthConfig({
      "Content-Type": "application/json",
    })
  );
  return response.data;
};