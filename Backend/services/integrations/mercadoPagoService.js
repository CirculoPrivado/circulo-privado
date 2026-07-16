const axios = require("axios");

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_BASE_URL = process.env.MP_BASE_URL || "https://api.mercadopago.com";

async function crearPreferencia({ pagoId, concepto, monto }) {
  const body = {
    items: [
      {
        title: concepto,
        quantity: 1,
        unit_price: Number(monto),
        currency_id: "MXN",
      },
    ],
    external_reference: String(pagoId),
    notification_url: process.env.MP_WEBHOOK_URL,
    back_urls: {
      success: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mercado-vecinal?pagoId=${pagoId}`,
      failure: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mercado-vecinal?pagoId=${pagoId}`,
      pending: `${process.env.FRONTEND_URL || "http://localhost:5173"}/mercado-vecinal?pagoId=${pagoId}`,
    },
    auto_return: "approved",
  };

  const response = await axios.post(`${MP_BASE_URL}/checkout/preferences`, body, {
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

async function obtenerPago(paymentId) {
  const response = await axios.get(`${MP_BASE_URL}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
  });

  return response.data;
}

module.exports = {
  crearPreferencia,
  obtenerPago,
};
