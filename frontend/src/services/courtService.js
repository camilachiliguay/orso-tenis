import { request } from "./api";

// Obtener cantidad de canchas habilitadas.
export const getActiveCourtsCount = () =>
  request(
    "/api/courts/active-count",
    undefined,
    "Error al obtener la cantidad de canchas disponibles",
  );

// Obtener todas las canchas.
export const getCourts = () =>
  request("/api/courts", undefined, "Error al obtener las canchas");

// Cambiar estado de una cancha.
export const updateCourtStatus = (id, data) =>
  request(
    `/api/courts/${id}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    "Error al actualizar el estado de la cancha",
  );
