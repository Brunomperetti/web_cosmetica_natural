"use strict";

const productosContainer = document.querySelector("#productos-container");
const filtros = [...document.querySelectorAll(".shop-filter")];
const ordenCategorias = ["Facial", "Corporal", "Cabello", "Bienestar", "Jabones"];
let temporizadorFiltro;

function formatearPrecio(precio) {
  return `$${precio.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function obtenerCategoriaInicial() {
  const categoriaSolicitada = new URLSearchParams(window.location.search).get("categoria");
  return ordenCategorias.includes(categoriaSolicitada) ? categoriaSolicitada : "Todos";
}

function activarFiltro(categoria) {
  filtros.forEach((filtro) => {
    const estaActivo = filtro.dataset.category === categoria;
    filtro.classList.toggle("is-active", estaActivo);
    filtro.setAttribute("aria-pressed", String(estaActivo));
  });
}

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

  const microdatos = [
    producto.beneficio,
    Array.isArray(producto.beneficios) ? producto.beneficios.find(Boolean) : producto.beneficios,
    producto.tipoPiel,
    producto.tipoCabello,
    producto.contenido,
    producto.ingredienteProtagonista
  ].filter((dato, indice, datos) => typeof dato === "string" && dato.trim() && datos.indexOf(dato) === indice).slice(0, 2);

  microdatos.forEach((dato) => {
    const detalle = document.createElement("p");
    detalle.className = "product-card__microdata";
    detalle.textContent = dato.trim();
    contenidoOverlay.append(detalle);
  });

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
    precio.textContent = formatearPrecio(producto.precio);
    informacion.append(precio);
  }

  enlace.append(visual, nombre, informacion);
  tarjeta.append(enlace);
  return tarjeta;
}

function crearColeccion(categoria, productos) {
  const seccion = document.createElement("section");
  seccion.className = "shop-collection";
  seccion.dataset.category = categoria;

  const encabezado = document.createElement("header");
  encabezado.className = "shop-collection__heading";
  const titulo = document.createElement("h2");
  titulo.textContent = categoria === "Facial" ? "Cuidado facial" : categoria === "Corporal" ? "Cuidado corporal" : categoria;
  encabezado.append(titulo);

  const grilla = document.createElement("div");
  grilla.className = "product-grid";
  const tarjetas = productos.map(crearTarjetaProducto);
  grilla.append(...tarjetas);
  seccion.append(encabezado, grilla);
  return { seccion, tarjetas };
}

function renderizarCatalogo(productos, categoria = "Todos") {
  const tarjetas = [];
  const fragmento = document.createDocumentFragment();

  if (categoria === "Todos") {
    ordenCategorias.forEach((nombreCategoria) => {
      const productosCategoria = productos.filter((producto) => producto.categoria === nombreCategoria);
      if (!productosCategoria.length) return;
      const coleccion = crearColeccion(nombreCategoria, productosCategoria);
      tarjetas.push(...coleccion.tarjetas);
      fragmento.append(coleccion.seccion);
    });
  } else {
    const grilla = document.createElement("div");
    grilla.className = "product-grid product-grid--filtered";
    const productosFiltrados = productos.filter((producto) => producto.categoria === categoria);
    const nuevasTarjetas = productosFiltrados.map(crearTarjetaProducto);
    tarjetas.push(...nuevasTarjetas);
    grilla.append(...nuevasTarjetas);
    fragmento.append(grilla);
  }

  productosContainer.classList.remove("is-changing");
  productosContainer.replaceChildren(fragmento);
  productosContainer.setAttribute("aria-busy", "false");
  observarEntradaTarjetas(tarjetas);
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
    const productosVisibles = seleccion.slice(0, limite);

    if (filtros.length && productosContainer.classList.contains("shop-collections")) {
      const categoriaInicial = obtenerCategoriaInicial();
      activarFiltro(categoriaInicial);
      renderizarCatalogo(productosVisibles, categoriaInicial);
      filtros.forEach((filtro) => {
        filtro.addEventListener("click", () => {
          activarFiltro(filtro.dataset.category);
          productosContainer.classList.add("is-changing");
          window.clearTimeout(temporizadorFiltro);
          temporizadorFiltro = window.setTimeout(() => renderizarCatalogo(productosVisibles, filtro.dataset.category), 120);
        });
      });
    } else {
      const tarjetas = productosVisibles.map(crearTarjetaProducto);
      productosContainer.replaceChildren(...tarjetas);
      observarEntradaTarjetas(tarjetas);
    }
  } catch (error) {
    console.error(error);
    productosContainer.textContent = "No fue posible cargar los productos.";
  }
}

if (productosContainer) {
  cargarProductos();
}
