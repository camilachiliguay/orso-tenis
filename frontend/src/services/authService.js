import { request, jsonRequest, setToken, clearToken } from "./api";

// Inicia sesión y guarda el token. Devuelve { id, email, role }.
export const login = async (email, password) => {
  const data = await request(
    "/api/auth/login",
    jsonRequest("POST", { email, password }),
    "No se pudo iniciar sesión",
  );

  setToken(data.token);
  return data.user;
};
//* Registra un nuevo jugador.*
export const register = (userData) =>
  request(
    "/api/auth/register",
    jsonRequest("POST", userData),
    "No se pudo crear la cuenta",
  );
// Valida el token guardado y devuelve el usuario.
export const getSession = async () => {
  const data = await request("/api/auth/me", undefined, "Sesión inválida");
  return data.user;
};

export const logout = () => clearToken();

// Cambia la contraseña del usuario logueado.
export const changePassword = (currentPassword, newPassword) =>
  request(
    "/api/auth/change-password",
    jsonRequest("POST", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
    "No se pudo cambiar la contraseña",
  );
