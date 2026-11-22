const { verifyToken } = require("../utils/auth");

// Exige un usuario logueado. Deja los datos en req.user.
function requireAuth(req, res, next) {
  const [type, token] = (req.headers.authorization || "").split(" ");
  const payload = type === "Bearer" ? verifyToken(token) : null;

  if (!payload) {
    return res
      .status(401)
      .json({ mensaje: "Tenés que iniciar sesión para hacer esto." });
  }

  req.user = { id: payload.id, email: payload.email, role: payload.role };

  console.log("Usuario autenticado:", req.user);

  next();
}

// Exige estar logueado Y tener alguno de los roles indicados.
function requireRole(...roles) {
  return [
    requireAuth,
    (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res
          .status(403)
          .json({ mensaje: "No tenés permiso para realizar esta acción." });
      }
      next();
    },
  ];
}

// Pone el id del usuario logueado en el body (created_by / cancelled_by).
// Así el cliente no puede falsificar quién hizo la acción.
function setBodyUser(field) {
  return (req, res, next) => {
    req.body = { ...(req.body || {}), [field]: req.user.id };
    next();
  };
}

module.exports = { requireAuth, requireRole, setBodyUser };
