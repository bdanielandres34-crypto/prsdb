// navbar.js

async function inicializarNavbar() {
  try {
    const res = await fetch('/getUser', { cache: 'no-store' });
    const user = res.ok ? await res.json() : {};

    const account = document.getElementById('navbar-account');
    const text = document.getElementById('account-text');
    const cartBtn = document.getElementById('navbar-cart');
    const countEl = document.getElementById('cart-count');

    // 🧍 Usuario
    if (!user.username) {
      text.innerHTML = `<span>¡Hola! Inicia sesión</span><br><strong>Mi cuenta</strong>`;
      account.onclick = () => window.location.href = '/index.html';
    } else {
      text.innerHTML = `<span>Bienvenido</span><br><strong>${user.username}</strong>`;
      account.onclick = async () => {
        if (confirm("¿Deseas cerrar sesión?")) {
          await fetch('/logout');
          localStorage.removeItem('carrito');
          window.location.href = '/index.html';
        }
      };
    }

    // 🛒 Contador del carrito
    function actualizarContador() {
      const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
      countEl.textContent = carrito.length > 0 ? carrito.length : '';
    }
    actualizarContador();
    window.addEventListener('storage', actualizarContador);

    // 🛍 Ir al carrito
    cartBtn.onclick = () => window.location.href = '/carrito.html';

    // 🔍 Inicializar búsqueda
    inicializarBusqueda();

  } catch (err) {
    console.error('Error inicializando navbar:', err);
  }
}

// 🔍 Inicializar búsqueda
function inicializarBusqueda() {
  const input = document.getElementById('search-input');
  const boton = document.getElementById('search-btn');

  if (!input) return;

  const ejecutarBusqueda = () => {
    const texto = input.value.trim();
    filtrarProductosPorBusqueda(texto);
  };

  input.addEventListener('input', ejecutarBusqueda);
  input.addEventListener('keypress', e => {
    if (e.key === 'Enter') ejecutarBusqueda();
  });
  boton.addEventListener('click', ejecutarBusqueda);
}

// 🔍 Filtrado de productos y redirección a categoría
async function filtrarProductosPorBusqueda(texto) {
  if (!texto) return;

  try {
    const res = await fetch('/productos/todos'); // Todos los productos
    const productos = await res.json();

    const resultados = productos.filter(p =>
      p.name.toLowerCase().includes(texto.toLowerCase())
    );

    const contenedor = document.getElementById('resultados-temporales');
    if (contenedor) contenedor.innerHTML = '';

    if (resultados.length === 0) {
      if (contenedor) {
        contenedor.innerHTML = '<p style="padding:10px;">No se encontraron productos.</p>';
        contenedor.style.display = 'block';
      } else {
        alert("No se encontraron productos.");
      }
      return;
    }

    // Mostrar resultados en dropdown si existe
    if (contenedor) {
      resultados.forEach(p => {
        const div = document.createElement('div');
        div.classList.add('producto-temporal');
        div.innerHTML = `
          <img src="${p.image_url}" alt="${p.name}">
          <div>
            <strong>${p.name}</strong>
            <p>${p.category}</p>
            <span>$${p.price.toLocaleString()}</span>
          </div>
        `;

        // ✅ Al hacer clic: guardar producto y redirigir a categoría
        div.addEventListener('click', () => {
          localStorage.setItem('productoBusqueda', JSON.stringify(p));
          window.location.href = `/${p.category}.html`;
        });

        contenedor.appendChild(div);
      });
      contenedor.style.display = 'block';
    }

  } catch (err) {
    console.error('Error buscando producto:', err);
  }
}

document.addEventListener('DOMContentLoaded', inicializarNavbar);

