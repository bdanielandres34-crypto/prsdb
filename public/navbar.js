// ✅ Inicializar funcionalidad del navbar
async function inicializarNavbar() {
  try {
    const res = await fetch('/getUser', { cache: 'no-store' });
    const user = res.ok ? await res.json() : {};

    const account = document.getElementById('navbar-account');
    const text = document.getElementById('account-text');
    const cartBtn = document.getElementById('navbar-cart');
    const countEl = document.getElementById('cart-count');

    // 🧍 Mostrar usuario
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

    // 🔁 Escuchar cambios en el carrito (por otras páginas)
    window.addEventListener('storage', actualizarContador);

    // 🛍 Ir al carrito
    cartBtn.onclick = () => window.location.href = '/carrito.html';
  } catch (err) {
    console.error('Error inicializando navbar:', err);
  }
}
