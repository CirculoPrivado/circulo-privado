import api from "./api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const crearAlertaEmergencia = async (datos) => {
  const respuesta = await api.post("/emergencia", datos);
  return respuesta.data;
};

export const obtenerAlertasEmergencia = async () => {
  const respuesta = await api.get("/emergencia");
  return respuesta.data;
};

export const actualizarEstadoAlertaEmergencia = async (id, estado, comentario = "") => {
  const respuesta = await api.patch(`/emergencia/${id}/estado`, { estado, comentario });
  return respuesta.data;
};

export const crearCanalEmergencias = (onNuevaAlerta, onError) => {
  const eventSource = new EventSource(`${API_BASE}/emergencia/stream`);

  eventSource.addEventListener("nueva-alerta", (event) => {
    const data = JSON.parse(event.data);
    onNuevaAlerta(data);
  });

  eventSource.addEventListener("heartbeat", () => {});

  eventSource.onerror = (error) => {
    if (onError) onError(error);
  };

  return eventSource;
};
