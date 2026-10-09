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

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('[type="submit"]');
    const originalLabel = submitButton?.textContent;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    if (status) {
      status.textContent = "";
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("https://formsubmit.co/ajax/luziacosmeticanatural@gmail.com", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.success === "false" || data.success === false) {
        throw new Error(data.message || "No se pudo enviar el formulario.");
      }

      form.reset();

      if (reason && allowedReasons.has(requestedReason)) {
        reason.value = requestedReason;
      }

      if (status) {
        status.textContent = "Gracias por escribirnos. Recibimos tu consulta y te responderemos a la brevedad.";
      }
    } catch (error) {
      if (status) {
        status.textContent = "No pudimos enviar tu consulta en este momento. Por favor, intentá nuevamente.";
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel || "Enviar consulta";
      }
    }
  });
})();
