const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  // XAMPP normalmente configura el usuario root sin contraseña.
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "skillswap",
});

connection.connect((error) => {
  if (error) {
    console.error("No se pudo conectar a MySQL:", error.message);
    return;
  }

  console.log(`MySQL conectado correctamente a la base de datos ${process.env.DB_NAME || 'skillswap'}`);
});

module.exports = connection;
