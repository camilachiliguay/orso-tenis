export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Token de sesión.
const TOKEN_KEY = "orso_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

// Realizar peticiones a la API.
export async function request(path, options = {}, fallbackMessage) {
  const token = typeof window !== "undefined" ? getToken() : null;

  const finalOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, finalOptions);
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.mensaje || fallbackMessage || "Ocurrió un error en la petición.",
    );
  }

  return data;
}

// Construir peticiones JSON.
export const jsonRequest = (method, body) => ({
  method,
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});
