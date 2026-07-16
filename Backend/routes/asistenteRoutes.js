const express = require("express");
const router = express.Router();
const { chatAsistente } = require("../controllers/asistenteController");

router.post("/chat", chatAsistente);

module.exports = router;