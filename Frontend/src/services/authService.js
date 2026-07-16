import api from "./api";

export const registrarUsuario = async (datos) => {
  const response = await api.post("/auth/register", datos);
  return response.data;
};

export const iniciarSesion = async (datos) => {
  const respuesta = await api.post("/auth/login", datos);
  return respuesta.data;
};

export const solicitarRecuperacion = async (email) => {
  const respuesta = await api.post("/auth/forgot-password", { email });
  return respuesta.data;
};

export const validarTokenRecuperacion = async (token) => {
  const respuesta = await api.get(`/auth/reset-password/${token}`);
  return respuesta.data;
};

export const restablecerContrasena = async (token, password) => {
  const respuesta = await api.post(`/auth/reset-password/${token}`, { password });
  return respuesta.data;
};
