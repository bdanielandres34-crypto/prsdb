// ✅ Obtener parámetros de la URL
function obtenerIdCompra() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// ✅ Cargar datos de la compra desde el backend
async function cargarRecibo() {
  const id = obtenerIdCompra();
  if (!id) {
    document.body.innerHTML = "<h2>No se encontró el ID de la compra ❌</h2>";
    return;
  }

  try {
    const res = await fetch(`/compra/${id}`);
    const data = await res.json();

    if (data.error) {
      document.body.innerHTML = `<h2>${data.error}</h2>`;
      return;
    }

    mostrarRecibo(data);
  } catch (err) {
    console.error("Error cargando recibo:", err);
    document.body.innerHTML = "<h2>Error al obtener los datos del recibo ❌</h2>";
  }
}

// ✅ Mostrar recibo en el HTML
function mostrarRecibo(data) {
  const cont = document.getElementById("recibo-container");
  if (!cont) return;

  const productosHTML = data.productos
    .map(
      (p) => `
      <div class="producto-recibo">
        <img src="${p.image_url}" alt="${p.name}" class="img-recibo">
        <div>
          <h3>${p.name}</h3>
          <p>Cantidad: ${p.cantidad}</p>
          <p>Precio unitario: $${p.price.toLocaleString()}</p>
          <p>Subtotal: $${(p.price * p.cantidad).toLocaleString()}</p>
        </div>
      </div>
    `
    )
    .join("");

  cont.innerHTML = `
    <h1>🧾 Recibo de compra #${data.id}</h1>
    <p><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleString()}</p>
    <p><strong>Método de pago:</strong> ${data.metodo_pago}</p>
    <hr>
    <h2>Productos:</h2>
    <div class="lista-productos">${productosHTML}</div>
    <hr>
    <h2>Total pagado: $${data.total.toLocaleString()}</h2>
    <button id="volver" class="btn-volver">Volver al inicio</button>
  `;

  document.getElementById("volver").addEventListener("click", () => {
    window.location.href = "/super.html";
  });
}

// 🚀 Cargar el recibo al iniciar
document.addEventListener("DOMContentLoaded", cargarRecibo);
