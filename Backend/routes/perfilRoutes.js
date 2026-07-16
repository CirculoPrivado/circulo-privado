const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const uploadPerfil = require("../middleware/uploadPerfil");

const {
  obtenerPerfil,
  actualizarPerfil,
  actualizarUbicacionActual,
  obtenerPreferenciasAccesibilidad,
  actualizarPreferenciasAccesibilidad,
} = require("../controllers/perfilController");

router.get("/", authMiddleware, obtenerPerfil);
router.put("/", authMiddleware, uploadPerfil.single("foto"), actualizarPerfil);
router.put("/ubicacion", authMiddleware, actualizarUbicacionActual);
router.get("/accesibilidad", authMiddleware, obtenerPreferenciasAccesibilidad);
router.put("/accesibilidad", authMiddleware, actualizarPreferenciasAccesibilidad);

module.exports = router;