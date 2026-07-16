const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 20000,
});

db.connect((error) => {
  if (error) {
    console.error("Error al conectar con MySQL:", error.message);
  } else {
    console.log("Conexión a MySQL exitosa");
  }
});

module.exports = db;
