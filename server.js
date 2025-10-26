const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./db');
const path = require('path');

db.query('SELECT DATABASE() AS db', (err, results) => {
  if (err) return console.error('⚠️ Error verificando BD:', err);
  console.log('🗄️ Conectado a la BD:', results[0].db);
});

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'clave_secreta',
  resave: false,
  saveUninitialized: true
}));

// ---------------- LOGIN Y REGISTRO ---------------- //

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, hashed], err => {
    if (err) return res.send('Error al registrar usuario: ' + err);
    res.redirect('/index.html');
  });
});
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) {
      return res.send('Usuario no encontrado');
    }

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.send('Contraseña incorrecta');
    }

    // ✅ Guardamos el usuario en la sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin
    };

    // ✅ Redirige según tipo de usuario
    if (user.is_admin === 1) {
      res.redirect('/admin.html');
    } else {
      res.redirect('/super.html');
    }
  });
});

// ---------------- SESIÓN ---------------- //

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

// ---------------- PANEL ADMIN ---------------- //

app.get('/admin.html', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/index.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Agregar producto
app.post('/add-product', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).send('No autorizado');
  }
  const { name, price, image_url, category } = req.body;
  const sql = 'INSERT INTO products (name, price, image_url, category) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, price, image_url, category], err => {
    if (err) {
      console.error(err);
      return res.send('Error al agregar producto');
    }
    res.redirect('/admin.html');
  });
});

// 🔥 NUEVO: Eliminar producto
app.post('/delete-product', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).send('No autorizado');
  }

  const { id } = req.body;
  const sql = 'DELETE FROM products WHERE id = ?';

  db.query(sql, [id], err => {
    if (err) {
      console.error('Error eliminando producto:', err);
      return res.status(500).send('Error al eliminar producto');
    }
    console.log(`🗑️ Producto con ID ${id} eliminado`);
    res.redirect('/admin.html');
  });
});

// ---------------- PRODUCTOS ---------------- //

app.get('/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});
// Obtener productos por categoría
app.get('/productos/:categoria', (req, res) => {
  const { categoria } = req.params;
  db.query('SELECT * FROM products WHERE category = ?', [categoria], (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      res.status(500).json({ error: 'Error al obtener productos' });
    } else {
      res.json(results);
    }
  });
});

// ---------------- PÁGINAS ---------------- //

app.get('/super.html', (req, res) => {
  if (!req.session.user) return res.redirect('/index.html');
  res.sendFile(path.join(__dirname, 'public', 'super.html'));
});

// Redirecciones a páginas por categoría
const categorias = ['lacteos', 'despensa', 'aseo_personal', 'aseo_hogar', 'carnes_frias'];
categorias.forEach(cat => {
  app.get(`/${cat}.html`, (req, res) => {
    if (!req.session.user) return res.redirect('/index.html');
    res.sendFile(path.join(__dirname, 'public', `${cat}.html`));
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
