"use strict";

function activarPromocionDiaMadre() {
  if (!window.LuziaCarrito?.promocionDiaMadreActiva()) return;

  document.querySelectorAll("[data-mother-promo]").forEach((elemento) => {
    elemento.hidden = false;
  });

  const header = document.querySelector(".site-header");
  if (!header || document.querySelector(".promo-bar")) return;

  const barra = document.createElement("aside");
  barra.className = "promo-bar";
  barra.setAttribute("aria-label", "Promoción Día de la Madre");
  barra.innerHTML = '<div class="container promo-bar__content"><strong>Día de la Madre</strong><span>10% OFF en toda la tienda</span><span class="promo-bar__separator" aria-hidden="true">·</span><span>20% OFF total con transferencia</span><span class="promo-bar__separator" aria-hidden="true">·</span><span>Hasta el 31/10</span></div>';
  header.before(barra);
}

activarPromocionDiaMadre();

function obtenerBarraCarritoMobile() {
  let barra = document.querySelector(".mobile-cart-bar");
  if (barra) return barra;

  barra = document.createElement("a");
  barra.className = "mobile-cart-bar";
  barra.href = "carrito.html";
  barra.hidden = true;
  barra.innerHTML = '<span>Ver carrito</span><strong data-mobile-cart-copy></strong>';
  document.body.append(barra);
  return barra;
}

function actualizarIndicadoresCarrito() {
  if (!window.LuziaCarrito) return;

  const cantidad = window.LuziaCarrito.obtenerCantidadTotal();

  document.querySelectorAll("[data-cart-link]").forEach((enlace) => {
    enlace.setAttribute("aria-label", `Ver carrito, ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`);

    if (!enlace.querySelector(".site-cart__text")) {
      const texto = document.createElement("span");
      texto.className = "site-cart__text";
      texto.textContent = "Carrito";
      const badge = enlace.querySelector("[data-cart-count]");
      enlace.insertBefore(texto, badge || null);
    }

    const badge = enlace.querySelector("[data-cart-count]");
    if (badge) {
      badge.textContent = cantidad;
      badge.hidden = cantidad === 0;
    }
  });

  const pagina = window.location.pathname.split("/").pop() || "index.html";
  const puedeMostrarFlotante = pagina !== "carrito.html" && pagina !== "checkout.html";
  const barra = obtenerBarraCarritoMobile();
  barra.hidden = !(cantidad > 0 && puedeMostrarFlotante);

  if (!barra.hidden) {
    const copy = barra.querySelector("[data-mobile-cart-copy]");
    copy.textContent = `${cantidad} ${cantidad === 1 ? "producto" : "productos"}`;
    document.body.classList.add("has-mobile-cart-bar");
  } else {
    document.body.classList.remove("has-mobile-cart-bar");
  }
}

actualizarIndicadoresCarrito();
window.addEventListener("luzia:carrito-actualizado", actualizarIndicadoresCarrito);
window.addEventListener("storage", (event) => {
  if (event.key === window.LuziaCarrito?.CLAVE) actualizarIndicadoresCarrito();
});

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// Las fotografías se revelan únicamente después de cargar. Si el archivo aún no
// existe, el atributo hidden conserva el placeholder editorial del contenedor.
document.querySelectorAll("[data-local-photo]").forEach((image) => {
  const revealImage = () => {
    image.hidden = false;
    image.parentElement?.classList.add("has-photo");
  };
  const keepFallback = () => {
    image.hidden = true;
    image.parentElement?.classList.remove("has-photo");
  };

  image.addEventListener("load", revealImage);
  image.addEventListener("error", keepFallback);

  if (image.complete) {
    image.naturalWidth > 0 ? revealImage() : keepFallback();
  }

  // Cuando hay una versión WebP disponible, se valida antes de reemplazar el
  // JPG. Así un WebP ausente nunca provoca un icono roto ni altera el fallback.
  const preferredSource = image.dataset.preferredSrc;
  if (preferredSource) {
    const preferredImage = new Image();
    preferredImage.addEventListener("load", () => {
      image.src = preferredSource;
    });
    preferredImage.src = preferredSource;
  }
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNavigation = document.querySelector("#main-navigation");

if (menuToggle && mainNavigation) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mainNavigation.classList.toggle("is-open", !isOpen);
  });

  mainNavigation.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNavigation.classList.remove("is-open");
    }
  });
}
