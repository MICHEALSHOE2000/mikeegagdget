(() => {
  const form = document.querySelector("#standaloneSwapForm");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = (id, fallback = "Not supplied") => document.querySelector(id)?.value.trim() || fallback;
    const brand = value("#psBrand");
    const model = value("#psModel");
    const condition = value("#psCondition");
    const message = [
      "Hello FORMEX Communication, I want to swap my current phone and upgrade.",
      `Phone: ${brand} ${model}`,
      `Storage: ${value("#psStorage")}`,
      `Condition: ${condition}`,
      `Battery health: ${value("#psBattery")}`,
      `My WhatsApp number: ${value("#psContact")}`,
      "Please explain the inspection process and help me discuss an initial valuation. I understand the final value is confirmed after physical inspection."
    ].join("\n");
    window.FormexTracking?.pushEvent("begin_phone_swap", { lead_type: "phone_swap", phone_model: `${brand} ${model}`, device_condition: condition });
    window.location.href = `https://wa.me/2349060699096?text=${encodeURIComponent(message)}`;
  });
})();
