const express = require("express");
const router = express.Router();

const verificarToken = require("../middleware/authMiddleware");
const soloAdmin = require("../middleware/adminMiddleware");
const {
  listarUsuarios,
  transferirAdministrador,
  actualizarEstadoUsuario,
  eliminarUsuario,
} = require("../controllers/adminController");

router.use(verificarToken, soloAdmin);

router.get("/usuarios", listarUsuarios);
router.put("/usuarios/:userId/estado", actualizarEstadoUsuario);
router.put("/usuarios/transferir-admin", transferirAdministrador);
router.delete("/usuarios/:userId", eliminarUsuario);

module.exports = router;
