(() => {
  const form = document.querySelector("[data-contact-form]");
  const reason = document.querySelector("[data-contact-reason]");
  const status = document.querySelector("[data-contact-status]");

  const params = new URLSearchParams(window.location.search);
  const requestedReason = params.get("motivo");
  const allowedReasons = new Set(["productos", "pedido", "mayorista", "otra"]);

  if (reason && allowedReasons.has(requestedReason)) {
    reason.value = requestedReason;
  }

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    if (status) {
      status.textContent = "El formulario está listo. Falta conectar el destino de envío antes de publicarlo.";
    }
  });
})();
