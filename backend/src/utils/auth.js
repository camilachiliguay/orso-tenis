// Utilidades de autenticación SIN dependencias externas (solo el módulo "crypto" de Node).
const crypto = require("crypto");

const KEY_LENGTH = 64;
const TOKEN_DURATION_SECONDS = 8 * 60 * 60; // 8 horas

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error("Falta JWT_SECRET en el .env (mínimo 16 caracteres).");
  }

  return secret;
}

// ---------- Contraseñas (scrypt + salt) ----------
// Formato guardado en la base: scrypt$<salt>$<hash>
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof password !== "string" || typeof stored !== "string") return false;

  const [algorithm, salt, hash] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  if (expected.length === 0) return false;

  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

// ---------- Token firmado (formato JWT, HS256) ----------
const encode = (object) =>
  Buffer.from(JSON.stringify(object)).toString("base64url");

const sign = (data) =>
  crypto.createHmac("sha256", getSecret()).update(data).digest();

function signToken(payload, expiresInSeconds = TOKEN_DURATION_SECONDS) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  const signature = sign(`${header}.${body}`).toString("base64url");

  return `${header}.${body}.${signature}`;
}

// Devuelve el contenido del token o null si es inválido / venció.
function verifyToken(token) {
  const parts = typeof token === "string" ? token.split(".") : [];
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = sign(`${header}.${body}`);
  const given = Buffer.from(signature, "base64url");

  if (
    given.length !== expected.length ||
    !crypto.timingSafeEqual(given, expected)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000))
      return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken };
