(() => {
  "use strict";

  const body = document.body;
  const attributionKeys = [
    "gclid",
    "fbclid",
    "ttclid",
    "wbraid",
    "gbraid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content"
  ];
  const attributionStorageKey = "mikee-gadget-plug_ad_attribution";
  const context = {
    ad_group_id: body.dataset.adGroupId || "",
    ad_group_name: body.dataset.adGroupName || "",
    landing_page: body.dataset.landingPage || location.pathname,
    product_name: body.dataset.productName || "",
    phone_model: body.dataset.phoneModel || "",
    device_condition: body.dataset.deviceCondition || "",
    lead_type: body.dataset.leadType || "",
    page_location: location.href
  };

  window.dataLayer = window.dataLayer || [];

  function readAttribution() {
    const current = Object.fromEntries(
      attributionKeys
        .map((key) => [key, new URLSearchParams(location.search).get(key)])
        .filter(([, value]) => value)
    );
    let stored = {};

    try {
      stored = JSON.parse(sessionStorage.getItem(attributionStorageKey) || "{}");
    } catch {
      stored = {};
    }

    const attribution = { ...stored, ...current };
    try {
      sessionStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
    } catch {
      // Tracking must never block a visitor from using the page.
    }
    return attribution;
  }

  const attribution = readAttribution();

  function pushEvent(event, parameters = {}) {
    window.dataLayer.push({
      event,
      ...context,
      ...attribution,
      ...parameters,
      page_location: location.href
    });
  }

  function decorateInternalLink(anchor) {
    if (!anchor.href || anchor.href.startsWith("tel:") || anchor.href.startsWith("mailto:")) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) return;
    Object.entries(attribution).forEach(([key, value]) => {
      if (value && !url.searchParams.has(key)) url.searchParams.set(key, value);
    });
    anchor.href = url.toString();
  }

  function decorateWhatsappLink(anchor) {
    if (!anchor.href.includes("wa.me/")) return;
    const url = new URL(anchor.href);
    const values = Object.entries(attribution).filter(([, value]) => value);
    if (!values.length) return;

    const existing = url.searchParams.get("text") || `Hello ${body.dataset.adGroupName || "Mikee Gadget Plug Communication"}.`;
    const source = values.map(([key, value]) => `${key}: ${value}`).join(" | ");
    if (!existing.includes("Campaign reference:")) {
      url.searchParams.set("text", `${existing}\nCampaign reference: ${source}`);
    }
    anchor.href = url.toString();
  }

  document.querySelectorAll("a").forEach((anchor) => {
    decorateInternalLink(anchor);
    decorateWhatsappLink(anchor);
  });

  const menuButton = document.querySelector(".intent-menu-button");
  const menu = document.querySelector(".intent-menu");
  if (menuButton && menu) {
    menuButton.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
    menu.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      menu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    decorateInternalLink(link);
    decorateWhatsappLink(link);
    const isWhatsapp = link.dataset.track === "whatsapp" || link.href.includes("wa.me/");
    const isCall = link.dataset.track === "call" || link.href.startsWith("tel:");
    const isDirections = link.dataset.track === "directions" || link.href.includes("google.com/maps");

    if (isWhatsapp) {
      if (link.dataset.selectPhone === "true") pushEvent("select_phone");
      if (link.dataset.easyBuy === "true" || body.classList.contains("easy-buy-page")) {
        pushEvent("begin_easy_buy_application");
      }
      pushEvent("click_whatsapp", { link_url: link.href });
      pushEvent("whatsapp_click", { link_url: link.href });
    }
    if (isCall) {
      pushEvent("click_call", { link_url: link.href });
      pushEvent("call_click", { link_url: link.href });
    }
    if (isDirections) {
      pushEvent("click_directions", { link_url: link.href });
      pushEvent("directions_click", { link_url: link.href });
    }
    if (link.dataset.primaryAction === "select_phone") {
      pushEvent("select_phone");
    }
  });

  document.addEventListener("mikee-gadget-plug:lead-success", (event) => {
    pushEvent("submit_lead", {
      form_name: event.detail?.form_name || "lead_form",
      lead_type: event.detail?.lead_type || context.lead_type
    });
  });

  pushEvent("view_landing_page");
  if (body.dataset.pageType === "product") {
    pushEvent("view_product");
  }

  window.MikeeGadgetPlugTracking = Object.freeze({
    pushEvent,
    submitLead(detail = {}) {
      document.dispatchEvent(new CustomEvent("mikee-gadget-plug:lead-success", { detail }));
    }
  });
})();
