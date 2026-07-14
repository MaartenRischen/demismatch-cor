/* chrome.js - single-source masthead + footer for Cor Portal v2.
 *
 * IIFE on window. No build step, no framework, works on file://.
 * Per IA-BUILD-CONTRACT.md sec.2: every page declares
 *   <header data-masthead data-page="<PAGE_KEY>"></header>
 *   <footer data-footer></footer>
 * and this module injects the canonical chrome into those placeholders, with
 * the nav item matching data-page lit (aria-current="page" + .is-current).
 *
 * Load order (contract sec.1): snapshot-data.js -> data.js -> xref.js ->
 * chrome.js -> js/<page>.js. chrome.js runs immediately on execution (the
 * placeholders sit in <body> above the scripts, so they already exist) and
 * also re-asserts on DOMContentLoaded as a belt-and-braces guard. Running
 * before the page script means #foot-counts and [data-cor-honesty] are present
 * when the page script and data.js's initHonestyMarkers() fire.
 *
 * Data only from window.CorData. Never fetches. Counts are never hardcoded:
 * the footer signature line is filled from CorData.counts(); if CorData is
 * absent it degrades to an honest "counts unavailable".
 */
(function () {
  "use strict";

  var D = window.CorData || null;

  // Single source of nav order (contract sec.2). Two tiers: PRIMARY are the
  // destinations (the spec itself); SECONDARY are utilities + reference. The
  // logo is the home link, so "Home" is no longer a nav item.
  var NAV_PRIMARY = Object.freeze([
    Object.freeze({ key: "mechanisms",  label: "Mechanisms", href: "mechanisms.html" }),
    Object.freeze({ key: "the-gap",     label: "The Gap",    href: "the-gap.html" }),
    Object.freeze({ key: "derivation",  label: "Derivation", href: "derivation.html" })
  ]);
  var NAV_SECONDARY = Object.freeze([
    Object.freeze({ key: "reference",   label: "Reference",  href: "reference.html" }),
    Object.freeze({ key: "mindmap",     label: "Map",        href: "mindmap.html" }),
    Object.freeze({ key: "downloads",   label: "Downloads",  href: "downloads.html" }),
    Object.freeze({ key: "faq",         label: "FAQ",        href: "faq.html" })
  ]);
  // Combined list (matching/compat for setCurrent + window.CorChrome.NAV).
  var NAV = Object.freeze(NAV_PRIMARY.concat(NAV_SECONDARY));

  // mechanism.html is a detail surface under Mechanisms; light Mechanisms for it.
  // Long-reads (bridge-paper / constitutional / programme / eli5 / cases) use
  // data-page="reference" and therefore light Reference (contract sec.2).
  var NAV_ALIAS = { mechanism: "mechanisms" };

  function navKeyFor(pageKey) {
    return NAV_ALIAS[pageKey] || pageKey;
  }

  // Minimal HTML escape for attribute/text injection. The only dynamic value
  // we inject here is the count signature, which is numbers + fixed labels, but
  // escape anyway for hygiene.
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- masthead ---------- */

  // Canonical Cor seal, rings-and-dot (favicon) variant - geometry measured from
  // the master mark, shared verbatim with the front door and /vision so all three
  // onion layers carry the same mark. No C/R glyphs here: the masthead already
  // renders a "Cor" text title, so the glyph-bearing full seal would double up.
  // Rings use currentColor (themeable; .mark sets color:var(--oxblood)); the dot
  // is the teal accent via .dot. stroke-width 7 on the 560 viewBox preserves the
  // masthead's existing hairline weight at 46px.
  var BRAND_MARK =
    '<span class="mark" aria-hidden="true">' +
      '<svg viewBox="120 50 560 560" role="img" fill="none">' +
        '<g stroke="currentColor" stroke-width="7" fill="none">' +
          '<circle cx="399.5" cy="329" r="271"/>' +
          '<circle cx="446.5" cy="376.5" r="200"/>' +
          '<circle cx="488" cy="418" r="129"/>' +
        '</g>' +
        '<circle class="dot" cx="523" cy="453" r="59"/>' +
      '</svg>' +
    '</span>';

  // mechanism.html keeps its structural exception: the "Detail View" subtitle.
  function subtitleFor(pageKey) {
    if (pageKey === "mechanism") return "Mechanism Spec - Detail View";
    return "An evidence-graded atlas of human needs";
  }

  function navLinks(list, navKey, cls) {
    return list.map(function (item) {
      var current = item.key === navKey;
      return '<a href="' + esc(item.href) + '"' +
        ' class="' + cls + (current ? ' is-current' : '') + '"' +
        (current ? ' aria-current="page"' : '') +
        '>' + esc(item.label) + '</a>';
    }).join("");
  }

  function mastheadHTML(pageKey) {
    var navKey = navKeyFor(pageKey);
    var primary = navLinks(NAV_PRIMARY, navKey, "nav-primary");
    var secondary = navLinks(NAV_SECONDARY, navKey, "nav-secondary");

    return '' +
      '<a class="mast-brand" href="index.html">' +
        BRAND_MARK +
        '<span class="masthead-txt">' +
          '<span class="masthead-title">Cor</span>' +
          '<span class="masthead-sub">' + esc(subtitleFor(pageKey)) + '</span>' +
        '</span>' +
      '</a>' +
      '<nav class="mast-nav" aria-label="Primary">' +
        '<span class="nav-group nav-group-primary">' + primary + '</span>' +
        '<span class="nav-sep" aria-hidden="true"></span>' +
        '<span class="nav-group nav-group-secondary">' + secondary + '</span>' +
      '</nav>';
  }

  /* ---------- footer ---------- */

  // Live count signature line. Never hardcoded; reads CorData.counts().
  function countSignature() {
    if (!D || typeof D.counts !== "function") return "counts unavailable";
    var c = D.counts() || {};
    var bits = [];
    function push(key, singular, plural) {
      var v = c[key];
      if (typeof v === "number" && isFinite(v)) {
        bits.push(v + " " + (v === 1 ? singular : plural));
      }
    }
    push("mechanisms", "mechanism", "mechanisms");
    push("foundations", "foundation", "foundations");
    push("convergences", "convergence", "convergences");
    push("works", "work", "works");
    return bits.length ? bits.join(" - ") : "counts unavailable";
  }

  // Compact sitemap: Core / Reference sections / Papers (contract sec.2).
  // Reference deep-links use the fixed section ids from contract sec.5.
  var SITEMAP = [
    {
      head: "Core",
      links: [
        { label: "Home",        href: "index.html" },
        { label: "Mechanisms",  href: "mechanisms.html" },
        { label: "Derivation",  href: "derivation.html" },
        { label: "Map",         href: "mindmap.html" },
        { label: "Downloads",   href: "downloads.html" }
      ]
    },
    {
      head: "Reference",
      links: [
        { label: "Foundations",   href: "reference.html#ref-foundations" },
        { label: "Convergences",  href: "reference.html#ref-convergences" },
        { label: "Demonstrations", href: "reference.html#ref-demonstrations" },
        { label: "Cases",         href: "reference.html#ref-cases" },
        { label: "Applications",  href: "reference.html#ref-applications" },
        { label: "Gaps",          href: "reference.html#ref-gaps" },
        { label: "Thinkers",      href: "reference.html#ref-thinkers" }
      ]
    },
    {
      head: "Papers",
      links: [
        { label: "The Optimizer Without a Target", href: "bridge-paper.html" },
        { label: "Constitutional",  href: "constitutional.html" },
        { label: "Research Programme", href: "programme.html" },
        { label: "Start here (newcomer)", href: "eli5.html" }
      ]
    }
  ];

  // Cross-site why/what/how triad, ported from the live site's
  // partials/footer.html + xsite-nav.html.
  var XSITE = [
    { head: "DEMISMATCH", role: "The why", desc: "the front door", href: "https://demismatch.com/" },
    { head: "COR",        role: "The how", desc: "the spec",       href: "https://cor.demismatch.com/", current: true }
  ];

  function sitemapHTML() {
    var cols = SITEMAP.map(function (col) {
      var items = col.links.map(function (l) {
        return '<li><a href="' + esc(l.href) + '">' + esc(l.label) + '</a></li>';
      }).join("");
      return '<div class="foot-col">' +
        '<h2 class="foot-col-head">' + esc(col.head) + '</h2>' +
        '<ul class="foot-col-list">' + items + '</ul>' +
      '</div>';
    }).join("");
    return '<nav class="foot-sitemap" aria-label="Sitemap">' + cols + '</nav>';
  }

  function xsiteHTML() {
    var cells = XSITE.map(function (x) {
      return '<a class="foot-xsite-cell' + (x.current ? ' is-current' : '') + '"' +
        ' href="' + esc(x.href) + '"' + (x.current ? ' aria-current="page"' : '') + '>' +
        '<span class="foot-xsite-head">' + esc(x.head) + '</span>' +
        '<span class="foot-xsite-role">' + esc(x.role) + '</span>' +
        '<span class="foot-xsite-desc">' + esc(x.desc) + '</span>' +
      '</a>';
    }).join("");
    return '<nav class="foot-xsite" aria-label="Demismatch network">' + cells + '</nav>';
  }

  function footerHTML() {
    return '' +
      '<div class="foot-top">' +
        sitemapHTML() +
        xsiteHTML() +
      '</div>' +
      '<p class="foot-canonical">Demismatch is the project. Cor is its central ' +
        'reference work: the diagnostic tools, the alignment outputs, and the ' +
        'environment design are all built on it.</p>' +
      '<div class="foot-signature">' +
        '<span>Cor</span><span class="sep">/</span>' +
        '<span>a living atlas, built toward the specification</span>' +
        '<span class="sep">/</span><span id="foot-counts">' + esc(countSignature()) + '</span>' +
        '<span class="sep">/</span><span data-cor-honesty></span>' +
      '</div>';
  }

  /* ---------- mount ---------- */

  var mounted = false;

  function mountInto(masthead, footer) {
    if (masthead) {
      var pageKey = masthead.getAttribute("data-page") || "home";
      masthead.className = "masthead";
      masthead.innerHTML = mastheadHTML(pageKey);
    }
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = footerHTML();
    }
  }

  function mount() {
    var masthead = document.querySelector("[data-masthead]");
    var footer = document.querySelector("[data-footer]");
    if (!masthead && !footer) return; // nothing to do on this page
    mountInto(masthead, footer);
    mounted = true;
    // data.js's initHonestyMarkers() fills [data-cor-honesty]. If data.js has
    // already run its init (it runs on DOMContentLoaded too), re-fill the
    // freshly-injected marker. Safe + idempotent; never duplicates logic.
    if (D && typeof D.buildHonesty === "function") {
      var hon = footer && footer.querySelector("[data-cor-honesty]");
      if (hon && !hon.textContent) {
        try { hon.textContent = D.buildHonesty() || ""; } catch (e) { /* leave empty */ }
      }
    }
  }

  function setCurrent(pageKey) {
    var navKey = navKeyFor(pageKey);
    var links = document.querySelectorAll(".mast-nav a");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = a.getAttribute("href") || "";
      var match = NAV.filter(function (n) { return n.href === href; })[0];
      var on = match && match.key === navKey;
      if (on) { a.setAttribute("aria-current", "page"); a.classList.add("is-current"); }
      else { a.removeAttribute("aria-current"); a.classList.remove("is-current"); }
    }
  }

  // Run now (placeholders are in <body> above this script tag), and again on
  // DOMContentLoaded for safety / late-inserted placeholders.
  mount();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { if (!mounted) mount(); });
  }

  window.CorChrome = {
    mount: mount,
    setCurrent: setCurrent,
    NAV: NAV
  };
})();
