const express = require("express");
const router = express.Router();

const {
  login,
  register,
  me,
  changePassword,
} = require("../controllers/authController");
const { requireAuth } = require("../middlewares/auth");
const { createRateLimiter } = require("../middlewares/rateLimit");

// Máximo 10 intentos de login por IP cada 10 minutos.
const limiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  mensaje: "Demasiados intentos. Probá de nuevo en unos minutos.",
});

router.post("/login", limiter, login);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, limiter, changePassword);
router.post("/register", limiter, register);
module.exports = router;
