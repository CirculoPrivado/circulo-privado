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

// Se deja desactivado porque usa sintaxis incompatible con MySQL de Railway.
// const ensureSchema = require("./config/ensureSchema");
// ensureSchema();

const app = express();

/* =========================================================
   CONFIGURACIÓN DE CORS
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "https://circulo-privado.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

const vercelPreviewPattern =
  /^https:\/\/circulo-privado(?:-[a-z0-9-]+)*\.vercel\.app$/i;

const corsOptions = {
  origin(origin, callback) {
    // Permite Postman, health checks y solicitudes sin navegador.
    if (!origin) {
      return callback(null, true);
    }

    const originPermitido =
      allowedOrigins.includes(origin) ||
      vercelPreviewPattern.test(origin);

    if (originPermitido) {
      return callback(null, true);
    }

    console.error("Origen bloqueado por CORS:", origin);

    return callback(
      new Error(`Origen no autorizado por CORS: ${origin}`)
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* =========================================================
   MIDDLEWARES
========================================================= */

// Webhooks
app.use(
  "/api/webhooks",
  express.json(),
  webhookRoutes
);

// Lectura de JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos públicos
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* =========================================================
   RUTAS DE LA API
========================================================= */

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

/* =========================================================
   RUTAS DE COMPROBACIÓN
========================================================= */

app.get("/", (req, res) => {
  res.send("API Círculo Privado funcionando 🚀");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    mensaje: "Backend de Círculo Privado funcionando",
  });
});

/* =========================================================
   SERVIDOR
========================================================= */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log("Orígenes permitidos por CORS:", allowedOrigins);
});