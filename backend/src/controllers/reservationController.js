const db = require("../config/database");

const TIMEZONE = "America/Argentina/Cordoba";

// ==========================================
// UTILIDADES
// ==========================================

const {
  HttpError,
  handle,
  isPositiveInteger,
  parseIdParam,
} = require("../utils/http");

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function isValidTime(value) {
  return (
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value)
  );
}

// "18:00" -> "18:00:00"
function normalizeTime(value) {
  return value.length === 5 ? `${value}:00` : value;
}

// Fecha y hora actuales en Argentina (Córdoba).
function getNowInArgentina() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}:${get("second")}`,
  };
}

// Día de la semana ISO: 1 = lunes ... 7 = domingo.
function getIsoDayOfWeek(dateString) {
  const day = new Date(`${dateString}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

// Valida y normaliza el cuerpo de crear / modificar una reserva.
function parseReservationBody(body, { requireCreatedBy }) {
  const {
    player_id,
    court_id,
    created_by,
    reservation_date,
    start_time,
    end_time,
    uses_lights,
  } = body || {};

  if (
    !player_id ||
    !court_id ||
    (requireCreatedBy && !created_by) ||
    !reservation_date ||
    !start_time ||
    !end_time
  ) {
    throw new HttpError(400, "Todos los campos son obligatorios");
  }

  const ids = requireCreatedBy
    ? [player_id, court_id, created_by]
    : [player_id, court_id];

  if (!ids.every(isPositiveInteger)) {
    throw new HttpError(400, "Los identificadores no son válidos");
  }

  if (!isValidDate(reservation_date)) {
    throw new HttpError(400, "La fecha no es válida");
  }

  if (!isValidTime(start_time) || !isValidTime(end_time)) {
    throw new HttpError(400, "Las horas no son válidas");
  }

  const start = normalizeTime(start_time);
  const end = normalizeTime(end_time);

  if (start >= end) {
    throw new HttpError(
      400,
      "La hora de finalización debe ser posterior al inicio",
    );
  }
  if (uses_lights !== 0 && uses_lights !== 1) {
    throw new HttpError(400, "Debés indicar si la reserva utiliza luces");
  }
  return {
    player_id,
    court_id,
    created_by,
    reservation_date,
    start_time: start,
    end_time: end,
    uses_lights,
  };
}

// Ejecuta `callback` dentro de una transacción con la cancha bloqueada.
// Bloquear la fila de la cancha serializa las reservas de esa cancha y
// evita que dos personas reserven el mismo horario a la vez.
async function withCourtLocks(reservationId, newCourtId, callback) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `
        SELECT id, court_id, reservation_date, start_time, end_time
        FROM reservations
        WHERE id = ? AND status = 'confirmed'
        FOR UPDATE
      `,
      [reservationId],
    );

    if (existing.length === 0) {
      throw new HttpError(404, "Reserva no encontrada o cancelada");
    }

    const current = existing[0];

    const courtIds = [
      ...new Set([Number(current.court_id), Number(newCourtId)]),
    ].sort((a, b) => a - b);

    for (const courtId of courtIds) {
      const [courts] = await connection.query(
        "SELECT id FROM courts WHERE id = ? FOR UPDATE",
        [courtId],
      );

      if (courts.length === 0) {
        throw new HttpError(404, "La cancha no existe");
      }
    }

    const [activeCourt] = await connection.query(
      "SELECT id FROM courts WHERE id = ? AND is_active = TRUE",
      [newCourtId],
    );

    if (activeCourt.length === 0) {
      throw new HttpError(404, "La cancha nueva no existe o está inactiva");
    }

    const result = await callback(connection, current);

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}
// Verifica que la fecha/hora no sea pasada y que el horario exista
// entre los horarios habituales activos de ese día.
async function assertBookable(connection, reservation) {
  const now = getNowInArgentina();
  const { reservation_date, start_time, end_time } = reservation;

  if (
    reservation_date < now.date ||
    (reservation_date === now.date && start_time <= now.time)
  ) {
    throw new HttpError(
      400,
      "No se puede reservar en una fecha u horario pasado",
    );
  }

  const [slots] = await connection.query(
    `
    SELECT id
    FROM court_schedules
    WHERE day_of_week = ?
      AND is_active = TRUE
      AND slot_start = ?
      AND slot_end = ?
    LIMIT 1
    `,
    [getIsoDayOfWeek(reservation_date), start_time, end_time],
  );

  if (slots.length === 0) {
    throw new HttpError(
      400,
      "El horario elegido no está habilitado para ese día",
    );
  }
}

// Verifica que no haya otra reserva superpuesta (ignorando `excludeId`).
async function assertNoConflict(connection, reservation, excludeId = null) {
  const params = [
    reservation.court_id,
    reservation.reservation_date,
    reservation.end_time,
    reservation.start_time,
  ];

  let excludeClause = "";

  if (excludeId) {
    excludeClause = "AND id != ?";
    params.push(excludeId);
  }

  const [conflicts] = await connection.query(
    `
    SELECT id
    FROM reservations
    WHERE court_id = ?
      AND reservation_date = ?
    AND status = 'confirmed'
      AND start_time < ?
      AND end_time > ?
      ${excludeClause}
    LIMIT 1
    `,
    params,
  );

  if (conflicts.length > 0) {
    throw new HttpError(409, "La cancha ya está reservada en ese horario");
  }
}

async function assertPlayerExists(connection, playerId) {
  const [players] = await connection.query(
    "SELECT id FROM players WHERE id = ?",
    [playerId],
  );

  if (players.length === 0) {
    throw new HttpError(404, "El jugador no existe");
  }
}

async function calculateReservationPrice(connection, playerId, usesLights) {
  const [players] = await connection.query(
    "SELECT is_student FROM players WHERE id = ?",
    [playerId],
  );

  if (players.length === 0) {
    throw new HttpError(404, "El jugador no existe");
  }

  const isStudent = players[0].is_student;

  if (isStudent === null) {
    throw new HttpError(
      400,
      "Tu condición de alumno está pendiente de verificar. Consultá con la administración.",
    );
  }

  const [prices] = await connection.query(
    "SELECT * FROM reservation_prices ORDER BY id DESC LIMIT 1",
  );

  if (prices.length === 0) {
    throw new HttpError(500, "No hay tarifas configuradas");
  }

  const tariff = prices[0];

  if (isStudent === 1) {
    return Number(
      usesLights ? tariff.student_with_lights : tariff.student_without_lights,
    );
  }

  return Number(
    usesLights
      ? tariff.non_student_with_lights
      : tariff.non_student_without_lights,
  );
}

const getReservationPrice = handle(
  "Error al calcular el precio de la reserva",
  async (req, res) => {
    const { player_id, uses_lights } = req.body || {};

    const selectedPlayerId = Number(player_id);

    if (!Number.isSafeInteger(selectedPlayerId) || selectedPlayerId <= 0) {
      throw new HttpError(400, "Debés seleccionar un jugador válido");
    }

    if (uses_lights !== 0 && uses_lights !== 1) {
      throw new HttpError(400, "Debés indicar si la reserva utiliza luces");
    }

    let playerId = selectedPlayerId;

    // El jugador solamente puede consultar su propio precio.
    if (req.user.role === "player") {
      const [players] = await db.query(
        "SELECT id FROM players WHERE user_id = ?",
        [req.user.id],
      );

      if (players.length === 0) {
        throw new HttpError(404, "No tenés un perfil de jugador asociado");
      }

      playerId = players[0].id;
    } else if (!["admin", "staff"].includes(req.user.role)) {
      throw new HttpError(403, "No tenés permiso para consultar precios");
    }

    const price = await calculateReservationPrice(db, playerId, uses_lights);

    res.json({
      player_id: playerId,
      uses_lights,
      price_applied: price,
    });
  },
);

async function assertActiveUserExists(connection, userId, mensaje) {
  const [users] = await connection.query(
    "SELECT id FROM users WHERE id = ? AND is_active = TRUE",
    [userId],
  );

  if (users.length === 0) {
    throw new HttpError(404, mensaje);
  }
}

// ==========================================
// 1. OBTENER TODAS LAS RESERVAS
// ==========================================

const getTodayReservationsCount = handle(
  "Error al obtener las reservas de hoy",
  async (req, res) => {
    if (req.user.role !== "admin") {
      throw new HttpError(
        403,
        "No tenés permiso para consultar las estadísticas",
      );
    }

    const { date } = getNowInArgentina();

    const [result] = await db.query(
      `SELECT COUNT(*) AS total
       FROM reservations
       WHERE reservation_date = ?
         AND status = 'confirmed'`,
      [date],
    );

    res.json({
      date,
      total: Number(result[0].total),
    });
  },
);

//* Obtener la cantidad de próximas reservas (solo administrador).
const getUpcomingReservationsCount = handle(
  "Error al obtener las próximas reservas",
  async (req, res) => {
    if (req.user.role !== "admin") {
      throw new HttpError(
        403,
        "No tenés permiso para consultar las estadísticas",
      );
    }

    const { date } = getNowInArgentina();

    const [result] = await db.query(
      `SELECT COUNT(*) AS total
       FROM reservations
       WHERE reservation_date > ?
         AND status = 'confirmed'`,
      [date],
    );

    res.json({
      total: Number(result[0].total),
    });
  },
);

const getReservations = handle(
  "Error al obtener las reservas",
  async (req, res) => {
    let query = `
      SELECT
        r.id,
        r.player_id,
        r.court_id,
        p.first_name,
        p.last_name,
        c.name AS court,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status
      FROM reservations r
      INNER JOIN players p ON r.player_id = p.id
      INNER JOIN courts c ON r.court_id = c.id
    `;

    const params = [];

    // Si es jugador, solamente consulta sus propias reservas.
    if (req.user.role === "player") {
      query += " WHERE p.user_id = ?";
      params.push(req.user.id);
    } else if (!["admin", "staff"].includes(req.user.role)) {
      throw new HttpError(403, "No tenés permiso para consultar las reservas");
    }

    query += " ORDER BY r.reservation_date, r.start_time";

    const [reservations] = await db.query(query, params);

    res.json(reservations);
  },
);

// ==========================================
// 2. OBTENER UNA RESERVA POR ID
// ==========================================

const getReservationById = handle(
  "Error al obtener la reserva",
  async (req, res) => {
    const id = parseIdParam(req.params.id);

    let query = `
      SELECT
        r.id,
        r.player_id,
        r.court_id,
        p.first_name,
        p.last_name,
        c.name AS court,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status
      FROM reservations r
      INNER JOIN players p ON r.player_id = p.id
      INNER JOIN courts c ON r.court_id = c.id
      WHERE r.id = ?
    `;

    const params = [id];

    if (req.user.role === "player") {
      query += " AND p.user_id = ?";
      params.push(req.user.id);
    } else if (!["admin", "staff"].includes(req.user.role)) {
      throw new HttpError(403, "No tenés permiso para consultar esta reserva");
    }

    const [reservations] = await db.query(query, params);

    if (reservations.length === 0) {
      throw new HttpError(404, "Reserva no encontrada");
    }

    res.json(reservations[0]);
  },
);

// ==========================================
// OBTENER ACTIVIDAD RECIENTE DEL DASHBOARD
// ==========================================

const getRecentReservations = handle(
  "Error al obtener la actividad reciente",
  async (req, res) => {
    if (req.user.role !== "admin") {
      throw new HttpError(
        403,
        "No tenés permiso para consultar la actividad reciente",
      );
    }

    const [reservations] = await db.query(
      `
      SELECT
        r.id,
        p.first_name,
        p.last_name,
        c.name AS court,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status
      FROM reservations r
      INNER JOIN players p ON r.player_id = p.id
      INNER JOIN courts c ON r.court_id = c.id
      ORDER BY
        r.reservation_date DESC,
        r.start_time DESC,
        r.id DESC
      LIMIT 5
      `,
    );

    res.json(reservations);
  },
);

// ==========================================
// 3. CREAR UNA RESERVA
// ==========================================

// TEMPORAL: created_by llega en el body. Cuando exista autenticación,
// debe obtenerse de la sesión / token y no del cliente.
const createReservation = handle(
  "Error al crear la reserva",
  async (req, res) => {
    const reservation = parseReservationBody(req.body, {
      requireCreatedBy: true,
    });

    // El jugador solamente puede reservar para sí mismo.
    if (req.user.role === "player") {
      const [players] = await db.query(
        "SELECT id FROM players WHERE user_id = ?",
        [req.user.id],
      );

      if (players.length === 0) {
        throw new HttpError(404, "No tenés un perfil de jugador asociado");
      }

      reservation.player_id = players[0].id;
    } else if (!["admin", "staff"].includes(req.user.role)) {
      throw new HttpError(403, "No tenés permiso para crear reservas");
    }
    let priceApplied;
    const reservationId = await withCourtLock(
      reservation.court_id,
      async (connection) => {
        await assertPlayerExists(connection, reservation.player_id);

        await assertActiveUserExists(
          connection,
          reservation.created_by,
          "El usuario que registra la reserva no existe o está inactivo",
        );

        await assertBookable(connection, reservation);
        await assertNoConflict(connection, reservation);

        // Calculamos el precio según el jugador y el uso de luces.
        priceApplied = await calculateReservationPrice(
          connection,
          reservation.player_id,
          reservation.uses_lights,
        );

        const [result] = await connection.query(
          `
  INSERT INTO reservations (
    player_id,
    court_id,
    created_by,
    reservation_date,
    start_time,
    end_time,
    uses_lights,
    price_applied,
    status
  )
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
`,
          [
            reservation.player_id,
            reservation.court_id,
            reservation.created_by,
            reservation.reservation_date,
            reservation.start_time,
            reservation.end_time,
            reservation.uses_lights,
            priceApplied,
          ],
        );
        return result.insertId;
      },
    );

    res.status(201).json({
      mensaje: "Reserva creada correctamente",
      reservation_id: reservationId,
      price_applied: priceApplied,
    });
  },
);
// ==========================================
// 4. MODIFICAR UNA RESERVA
// ==========================================

const updateReservation = handle(
  "Error al actualizar la reserva",
  async (req, res) => {
    const id = parseIdParam(req.params.id);

    const reservation = parseReservationBody(req.body, {
      requireCreatedBy: false,
    });

    await withCourtLocks(
      id,
      reservation.court_id,
      async (connection, current) => {
        await assertPlayerExists(connection, reservation.player_id);

        const scheduleChanged =
          Number(current.court_id) !== reservation.court_id ||
          String(current.reservation_date).slice(0, 10) !==
            reservation.reservation_date ||
          normalizeTime(String(current.start_time)) !==
            reservation.start_time ||
          normalizeTime(String(current.end_time)) !== reservation.end_time;

        if (scheduleChanged) {
          await assertBookable(connection, reservation);
        }

        await assertNoConflict(connection, reservation, id);

        await connection.query(
          `
            UPDATE reservations
            SET
              player_id = ?,
              court_id = ?,
              reservation_date = ?,
              start_time = ?,
              end_time = ?
            WHERE id = ? AND status = 'confirmed'
          `,
          [
            reservation.player_id,
            reservation.court_id,
            reservation.reservation_date,
            reservation.start_time,
            reservation.end_time,
            id,
          ],
        );
      },
    );

    res.json({
      mensaje: "Reserva actualizada correctamente",
      reservation_id: id,
    });
  },
);
// ==========================================
// 5. CANCELAR UNA RESERVA
// ==========================================

// TEMPORAL: cancelled_by llega en el body (ver nota en createReservation).
const cancelReservation = handle(
  "Error al cancelar la reserva",
  async (req, res) => {
    const id = parseIdParam(req.params.id);
    const { cancelled_by } = req.body || {};

    if (!isPositiveInteger(cancelled_by)) {
      throw new HttpError(400, "El usuario que cancela no es válido");
    }

    await assertActiveUserExists(
      db,
      cancelled_by,
      "El usuario que cancela no existe o está inactivo",
    );

    // Cancelar sin eliminar el registro. La condición status = 'confirmed'
    // hace la operación atómica: si ya estaba cancelada, no cambia nada.
    const [result] = await db.query(
      `
      UPDATE reservations
      SET status = 'cancelled',
          cancelled_by = ?
      WHERE id = ? AND status = 'confirmed'
      `,
      [cancelled_by, id],
    );

    if (result.affectedRows === 0) {
      throw new HttpError(404, "Reserva no encontrada o ya cancelada");
    }

    res.json({
      mensaje: "Reserva cancelada correctamente",
      reservation_id: id,
    });
  },
);

// ==========================================
// 6. OBTENER HORARIOS DISPONIBLES
// ==========================================

// Query: date, court_id y (opcional) exclude_reservation_id.
// Con exclude_reservation_id, esa reserva no cuenta como ocupada
// (sirve para editar una reserva sin que su propio horario se bloquee).
const getAvailableSlots = handle(
  "Error al obtener los horarios disponibles",
  async (req, res) => {
    const { date, court_id, exclude_reservation_id } = req.query;

    if (!isValidDate(date)) {
      throw new HttpError(400, "La fecha no es válida");
    }

    if (!/^\d+$/.test(court_id || "")) {
      throw new HttpError(400, "Debés seleccionar una cancha válida");
    }

    if (exclude_reservation_id && !/^\d+$/.test(exclude_reservation_id)) {
      throw new HttpError(400, "La reserva a excluir no es válida");
    }

    const [courts] = await db.query(
      "SELECT id FROM courts WHERE id = ? AND is_active = TRUE",
      [court_id],
    );

    if (courts.length === 0) {
      throw new HttpError(404, "La cancha no existe o está inactiva");
    }

    const now = getNowInArgentina();

    // Fechas pasadas: no hay horarios disponibles.
    if (date < now.date) {
      return res.json({ date, court_id: Number(court_id), slots: [] });
    }

    const conditions = ["s.day_of_week = ?", "s.is_active = TRUE"];
    const params = [getIsoDayOfWeek(date)];

    // Si es hoy, se ocultan los horarios que ya empezaron.
    if (date === now.date) {
      conditions.push("s.slot_start > ?");
      params.push(now.time);
    }

    let excludeClause = "";
    const reservationParams = [court_id, date];

    if (exclude_reservation_id) {
      excludeClause = "AND r.id != ?";
      reservationParams.push(Number(exclude_reservation_id));
    }

    const [slots] = await db.query(
      `
      SELECT
        s.id,
        s.slot_start,
        s.slot_end
      FROM court_schedules s
      WHERE ${conditions.join(" AND ")}
        AND NOT EXISTS (
          SELECT 1
          FROM reservations r
          WHERE r.court_id = ?
            AND r.reservation_date = ?
            AND r.status != 'cancelled'
            AND r.start_time < s.slot_end
            AND r.end_time > s.slot_start
            ${excludeClause}
        )
      ORDER BY s.slot_start
      `,
      [...params, ...reservationParams],
    );

    res.json({
      date,
      court_id: Number(court_id),
      slots,
    });
  },
);

// ==========================================
// 7. OBTENER FECHAS DISPONIBLES
// ==========================================

// Los horarios habituales (court_schedules) son los mismos para todas las
// canchas; court_id solo se valida. Si más adelante cada cancha tiene sus
// propios horarios, hay que filtrar acá por cancha.
const getAvailableDates = handle(
  "Error al obtener las fechas disponibles",
  async (req, res) => {
    const { court_id, from, days = "90" } = req.query;

    if (!/^\d+$/.test(court_id || "")) {
      throw new HttpError(400, "Debés seleccionar una cancha válida");
    }

    if (!isValidDate(from)) {
      throw new HttpError(400, "La fecha inicial no es válida");
    }

    const numberOfDays = Number(days);

    if (
      !Number.isSafeInteger(numberOfDays) ||
      numberOfDays < 1 ||
      numberOfDays > 180
    ) {
      throw new HttpError(400, "El período solicitado no es válido");
    }

    const [courts] = await db.query(
      "SELECT id FROM courts WHERE id = ? AND is_active = TRUE",
      [court_id],
    );

    if (courts.length === 0) {
      throw new HttpError(404, "La cancha no existe o está inactiva");
    }

    // Días de la semana con horarios activos.
    const [schedules] = await db.query(
      `SELECT DISTINCT day_of_week
       FROM court_schedules
       WHERE is_active = TRUE`,
    );

    const enabledDays = new Set(
      schedules.map((schedule) => Number(schedule.day_of_week)),
    );

    // Hoy solo cuenta si todavía queda algún horario por empezar.
    const now = getNowInArgentina();
    let todayHasSlotsLeft = false;

    if (from <= now.date && enabledDays.has(getIsoDayOfWeek(now.date))) {
      const [remaining] = await db.query(
        `SELECT 1
         FROM court_schedules
         WHERE is_active = TRUE
           AND day_of_week = ?
           AND slot_start > ?
         LIMIT 1`,
        [getIsoDayOfWeek(now.date), now.time],
      );

      todayHasSlotsLeft = remaining.length > 0;
    }

    const availableDates = [];
    const currentDate = new Date(`${from}T00:00:00Z`);

    for (let i = 0; i < numberOfDays; i++) {
      const dateString = currentDate.toISOString().slice(0, 10);

      const isPast = dateString < now.date;
      const isToday = dateString === now.date;

      if (
        !isPast &&
        enabledDays.has(getIsoDayOfWeek(dateString)) &&
        (!isToday || todayHasSlotsLeft)
      ) {
        availableDates.push(dateString);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.json({
      court_id: Number(court_id),
      dates: availableDates,
    });
  },
);

// ==========================================
// 8. COMPROBANTE (vista HTML renderizada con Handlebars)
// ==========================================

const getReservationReceipt = async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);

    let query = `
      SELECT
        r.id,
        p.first_name,
        p.last_name,
        c.name AS court,
        r.reservation_date,
        r.start_time,
        r.end_time,
        r.status,
        r.uses_lights,
        r.price_applied
      FROM reservations r
      INNER JOIN players p ON r.player_id = p.id
      INNER JOIN courts c ON r.court_id = c.id
      WHERE r.id = ?
    `;

    const params = [id];

    if (req.user.role === "player") {
      query += " AND p.user_id = ?";
      params.push(req.user.id);
    } else if (!["admin", "staff"].includes(req.user.role)) {
      throw new HttpError(
        403,
        "No tenés permiso para consultar este comprobante",
      );
    }

    const [reservations] = await db.query(query, params);

    if (reservations.length === 0) {
      throw new HttpError(404, "Reserva no encontrada");
    }

    res.render("receipt", {
      title: `Comprobante de reserva #${id}`,
      reservation: reservations[0],
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;

    if (status === 500) {
      console.error("Error al generar el comprobante:", error);
    }

    res.status(status).render("error", {
      title: "Error",
      status,
      mensaje:
        status === 500 ? "No se pudo generar el comprobante" : error.message,
    });
  }
};
// ==========================================
// 9. ELIMINAR UNA RESERVA
// ==========================================

const deleteReservation = handle(
  "Error al eliminar la reserva",
  async (req, res) => {
    if (req.user.role !== "admin") {
      throw new HttpError(403, "No tenés permiso para eliminar reservas");
    }

    const id = parseIdParam(req.params.id);

    try {
      const [result] = await db.query("DELETE FROM reservations WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        throw new HttpError(404, "Reserva no encontrada");
      }

      res.json({
        mensaje: "Reserva eliminada correctamente",
        reservation_id: id,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        throw new HttpError(
          409,
          "No se puede eliminar esta reserva porque tiene registros relacionados",
        );
      }

      throw error;
    }
  },
);
// ==========================================
// EXPORTAR CONTROLADORES
// ==========================================

module.exports = {
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
};
