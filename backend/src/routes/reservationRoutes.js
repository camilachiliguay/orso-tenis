const express = require("express");
const router = express.Router();
const {
  getReservations,
  getTodayReservationsCount,
  getUpcomingReservationsCount,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  deleteReservation,
  getAvailableSlots,
  getAvailableDates,
  getReservationReceipt,
  getReservationPrice,
  getRecentReservations,
} = require("../controllers/reservationController");
const { requireAuth, setBodyUser } = require("../middlewares/auth");

// Consultar fechas y horarios disponibles.
router.get("/available-dates", getAvailableDates);
router.get("/available-slots", getAvailableSlots);
// Consultar el precio de una reserva.
router.post("/price", requireAuth, getReservationPrice);
// Consultar reservas: requiere autenticación.
router.delete("/:id", requireAuth, deleteReservation);
router.get("/", requireAuth, getReservations);
//* Consultar cantidad de reservas confirmadas de hoy (solo administrador).
router.get("/today-count", requireAuth, getTodayReservationsCount);
// Comprobante HTML.
//* Cantidad de próximas reservas (solo administrador).
router.get("/upcoming-count", requireAuth, getUpcomingReservationsCount);

router.get("/:id/receipt", requireAuth, getReservationReceipt);
//* Actividad reciente del dashboard (solo administrador).
router.get("/recent", requireAuth, getRecentReservations);
// Consultar una reserva por ID.
router.get("/:id", requireAuth, getReservationById);

// Crear una reserva.
router.post("/", requireAuth, setBodyUser("created_by"), createReservation);

// Modificar una reserva.
router.put("/:id", requireAuth, setBodyUser("created_by"), updateReservation);

// Cancelar una reserva.
router.patch(
  "/:id/cancel",
  requireAuth,
  setBodyUser("cancelled_by"),
  cancelReservation,
);

module.exports = router;
