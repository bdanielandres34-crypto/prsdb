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

// 🔍 Búsqueda global
function inicializarBusqueda() {
  const input = document.getElementById('search-input');
  const boton = document.getElementById('search-btn');

  if (!input) return;

  const ejecutarBusqueda = () => {
    const texto = input.value.trim().toLowerCase();
    if (typeof filtrarProductosPorBusqueda === 'function') {
      filtrarProductosPorBusqueda(texto);
    }
  };

  input.addEventListener('input', ejecutarBusqueda);
  boton.addEventListener('click', ejecutarBusqueda);
}

document.addEventListener('DOMContentLoaded', inicializarNavbar);
// 🔍 --- Funcionalidad de la barra de búsqueda ---
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  // Si no existe (por ejemplo, en carrito.html), salir
  if (!searchInput || !searchBtn) return;

  searchBtn.addEventListener('click', realizarBusqueda);
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') realizarBusqueda();
  });

  async function realizarBusqueda() {
    const termino = searchInput.value.trim().toLowerCase();
    if (!termino) {
      alert("Por favor escribe algo para buscar 🔍");
      return;
    }

    try {
      // 🔹 Buscar en todos los productos
      const res = await fetch('/productos/todos'); // backend debe devolver todos
      const productos = await res.json();

      // 🔹 Filtrar
      const resultados = productos.filter(p => 
        p.name.toLowerCase().includes(termino)
      );

      // 🔹 Guardar resultados en localStorage y redirigir
      localStorage.setItem('resultadosBusqueda', JSON.stringify(resultados));
      localStorage.setItem('terminoBusqueda', termino);

      // Ir a una página de resultados (por ejemplo resultados.html)
      window.location.href = '/resultados.html';
    } catch (err) {
      console.error('Error en búsqueda:', err);
      alert("Ocurrió un error buscando los productos.");
    }
  }
});
