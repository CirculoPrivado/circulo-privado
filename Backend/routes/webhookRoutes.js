const express = require("express");
const router = express.Router();
const db = require("../config/db");
const mercadoPagoService = require("../services/integrations/mercadoPagoService");
const { verifyWebhookSignature } = require("../services/integrations/paypalService");
const { notificarPagoExitoso } = require("../services/notificacionesService");

function ejecutarQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

router.post("/mercadopago", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
    const topic = req.body?.type || req.query?.topic;

    if (!paymentId || (topic && topic !== "payment")) {
      return res.sendStatus(200);
    }

    const payment = await mercadoPagoService.obtenerPago(paymentId);
    const externalReference = payment.external_reference;

    if (payment.status === "approved" && externalReference) {
      await ejecutarQuery(
        `UPDATE pagos
         SET estado = 'pagado',
             proveedor_pago = 'mercadopago',
             mp_payment_id = ?,
             pagado_en = NOW()
         WHERE id = ?`,
        [String(payment.id), externalReference]
      );

      try {
        await notificarPagoExitoso(externalReference);
      } catch (emailError) {
        console.error("No se pudo enviar el correo de pago exitoso:", emailError.message);
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error webhook Mercado Pago:", error.response?.data || error.message);
    return res.status(500).json({ message: "Error procesando webhook de Mercado Pago" });
  }
});

router.post("/paypal", async (req, res) => {
  try {
    const verification = await verifyWebhookSignature({
      headers: req.headers,
      body: req.body,
    });

    if (verification.verification_status !== "SUCCESS") {
      return res.status(400).json({ message: "Webhook PayPal no verificado" });
    }

    const event = req.body;

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const captureId = event.resource?.id;
      const orderId = event.resource?.supplementary_data?.related_ids?.order_id;

      if (orderId) {
        await ejecutarQuery(
          `UPDATE pagos
           SET estado = 'pagado',
               proveedor_pago = 'paypal',
               paypal_order_id = ?,
               paypal_capture_id = ?,
               pagado_en = NOW()
           WHERE paypal_order_id = ?`,
          [orderId, captureId, orderId]
        );

        try {
          const pagosActualizados = await ejecutarQuery(
            `SELECT id FROM pagos WHERE paypal_order_id = ? LIMIT 1`,
            [orderId]
          );

          if (pagosActualizados[0]?.id) {
            await notificarPagoExitoso(pagosActualizados[0].id);
          }
        } catch (emailError) {
          console.error("No se pudo enviar el correo de pago exitoso:", emailError.message);
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error webhook PayPal:", error.response?.data || error.message);
    return res.status(500).json({ message: "Error procesando webhook de PayPal" });
  }
});

module.exports = router;
