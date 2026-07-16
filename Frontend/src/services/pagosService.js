import api from "./api";

export const obtenerPagos = async () => {
  const respuesta = await api.get("/pagos");
  return respuesta.data;
};

export const crearPago = async (datos) => {
  const respuesta = await api.post("/pagos", datos);
  return respuesta.data;
};

export const crearCheckoutPago = async ({ pagoId, proveedor }) => {
  const respuesta = await api.post("/pagos/create-checkout", { pagoId, proveedor });
  return respuesta.data;
};

export const capturarPagoPayPal = async ({ pagoId, orderID }) => {
  const respuesta = await api.post("/pagos/paypal/capture-order", { pagoId, orderID });
  return respuesta.data;
};

export const obtenerPagoPorId = async (id) => {
  const respuesta = await api.get(`/pagos/${id}`);
  return respuesta.data;
};

export const marcarPagoComoPagado = async (id) => {
  const respuesta = await api.patch(`/pagos/${id}/marcar-pagado`);
  return respuesta.data;
};
