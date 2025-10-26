// Cargar navbar
fetch('navbar.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('navbar-placeholder').innerHTML = html;
    if (typeof inicializarNavbar === 'function') inicializarNavbar();
  });

// Obtener resultados desde localStorage
const resultados = JSON.parse(localStorage.getItem('resultadosBusqueda') || '[]');
const contenedor = document.getElementById('resultados-container');
const noResultados = document.getElementById('no-resultados');

if(resultados.length === 0){
  noResultados.style.display = 'block';
} else {
  contenedor.innerHTML = resultados.map(p => `
    <div class="producto" onclick="window.location.href='/producto.html?id=${p.id}'">
      <img src="${p.image_url}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.category}</p>
      <strong>$${p.price.toLocaleString()}</strong>
    </div>
  `).join('');
}
