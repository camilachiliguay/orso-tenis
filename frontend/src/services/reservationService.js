import { API_URL, request, jsonRequest } from "./api";

// Obtener todas las reservas
export const getReservations = () =>
  request("/api/reservations", undefined, "Error al obtener las reservas");

// Obtener horarios disponibles según fecha y cancha.
// Si se pasa excludeReservationId, esa reserva no cuenta como ocupada.
export const getAvailableSlots = (date, courtId, excludeReservationId) => {
  const params = new URLSearchParams({
    date,
    court_id: String(courtId),
  });

  if (excludeReservationId) {
    params.set("exclude_reservation_id", String(excludeReservationId));
  }

  return request(
    `/api/reservations/available-slots?${params}`,
    undefined,
    "Error al obtener los horarios disponibles",
  );
};

// Obtener fechas habilitadas
export const getAvailableDates = (from, courtId, days = 90) => {
  const params = new URLSearchParams({
    from,
    court_id: String(courtId),
    days: String(days),
  });

  return request(
    `/api/reservations/available-dates?${params}`,
    undefined,
    "Error al obtener las fechas disponibles",
  );
};
export const getReservationPrice = (playerId, usesLights) =>
  request(
    "/api/reservations/price",
    jsonRequest("POST", {
      player_id: Number(playerId),
      uses_lights: Number(usesLights),
    }),
    "Error al calcular el precio de la reserva",
  );
// Crear una reserva
export const createReservation = (reservationData) =>
  request(
    "/api/reservations",
    jsonRequest("POST", reservationData),
    "Error al crear la reserva",
  );

// Actualizar una reserva
export const updateReservation = (id, reservationData) =>
  request(
    `/api/reservations/${id}`,
    jsonRequest("PUT", reservationData),
    "Error al actualizar la reserva",
  );

// Cancelar una reserva
export const cancelReservation = (id) =>
  request(
    `/api/reservations/${id}/cancel`,
    { method: "PATCH" },
    "Error al cancelar la reserva",
  );
export const deleteReservation = (id) =>
  request(
    `/api/reservations/${id}`,
    { method: "DELETE" },
    "Error al eliminar la reserva",
  );
// URL del comprobante (página HTML generada por el backend con Handlebars)
export const getReceiptUrl = (id) =>
  `${API_URL}/api/reservations/${id}/receipt`;

//* Obtener la cantidad de reservas confirmadas de hoy (dashboard).*
export const getTodayReservationsCount = () =>
  request(
    "/api/reservations/today-count",
    undefined,
    "Error al obtener las reservas de hoy",
  );

//* Obtener la cantidad de próximas reservas (dashboard).
export const getUpcomingReservationsCount = () =>
  request(
    "/api/reservations/upcoming-count",
    undefined,
    "Error al obtener las próximas reservas",
  );

//* Obtener las últimas reservas para la actividad reciente del dashboard.
export const getRecentReservations = () =>
  request(
    "/api/reservations/recent",
    undefined,
    "Error al obtener la actividad reciente",
  );
