const { hashPassword, verifyPassword, signToken } = require("../utils/auth");
const db = require("../config/database");
const { HttpError, handle } = require("../utils/http");

//* POST /api/auth/login { email, password }
const login = handle("Error al iniciar sesión", async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    throw new HttpError(400, "Ingresá el email y la contraseña");
  }

  const [rows] = await db.query(
    "SELECT id, email, password, role FROM users WHERE email = ? AND is_active = TRUE",
    [email.trim().toLowerCase()],
  );

  const user = rows[0];

  if (!user || !verifyPassword(password, user.password)) {
    throw new HttpError(401, "Email o contraseña incorrectos");
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

// POST /api/auth/register
const register = handle("Error al registrar usuario", async (req, res) => {
  const { first_name, last_name, email, phone, password, confirm_password } =
    req.body || {};

  // Validar campos obligatorios
  if (
    typeof first_name !== "string" ||
    typeof last_name !== "string" ||
    typeof email !== "string" ||
    typeof phone !== "string" ||
    typeof password !== "string" ||
    typeof confirm_password !== "string" ||
    !first_name.trim() ||
    !last_name.trim() ||
    !email.trim() ||
    !phone.trim() ||
    !password ||
    !confirm_password
  ) {
    throw new HttpError(400, "Completá todos los campos");
  }

  const cleanFirstName = first_name.trim();
  const cleanLastName = last_name.trim();
  const cleanPhone = phone.trim();
  const normalizedEmail = email.trim().toLowerCase();

  // Validar nombres
  if (cleanFirstName.length > 100 || cleanLastName.length > 100) {
    throw new HttpError(
      400,
      "Los nombres no pueden superar los 100 caracteres",
    );
  }

  // Validar teléfono
  if (cleanPhone.length > 30) {
    throw new HttpError(400, "El teléfono no puede superar los 30 caracteres");
  }

  // Validar email
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    normalizedEmail.length > 150
  ) {
    throw new HttpError(400, "Ingresá un correo electrónico válido");
  }

  // Validar contraseña
  if (password.length < 8 || password.length > 72) {
    throw new HttpError(
      400,
      "La contraseña debe tener entre 8 y 72 caracteres",
    );
  }

  if (password !== confirm_password) {
    throw new HttpError(400, "Las contraseñas no coinciden");
  }

  // Comprobar email existente
  const [existingUsers] = await db.query(
    "SELECT id FROM users WHERE email = ?",
    [normalizedEmail],
  );

  if (existingUsers.length > 0) {
    throw new HttpError(409, "Este correo electrónico ya está registrado");
  }

  const hashedPassword = hashPassword(password);

  // Crear usuario y jugador dentro de una misma transacción
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO users
        (first_name, last_name, email, phone, password, role)
       VALUES (?, ?, ?, ?, ?, 'player')`,
      [
        cleanFirstName,
        cleanLastName,
        normalizedEmail,
        cleanPhone,
        hashedPassword,
      ],
    );

    const userId = userResult.insertId;

    await connection.query(
      `INSERT INTO players
        (user_id, first_name, last_name, phone)
       VALUES (?, ?, ?, ?)`,
      [userId, cleanFirstName, cleanLastName, cleanPhone],
    );

    await connection.commit();

    res.status(201).json({
      mensaje: "Cuenta creada correctamente",
      user: {
        id: userId,
        first_name: cleanFirstName,
        last_name: cleanLastName,
        email: normalizedEmail,
        phone: cleanPhone,
        role: "player",
      },
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      throw new HttpError(409, "Este correo electrónico ya está registrado");
    }

    throw error;
  } finally {
    connection.release();
  }
});

//* POST /api/auth/change-password
const changePassword = handle(
  "Error al cambiar la contraseña",
  async (req, res) => {
    const { current_password, new_password } = req.body || {};

    if (
      typeof current_password !== "string" ||
      typeof new_password !== "string" ||
      !current_password ||
      !new_password
    ) {
      throw new HttpError(400, "Completá la contraseña actual y la nueva");
    }

    if (new_password.length < 8 || new_password.length > 72) {
      throw new HttpError(
        400,
        "La nueva contraseña debe tener entre 8 y 72 caracteres",
      );
    }

    if (new_password === current_password) {
      throw new HttpError(
        400,
        "La nueva contraseña debe ser distinta de la actual",
      );
    }

    const [rows] = await db.query(
      "SELECT password FROM users WHERE id = ? AND is_active = TRUE",
      [req.user.id],
    );

    if (
      rows.length === 0 ||
      !verifyPassword(current_password, rows[0].password)
    ) {
      throw new HttpError(400, "La contraseña actual es incorrecta");
    }

    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashPassword(new_password),
      req.user.id,
    ]);

    res.json({
      mensaje: "Contraseña actualizada correctamente",
    });
  },
);

//* GET /api/auth/me
const me = (req, res) => res.json({ user: req.user });

// Exportar controladores
module.exports = {
  login,
  register,
  me,
  changePassword,
};
