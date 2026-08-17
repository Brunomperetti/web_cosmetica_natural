"use strict";

const productosContainer = document.querySelector("#productos-container");

function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "product-card";

  const enlace = document.createElement("a");
  enlace.className = "product-card__link";
  enlace.href = `producto.html?slug=${encodeURIComponent(producto.slug)}`;
  enlace.setAttribute("aria-label", `Ver ${producto.nombre}`);

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

  const overlay = document.createElement("div");
  overlay.className = "product-card__overlay";

  const contenidoOverlay = document.createElement("div");
  contenidoOverlay.className = "product-card__overlay-content";

  const descripcionCorta = typeof producto.descripcion === "string"
    ? producto.descripcion.trim()
    : "";

  if (descripcionCorta) {
    const descripcion = document.createElement("p");
    descripcion.className = "product-card__description";
    descripcion.textContent = descripcionCorta;
    contenidoOverlay.append(descripcion);
  }

  const llamada = document.createElement("span");
  llamada.className = "product-card__cta";
  llamada.textContent = "Ver producto";
  contenidoOverlay.append(llamada);
  overlay.append(contenidoOverlay);
  visual.append(overlay);

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

  enlace.append(visual, nombre, informacion);
  tarjeta.append(enlace);
  return tarjeta;
}

function observarEntradaTarjetas(tarjetas) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    tarjetas.forEach((tarjeta) => tarjeta.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add("is-visible");
      observer.unobserve(entrada.target);
    });
  }, { threshold: 0.12 });

  tarjetas.forEach((tarjeta, indice) => {
    tarjeta.style.setProperty("--reveal-delay", `${Math.min(indice % 3, 2) * 70}ms`);
    observer.observe(tarjeta);
  });
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
    const tarjetas = seleccion.slice(0, limite).map(crearTarjetaProducto);
    productosContainer.replaceChildren(...tarjetas);
    observarEntradaTarjetas(tarjetas);
  } catch (error) {
    console.error(error);
    productosContainer.textContent = "No fue posible cargar los productos.";
  }
}

if (productosContainer) {
  cargarProductos();
}
