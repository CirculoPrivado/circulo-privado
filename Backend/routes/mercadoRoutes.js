const express = require("express");
const router = express.Router();
const {
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  crearPublicacion,
} = require("../controllers/mercadoController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMercado");

router.get("/", obtenerPublicaciones);
router.get("/:id", obtenerPublicacionPorId);

// 🔥 Manejo de errores de multer
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.single("imagen")(req, res, (err) => {
      if (err) {
        console.error("❌ Error de multer:", err);
        return res.status(400).json({
          message: err.message || "Error al subir la imagen",
        });
      }
      next();
    });
  },
  crearPublicacion
);

module.exports = router;