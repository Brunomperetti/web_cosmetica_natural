"use strict";

(function iniciarCarrito(global) {
  const CLAVE = "luzia_cart_v1";

  function normalizar(carrito) {
    if (!Array.isArray(carrito)) return [];
    const cantidades = new Map();
    for (const item of carrito) {
      if (!item || typeof item.slug !== "string" || !item.slug.trim() ||
          !Number.isInteger(item.cantidad) || item.cantidad < 1) return [];
      cantidades.set(item.slug, (cantidades.get(item.slug) || 0) + item.cantidad);
    }
    return Array.from(cantidades, ([slug, cantidad]) => ({ slug, cantidad }));
  }

  function obtenerCarrito() {
    try {
      const guardado = global.localStorage.getItem(CLAVE);
      return guardado === null ? [] : normalizar(JSON.parse(guardado));
    } catch (error) {
      return [];
    }
  }

  function notificar(carrito) {
    global.dispatchEvent(new CustomEvent("luzia:carrito-actualizado", {
      detail: { carrito, cantidadTotal: carrito.reduce((total, item) => total + item.cantidad, 0) }
    }));
  }

  function guardarCarrito(carrito) {
    const carritoValido = normalizar(carrito);
    try {
      global.localStorage.setItem(CLAVE, JSON.stringify(carritoValido));
    } catch (error) {
      // El carrito continúa funcionando durante la visita aunque el navegador bloquee el almacenamiento.
    }
    notificar(carritoValido);
    return carritoValido;
  }

  function agregarProducto(slug, cantidad = 1) {
    if (typeof slug !== "string" || !slug.trim() || !Number.isInteger(cantidad) || cantidad < 1) return obtenerCarrito();
    const carrito = obtenerCarrito();
    const existente = carrito.find((item) => item.slug === slug);
    if (existente) existente.cantidad += cantidad;
    else carrito.push({ slug, cantidad });
    return guardarCarrito(carrito);
  }

  function quitarProducto(slug) {
    return guardarCarrito(obtenerCarrito().filter((item) => item.slug !== slug));
  }

  function actualizarCantidad(slug, cantidad) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) return quitarProducto(slug);
    const carrito = obtenerCarrito();
    const item = carrito.find((producto) => producto.slug === slug);
    if (item) item.cantidad = cantidad;
    return guardarCarrito(carrito);
  }

  function vaciarCarrito() { return guardarCarrito([]); }
  function obtenerCantidadTotal() { return obtenerCarrito().reduce((total, item) => total + item.cantidad, 0); }
  function obtenerCantidadProducto(slug) { return obtenerCarrito().find((item) => item.slug === slug)?.cantidad || 0; }
  function formatearPrecio(precio) { return `$${precio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`; }
  function calcularSubtotal(producto, cantidad) {
    if (producto.promocionCantidad && producto.promocionPrecio && cantidad >= producto.promocionCantidad) {
      const grupos = Math.floor(cantidad / producto.promocionCantidad);
      const resto = cantidad % producto.promocionCantidad;
      return (grupos * producto.promocionPrecio) + (resto * producto.precio);
    }
    return producto.precio * cantidad;
  }

  global.LuziaCarrito = Object.freeze({
    CLAVE, obtenerCarrito, guardarCarrito, agregarProducto, quitarProducto,
    actualizarCantidad, vaciarCarrito, obtenerCantidadTotal, obtenerCantidadProducto,
    formatearPrecio, calcularSubtotal
  });
})(window);
