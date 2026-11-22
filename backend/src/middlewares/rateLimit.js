// Limitador simple en memoria: `max` peticiones por IP cada `windowMs`.
function createRateLimiter({ windowMs, max, mensaje }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";

    const recent = (hits.get(key) || []).filter(
      (time) => now - time < windowMs,
    );

    if (recent.length >= max) {
      return res.status(429).json({ mensaje });
    }

    recent.push(now);
    hits.set(key, recent);

    // Limpieza ocasional para que el mapa no crezca indefinidamente.
    if (hits.size > 1000) {
      for (const [ip, times] of hits) {
        if (times.every((time) => now - time >= windowMs)) hits.delete(ip);
      }
    }

    next();
  };
}

module.exports = { createRateLimiter };
