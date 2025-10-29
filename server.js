const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");
const path = require("path");

const app = express();

// ================== Middleware ==================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "clave_secreta",
    resave: false,
    saveUninitialized: true,
  })
);

// ================== Conexión a BD ==================
db.query("SELECT DATABASE() AS db", (err, results) => {
  if (err) return console.error("⚠️ Error verificando BD:", err);
  console.log("🗄️ Conectado a la BD:", results[0].db);
});

// ================== Registro y Login ==================
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(sql, [username, email, hashed], (err) => {
      if (err) return res.send("Error al registrar usuario: " + err);
      res.redirect("/index.html");
    });
  } catch (err) {
    console.error(err);
    res.send("Error al registrar usuario");
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.send("Usuario no encontrado");

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.send("Contraseña incorrecta");

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    };

    if (user.is_admin === 1) res.redirect("/admin.html");
    else res.redirect("/super.html");
  });
});

// ================== Guardar compra ==================
app.post("/guardar-compra", (req, res) => {
  const { productos, metodo_pago, total } = req.body;

  if (!productos || !metodo_pago || !total) {
    return res.status(400).json({ success: false, message: "Datos incompletos" });
  }

  const fecha = new Date();

  const sqlCompra = `INSERT INTO compras (total, metodo_pago, fecha) VALUES (?, ?, ?)`;
  db.query(sqlCompra, [total, metodo_pago, fecha], (err, result) => {
    if (err) {
      console.error("❌ Error al guardar compra:", err);
      return res.status(500).json({ success: false, message: "Error al guardar compra" });
    }

    const compraId = result.insertId;
    const sqlDetalle = `INSERT INTO detalles_compra (compra_id, productos) VALUES (?, ?)`;
    const productosJSON = JSON.stringify(productos);

    db.query(sqlDetalle, [compraId, productosJSON], (err2) => {
      if (err2) {
        console.error("❌ Error al guardar detalles:", err2);
        return res.status(500).json({ success: false, message: "Error al guardar detalles" });
      }

      console.log(`✅ Compra y detalles guardados correctamente (ID: ${compraId})`);
      res.json({
        success: true,
        message: "Compra registrada exitosamente",
        recibo: { id: compraId, fecha, metodo_pago, total },
      });
    });
  });
});

// ================== Obtener compra ==================
app.get("/compra/:id", (req, res) => {
  const { id } = req.params;

  const sqlCompra = "SELECT * FROM compras WHERE id = ?";
  const sqlDetalles = "SELECT * FROM detalles_compra WHERE compra_id = ?";

  db.query(sqlCompra, [id], (err, compraRes) => {
    if (err || compraRes.length === 0)
      return res.status(404).json({ error: "Compra no encontrada" });

    const compra = compraRes[0];

    db.query(sqlDetalles, [id], (err, detallesRes) => {
      if (err) return res.status(500).json({ error: "Error obteniendo detalles" });

      const productos = detallesRes.length
        ? JSON.parse(detallesRes[0].productos)
        : [];

      res.json({
        id: compra.id,
        metodo_pago: compra.metodo_pago,
        fecha: compra.fecha,
        total: compra.total,
        productos,
      });
    });
  });
});

// ================== Sesión ==================
app.get("/getUser", (req, res) => {
  if (!req.session.user) return res.json({ username: "", is_admin: false });
  res.json({
    username: req.session.user.username,
    is_admin: !!req.session.user.is_admin,
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/index.html"));
});

// ================== Administrador ==================
app.get("/admin.html", (req, res) => {
  if (!req.session.user || !req.session.user.is_admin)
    return res.redirect("/index.html");
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/products", (req, res) => {
  if (!req.session.user || !req.session.user.is_admin)
    return res.status(403).json({ success: false, message: "No autorizado" });
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Error DB" });
    res.json(results);
  });
});

app.post("/add-product", (req, res) => {
  if (!req.session.user || !req.session.user.is_admin)
    return res.status(403).send("No autorizado");

  const { name, price, image_url, category } = req.body;
  const sql = "INSERT INTO products (name, price, image_url, category) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, price, image_url, category], (err) => {
    if (err) return res.send("Error al agregar producto");
    res.redirect("/admin.html");
  });
});

app.post("/delete-product", (req, res) => {
  if (!req.session.user || !req.session.user.is_admin)
    return res.status(403).send("No autorizado");

  const { id } = req.body;
  db.query("DELETE FROM products WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).send("Error al eliminar producto");
    res.redirect("/admin.html");
  });
});

// ================== Productos ==================
app.get("/productos/todos", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "Error al obtener productos" });
    res.json(results);
  });
});

app.get("/productos/:categoria", (req, res) => {
  const { categoria } = req.params;
  db.query("SELECT * FROM products WHERE category = ?", [categoria], (err, results) => {
    if (err) return res.status(500).json({ error: "Error al obtener productos" });
    res.json(results);
  });
});

// ================== Páginas ==================
app.get("/super.html", (req, res) => {
  if (!req.session.user) return res.redirect("/index.html");
  res.sendFile(path.join(__dirname, "public", "super.html"));
});

const categorias = ["lacteos", "despensa", "aseo_personal", "aseo_hogar", "carnes_frias"];
categorias.forEach((cat) => {
  app.get(`/${cat}.html`, (req, res) => {
    if (!req.session.user) return res.redirect("/index.html");
    res.sendFile(path.join(__dirname, "public", `${cat}.html`));
  });
});

// ================== Iniciar servidor ==================
app.listen(3000, () =>
  console.log("🚀 Servidor corriendo en http://localhost:3000")
);
