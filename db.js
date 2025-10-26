// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // ⚠️ cambia si usas otro usuario
  password: '',          // ⚠️ cambia si tu MySQL tiene contraseña
  database: 'login_db'   // asegúrate que exista
});

db.connect(err => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos:', err);
  } else {
    console.log('✅ Conectado a la base de datos.');
  }
});

module.exports = db;
