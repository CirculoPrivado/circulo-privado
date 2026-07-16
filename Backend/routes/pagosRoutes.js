const express = require("express");
const router = express.Router();
const verificarToken = require("../middleware/authMiddleware");
const {
  obtenerPagos,
  obtenerPago,
  crearPago,
  crearCheckout,
  capturarOrdenPayPal,
  iniciarPago,
  marcarPagoManual,
} = require("../controllers/pagosController");

router.get("/", obtenerPagos);
router.get("/:id", obtenerPago);
router.post("/", crearPago);
router.post("/create-checkout", crearCheckout);
router.post("/paypal/capture-order", capturarOrdenPayPal);

// Compatibilidad con el endpoint anterior de Mercado Pago
router.post("/iniciar", iniciarPago);
router.patch("/:id/marcar-pagado", verificarToken, marcarPagoManual);

module.exports = router;
