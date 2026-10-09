(() => {
  const reason = document.querySelector("[data-contact-reason]");
  const status = document.querySelector("[data-contact-status]");

  const params = new URLSearchParams(window.location.search);
  const requestedReason = params.get("motivo");
  const allowedReasons = new Set(["productos", "pedido", "mayorista", "otra"]);

  if (reason && allowedReasons.has(requestedReason)) {
    reason.value = requestedReason;
  }

  if (status && params.get("enviado") === "1") {
    status.textContent = "Gracias por escribirnos. Recibimos tu consulta y te responderemos a la brevedad.";
  }
})();
