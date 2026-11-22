const db = require("../config/database");

const { HttpError, handle } = require("../utils/http");

// Obtener cantidad de canchas habilitadas.
const getActiveCourtsCount = handle(
  "Error al obtener la cantidad de canchas disponibles",
  async (req, res) => {
    const [[result]] = await db.query(
      "SELECT COUNT(*) AS total FROM courts WHERE is_active = 1",
    );

    res.json({
      total: Number(result.total),
    });
  },
);

// Listar todas las canchas.
const getCourts = handle("Error al obtener las canchas", async (req, res) => {
  const [courts] = await db.query(`
      SELECT
        id,
        name,
        is_active,
        disabled_reason,
        disabled_at,
        disabled_by
      FROM courts
      ORDER BY id ASC
    `);

  res.json(courts);
});

// Habilitar o deshabilitar una cancha.
const updateCourtStatus = handle(
  "Error al actualizar el estado de la cancha",
  async (req, res) => {
    const id = Number(req.params.id);
    const { is_active, disabled_reason } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "Identificador de cancha inválido");
    }

    if (typeof is_active !== "boolean") {
      throw new HttpError(400, "El estado de la cancha es inválido");
    }

    if (
      !is_active &&
      (typeof disabled_reason !== "string" || !disabled_reason.trim())
    ) {
      throw new HttpError(
        400,
        "Tenés que indicar el motivo de deshabilitación",
      );
    }

    const [result] = await db.query(
      `
        UPDATE courts
        SET
          is_active = ?,
          disabled_reason = ?,
          disabled_at = ?,
          disabled_by = ?
        WHERE id = ?
      `,
      [
        is_active ? 1 : 0,
        is_active ? null : disabled_reason.trim(),
        is_active ? null : new Date(),
        is_active ? null : req.user.id,
        id,
      ],
    );

    if (result.affectedRows === 0) {
      throw new HttpError(404, "La cancha no existe");
    }

    res.json({
      mensaje: is_active
        ? "Cancha habilitada correctamente"
        : "Cancha deshabilitada correctamente",
    });
  },
);

module.exports = {
  getActiveCourtsCount,
  getCourts,
  updateCourtStatus,
};
