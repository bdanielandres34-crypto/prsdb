const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db'); // tu conexión a MySQL
const path = require('path');

const app = express();

// 🔹 Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'clave_secreta',
  resave: false,
  saveUninitialized: true
}));

// 🔹 Verificar conexión a la DB
db.query('SELECT DATABASE() AS db', (err, results) => {
  if (err) return console.error('⚠️ Error verificando BD:', err);
  console.log('🗄️ Conectado a la BD:', results[0].db);
});

// ================= LOGIN / REGISTRO ================= //

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(sql, [username, email, hashed], err => {
      if (err) return res.send('Error al registrar usuario: ' + err);
      res.redirect('/index.html');
    });
  } catch (err) {
    console.error(err);
    res.send('Error hashing password');
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send('Usuario no encontrado');

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.send('Contraseña incorrecta');

    // Guardar usuario en sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin
    };

    if (user.is_admin === 1) res.redirect('/admin.html');
    else res.redirect('/super.html');
  });
});

// ================= SESIÓN ================= //

app.get('/getUser', (req, res) => {
  if (!req.session.user) return res.json({ username: '', is_admin: false });
  res.json({
    username: req.session.user.username,
    is_admin: !!req.session.user.is_admin
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/index.html'));
});

// ================= ADMIN ================= //

app.get('/admin.html', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.redirect('/index.html');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 🔹 Obtener productos (solo admin)
app.get('/products', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ success: false, message: 'Error DB' });
    }
    res.json(results);
  });
});

// 🔹 Agregar producto (solo admin)
app.post('/add-product', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.status(403).send('No autorizado');
  const { name, price, image_url, category } = req.body;
  const sql = 'INSERT INTO products (name, price, image_url, category) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, price, image_url, category], err => {
    if (err) {
      console.error('Error agregando producto:', err);
      return res.send('Error al agregar producto');
    }
    res.redirect('/admin.html');
  });
});

// 🔹 Eliminar producto (solo admin)
app.post('/delete-product', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) return res.status(403).send('No autorizado');
  const { id } = req.body;
  const sql = 'DELETE FROM products WHERE id = ?';
  db.query(sql, [id], err => {
    if (err) {
      console.error('Error eliminando producto:', err);
      return res.status(500).send('Error al eliminar producto');
    }
    res.redirect('/admin.html');
  });
});

// ================= PRODUCTOS ================= //

// Todos los productos (para barra de búsqueda)
app.get('/productos/todos', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    res.json(results);
  });
});

// Productos por categoría
app.get('/productos/:categoria', (req, res) => {
  const { categoria } = req.params;
  db.query('SELECT * FROM products WHERE category = ?', [categoria], (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    res.json(results);
  });
});

// ================= PÁGINAS ================= //

app.get('/super.html', (req, res) => {
  if (!req.session.user) return res.redirect('/index.html');
  res.sendFile(path.join(__dirname, 'public', 'super.html'));
});

// Redirecciones a categorías
const categorias = ['lacteos', 'despensa', 'aseo_personal', 'aseo_hogar', 'carnes_frias'];
categorias.forEach(cat => {
  app.get(`/${cat}.html`, (req, res) => {
    if (!req.session.user) return res.redirect('/index.html');
    res.sendFile(path.join(__dirname, 'public', `${cat}.html`));
  });
});

// ================= PUERTO ================= //

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
