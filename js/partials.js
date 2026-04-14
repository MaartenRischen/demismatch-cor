async function loadPartials() {
  const targets = Array.from(document.querySelectorAll("[data-include]"));
  await Promise.all(
    targets.map(async (target) => {
      const src = target.getAttribute("data-include");
      if (!src) return;
      if (src.includes("/partials/nav.html")) {
        target.classList.add("site-nav-shell");
      }
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Partial unavailable");
        target.innerHTML = await response.text();
      } catch (error) {
        target.innerHTML = "";
        target.setAttribute("data-partial-error", "true");
      }
    })
  );
}

function initActiveNav() {
  const current = document.body.dataset.nav;
  if (!current) return;
  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    if (link.getAttribute("data-nav-link") === current) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function initMobileNav() {
  const shell = document.querySelector(".site-nav");
  const toggle = document.querySelector(".nav-toggle");
  if (!shell || !toggle) return;

  function setOpen(next) {
    shell.setAttribute("data-open", String(next));
    toggle.setAttribute("aria-expanded", String(next));
  }

  toggle.addEventListener("click", () => {
    const open = shell.getAttribute("data-open") === "true";
    setOpen(!open);
  });

  shell.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("click", (event) => {
    if (shell.getAttribute("data-open") !== "true") return;
    if (shell.contains(event.target)) return;
    setOpen(false);
  });
}

function closeCitations() {
  document.querySelectorAll(".citation[data-open='true']").forEach((citation) => {
    citation.dataset.open = "false";
    const button = citation.querySelector(".citation-button");
    if (button) button.setAttribute("aria-expanded", "false");
  });
}

function initCitations() {
  document.querySelectorAll(".citation-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const citation = button.closest(".citation");
      if (!citation) return;
      const willOpen = citation.dataset.open !== "true";
      closeCitations();
      citation.dataset.open = String(willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
    });
  });

  document.addEventListener("click", closeCitations);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCitations();
  });
}

function setFooterYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = "2026";
  });
}

async function injectBanner() {
  const nav = document.querySelector(".site-nav");
  if (!nav) return;
  try {
    const res = await fetch("/partials/banner.html");
    if (!res.ok) return;
    const html = await res.text();
    nav.insertAdjacentHTML("afterend", html);
  } catch (_) { /* banner is non-critical */ }
}

async function injectXsiteNav() {
  const shell = document.querySelector(".site-nav-shell");
  if (!shell) return;
  try {
    const res = await fetch("/partials/xsite-nav.html");
    if (!res.ok) return;
    const html = await res.text();
    shell.insertAdjacentHTML("beforebegin", html);
  } catch (_) { /* xsite nav is non-critical */ }
}

function setFavicon() {
  if (document.querySelector("link[rel='icon']")) return;
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/png";
  link.href = "/img/cor-mark.png";
  document.head.appendChild(link);
}

async function bootPartials() {
  setFavicon();
  await loadPartials();
  await injectXsiteNav();
  await injectBanner();
  initActiveNav();
  initMobileNav();
  initCitations();
  setFooterYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootPartials);
} else {
  bootPartials();
}
