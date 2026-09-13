"use strict";

const detalleProducto = document.querySelector("#producto-detalle");

const formatearPrecio = window.LuziaCarrito.formatearPrecio;

function crearTexto(etiqueta, contenido, clase = "") {
  const elemento = document.createElement(etiqueta);
  elemento.className = clase;
  elemento.textContent = contenido;
  return elemento;
}

function crearSeccion(titulo, contenido) {
  if (!contenido || (Array.isArray(contenido) && !contenido.length)) return null;
  const seccion = document.createElement("section");
  seccion.className = "product-detail__section";
  seccion.append(crearTexto("h2", titulo));

  if (Array.isArray(contenido)) {
    const lista = document.createElement("ul");
    lista.className = "product-detail__ingredients";
    contenido.forEach((item) => lista.append(crearTexto("li", item)));
    seccion.append(lista);
  } else {
    seccion.append(crearTexto("p", contenido));
  }
  return seccion;
}

function renderizarProducto(producto) {
  document.title = `${producto.nombre} | Luzia Cosmética Natural`;

  const figura = document.createElement("figure");
  figura.className = "product-detail__visual";
  const imagen = document.createElement("img");
  imagen.src = producto.imagen;
  imagen.alt = `Fotografía de ${producto.nombre}`;
  figura.append(imagen);

  const informacion = document.createElement("div");
  informacion.className = "product-detail__information";
  informacion.append(
    crearTexto("p", producto.categoria, "eyebrow product-detail__category"),
    crearTexto("h1", producto.nombre),
    crearTexto("p", formatearPrecio(producto.precio), "product-detail__price")
  );

  if (producto.promocion) {
    informacion.append(crearTexto("p", producto.promocion, "product-detail__promotion"));
  }

  informacion.append(crearTexto("p", producto.descripcionCompleta || producto.descripcion, "product-detail__description"));
  [
    crearSeccion("Ingredientes", producto.ingredientes),
    crearSeccion("Modo de uso", producto.modoUso)
  ].filter(Boolean).forEach((seccion) => informacion.append(seccion));

  const cta = document.createElement("button");
  cta.className = "button product-detail__cta";
  cta.type = "button";
  cta.textContent = "Agregar al carrito";
  const feedback = crearTexto("p", "", "product-detail__feedback");
  feedback.setAttribute("aria-live", "polite");
  cta.addEventListener("click", () => {
    window.LuziaCarrito.agregarProducto(producto.slug);
    cta.textContent = "Agregado ✓";
    feedback.replaceChildren(
      document.createTextNode("Producto agregado · "),
      Object.assign(document.createElement("a"), { href: "carrito.html", textContent: "Ver carrito" })
    );
    window.clearTimeout(cta.feedbackTimeout);
    cta.feedbackTimeout = window.setTimeout(() => { cta.textContent = "Agregar al carrito"; }, 1700);
  });
  informacion.append(cta, feedback);

  detalleProducto.replaceChildren(figura, informacion);
  detalleProducto.setAttribute("aria-busy", "false");
}

async function cargarProducto() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  try {
    const respuesta = await fetch("data/productos.json");
    if (!respuesta.ok) throw new Error(`No se pudieron cargar los productos: ${respuesta.status}`);
    const productos = await respuesta.json();
    const producto = productos.find((item) => item.slug === slug);
    if (!producto) throw new Error("Producto no encontrado");
    renderizarProducto(producto);
  } catch (error) {
    console.error(error);
    detalleProducto.classList.add("product-detail__error");
    detalleProducto.replaceChildren(
      crearTexto("h1", "Producto no encontrado"),
      crearTexto("p", "No pudimos encontrar la ficha que buscás."),
      Object.assign(document.createElement("a"), { href: "productos.html", className: "text-link", textContent: "Volver a la tienda" })
    );
    detalleProducto.setAttribute("aria-busy", "false");
  }
}

if (detalleProducto) cargarProducto();
