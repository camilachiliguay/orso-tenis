const db = require("../config/database");
const { HttpError, handle, parseIdParam } = require("../utils/http");

// Letras (con acentos), espacios, apóstrofes, puntos y guiones.
const NAME_REGEX = /^\p{L}[\p{L}\s'.-]*$/u;

// Categorías permitidas (para cambiarlas, editá esta lista y la del frontend).
const CATEGORIES = ["Principiante", "Intermedio", "Avanzado"];

// Tamaño máximo de la foto (texto base64). ~400.000 caracteres = unos 300 KB.
const MAX_PHOTO_LENGTH = 400000;
// Teléfono: números, espacios, +, - y paréntesis.
const PHONE_REGEX = /^[0-9+()\s-]{6,20}$/;
// Roles que pueden administrar jugadores.
const canManagePlayers = (user) => ["admin", "staff"].includes(user?.role);

// Valida y normaliza el cuerpo de crear / modificar un jugador.
function parsePlayerBody(body) {
  const { first_name, last_name, category, photo, is_student } = body || {};

  if (typeof first_name !== "string" || typeof last_name !== "string") {
    throw new HttpError(400, "El nombre y el apellido son obligatorios");
  }

  const firstName = first_name.trim().replace(/\s+/g, " ");
  const lastName = last_name.trim().replace(/\s+/g, " ");

  if (!firstName || !lastName) {
    throw new HttpError(400, "El nombre y el apellido son obligatorios");
  }

  if (firstName.length > 50 || lastName.length > 50) {
    throw new HttpError(
      400,
      "El nombre y el apellido admiten hasta 50 caracteres",
    );
  }

  if (!NAME_REGEX.test(firstName) || !NAME_REGEX.test(lastName)) {
    throw new HttpError(
      400,
      "El nombre y el apellido solo pueden tener letras, espacios, apóstrofes, puntos y guiones",
    );
  }

  // Categoría (opcional)
  let cleanCategory;

  if (category) {
    if (!CATEGORIES.includes(category)) {
      throw new HttpError(
        400,
        `La categoría debe ser: ${CATEGORIES.join(", ")}`,
      );
    }
    cleanCategory = category;
  }

  // Foto (opcional): imagen en base64 ya achicada por el frontend.
  let cleanPhoto = null;

  if (photo) {
    if (
      typeof photo !== "string" ||
      !/^data:image\/(jpeg|png|webp);base64,/.test(photo)
    ) {
      throw new HttpError(400, "La foto no es una imagen válida");
    }

    if (photo.length > MAX_PHOTO_LENGTH) {
      throw new HttpError(400, "La foto es demasiado pesada");
    }

    cleanPhoto = photo;
  }
  //* Condición de alumno (opcional).
  let cleanIsStudent;

  if (is_student !== undefined) {
    if (![0, 1, null].includes(is_student)) {
      throw new HttpError(400, "La condición de alumno debe ser 1, 0 o null");
    }

    cleanIsStudent = is_student;
  }
  return {
    first_name: firstName,
    last_name: lastName,
    category: cleanCategory,
    photo: cleanPhoto,
    is_student: cleanIsStudent,
  };
}
// Valida los datos que el propio jugador puede editar de su perfil.
// Reutiliza la validación de nombre y apellido de parsePlayerBody.
function parseProfileBody(body) {
  const { first_name, last_name, category, photo, is_student } = body || {};

  let phone = null;
  const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (rawPhone) {
    if (!PHONE_REGEX.test(rawPhone)) {
      throw new HttpError(
        400,
        "El teléfono solo puede tener números, espacios, +, - y paréntesis (6 a 20 caracteres)",
      );
    }
    phone = rawPhone;
  }

  return { first_name, last_name, phone };
}
// ==========================================
// LEER: listado de jugadores
// - admin / staff: todos los jugadores
// - player: solamente el suyo
// ==========================================

const getPlayers = handle(
  "Error al obtener los jugadores",
  async (req, res) => {
    const onlyOwn = !canManagePlayers(req.user);

    const [players] = await db.query(
      `
    SELECT
      p.id,
      p.first_name,
      p.last_name,
      p.category,
      p.is_student,
      p.photo,
      COUNT(r.id) AS reservations_count
    FROM players p
    LEFT JOIN reservations r ON r.player_id = p.id
    ${onlyOwn ? "WHERE p.user_id = ?" : ""}
    GROUP BY p.id
    ORDER BY p.last_name, p.first_name
  `,
      onlyOwn ? [req.user.id] : [],
    );

    res.json(players);
  },
);
//* Obtener la cantidad total de jugadores registrados (solo administrador).
const getPlayersCount = handle(
  "Error al obtener la cantidad de jugadores",
  async (req, res) => {
    if (req.user.role !== "admin") {
      throw new HttpError(
        403,
        "No tenés permiso para consultar las estadísticas",
      );
    }

    const [[result]] = await db.query("SELECT COUNT(*) AS total FROM players");

    res.json({
      total: Number(result.total),
    });
  },
);
// ==========================================
// LEER: mi perfil (el jugador asociado al usuario logueado) y mis reservas
// ==========================================

const getMyProfile = handle("Error al obtener tu perfil", async (req, res) => {
  const [players] = await db.query(
    `
    SELECT
      p.id,
      p.user_id,
      p.first_name,
      p.last_name,
      u.email,
      p.phone,
      p.category,
      p.is_student,
      p.photo,
      p.created_at
    FROM players p
    INNER JOIN users u ON u.id = p.user_id
    WHERE p.user_id = ?
    `,
    [req.user.id],
  );

  if (players.length === 0) {
    throw new HttpError(
      404,
      "Tu usuario todavía no tiene un jugador asociado.",
    );
  }

  const player = players[0];

  const [reservations] = await db.query(
    `
    SELECT
      r.id,
      r.reservation_date,
      r.start_time,
      r.end_time,
      r.status,
      c.name AS court_name
    FROM reservations r
    INNER JOIN courts c ON c.id = r.court_id
    WHERE r.player_id = ?
    ORDER BY r.reservation_date DESC, r.start_time DESC
    `,
    [player.id],
  );

  res.json({ player, reservations });
});

// ==========================================
// MODIFICAR: mi propio perfil (nombre, apellido y teléfono)
// ==========================================

const updateMyProfile = handle(
  "Error al actualizar tu perfil",
  async (req, res) => {
    const profile = parseProfileBody(req.body);

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [existing] = await connection.query(
        "SELECT id FROM players WHERE user_id = ?",
        [req.user.id],
      );

      if (existing.length === 0) {
        throw new HttpError(
          404,
          "Tu usuario todavía no tiene un jugador asociado.",
        );
      }

      await connection.query(
        `
        UPDATE players
        SET first_name = ?, last_name = ?, phone = ?
        WHERE user_id = ?
        `,
        [profile.first_name, profile.last_name, profile.phone, req.user.id],
      );

      await connection.query(
        `
        UPDATE users
        SET first_name = ?, last_name = ?, phone = ?
        WHERE id = ?
        `,
        [profile.first_name, profile.last_name, profile.phone, req.user.id],
      );

      await connection.commit();

      res.json({
        mensaje: "Perfil actualizado correctamente",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
);

// ==========================================
// LEER: un jugador (admin / staff)
// ==========================================

const getPlayerById = handle(
  "Error al obtener el jugador",
  async (req, res) => {
    const id = parseIdParam(req.params.id);

    const [players] = await db.query(
      "SELECT id, first_name, last_name, category, photo FROM players WHERE id = ?",
      [id],
    );

    if (players.length === 0) {
      throw new HttpError(404, "Jugador no encontrado");
    }

    res.json(players[0]);
  },
);

// ==========================================
// ESCRIBIR: crear un jugador
// ==========================================

const createPlayer = handle("Error al crear el jugador", async (req, res) => {
  const player = parsePlayerBody(req.body);

  const [result] = await db.query(
    "INSERT INTO players (first_name, last_name, category, photo) VALUES (?, ?, ?, ?)",
    [player.first_name, player.last_name, player.category, player.photo],
  );

  res.status(201).json({
    mensaje: "Jugador creado correctamente",
    player_id: result.insertId,
  });
});

// ==========================================
// MODIFICAR: actualizar un jugador
// ==========================================
const updatePlayer = handle(
  "Error al actualizar el jugador",
  async (req, res) => {
    const id = parseIdParam(req.params.id);
    const player = parsePlayerBody(req.body);

    const [existing] = await db.query("SELECT id FROM players WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      throw new HttpError(404, "Jugador no encontrado");
    }

    await db.query(
      `
    UPDATE players
    SET first_name = ?,
        last_name = ?,
        category = ?,
        photo = ?,
        is_student = ?
    WHERE id = ?
    `,
      [
        player.first_name,
        player.last_name,
        player.category,
        player.photo,
        player.is_student,
        id,
      ],
    );

    res.json({
      mensaje: "Jugador actualizado correctamente",
      player_id: id,
    });
  },
);

// ==========================================
// ELIMINAR: borrar un jugador (DELETE real)
// ==========================================

const deletePlayer = handle(
  "Error al eliminar el jugador",
  async (req, res) => {
    const id = parseIdParam(req.params.id);

    const [existing] = await db.query("SELECT id FROM players WHERE id = ?", [
      id,
    ]);

    if (existing.length === 0) {
      throw new HttpError(404, "Jugador no encontrado");
    }

    // Un jugador con reservas (incluso canceladas) no puede borrarse
    // sin dejar reservas huérfanas.
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM reservations WHERE player_id = ?",
      [id],
    );

    if (total > 0) {
      throw new HttpError(
        409,
        `No se puede eliminar: el jugador tiene ${total} reserva(s) registradas, incluidas las canceladas.`,
      );
    }

    try {
      await db.query("DELETE FROM players WHERE id = ?", [id]);
    } catch (error) {
      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new HttpError(
          409,
          "No se puede eliminar: el jugador tiene datos relacionados.",
        );
      }

      throw error;
    }

    res.json({
      mensaje: "Jugador eliminado correctamente",
      player_id: id,
    });
  },
);
module.exports = {
  getPlayers,
  getPlayersCount,
  getMyProfile,
  updateMyProfile,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
