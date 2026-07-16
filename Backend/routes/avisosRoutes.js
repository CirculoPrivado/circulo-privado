const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { obtenerAvisos, crearAviso, actualizarAviso, fijarAviso, eliminarAviso } = require("../controllers/avisosController");

router.get("/", verifyToken, obtenerAvisos);
router.post("/", verifyToken, crearAviso);
router.put("/:id", verifyToken, actualizarAviso);
router.patch("/:id/fijado", verifyToken, fijarAviso);
router.delete("/:id", verifyToken, eliminarAviso);

module.exports = router;
