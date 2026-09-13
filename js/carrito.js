"use strict";

const contenedorCarrito = document.querySelector("#carrito-contenido");
const anuncioCarrito = document.querySelector("#carrito-anuncio");
let catalogo = [];
const CLAVE_PAGO = "luzia_checkout_payment_v1";

function obtenerPago() {
  try {
    const pago = window.sessionStorage.getItem(CLAVE_PAGO);
    return pago === "transferencia" || pago === "otro" ? pago : "";
  } catch (error) {
    return "";
  }
}

function guardarPago(pago) {
  try { window.sessionStorage.setItem(CLAVE_PAGO, pago); } catch (error) {
    // La elección sigue activa en los controles aunque sessionStorage no esté disponible.
  }
}

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
  const fieldset = elemento("fieldset", undefined, "payment-options");
  fieldset.append(elemento("legend", "Forma de pago"));
  const pagoInicial = obtenerPago();
  [
    { valor: "transferencia", titulo: "Transferencia bancaria", ayuda: "10% de descuento" },
    { valor: "otro", titulo: "Otro medio de pago", ayuda: "El total se mantiene sin descuento" }
  ].forEach((opcion) => {
    const label = elemento("label", undefined, "payment-option");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "forma-pago";
    input.value = opcion.valor;
    input.checked = pagoInicial === opcion.valor;
    const copy = elemento("span", undefined, "payment-option__copy");
    copy.append(elemento("strong", opcion.titulo), elemento("small", opcion.ayuda));
    label.append(input, copy);
    fieldset.append(label);
  });
  const descuentoFila = Object.assign(elemento("div", undefined, "cart-summary__row cart-summary__discount"), { hidden: true });
  const totalFila = elemento("div", undefined, "cart-summary__row cart-summary__total");
  const estado = elemento("p", "Elegí una forma de pago para continuar.", "cart-summary__status");
  estado.setAttribute("aria-live", "polite");
  const finalizar = elemento("button", "Finalizar pedido", "button cart-summary__button cart-summary__checkout");
  finalizar.type = "button";
  const continuar = Object.assign(elemento("a", "Continuar comprando", "cart-summary__continue"), { href: "productos.html" });

  function actualizarResumen(pago) {
    const descuento = pago === "transferencia" ? Math.round(total * 0.10) : 0;
    descuentoFila.hidden = descuento === 0;
    descuentoFila.replaceChildren(elemento("span", "Descuento transferencia (10%)"), elemento("strong", `− ${window.LuziaCarrito.formatearPrecio(descuento)}`));
    totalFila.replaceChildren(elemento("span", "Total"), elemento("strong", window.LuziaCarrito.formatearPrecio(total - descuento)));
    finalizar.disabled = !pago;
    estado.textContent = pago ? (pago === "transferencia" ? `Descuento aplicado. Total ${window.LuziaCarrito.formatearPrecio(total - descuento)}.` : `Total ${window.LuziaCarrito.formatearPrecio(total)} sin descuento.`) : "Elegí una forma de pago para continuar.";
  }

  fieldset.addEventListener("change", (event) => {
    if (!event.target.matches('input[name="forma-pago"]')) return;
    guardarPago(event.target.value);
    actualizarResumen(event.target.value);
  });
  finalizar.addEventListener("click", () => {
    if (window.LuziaCarrito.obtenerCarrito().length && obtenerPago()) window.location.href = "checkout.html";
  });
  resumen.append(
    elemento("h2", "Resumen"),
    Object.assign(elemento("div", undefined, "cart-summary__row"), { innerHTML: `<span>Subtotal productos</span><strong>${window.LuziaCarrito.formatearPrecio(total)}</strong>` }),
    fieldset, descuentoFila, totalFila, estado, finalizar, continuar
  );
  actualizarResumen(pagoInicial);
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
