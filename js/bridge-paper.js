/* ============================================================================
   Cor Portal v2 - bridge-paper.html long-read renderer.
   "The Optimizer Without a Target" - the AI-alignment wedge.

   The argument prose is authored static HTML in the page. This script does the
   data-bound work only:
     1. fills the live "current snapshot" strip from CorData.counts() (so the
        frozen v0 figures in the prose never silently contradict the spec);
     2. freezes the snapshot-date stamp from meta().built_at;
     3. renders the mechanism / tier / forcing-convergence table from
        CorData.mechanismsOrdered(), with every code as a CorXref chip;
     4. turns the inline data-code placeholders sprinkled through the prose into
        CorXref chips (link if a surface exists, else plain text - no dead links).

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

  /* ---- 1 + 2. live snapshot strip + frozen date stamp ---------------------- */

  safe(function () {
    var stampEl = document.getElementById("bp-snapshot-date");
    var liveEl = document.getElementById("bp-live-counts");
    if (!D) {
      if (liveEl) liveEl.textContent = "Current snapshot counts unavailable.";
      return;
    }
    var built = (D.meta() || {}).built_at;
    var day = built ? String(built).slice(0, 10) : null;
    if (stampEl && day) stampEl.textContent = day;

    if (liveEl) {
      var c = D.counts() || {};
      // Build "N label" fragments only for counts that are present + finite.
      var order = [
        ["works", "reviewed works"],
        ["extractions", "extractions"],
        ["foundations", "foundations"],
        ["convergences", "convergences"],
        ["mechanisms", "mechanisms"],
        ["mechanism_evidence", "mechanism-evidence links"],
        ["empirical_demonstrations", "empirical demonstrations"],
        ["applications", "applications"],
        ["researchers", "researchers"],
        ["domains", "domains"],
        ["gaps", "open gaps"],
        ["bridge_theses", "bridge thesis"]
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

  /* ---- 3. mechanism table (data-bound; codes are chips) -------------------- */

  safe(function () {
    var body = document.getElementById("bp-mech-tbody");
    if (!body || !D) return;
    var rows = D.mechanismsOrdered() || [];
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4">Mechanism table unavailable in this snapshot.</td></tr>';
      return;
    }

    // Tier is an integer in the snapshot (1 forced / 2 strongly supported /
    // 3 moderate). Present it with the paper's own wording; never fabricate a
    // tier where the field is absent.
    var TIER_LABEL = {
      1: "T1 forced",
      2: "T2 strongly supported",
      3: "T3 moderate"
    };
    function tierInfo(m) {
      var t = m.tier;
      var n = (typeof t === "number") ? t : parseInt(t, 10);
      if (n === 1 || n === 2 || n === 3) {
        return { label: TIER_LABEL[n], cls: "lr-tier-t" + n };
      }
      return { label: "tier not stated", cls: "lr-tier-t3" };
    }

    var html = rows.map(function (m) {
      var code = m.code || "";
      var name = D.clean(m.name || "");
      var ti = tierInfo(m);
      var convs = Array.isArray(m.convergence_codes) ? m.convergence_codes : [];
      var convCell = convs.length
        ? convs.map(function (c) { return chip(c); }).join(" ")
        : '<span class="lr-tier-t3">not stated</span>';
      return "<tr>" +
        "<td>" + chip(code) + "</td>" +
        '<td class="lr-mech-name">' + name + "</td>" +
        '<td><span class="' + ti.cls + '">' + esc(ti.label) + "</span></td>" +
        "<td>" + convCell + "</td>" +
        "</tr>";
    }).join("");
    body.innerHTML = html;
  });

  /* ---- 4. inline code chips in prose -------------------------------------- */
  // Any <span data-code="M3"></span> (or data-code="M3" with custom text) in the
  // authored prose becomes a CorXref chip. Keeps the prose link-safe + DRY.

  safe(function () {
    var spots = document.querySelectorAll("[data-code]");
    for (var i = 0; i < spots.length; i++) {
      var el = spots[i];
      var code = el.getAttribute("data-code");
      if (!code) continue;
      var custom = el.getAttribute("data-text");
      // Replace the placeholder element with the chip markup.
      el.outerHTML = chip(code, custom || null);
    }
  });
})();
