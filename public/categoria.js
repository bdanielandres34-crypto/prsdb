let productos = [];

// ✅ Cargar productos según la categoría
async function cargarProductosCategoria() {
  const categoria = document.body.dataset.categoria;
  if (!categoria) return;

  try {
    const res = await fetch(`/productos/${categoria}`);
    productos = await res.json();
    mostrarProductos(productos);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

// ✅ Mostrar productos en la página
function mostrarProductos(lista) {
  const cont = document.getElementById("productos-container");
  if (!cont) return;

  const buscado = JSON.parse(localStorage.getItem("productoBusqueda") || "null");
  let productosOrdenados = lista;

  if (buscado && buscado.category === document.body.dataset.categoria) {
    productosOrdenados = [buscado, ...lista.filter(p => p.id !== buscado.id)];
    localStorage.removeItem("productoBusqueda");
  }

  if (!productosOrdenados.length) {
    cont.innerHTML = `<p class="no-resultados">No se encontraron productos.</p>`;
    return;
  }

  cont.innerHTML = productosOrdenados.map(p => `
    <div class="producto-card">
      <img src="${p.image_url}" alt="${p.name}" class="producto-img">
      <div class="producto-info">
        <p class="precio">$${parseFloat(p.price).toLocaleString()}</p>
        <h3>${p.name}</h3>
        <button class="btn-agregar"
          data-nombre="${p.name}"
          data-precio="${p.price}"
          data-imagen="${p.image_url}">
          Agregar 🛒
        </button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".btn-agregar").forEach(btn => {
    btn.addEventListener("click", () => {
      const producto = {
        name: btn.dataset.nombre,
        price: parseFloat(btn.dataset.precio),
        image_url: btn.dataset.imagen,
        cantidad: 1
      };

      let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
      const index = carrito.findIndex(p => p.name === producto.name);
      if (index !== -1) carrito[index].cantidad += 1;
      else carrito.push(producto);

      localStorage.setItem("carrito", JSON.stringify(carrito));

      const contador = document.getElementById("cart-count");
      if (contador) {
        const totalItems = carrito.reduce((acc, p) => acc + p.cantidad, 0);
        contador.textContent = totalItems > 0 ? totalItems : "";
      }

      alert(`${producto.name} agregado al carrito 🛒`);
    });
  });
}

// 🚀 Iniciar carga de productos
document.addEventListener("DOMContentLoaded", cargarProductosCategoria);
