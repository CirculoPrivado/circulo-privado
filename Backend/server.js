require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const incidentesRoutes = require("./routes/incidentesRoutes");
const emergenciaRoutes = require("./routes/emergenciaRoutes");
const avisosRoutes = require("./routes/avisosRoutes");
const pagosRoutes = require("./routes/pagosRoutes");
const perfilRoutes = require("./routes/perfilRoutes");
const asistenteRoutes = require("./routes/asistenteRoutes");
const mercadoRoutes = require("./routes/mercadoRoutes");
const comprasRoutes = require("./routes/comprasRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const adminRoutes = require("./routes/adminRoutes");
const comunidadRoutes = require("./routes/comunidadRoutes");
const ensureSchema = require("./config/ensureSchema");

ensureSchema();

const app = express();

app.use(cors());
app.use("/api/webhooks", express.json(), webhookRoutes);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/incidentes", incidentesRoutes);
app.use("/api/emergencia", emergenciaRoutes);
app.use("/api/avisos", avisosRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/asistente", asistenteRoutes);
app.use("/api/mercado", mercadoRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/comunidad", comunidadRoutes);


app.get("/", (req, res) => {
  res.send("API Círculo Privado funcionando 🚀");
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
