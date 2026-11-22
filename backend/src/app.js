require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const hbs = require("./config/handlebars");
const authRoutes = require("./routes/authRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const playerRoutes = require("./routes/playerRoutes");
const contactRoutes = require("./routes/contactRoutes");
const courtRoutes = require("./routes/courtRoutes");

const app = express();

// Motor de plantillas: Handlebars (vistas en src/views).
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Orígenes permitidos (separados por coma en CORS_ORIGIN).
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middlewares
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

// Ruta principal
app.get("/", (req, res) => {
  res.send("Bienvenido a la API de Orso Tenis");
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/courts", courtRoutes);
// Ruta inexistente
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// Manejo central de errores (Express exige los 4 parámetros)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ mensaje: "El cuerpo de la petición no es un JSON válido" });
  }

  console.error("Error no controlado:", err);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
