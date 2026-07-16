const express = require("express");
const router = express.Router();
const { crearCompra } = require("../controllers/comprasController");
const verificarToken = require("../middleware/authMiddleware");

router.post("/", verificarToken, crearCompra);

module.exports = router;