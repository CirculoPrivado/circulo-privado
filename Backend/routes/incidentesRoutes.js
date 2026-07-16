const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  crearIncidente,
  obtenerIncidentes,
  obtenerIncidentePorId,
  actualizarEstadoIncidente
} = require("../controllers/incidentesController");

router.get("/", verifyToken, obtenerIncidentes);
router.post("/", verifyToken, crearIncidente);
router.get("/:id", verifyToken, obtenerIncidentePorId);
router.patch("/:id/estado", verifyToken, actualizarEstadoIncidente);

module.exports = router;