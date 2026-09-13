"use strict";

const CLAVE_PAGO = "luzia_checkout_payment_v1";
const contenido = document.querySelector("#checkout-contenido");
const formulario = document.querySelector("#checkout-form");
const resumen = document.querySelector("#checkout-resumen");
const confirmacion = document.querySelector("#pedido-confirmado");
const estadoFormulario = document.querySelector("#form-status");
let detallePedido = null;
let pedidoEnMemoria = null;

function elemento(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function obtenerPago() {
  try {
    const pago = window.sessionStorage.getItem(CLAVE_PAGO);
    return pago === "transferencia" || pago === "otro" ? pago : "";
  } catch (error) { return ""; }
}

function calcularPedido(catalogo) {
  const carrito = window.LuziaCarrito.obtenerCarrito();
  const productos = carrito.flatMap((item) => {
    const producto = catalogo.find((dato) => dato.slug === item.slug && dato.disponible !== false);
    if (!producto) return [];
    return [{
      slug: producto.slug,
      nombre: producto.nombre,
      imagen: producto.imagen,
      cantidad: item.cantidad,
      precioUnitario: producto.precio,
      subtotal: window.LuziaCarrito.calcularSubtotal(producto, item.cantidad)
    }];
  });
  const validos = productos.map(({ slug, cantidad }) => ({ slug, cantidad }));
  if (validos.length !== carrito.length) window.LuziaCarrito.guardarCarrito(validos);
  const subtotal = productos.reduce((suma, producto) => suma + producto.subtotal, 0);
  const pago = obtenerPago();
  const descuento = pago === "transferencia" ? Math.round(subtotal * 0.10) : 0;
  return { productos, subtotal, descuento, total: subtotal - descuento, pago };
}

function crearFilaResumen(nombre, valor, clase = "") {
  const fila = elemento("div", undefined, `cart-summary__row ${clase}`.trim());
  fila.append(elemento("span", nombre), elemento("strong", valor));
  return fila;
}

function renderizarResumen() {
  const lista = elemento("div", undefined, "checkout-products");
  lista.append(elemento("h2", "Productos seleccionados"));
  detallePedido.productos.forEach((producto) => {
    const item = elemento("article", undefined, "checkout-product");
    const imagen = document.createElement("img");
    imagen.src = producto.imagen;
    imagen.alt = "";
    const texto = elemento("div");
    texto.append(elemento("h3", producto.nombre), elemento("p", `Cantidad: ${producto.cantidad}`));
    item.append(imagen, texto, elemento("strong", window.LuziaCarrito.formatearPrecio(producto.subtotal)));
    lista.append(item);
  });
  const totales = elemento("div", undefined, "checkout-totals");
  totales.append(crearFilaResumen("Subtotal productos", window.LuziaCarrito.formatearPrecio(detallePedido.subtotal)));
  if (detallePedido.descuento) totales.append(crearFilaResumen("Descuento transferencia 10%", `− ${window.LuziaCarrito.formatearPrecio(detallePedido.descuento)}`, "cart-summary__discount"));
  totales.append(crearFilaResumen("Total", window.LuziaCarrito.formatearPrecio(detallePedido.total), "cart-summary__total"));
  const pago = elemento("p", undefined, "checkout-payment");
  pago.append(elemento("span", "Forma de pago:"), elemento("strong", detallePedido.pago === "transferencia" ? "Transferencia bancaria" : "Otro medio de pago"));
  resumen.replaceChildren(lista, totales, pago);
}

function generarObjetoPedido() {
  const datos = new FormData(formulario);
  return {
    cliente: {
      nombre: datos.get("nombre").trim(), telefono: datos.get("telefono").trim(),
      email: datos.get("email").trim(), localidad: datos.get("localidad").trim(),
      direccion: datos.get("direccion").trim(), notas: datos.get("notas").trim()
    },
    entrega: datos.get("entrega") || "",
    pago: detallePedido.pago,
    productos: detallePedido.productos.map(({ slug, nombre, cantidad, precioUnitario, subtotal }) => ({ slug, nombre, cantidad, precioUnitario, subtotal })),
    subtotal: detallePedido.subtotal, descuento: detallePedido.descuento, total: detallePedido.total
  };
}

function validarFormulario() {
  let primero = null;
  ["nombre", "telefono", "localidad"].forEach((nombre) => {
    const campo = formulario.elements[nombre];
    const error = document.querySelector(`#${nombre}-error`);
    const invalido = !campo.value.trim();
    campo.setAttribute("aria-invalid", String(invalido));
    error.textContent = invalido ? "Completá este campo para continuar." : "";
    if (invalido && !primero) primero = campo;
  });
  const email = formulario.elements.email;
  const errorEmail = document.querySelector("#email-error");
  const emailInvalido = email.value.trim() && !email.validity.valid;
  email.setAttribute("aria-invalid", String(Boolean(emailInvalido)));
  errorEmail.textContent = emailInvalido ? "Ingresá un email válido o dejá el campo vacío." : "";
  if (emailInvalido && !primero) primero = email;
  if (primero) primero.focus();
  return !primero;
}

function mostrarConfirmacion(pedido) {
  const productos = elemento("ul", undefined, "order-ready__products");
  pedido.productos.forEach((producto) => productos.append(elemento("li", `${producto.nombre} — ${producto.cantidad}`)));
  const descuento = pedido.descuento ? `Descuento por transferencia: − ${window.LuziaCarrito.formatearPrecio(pedido.descuento)}` : "Sin descuento por forma de pago";
  confirmacion.replaceChildren(
    elemento("p", "Pedido revisado", "eyebrow"), elemento("h2", "Tu pedido está listo para enviar"),
    elemento("p", `Nombre: ${pedido.cliente.nombre}`), productos,
    elemento("p", `Forma de pago: ${pedido.pago === "transferencia" ? "Transferencia bancaria" : "Otro medio de pago"}`),
    elemento("p", descuento), elemento("p", `Total: ${window.LuziaCarrito.formatearPrecio(pedido.total)}`, "order-ready__total"),
    elemento("p", `Forma de entrega: ${pedido.entrega || "A coordinar"}`),
    elemento("p", "En el próximo paso conectaremos la confirmación con el canal de venta de Luzia.", "order-ready__note")
  );
  contenido.hidden = true;
  confirmacion.hidden = false;
  confirmacion.setAttribute("tabindex", "-1");
  confirmacion.focus();
}

formulario.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validarFormulario()) {
    estadoFormulario.textContent = "Revisá los campos señalados para continuar.";
    return;
  }
  estadoFormulario.textContent = "Datos completos. Preparamos el resumen final.";
  pedidoEnMemoria = generarObjetoPedido();
  mostrarConfirmacion(pedidoEnMemoria);
});

async function iniciarCheckout() {
  try {
    if (!obtenerPago()) throw new Error("Falta elegir una forma de pago.");
    const respuesta = await fetch("data/productos.json");
    if (!respuesta.ok) throw new Error(`No se pudo cargar el catálogo: ${respuesta.status}`);
    detallePedido = calcularPedido(await respuesta.json());
    if (!detallePedido.productos.length) throw new Error("El carrito está vacío.");
    renderizarResumen();
  } catch (error) {
    console.error(error);
    formulario.hidden = true;
    resumen.replaceChildren(elemento("h2", "No pudimos preparar el pedido"), elemento("p", "Volvé al carrito para revisar tus productos y elegir una forma de pago."), Object.assign(elemento("a", "Volver al carrito", "button"), { href: "carrito.html" }));
  }
  contenido.setAttribute("aria-busy", "false");
}

iniciarCheckout();
