"use strict";

const productosContainer = document.querySelector("#productos-container");

function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "product-card";

  const nombre = document.createElement("h3");
  nombre.textContent = producto.nombre;

  const categoria = document.createElement("p");
  categoria.className = "product-card__category";
  categoria.textContent = producto.categoria;

  const descripcion = document.createElement("p");
  descripcion.textContent = producto.descripcion;

  const precio = document.createElement("p");
  precio.className = "product-card__price";
  precio.textContent = `$${producto.precio.toLocaleString("es-AR")}`;

  tarjeta.append(nombre, categoria, descripcion, precio);
  return tarjeta;
}

async function cargarProductos() {
  try {
    const respuesta = await fetch("data/productos.json");

    if (!respuesta.ok) {
      throw new Error(`No se pudieron cargar los productos: ${respuesta.status}`);
    }

    const productos = await respuesta.json();
    productosContainer.replaceChildren(...productos.map(crearTarjetaProducto));
  } catch (error) {
    console.error(error);
    productosContainer.textContent = "No fue posible cargar los productos.";
  }
}

if (productosContainer) {
  cargarProductos();
}
