// ✅ Mostrar productos en el carrito
function mostrarCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  const contenedor = document.getElementById("carrito-container");
  const totalEl = document.getElementById("total");

  if (!contenedor) return;

  if (carrito.length === 0) {
    contenedor.innerHTML = `<p class="vacio">Tu carrito está vacío 🛒</p>`;
    totalEl.textContent = "Total: $0";
    return;
  }

  contenedor.innerHTML = carrito.map((p, i) => `
    <div class="item-carrito">
      <img src="${p.image_url}" alt="${p.name}" class="img-carrito">
      <div class="info-item">
        <h3>${p.name}</h3>
        <p>$${p.price.toLocaleString()}</p>
        <div class="cantidad">
          <button onclick="cambiarCantidad(${i}, -1)">➖</button>
          <span>${p.cantidad}</span>
          <button onclick="cambiarCantidad(${i}, 1)">➕</button>
        </div>
      </div>
      <button class="eliminar" onclick="eliminarProducto(${i})">❌</button>
    </div>
  `).join("");

  const total = carrito.reduce((sum, p) => sum + p.price * p.cantidad, 0);
  totalEl.textContent = `Total: $${total.toLocaleString()}`;
}

// ✅ Cambiar cantidad
function cambiarCantidad(index, delta) {
  let carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  if (!carrito[index]) return;

  carrito[index].cantidad += delta;
  if (carrito[index].cantidad <= 0) carrito.splice(index, 1);

  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarCarrito();
}

// ✅ Eliminar producto
function eliminarProducto(index) {
  let carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  mostrarCarrito();
}

// ✅ Finalizar compra (guardar en BD)
async function finalizarCompra() {
  const carrito = JSON.parse(localStorage.getItem("carrito") || "[]");
  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  const metodo_pago = document.getElementById("metodo-pago").value;
  if (!metodo_pago) {
    alert("Selecciona un método de pago.");
    return;
  }

  const total = carrito.reduce((sum, p) => sum + p.price * p.cantidad, 0);

  try {
    const res = await fetch("/guardar-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productos: carrito,
        metodo_pago,
        total,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert(`✅ Compra registrada con éxito! ID: ${data.recibo.id}`);

      // 🧹 Limpiar carrito local
      localStorage.removeItem("carrito");

      // 🔄 Redirigir al recibo
      window.location.href = `/recibo.html?id=${data.recibo.id}`;
    } else {
      alert("❌ Error al registrar la compra: " + data.message);
    }
  } catch (err) {
    console.error("Error enviando la compra:", err);
    alert("Error al enviar la compra al servidor.");
  }
}

// ✅ Cargar métodos de pago
function cargarMetodosPago() {
  const select = document.getElementById("metodo-pago");
  if (!select) return;

  const metodos = ["Efectivo", "Tarjeta de crédito", "Nequi", "Daviplata"];
  select.innerHTML =
    `<option value="">Seleccionar...</option>` +
    metodos.map(m => `<option value="${m}">${m}</option>`).join("");

  // Mostrar logo al cambiar método
  const logo = document.getElementById("logo-pago");
  select.addEventListener("change", () => {
    const metodo = select.value;
    if (!metodo) {
      logo.classList.add("oculto");
      return;
    }

    let imgSrc = "";
    if (metodo === "Nequi") imgSrc = "https://seeklogo.com/images/N/nequi-logo-22B67C31E6-seeklogo.com.png";
    else if (metodo === "Daviplata") imgSrc = "https://seeklogo.com/images/D/daviplata-logo-22A78D3D84-seeklogo.com.png";
    else if (metodo === "Tarjeta de crédito") imgSrc = "https://cdn-icons-png.flaticon.com/512/196/196561.png";
    else if (metodo === "Efectivo") imgSrc = "https://cdn-icons-png.flaticon.com/512/633/633611.png";

    logo.src = imgSrc;
    logo.classList.remove("oculto");
  });
}

// ✅ Inicializar
document.addEventListener("DOMContentLoaded", () => {
  mostrarCarrito();
  cargarMetodosPago();

  document.getElementById("finalizar-compra").addEventListener("click", finalizarCompra);
  document.getElementById("seguir-comprando").addEventListener("click", () => {
    window.location.href = "/super.html";
  });
});
