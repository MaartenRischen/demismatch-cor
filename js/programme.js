/* ============================================================================
   Cor Portal v2 - programme.html long-read renderer.
   "The hard core, the protective belt, and what would refute Cor" - Cor laid
   out as a Lakatosian research programme.

   The Lakatosian argument (hard core / protective belt / falsifiers / boundary
   conditions) is authored static HTML in the page - it is not in the snapshot.
   This script does the data-bound work only:
     1. freezes the snapshot-date stamp from meta().built_at;
     2. fills the live "current snapshot" strip from CorData.counts(), so the
        qualitative claims never silently contradict the live atlas;
     3. turns the inline data-code placeholders in the prose (e.g. OF2, M3) into
        CorXref chips - link if a surface exists, else plain text (no dead links).

   IIFE on window. No build step, works on file://. Reads only CorData/CorXref.
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

  /* ---- 1 + 2. frozen date stamp + live snapshot strip ---------------------- */

  safe(function () {
    var stampEl = document.getElementById("pg-snapshot-date");
    var liveEl = document.getElementById("pg-live-counts");
    if (!D) {
      if (liveEl) liveEl.textContent = "Current snapshot counts unavailable.";
      return;
    }
    var built = (D.meta() || {}).built_at;
    var day = built ? String(built).slice(0, 10) : null;
    if (stampEl && day) stampEl.textContent = day;

    if (liveEl) {
      var c = D.counts() || {};
      var order = [
        ["foundations", "foundations"],
        ["mechanisms", "mechanisms"],
        ["convergences", "convergences"],
        ["empirical_demonstrations", "empirical demonstrations"],
        ["works", "reviewed works"],
        ["extractions", "extractions"],
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
    }
  });

  /* ---- 3. inline code chips in prose -------------------------------------- */
  // Any <span data-code="OF2"></span> in the authored prose becomes a CorXref
  // chip (foundation/mechanism codes deep-link; cut/absent codes degrade to
  // plain text). Keeps the prose link-safe and DRY.

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
