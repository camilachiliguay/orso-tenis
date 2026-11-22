// Utilidades compartidas por los controladores.

// Error controlado: se responde con el status y el mensaje indicados.
class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

// Envuelve un controlador para responder errores de forma uniforme.
const handle = (fallbackMessage, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ mensaje: error.message });
    }

    console.error(`${fallbackMessage}:`, error);
    res.status(500).json({ mensaje: fallbackMessage });
  }
};

const isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;

// Valida el id de la URL.
function parseIdParam(id) {
  if (!/^\d+$/.test(id)) {
    throw new HttpError(400, "El ID debe ser numérico");
  }

  return Number(id);
}

module.exports = { HttpError, handle, isPositiveInteger, parseIdParam };
