const express = require("express");
const router = express.Router();

const {
  getActiveCourtsCount,
  getCourts,
  updateCourtStatus,
} = require("../controllers/courtController");

const { requireRole } = require("../middlewares/auth");

// Estadísticas.
router.get("/active-count", requireRole("admin"), getActiveCourtsCount);

// Listar canchas.
router.get("/", requireRole("admin"), getCourts);

// Cambiar estado.
router.patch("/:id/status", requireRole("admin"), updateCourtStatus);

module.exports = router;
