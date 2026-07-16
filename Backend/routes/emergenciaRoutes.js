const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { crearAlerta, obtenerAlertas, streamAlertas, actualizarEstadoAlerta } = require("../controllers/emergenciaController");

router.post("/", verifyToken, crearAlerta);
router.get("/", verifyToken, obtenerAlertas);
router.get("/stream", streamAlertas);
router.patch("/:id/estado", verifyToken, actualizarEstadoAlerta);

module.exports = router;
