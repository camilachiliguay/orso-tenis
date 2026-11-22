import { request, jsonRequest } from "./api";

// Leer
export const getPlayers = () =>
  request("/api/players", undefined, "Error al obtener los jugadores");
//* Obtener la cantidad total de jugadores registrados.
export const getPlayersCount = () =>
  request(
    "/api/players/count",
    undefined,
    "Error al obtener la cantidad de jugadores",
  );
// Escribir
export const createPlayer = (player) =>
  request(
    "/api/players",
    jsonRequest("POST", player),
    "Error al crear el jugador",
  );

// Modificar
export const updatePlayer = (id, player) =>
  request(
    `/api/players/${id}`,
    jsonRequest("PUT", player),
    "Error al actualizar el jugador",
  );

// Eliminar
export const deletePlayer = (id) =>
  request(
    `/api/players/${id}`,
    { method: "DELETE" },
    "Error al eliminar el jugador",
  );
// Mi perfil (el jugador asociado al usuario logueado) y mis reservas
export const getMyProfile = () =>
  request("/api/players/me", undefined, "Error al obtener tu perfil");

// Modifica nombre, apellido y teléfono del propio perfil
export const updateMyProfile = (data) =>
  request(
    "/api/players/me",
    jsonRequest("PUT", data),
    "Error al actualizar tu perfil",
  );
