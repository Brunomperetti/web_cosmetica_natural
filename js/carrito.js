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
  imagen.loading = "lazy";
  imagen.decoding = "async";

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

  let subtotal = 0;
  disponibles.forEach((item) => {
    const producto = catalogo.find((dato) => dato.slug === item.slug);
    subtotal += window.LuziaCarrito.calcularSubtotal(producto, item.cantidad);
    lista.append(crearFila(producto, item.cantidad));
  });

  const resumen = elemento("aside", undefined, "cart-summary");
  const descuentoBase = window.LuziaCarrito.calcularDescuentosCompra(subtotal, "otro");
  const totalParcial = descuentoBase.total;

  resumen.append(
    elemento("p", "Resumen de compra", "eyebrow"),
    elemento("h2", "Tu pedido"),
    Object.assign(elemento("div", undefined, "cart-summary__row"), {
      innerHTML: `<span>Subtotal productos</span><strong>${window.LuziaCarrito.formatearPrecio(subtotal)}</strong>`
    })
  );

  if (descuentoBase.descuentoDiaMadre) {
    const promo = elemento("div", undefined, "cart-summary__row cart-summary__discount");
    promo.append(
      elemento("span", "Día de la Madre (10%)"),
      elemento("strong", `− ${window.LuziaCarrito.formatearPrecio(descuentoBase.descuentoDiaMadre)}`)
    );
    resumen.append(promo);
  }

  const total = elemento("div", undefined, "cart-summary__row cart-summary__total");
  total.append(
    elemento("span", "Total parcial"),
    elemento("strong", window.LuziaCarrito.formatearPrecio(totalParcial))
  );

  const nota = elemento("div", undefined, "cart-summary__next");
  nota.append(
    elemento("strong", "En el siguiente paso"),
    elemento("p", descuentoBase.promoActiva
      ? "Completás tus datos, coordinás la entrega y elegís el pago. Con transferencia sumás 10% extra y llegás a 20% OFF total durante octubre."
      : "Completás tus datos, coordinás la entrega y elegís cómo pagar.")
  );

  const envio = elemento("div", undefined, "shipping-policy");
  envio.append(
    elemento("strong", "Envíos"),
    elemento("p", "El envío no está incluido en el total y puede tener costo. Es gratis en compras desde $60.000 para Cabalango, Villa Carlos Paz, Tanti y Santa Cruz del Lago. La modalidad y el horario se coordinan con el vendedor.")
  );

  const finalizar = elemento("button", "Continuar compra", "button cart-summary__button cart-summary__checkout");
  finalizar.type = "button";
  finalizar.addEventListener("click", () => {
    try { window.sessionStorage.removeItem("luzia_checkout_payment_v1"); } catch (error) {}
    window.location.href = "checkout.html";
  });

  const continuar = Object.assign(elemento("a", "Seguir comprando", "cart-summary__continue"), { href: "productos.html" });

  resumen.append(total, envio, nota, finalizar, continuar);
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
