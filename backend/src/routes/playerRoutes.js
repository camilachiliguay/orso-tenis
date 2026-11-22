const express = require("express");
const router = express.Router();
const {
  getPlayers,
  getPlayersCount,
  getMyProfile,
  updateMyProfile,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
} = require("../controllers/playerController");
const { requireAuth, requireRole } = require("../middlewares/auth");

// Listado: admin/staff ven todos; un jugador ve solo el suyo.
router.get("/", requireAuth, getPlayers);
//* Cantidad total de jugadores registrados (solo administrador).
router.get("/count", requireRole("admin"), getPlayersCount);
// Mi perfil. Van ANTES de "/:id" para que no se confundan con un id.
router.get("/me", requireAuth, getMyProfile);
router.put("/me", requireAuth, updateMyProfile);

// Ver uno, crear, modificar y eliminar: administradores y personal (staff).
router.get("/:id", requireRole("admin", "staff"), getPlayerById);
router.post("/", requireRole("admin", "staff"), createPlayer);
router.put("/:id", requireRole("admin", "staff"), updatePlayer);
router.delete("/:id", requireRole("admin", "staff"), deletePlayer);

module.exports = router;
