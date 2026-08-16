"use strict";

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// Las fotografías se revelan únicamente después de cargar. Si el archivo aún no
// existe, el atributo hidden conserva el placeholder editorial del contenedor.
document.querySelectorAll("[data-local-photo]").forEach((image) => {
  const revealImage = () => { image.hidden = false; };
  const keepFallback = () => { image.hidden = true; };

  image.addEventListener("load", revealImage);
  image.addEventListener("error", keepFallback);

  if (image.complete) {
    image.naturalWidth > 0 ? revealImage() : keepFallback();
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
