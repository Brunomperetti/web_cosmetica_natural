"use strict";

const productosContainer = document.querySelector("#productos-container");

function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "product-card";

  const visual = document.createElement("div");
  visual.className = "product-card__visual";

  const silueta = document.createElement("span");
  silueta.className = "product-card__shape";
  silueta.setAttribute("role", "img");
  silueta.setAttribute("aria-label", `Imagen no disponible de ${producto.nombre}`);
  visual.append(silueta);

  if (producto.imagen) {
    const imagen = document.createElement("img");
    imagen.className = "product-card__image";
    imagen.alt = `Fotografía de ${producto.nombre}`;
    imagen.hidden = true;
    imagen.addEventListener("load", () => {
      imagen.hidden = false;
      silueta.hidden = true;
    });
    imagen.addEventListener("error", () => { imagen.remove(); });
    imagen.src = producto.imagen;
    visual.append(imagen);
  }

  const nombre = document.createElement("h3");
  nombre.textContent = producto.nombre;

  const categoria = document.createElement("p");
  categoria.className = "product-card__category";
  categoria.textContent = producto.categoria;

  const informacion = document.createElement("div");
  informacion.className = "product-card__meta";
  informacion.append(categoria);

  if (typeof producto.precio === "number" && Number.isFinite(producto.precio)) {
    const precio = document.createElement("p");
    precio.className = "product-card__price";
    precio.textContent = producto.precio.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    });
    informacion.append(precio);
  }

  tarjeta.append(visual, nombre, informacion);
  return tarjeta;
}

async function cargarProductos() {
  try {
    const respuesta = await fetch("data/productos.json");

    if (!respuesta.ok) {
      throw new Error(`No se pudieron cargar los productos: ${respuesta.status}`);
    }

    const productos = await respuesta.json();
    const seleccion = productosContainer.dataset.featured === "true"
      ? productos.filter((producto) => producto.destacado)
      : productos;
    const limite = Number(productosContainer.dataset.limit) || seleccion.length;
    productosContainer.replaceChildren(...seleccion.slice(0, limite).map(crearTarjetaProducto));
  } catch (error) {
    console.error(error);
    productosContainer.textContent = "No fue posible cargar los productos.";
  }
}

if (productosContainer) {
  cargarProductos();
}
