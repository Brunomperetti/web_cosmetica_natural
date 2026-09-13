"use strict";

const contenedorCarrito = document.querySelector("#carrito-contenido");
const anuncioCarrito = document.querySelector("#carrito-anuncio");
let catalogo = [];

function elemento(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function anunciar(mensaje) {
  anuncioCarrito.textContent = "";
  window.requestAnimationFrame(() => { anuncioCarrito.textContent = mensaje; });
}

function crearControlCantidad(producto, cantidad) {
  const control = elemento("div", undefined, "cart-quantity");
  const menos = elemento("button", "−", "cart-quantity__button");
  menos.type = "button";
  menos.setAttribute("aria-label", `Disminuir cantidad de ${producto.nombre}`);
  const valor = elemento("span", cantidad, "cart-quantity__value");
  valor.setAttribute("aria-label", `Cantidad: ${cantidad}`);
  const mas = elemento("button", "+", "cart-quantity__button");
  mas.type = "button";
  mas.setAttribute("aria-label", `Aumentar cantidad de ${producto.nombre}`);
  menos.addEventListener("click", () => {
    window.LuziaCarrito.actualizarCantidad(producto.slug, cantidad - 1);
    anunciar(cantidad === 1 ? `${producto.nombre} eliminado del carrito` : `Cantidad de ${producto.nombre} actualizada`);
    renderizarCarrito();
  });
  mas.addEventListener("click", () => {
    window.LuziaCarrito.actualizarCantidad(producto.slug, cantidad + 1);
    anunciar(`Cantidad de ${producto.nombre} actualizada`);
    renderizarCarrito();
  });
  control.append(menos, valor, mas);
  return control;
}

function crearFila(producto, cantidad) {
  const fila = elemento("article", undefined, "cart-item");
  const imagen = document.createElement("img");
  imagen.className = "cart-item__image";
  imagen.src = producto.imagen;
  imagen.alt = `Fotografía de ${producto.nombre}`;
  const detalle = elemento("div", undefined, "cart-item__detail");
  detalle.append(
    elemento("p", producto.categoria, "eyebrow cart-item__category"),
    elemento("h2", producto.nombre, "cart-item__name"),
    elemento("p", `${window.LuziaCarrito.formatearPrecio(producto.precio)} por unidad`, "cart-item__unit")
  );
  const cantidadControl = crearControlCantidad(producto, cantidad);
  const precio = elemento("div", undefined, "cart-item__price");
  precio.append(elemento("p", window.LuziaCarrito.formatearPrecio(window.LuziaCarrito.calcularSubtotal(producto, cantidad)), "cart-item__subtotal"));
  if (producto.promocionCantidad && cantidad >= producto.promocionCantidad) {
    precio.append(elemento("p", `Promo aplicada · ${producto.promocion}`, "cart-item__promotion"));
  }
  const eliminar = elemento("button", "Eliminar", "cart-item__remove");
  eliminar.type = "button";
  eliminar.addEventListener("click", () => {
    window.LuziaCarrito.quitarProducto(producto.slug);
    anunciar(`${producto.nombre} eliminado del carrito`);
    renderizarCarrito();
  });
  precio.append(eliminar);
  fila.append(imagen, detalle, cantidadControl, precio);
  return fila;
}

function renderizarVacio() {
  const vacio = elemento("section", undefined, "cart-empty");
  vacio.append(
    elemento("p", "Una pausa para elegir", "eyebrow"),
    elemento("h2", "Tu carrito está esperando."),
    elemento("p", "Descubrí los productos Luzia y elegí los que quieras sumar a tu ritual."),
    Object.assign(elemento("a", "Descubrir productos", "button"), { href: "productos.html" })
  );
  contenedorCarrito.replaceChildren(vacio);
}

function renderizarCarrito() {
  const carrito = window.LuziaCarrito.obtenerCarrito();
  const disponibles = carrito.filter((item) => catalogo.some((producto) => producto.slug === item.slug && producto.disponible !== false));
  if (disponibles.length !== carrito.length) window.LuziaCarrito.guardarCarrito(disponibles);
  if (!disponibles.length) return renderizarVacio();

  const lista = elemento("section", undefined, "cart-list");
  lista.setAttribute("aria-label", "Productos en el carrito");
  let total = 0;
  disponibles.forEach((item) => {
    const producto = catalogo.find((dato) => dato.slug === item.slug);
    total += window.LuziaCarrito.calcularSubtotal(producto, item.cantidad);
    lista.append(crearFila(producto, item.cantidad));
  });
  const resumen = elemento("aside", undefined, "cart-summary");
  resumen.append(
    elemento("h2", "Resumen"),
    Object.assign(elemento("div", undefined, "cart-summary__row"), { innerHTML: `<span>Subtotal productos</span><strong>${window.LuziaCarrito.formatearPrecio(total)}</strong>` }),
    Object.assign(elemento("div", undefined, "cart-summary__row cart-summary__total"), { innerHTML: `<span>Total</span><strong>${window.LuziaCarrito.formatearPrecio(total)}</strong>` }),
    elemento("p", "El envío y la forma de entrega se coordinan al finalizar el pedido.", "cart-summary__note"),
    Object.assign(elemento("a", "Continuar comprando", "button cart-summary__button"), { href: "productos.html" })
  );
  contenedorCarrito.replaceChildren(lista, resumen);
}

async function iniciarPaginaCarrito() {
  try {
    const respuesta = await fetch("data/productos.json");
    if (!respuesta.ok) throw new Error(`No se pudo cargar el catálogo: ${respuesta.status}`);
    catalogo = await respuesta.json();
    renderizarCarrito();
  } catch (error) {
    console.error(error);
    contenedorCarrito.replaceChildren(elemento("p", "No pudimos cargar el carrito. Intentá nuevamente en unos minutos.", "cart-load-error"));
  }
  contenedorCarrito.setAttribute("aria-busy", "false");
}

if (contenedorCarrito) iniciarPaginaCarrito();
