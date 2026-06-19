/* ============================================================================
   Cor Portal v2 - constitutional.html long-read renderer.
   "What You Are Talking To" - the model stated FOR the systems (AI) and builders
   that design our environments.

   The argument prose is authored static HTML in the page. This script does the
   data-bound work only, mirroring the bridge-paper.js idiom:
     1. fills the live "current snapshot" strip from CorData.counts() so the
        frozen "as of" figures never silently contradict the live atlas;
     2. freezes the snapshot-date stamp from meta().built_at (the honest "as of"
        label - never a hardcoded literal);
     3. turns every inline [data-code] placeholder in the prose into a CorXref
        chip: a link to the matching mechanism / foundation / reference surface
        if it exists, else PLAIN TEXT - no dead links, ever. This is what cross-
        links the named systems to their interactive atlas cards.

   IIFE on window. No build step, works on file://. Reads only CorData/CorXref;
   degrades to plain text if either is missing. A failing block never white-
   screens the page.
   ============================================================================ */
(function () {
  "use strict";

  var D = window.CorData || null;
  var X = window.CorXref || null;

  function esc(v) {
    return D ? D.esc(v)
      : String(v == null ? "" : v)
          .replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function chip(code, text) {
    if (X && typeof X.chip === "function") return X.chip(code, text);
    return '<span class="xref xref--plain">' + esc(text != null ? text : code) + "</span>";
  }
  function safe(fn) { try { fn(); } catch (e) { /* one block down, page lives */ } }

  /* ---- 1 + 2. live snapshot strip + frozen "as of" date -------------------- */

  safe(function () {
    var built = D ? ((D.meta() || {}).built_at) : null;
    var day = built ? String(built).slice(0, 10) : null;

    // Freeze every dated figure behind the snapshot's own build date.
    ["cn-snapshot-date", "cn-asof"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && day) el.textContent = day;
    });

    var liveEl = document.getElementById("cn-live-counts");
    if (!liveEl) return;
    if (!D) { liveEl.textContent = "Current snapshot counts unavailable."; return; }

    var c = D.counts() || {};
    var order = [
      ["works", "reviewed works"],
      ["extractions", "evidence extractions"],
      ["mechanism_evidence", "mechanism-evidence links"],
      ["foundations", "architectural foundations"],
      ["convergences", "cross-tradition convergences"],
      ["mechanisms", "evolved mechanisms"],
      ["domains", "research domains"],
      ["researchers", "researchers"],
      ["empirical_demonstrations", "empirical demonstrations"],
      ["applications", "applications"],
      ["gaps", "open gaps"]
    ];
    var bits = [];
    order.forEach(function (pair) {
      var v = c[pair[0]];
      if (typeof v === "number" && isFinite(v)) {
        bits.push("<b>" + esc(v) + "</b> " + esc(pair[1]));
      }
    });
    liveEl.innerHTML = bits.length
      ? bits.join(" &middot; ")
      : "Current snapshot counts unavailable.";
  });

  /* ---- 3. inline code chips in prose -------------------------------------- */
  // Every <span data-code="M2"></span> (mechanism) or data-code="OF2"
  // (foundation) etc. in the authored prose becomes a CorXref chip. Mechanisms
  // and Touch (R1) deep-link to mechanism.html#<CODE>; foundations to the
  // derivation layer; cut/unknown codes degrade to plain text. Keeps the named
  // systems cross-linked to the interactive atlas without any dead links.

  safe(function () {
    var spots = document.querySelectorAll("[data-code]");
    for (var i = 0; i < spots.length; i++) {
      var el = spots[i];
      var code = el.getAttribute("data-code");
      if (!code) continue;
      var custom = el.getAttribute("data-text");
      el.outerHTML = chip(code, custom || null);
    }
  });
})();
