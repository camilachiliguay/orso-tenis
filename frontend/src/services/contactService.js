import { request, jsonRequest } from "./api";

// Envía el formulario de contacto (el backend manda el correo).
export const sendContactMessage = (data) =>
  request(
    "/api/contact",
    jsonRequest("POST", data),
    "No se pudo enviar el mensaje",
  );
