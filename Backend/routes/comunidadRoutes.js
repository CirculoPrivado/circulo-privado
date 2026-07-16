const express = require("express");
const router = express.Router();

const verificarToken = require("../middleware/authMiddleware");
const { obtenerResumenComunidad } = require("../controllers/comunidadController");

router.get("/resumen", verificarToken, obtenerResumenComunidad);

module.exports = router;
