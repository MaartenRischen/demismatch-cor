/* ============================================================================
   Cor Portal v2 - case template renderer (window.CorCases).
   ONE data-driven template that renders any of the 3 kept cases from
   window.COR_CASES (js/cases-data.js). The page selects which via
   <body data-case="<slug>">.

   Load order on a case page (case/<slug>.html):
     ../js/snapshot-data.js -> ../js/data.js -> ../js/xref.js ->
     ../js/chrome.js -> ../js/cases-data.js -> ../js/cases.js

   Honesty / contract:
     - All prose runs through CorData.clean()/cleanMultiline() (hyphens-only,
       dash normalization, escaping) - same pipeline as DB-sourced prose.
     - Mechanism references are bare CODES; CorXref resolves names + links live
       from the snapshot. No dead links: a code with no surface degrades to
       plain text automatically (CorXref contract).
     - Thesis is NOT restated here (it lives once on the Reference hub). Each
       page carries a quiet back-link to the hub instead.
     - SUBDIR FIX: chrome.js emits root-relative hrefs (e.g. "index.html") that
       would resolve under case/ on file://. After chrome mounts, we rewrite
       those to "../index.html" so the masthead/footer work from the subdir.
       chrome.js itself is left untouched (it is shared by every other surface).
   ============================================================================ */
(function (global) {
  "use strict";

  var D = global.CorData || null;
  var X = global.CorXref || null;
  var CASES = global.COR_CASES || {};
  var META = global.COR_CASES_META || { worksHref: "reference.html#ref-thinkers", hubHref: "reference.html#ref-cases", order: [] };

  function clean(v) { return D ? D.clean(v) : esc(v); }
  function cleanMultiline(v) { return D ? D.cleanMultiline(v) : esc(v).replace(/\n{2,}/g, "<br><br>"); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function chip(code) { return X ? X.chip(code) : esc(code); }

  /* ---- subdir prefix fix for shared chrome ---------------------------------
     chrome.js mounts root-style relative hrefs. From case/<slug>.html those
     need a "../" prefix. Rewrite only plain relative hrefs (skip absolute,
     protocol, hash-only, and already-prefixed). Idempotent. */
  // Sibling case pages live alongside this one in case/ and must stay bare
  // (e.g. "instagram-depression.html"); everything else relative points at a
  // ROOT-level surface (mechanism.html, reference.html, ...) and needs "../".
  function siblingSet() {
    var s = {};
    (META.order || []).forEach(function (slug) { s[slug + ".html"] = true; });
    return s;
  }
  function prefixWithin(root, siblings) {
    if (!root) return;
    var as = root.querySelectorAll("a[href]");
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      var raw = a.getAttribute("href") || "";
      if (!raw) continue;
      if (/^(?:[a-z]+:|\/\/|\/|#|\.\.\/)/i.test(raw)) continue; // absolute / proto / root / hash / already ../
      var base = raw.split(/[?#]/)[0]; // filename before any ?query or #hash
      if (siblings[base]) continue;    // sibling case page - leave relative
      a.setAttribute("href", "../" + raw);
    }
  }

  // Rewrites the shared chrome (masthead/footer) AND, when present, the rendered
  // case body. CorXref mechanism chips (e.g. "mechanism.html#M3") live in the
  // body, so they must be prefixed too or they 404 from case/. Idempotent.
  function prefixChromeLinks() {
    var siblings = siblingSet();
    prefixWithin(document.querySelector("[data-masthead]"), siblings);
    prefixWithin(document.querySelector("[data-footer]"), siblings);
    prefixWithin(document.querySelector("[data-case-mount]"), siblings);
  }

  /* ---- section renderers --------------------------------------------------- */

  function proseBlock(s) {
    return '<section class="case-block">' +
      '<h2 class="case-block-h">' + clean(s.h) + "</h2>" +
      '<div class="case-prose">' + cleanMultiline(s.p) + "</div>" +
      "</section>";
  }

  function resolutionBlock(s) {
    // The proxy / resolution-conditions framing: cue fires, function absent.
    // A static, prose echo of the mechanism-detail gradient - it NEVER mimics
    // the interactive gradient stage (that lives only on mechanism.html).
    return '<section class="case-resolution" aria-label="Proxy and resolution conditions">' +
      '<p class="case-res-kicker">The proxy</p>' +
      '<div class="case-res-grid">' +
        '<div class="case-res-cell case-res-lit">' +
          '<span class="case-res-label">Cue, lit</span>' +
          '<p>' + clean(s.lit) + "</p>" +
        "</div>" +
        '<div class="case-res-cell case-res-fires">' +
          '<span class="case-res-label">What fires it</span>' +
          '<p>' + clean(s.fires) + "</p>" +
        "</div>" +
        '<div class="case-res-cell case-res-missing">' +
          '<span class="case-res-label">Function, absent</span>' +
          '<p>' + clean(s.missing) + "</p>" +
        "</div>" +
      "</div>" +
      "</section>";
  }

  function contrastBlock(s) {
    function list(items) {
      return (items || []).map(function (t) {
        return "<li>" + clean(t) + "</li>";
      }).join("");
    }
    return '<section class="case-contrast" aria-label="Conventional advice versus what Cor reads">' +
      '<div class="case-contrast-col case-contrast-conv">' +
        '<h2 class="case-block-h">What conventional advice says</h2>' +
        '<ul class="case-contrast-list">' + list(s.conventional) + "</ul>" +
      "</div>" +
      '<div class="case-contrast-col case-contrast-cor">' +
        '<h2 class="case-block-h">What Cor reads</h2>' +
        '<ul class="case-contrast-list">' + list(s.cor) + "</ul>" +
      "</div>" +
      "</section>";
  }

  function pullBlock(s) {
    return '<figure class="case-pull">' +
      '<blockquote><p>' + clean(s.quote) + "</p></blockquote>" +
      "</figure>";
  }

  function renderSection(s) {
    switch (s.kind) {
      case "resolution": return resolutionBlock(s);
      case "contrast":   return contrastBlock(s);
      case "pull":       return pullBlock(s);
      default:           return proseBlock(s);
    }
  }

  /* ---- header / mechanism chips / works ------------------------------------ */

  function mechChips(codes) {
    var list = (codes || []).map(function (c) { return chip(c); }).join("");
    if (!list) return "";
    return '<div class="case-mechs" aria-label="Mechanisms this case is a signal from">' +
      '<span class="case-mechs-label">Signal from</span>' + list + "</div>";
  }

  function worksList(works) {
    if (!works || !works.length) return "";
    var items = works.map(function (w) {
      var t = clean(w.title);
      var by = w.by ? ' <span class="case-work-by">' + clean(w.by) + "</span>" : "";
      return "<li>" + t + by + "</li>";
    }).join("");
    return '<section class="case-works">' +
      '<h2 class="case-block-h">Key works behind this case</h2>' +
      '<ul class="case-works-list">' + items + "</ul>" +
      '<p class="case-works-note">Full provenance lives in the ' +
        '<a href="' + esc(META.worksHref) + '">reference library</a>.</p>' +
      "</section>";
  }

  /* ---- prev / next within the kept set ------------------------------------- */

  function caseNav(slug) {
    var order = META.order || [];
    var i = order.indexOf(slug);
    var bits = [];
    bits.push('<a class="case-nav-link case-nav-hub" href="' + esc(META.hubHref) + '">All cases</a>');
    if (i > 0) {
      var prev = CASES[order[i - 1]];
      if (prev) bits.push('<a class="case-nav-link" href="' + esc(prev.slug) + '.html">' +
        '<span class="case-nav-dir">Previous</span>' + clean(prev.title) + "</a>");
    }
    if (i >= 0 && i < order.length - 1) {
      var next = CASES[order[i + 1]];
      if (next) bits.push('<a class="case-nav-link case-nav-next" href="' + esc(next.slug) + '.html">' +
        '<span class="case-nav-dir">Next</span>' + clean(next.title) + "</a>");
    }
    return '<nav class="case-nav" aria-label="Case navigation">' + bits.join("") + "</nav>";
  }

  /* ---- main render --------------------------------------------------------- */

  function render() {
    var mount = document.querySelector("[data-case-mount]");
    var slug = document.body && document.body.getAttribute("data-case");
    if (!mount) return;

    var c = slug && CASES[slug];
    if (!c) {
      mount.innerHTML = '<section class="case-block"><h1 class="case-title">Case not found</h1>' +
        '<p class="case-prose">This case is not part of the current set. ' +
        '<a href="' + esc(META.hubHref) + '">Browse the cases hub.</a></p></section>';
      return;
    }

    // Document title (presentation only; not a data count).
    try { document.title = "Cor - " + c.title; } catch (e) {}

    var head =
      '<header class="case-head">' +
        '<p class="case-eyebrow">' + clean(c.number) + " &middot; Mismatch case</p>" +
        '<h1 class="case-title">' + clean(c.title) + "</h1>" +
        '<p class="case-lede">' + clean(c.lede) + "</p>" +
        mechChips(c.code) +
      "</header>";

    var caption = c.caption
      ? '<figure class="case-figure"><figcaption>' + clean(c.caption) + "</figcaption></figure>"
      : "";

    var body = (c.sections || []).map(renderSection).join("");

    mount.innerHTML =
      head +
      caption +
      '<article class="case-body">' + body + worksList(c.works) + "</article>" +
      caseNav(c.slug);
  }

  function init() {
    // Render first so the case body exists, THEN rewrite root-relative links
    // (chrome masthead/footer + the rendered body's xref/hub/works links) for
    // the case/ subdir. chrome.js itself is left untouched (shared surface).
    render();
    prefixChromeLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.CorCases = { render: render, prefixChromeLinks: prefixChromeLinks };
})(window);
