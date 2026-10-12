"use strict";

const contenido = document.querySelector("#checkout-contenido");
const formulario = document.querySelector("#checkout-form");
const resumen = document.querySelector("#checkout-resumen");
const confirmacion = document.querySelector("#pedido-confirmado");
const estadoFormulario = document.querySelector("#form-status");
const botonConfirmar = formulario?.querySelector(".checkout-confirm");
const config = window.LuziaCheckoutConfig || {};
let catalogo = [];
let subtotalBase = 0;

function elemento(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

function obtenerPagoSeleccionado() {
  return formulario?.querySelector('input[name="pago"]:checked')?.value || "";
}

function generarReferenciaPedido() {
  const fecha = new Date();
  const dos = (valor) => String(valor).padStart(2, "0");
  const sello = `${fecha.getFullYear()}${dos(fecha.getMonth() + 1)}${dos(fecha.getDate())}-${dos(fecha.getHours())}${dos(fecha.getMinutes())}${dos(fecha.getSeconds())}`;
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LZ-${sello}-${sufijo}`;
}

function calcularDetalle(pago = obtenerPagoSeleccionado()) {
  const productos = window.LuziaCarrito.obtenerCarrito().flatMap((item) => {
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

  const subtotal = productos.reduce((suma, producto) => suma + producto.subtotal, 0);
  const pagoParaCalculo = pago === "transferencia" ? "transferencia" : "otro";
  const descuentos = window.LuziaCarrito.calcularDescuentosCompra(subtotal, pagoParaCalculo);

  return {
    productos,
    subtotal,
    pago,
    descuentoDiaMadre: descuentos.descuentoDiaMadre,
    descuentoTransferencia: pago === "transferencia" ? descuentos.descuentoTransferencia : 0,
    descuento: descuentos.descuentoDiaMadre + (pago === "transferencia" ? descuentos.descuentoTransferencia : 0),
    total: subtotal - descuentos.descuentoDiaMadre - (pago === "transferencia" ? descuentos.descuentoTransferencia : 0)
  };
}

function crearFilaResumen(nombre, valor, clase = "") {
  const fila = elemento("div", undefined, `cart-summary__row ${clase}`.trim());
  fila.append(elemento("span", nombre), elemento("strong", valor));
  return fila;
}

function renderizarResumen() {
  const detalle = calcularDetalle();

  const lista = elemento("div", undefined, "checkout-products");
  lista.append(elemento("p", "Tu compra", "eyebrow"), elemento("h2", "Resumen"));

  detalle.productos.forEach((producto) => {
    const item = elemento("article", undefined, "checkout-product");
    const imagen = document.createElement("img");
    imagen.src = producto.imagen;
    imagen.alt = "";
    imagen.loading = "lazy";
    imagen.decoding = "async";

    const texto = elemento("div");
    texto.append(elemento("h3", producto.nombre), elemento("p", `Cantidad: ${producto.cantidad}`));
    item.append(imagen, texto, elemento("strong", window.LuziaCarrito.formatearPrecio(producto.subtotal)));
    lista.append(item);
  });

  const totales = elemento("div", undefined, "checkout-totals");
  totales.append(crearFilaResumen("Subtotal productos", window.LuziaCarrito.formatearPrecio(detalle.subtotal)));

  if (detalle.descuentoDiaMadre) {
    totales.append(crearFilaResumen("Día de la Madre 10%", `− ${window.LuziaCarrito.formatearPrecio(detalle.descuentoDiaMadre)}`, "cart-summary__discount"));
  }

  if (detalle.descuentoTransferencia) {
    totales.append(crearFilaResumen("Transferencia 10% extra", `− ${window.LuziaCarrito.formatearPrecio(detalle.descuentoTransferencia)}`, "cart-summary__discount"));
  }

  totales.append(crearFilaResumen(detalle.pago ? "Total" : "Total con promo", window.LuziaCarrito.formatearPrecio(detalle.total), "cart-summary__total"));

  const pago = elemento("div", undefined, "checkout-payment");
  if (!detalle.pago) {
    pago.append(elemento("span", "Pago"), elemento("strong", "Elegí una opción para continuar"));
  } else {
    pago.append(
      elemento("span", "Pago elegido"),
      elemento("strong", detalle.pago === "transferencia" ? "Transferencia por WhatsApp" : "Mercado Pago")
    );
  }

  const entrega = elemento("div", undefined, "checkout-delivery-summary");
  entrega.append(
    elemento("span", "Entrega"),
    elemento("strong", "A coordinar con el vendedor"),
    elemento("small", "Envío no incluido · Gratis desde $60.000 en Cabalango, Villa Carlos Paz, Tanti y Santa Cruz del Lago")
  );

  resumen.replaceChildren(lista, totales, pago, entrega);
  subtotalBase = detalle.subtotal;
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

  if (!obtenerPagoSeleccionado() && !primero) {
    primero = formulario.querySelector('input[name="pago"]:not(:disabled)');
    estadoFormulario.textContent = "Elegí cómo querés pagar para continuar.";
  }

  if (primero) primero.focus();
  return !primero;
}

function generarPedido() {
  const datos = new FormData(formulario);
  const pago = obtenerPagoSeleccionado();
  const detalle = calcularDetalle(pago);

  return {
    referencia: generarReferenciaPedido(),
    cliente: {
      nombre: datos.get("nombre").trim(),
      telefono: datos.get("telefono").trim(),
      email: datos.get("email").trim(),
      localidad: datos.get("localidad").trim(),
      direccion: datos.get("direccion").trim(),
      notas: datos.get("notas").trim()
    },
    entrega: "A coordinar con el vendedor",
    pago,
    regalo: datos.get("regalo") === "si",
    dedicatoria: (datos.get("dedicatoria") || "").trim(),
    productos: detalle.productos,
    subtotal: detalle.subtotal,
    descuentoDiaMadre: detalle.descuentoDiaMadre,
    descuentoTransferencia: detalle.descuentoTransferencia,
    descuento: detalle.descuento,
    total: detalle.total
  };
}

function lineasProductos(pedido) {
  return pedido.productos.map((producto) =>
    `${producto.cantidad} x ${producto.nombre} — ${window.LuziaCarrito.formatearPrecio(producto.subtotal)}`
  ).join("\n");
}

function construirMensajeWhatsApp(pedido) {
  const descuentos = [];
  if (pedido.descuentoDiaMadre) descuentos.push(`Día de la Madre: -${window.LuziaCarrito.formatearPrecio(pedido.descuentoDiaMadre)}`);
  if (pedido.descuentoTransferencia) descuentos.push(`Transferencia: -${window.LuziaCarrito.formatearPrecio(pedido.descuentoTransferencia)}`);

  return [
    "Hola Luzia, quiero confirmar este pedido:",
    "",
    `Pedido: ${pedido.referencia}`,
    `Nombre: ${pedido.cliente.nombre}`,
    `Teléfono: ${pedido.cliente.telefono}`,
    `Localidad: ${pedido.cliente.localidad}`,
    pedido.cliente.direccion ? `Dirección / referencia: ${pedido.cliente.direccion}` : "",
    "",
    "Productos:",
    lineasProductos(pedido),
    "",
    `Subtotal: ${window.LuziaCarrito.formatearPrecio(pedido.subtotal)}`,
    ...descuentos,
    `TOTAL: ${window.LuziaCarrito.formatearPrecio(pedido.total)}`,
    "",
    "Pago: transferencia bancaria",
    "Entrega: a coordinar con el vendedor",
    "Envío: no incluido en el total. Gratis desde $60.000 en Cabalango, Villa Carlos Paz, Tanti y Santa Cruz del Lago.",
    pedido.regalo ? "Es para regalo por el Día de la Madre." : "",
    pedido.dedicatoria ? `Dedicatoria: ${pedido.dedicatoria}` : "",
    pedido.cliente.notas ? `Notas: ${pedido.cliente.notas}` : ""
  ].filter(Boolean).join("\n");
}

function construirPayloadEmail(pedido) {
  return {
    _subject: `Nuevo pedido Luzia · ${pedido.referencia}`,
    referencia: pedido.referencia,
    cliente: pedido.cliente.nombre,
    telefono: pedido.cliente.telefono,
    email_cliente: pedido.cliente.email || "No informado",
    localidad: pedido.cliente.localidad,
    direccion: pedido.cliente.direccion || "A coordinar",
    entrega: pedido.entrega,
    politica_envio: "Envío no incluido en el total. Gratis desde $60.000 en Cabalango, Villa Carlos Paz, Tanti y Santa Cruz del Lago.",
    pago: pedido.pago === "transferencia" ? "Transferencia por WhatsApp" : "Mercado Pago",
    productos: lineasProductos(pedido),
    subtotal: window.LuziaCarrito.formatearPrecio(pedido.subtotal),
    descuento_dia_madre: pedido.descuentoDiaMadre ? window.LuziaCarrito.formatearPrecio(pedido.descuentoDiaMadre) : "—",
    descuento_transferencia: pedido.descuentoTransferencia ? window.LuziaCarrito.formatearPrecio(pedido.descuentoTransferencia) : "—",
    total: window.LuziaCarrito.formatearPrecio(pedido.total),
    regalo: pedido.regalo ? "Sí" : "No",
    dedicatoria: pedido.dedicatoria || "—",
    notas: pedido.cliente.notas || "—"
  };
}

async function enviarPedidoPorEmail(pedido) {
  if (!config.orderEmailEndpoint) return false;

  const respuesta = await fetch(config.orderEmailEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(construirPayloadEmail(pedido))
  });

  const data = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || data.success === "false" || data.success === false) {
    throw new Error(data.message || "No se pudo registrar el pedido por email.");
  }
  return true;
}

function actualizarPagoDisponible() {
  const opcionMercadoPago = formulario.querySelector('[data-payment-option="mercadopago"]');
  const inputMercadoPago = opcionMercadoPago?.querySelector('input[value="mercadopago"]');
  const estadoMercadoPago = opcionMercadoPago?.querySelector("[data-mp-status]");

  if (!inputMercadoPago) return;

  if (!config.mercadoPagoLink) {
    inputMercadoPago.disabled = true;
    opcionMercadoPago.classList.add("is-disabled");
    if (estadoMercadoPago) estadoMercadoPago.textContent = "Se habilita cuando carguemos el enlace de cobro.";
    return;
  }

  inputMercadoPago.disabled = false;
  opcionMercadoPago.classList.remove("is-disabled");
  if (estadoMercadoPago) {
    const detalle = calcularDetalle("mercadopago");
    estadoMercadoPago.textContent = `En Mercado Pago ingresá exactamente ${window.LuziaCarrito.formatearPrecio(detalle.total)}.`;
  }
}

function actualizarBotonPago() {
  const pago = obtenerPagoSeleccionado();
  if (!botonConfirmar) return;

  botonConfirmar.disabled = !pago;
  if (pago === "transferencia") {
    botonConfirmar.textContent = "Enviar pedido por WhatsApp";
  } else if (pago === "mercadopago") {
    const detalle = calcularDetalle("mercadopago");
    botonConfirmar.textContent = `Pagar ${window.LuziaCarrito.formatearPrecio(detalle.total)} con Mercado Pago`;
  } else {
    botonConfirmar.textContent = "Elegí una forma de pago";
  }
}

formulario.addEventListener("change", (event) => {
  if (event.target.matches('input[name="pago"]')) {
    estadoFormulario.textContent = "";
    actualizarBotonPago();
    renderizarResumen();
  }
});

formulario.addEventListener("submit", async (event) => {
  event.preventDefault();
  estadoFormulario.textContent = "";

  if (!validarFormulario()) return;

  const pedido = generarPedido();
  const pago = pedido.pago;
  botonConfirmar.disabled = true;
  botonConfirmar.textContent = "Registrando pedido…";
  estadoFormulario.textContent = "Estamos registrando tu pedido.";

  let emailRegistrado = false;
  try {
    emailRegistrado = await enviarPedidoPorEmail(pedido);
  } catch (error) {
    console.error(error);
  }

  if (pago === "transferencia") {
    if (!config.whatsappNumber) {
      estadoFormulario.textContent = "No pudimos abrir WhatsApp. Escribinos desde la sección Contacto.";
      actualizarBotonPago();
      return;
    }

    const mensaje = construirMensajeWhatsApp(pedido);
    const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(mensaje)}`;
    window.LuziaCarrito.vaciarCarrito();
    estadoFormulario.textContent = emailRegistrado
      ? "Pedido registrado. Abrimos WhatsApp para terminar de coordinarlo."
      : "Abrimos WhatsApp para que puedas enviarnos el pedido.";
    window.location.href = url;
    return;
  }

  if (pago === "mercadopago") {
    if (!config.mercadoPagoLink) {
      estadoFormulario.textContent = "Mercado Pago todavía no está habilitado. Elegí transferencia o volvé más tarde.";
      actualizarBotonPago();
      return;
    }

    estadoFormulario.textContent = `Pedido registrado. En Mercado Pago ingresá exactamente ${window.LuziaCarrito.formatearPrecio(pedido.total)}.`;
    window.location.href = config.mercadoPagoLink;
  }
});

async function iniciarCheckout() {
  try {
    const respuesta = await fetch("data/productos.json");
    if (!respuesta.ok) throw new Error(`No se pudo cargar el catálogo: ${respuesta.status}`);
    catalogo = await respuesta.json();

    const carrito = window.LuziaCarrito.obtenerCarrito();
    const validos = carrito.filter((item) => catalogo.some((producto) => producto.slug === item.slug && producto.disponible !== false));
    if (validos.length !== carrito.length) window.LuziaCarrito.guardarCarrito(validos);
    if (!validos.length) throw new Error("El carrito está vacío.");

    actualizarPagoDisponible();
    actualizarBotonPago();
    renderizarResumen();
  } catch (error) {
    console.error(error);
    formulario.hidden = true;
    resumen.replaceChildren(
      elemento("h2", "No pudimos preparar el pedido"),
      elemento("p", "Volvé al carrito para revisar tu selección."),
      Object.assign(elemento("a", "Volver al carrito", "button"), { href: "carrito.html" })
    );
  }

  contenido.setAttribute("aria-busy", "false");
}

iniciarCheckout();
