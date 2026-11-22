const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Devuelve DATE/TIME/DATETIME como texto ("2026-11-15", "18:00:00").
  // Evita corrimientos de día por zona horaria al serializar a JSON.
  dateStrings: true,
});

module.exports = pool;
