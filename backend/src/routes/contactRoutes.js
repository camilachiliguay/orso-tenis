const express = require("express");
const router = express.Router();

const { sendContactMessage } = require("../controllers/contactController");
const { createRateLimiter } = require("../middlewares/rateLimit");

// Máximo 5 mensajes por IP cada 10 minutos.
const limiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  mensaje: "Enviaste demasiados mensajes. Probá de nuevo en unos minutos.",
});

router.post("/", limiter, sendContactMessage);

module.exports = router;
