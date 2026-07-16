import api from "./api";

export const obtenerUsuariosAdmin = async () => {
  const respuesta = await api.get("/admin/usuarios");
  return respuesta.data;
};

export const transferirAdministrador = async (userId) => {
  const respuesta = await api.put("/admin/usuarios/transferir-admin", { userId });
  return respuesta.data;
};

export const actualizarEstadoUsuarioAdmin = async (userId, activo) => {
  const respuesta = await api.put(`/admin/usuarios/${userId}/estado`, { activo });
  return respuesta.data;
};

export const eliminarUsuarioAdmin = async (userId) => {
  const respuesta = await api.delete(`/admin/usuarios/${userId}`);
  return respuesta.data;
};
