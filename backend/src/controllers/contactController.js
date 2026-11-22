const path = require("path");
const nodemailer = require("nodemailer");

const hbs = require("../config/handlebars");
const { HttpError, handle } = require("../utils/http");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TEMPLATE_PATH = path.join(__dirname, "../templates/emails/contact.hbs");

let transporter = null;

// Crea el transporte SMTP la primera vez que se necesita.
function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO) {
    throw new HttpError(
      503,
      "El envío de correos no está configurado en el servidor.",
    );
  }

  if (!transporter) {
    const port = Number(SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465, // 465 = SSL directo; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  return transporter;
}

// Quita saltos de línea (evita inyección de cabeceras en asunto y nombre).
const singleLine = (value) =>
  String(value)
    .replace(/[\r\n]+/g, " ")
    .trim();

function parseContactBody(body) {
  const { name, email, subject, message } = body || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof subject !== "string" ||
    typeof message !== "string"
  ) {
    throw new HttpError(400, "Completá todos los campos.");
  }

  const data = {
    name: singleLine(name),
    email: singleLine(email),
    subject: singleLine(subject),
    message: message.trim(),
  };

  if (!data.name || !data.email || !data.subject || !data.message) {
    throw new HttpError(400, "Completá todos los campos.");
  }

  if (data.name.length < 2 || data.name.length > 100) {
    throw new HttpError(400, "El nombre debe tener entre 2 y 100 caracteres.");
  }

  if (!EMAIL_REGEX.test(data.email) || data.email.length > 150) {
    throw new HttpError(400, "El correo electrónico no es válido.");
  }

  if (data.subject.length < 3 || data.subject.length > 120) {
    throw new HttpError(400, "El asunto debe tener entre 3 y 120 caracteres.");
  }

  if (data.message.length < 10 || data.message.length > 2000) {
    throw new HttpError(
      400,
      "El mensaje debe tener entre 10 y 2000 caracteres.",
    );
  }

  return data;
}

// POST /api/contact
const sendContactMessage = handle(
  "No se pudo enviar el mensaje",
  async (req, res) => {
    // Campo trampa para bots: un usuario real nunca lo completa.
    if (req.body && req.body.website) {
      return res.status(201).json({ mensaje: "Mensaje enviado correctamente" });
    }

    const data = parseContactBody(req.body);
    const mailer = getTransporter();

    const sentAt = new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Cordoba",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());

    // El cuerpo del correo se genera con una plantilla Handlebars.
    const html = await hbs.render(TEMPLATE_PATH, { ...data, sentAt });

    const text =
      `Nuevo mensaje desde el sitio de Orso Tenis\n\n` +
      `Nombre: ${data.name}\nCorreo: ${data.email}\n` +
      `Asunto: ${data.subject}\nFecha: ${sentAt}\n\n${data.message}\n`;

    try {
      await mailer.sendMail({
        from: `"Orso Tenis" <${process.env.SMTP_USER}>`,
        to: process.env.MAIL_TO,
        replyTo: `"${data.name.replace(/"/g, "")}" <${data.email}>`,
        subject: `[Orso Tenis] ${data.subject}`,
        text,
        html,
      });
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      throw new HttpError(
        502,
        "No se pudo enviar el correo. Intentá de nuevo más tarde.",
      );
    }

    res.status(201).json({ mensaje: "Mensaje enviado correctamente" });
  },
);

module.exports = { sendContactMessage };
