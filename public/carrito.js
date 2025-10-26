// ✅ Mostrar productos del carrito
function mostrarCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const cont = document.getElementById("carrito-contenedor");
  const totalEl = document.getElementById("carrito-total");

  if (carrito.length === 0) {
    cont.innerHTML = `<p class="vacio">Tu carrito está vacío 😢</p>`;
    totalEl.textContent = "$0";
    return;
  }

  cont.innerHTML = carrito.map((p, i) => `
    <div class="carrito-item">
      <img src="${p.image_url}" alt="${p.name}">
      <div class="carrito-info">
        <h3>${p.name}</h3>
        <p class="precio">$${parseFloat(p.price).toLocaleString()}</p>
      </div>
      <button class="btn-eliminar" onclick="eliminarItem(${i})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join("");

  const total = carrito.reduce((s, p) => s + parseFloat(p.price), 0);
  totalEl.textContent = `$${total.toLocaleString()}`;
}

function eliminarItem(i) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  carrito.splice(i, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarCarrito();
}

document.addEventListener("click", e => {
  if (e.target.id === "btn-vaciar") {
    if (confirm("¿Seguro que deseas vaciar el carrito?")) {
      localStorage.removeItem("carrito");
      mostrarCarrito();
    }
  }

  if (e.target.id === "btn-comprar") {
    abrirModalPago();
  }

  if (e.target.id === "cerrar-modal") {
    cerrarModalPago();
  }

  if (e.target.classList.contains("pago-btn")) {
    const metodo = e.target.dataset.metodo;
    procesarPago(metodo);
  }
});

function abrirModalPago() {
  const modal = document.getElementById("modal-pago");
  const total = document.getElementById("carrito-total").textContent;
  document.getElementById("pago-total").textContent = total;
  modal.classList.remove("oculto");
}

function cerrarModalPago() {
  document.getElementById("modal-pago").classList.add("oculto");
}

// ✅ Simular pago
function procesarPago(metodo) {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  alert(`✅ Pago exitoso con ${metodo}.\n¡Gracias por tu compra! 🛍️`);
  localStorage.removeItem("carrito");
  cerrarModalPago();
  mostrarCarrito();
}

mostrarCarrito();
