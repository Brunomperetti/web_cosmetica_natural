"use strict";

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
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
