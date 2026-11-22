const path = require("path");
const { create } = require("express-handlebars");

// Una sola instancia de Handlebars para:
//  - las vistas HTML que renderiza el servidor (res.render), y
//  - las plantillas de correo (hbs.render).
const hbs = create({
  extname: ".hbs",
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "../views/layouts"),
  partialsDir: path.join(__dirname, "../views/partials"),
  helpers: {
    // "2026-11-20" -> "20/11/2026"
    formatDate: (value) => {
      const [year, month, day] = String(value || "")
        .slice(0, 10)
        .split("-");
      return year && month && day ? `${day}/${month}/${year}` : "";
    },
    // "18:00:00" -> "18:00"
    formatTime: (value) => String(value || "").slice(0, 5),
    statusLabel: (status) =>
      status === "confirmed"
        ? "Confirmada"
        : status === "cancelled"
          ? "Cancelada"
          : status,
    isConfirmed: (status) => status === "confirmed",
  },
});

module.exports = hbs;
