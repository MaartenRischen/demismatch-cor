/* ============================================================================
   Cor Portal v2 - Downloads page (downloads.html)
   The page-level chrome around the export experience. The actual download UI
   (5-level radio picker + Markdown / print-to-PDF, the markdown->HTML and PDF
   code) lives in js/exports.js, which binds to #dl-panel - we do NOT duplicate
   any of that here. This module only:
     - renders the human-readable "five reading levels" guide list, and
     - stamps the compiled / snapshot date,
   both from window.COR_EXPORTS.meta (never hardcoded). If the export corpus is
   unavailable, exports.js renders the honest unavailable state in #dl-panel;
   here we degrade the guide + stamp to a quiet honest note.
   ============================================================================ */
(function () {
  "use strict";

  var EX = window.COR_EXPORTS;
  var meta = EX && EX.meta ? EX.meta : null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---- compiled / snapshot date stamp -------------------------------------- */
  var stamp = document.getElementById("dl-stamp");
  if (stamp) {
    if (meta && meta.compiled_at && meta.source_built_at) {
      var counts = meta.counts || {};
      var mech = (typeof counts.mechanisms === "number") ? counts.mechanisms : null;
      var grad = (typeof meta.gradients_derived === "number") ? meta.gradients_derived : null;
      var html =
        '<span class="dia" aria-hidden="true"></span>' +
        '<span class="dl-stamp-body">' +
          'Compiled <strong>' + esc(meta.compiled_at) + '</strong> ' +
          'from the snapshot built <strong>' + esc(meta.source_built_at) + '</strong>.';
      if (mech != null) {
        html += ' Covers <strong>' + esc(String(mech)) + '</strong> mechanism' +
          (mech === 1 ? "" : "s");
        if (grad != null) {
          html += ', <strong>' + esc(String(grad)) + '</strong> with a derived proxy gradient';
        }
        html += '.';
      }
      if (meta.eea && typeof meta.eea.parameters === "number") {
        html += ' Includes <strong>The Gap</strong> - <strong>' +
          esc(String(meta.eea.parameters)) + '</strong> EEA baseline parameter' +
          (meta.eea.parameters === 1 ? "" : "s") +
          (typeof meta.eea.domains === "number"
            ? ' across <strong>' + esc(String(meta.eea.domains)) + '</strong> domains' : '') +
          '.';
      }
      html += '</span>';
      stamp.innerHTML = html;
    } else {
      stamp.innerHTML =
        '<span class="dl-stamp-body dl-stamp-pending">' +
          'Compilation date unavailable - the export corpus has not been built. ' +
          'See the panel below.' +
        '</span>';
    }
  }

  /* ---- the five reading levels guide --------------------------------------- */
  var list = document.getElementById("dl-level-list");
  var empty = document.getElementById("dl-level-empty");
  var levels = meta && Array.isArray(meta.levels) ? meta.levels : [];

  if (list) {
    if (levels.length) {
      list.innerHTML = levels.map(function (lv) {
        return '<li class="dl-level">' +
          '<span class="dl-level-key" aria-hidden="true"></span>' +
          '<div class="dl-level-text">' +
            '<h3 class="dl-level-title">' + esc(lv.title) + '</h3>' +
            '<p class="dl-level-sub">' + esc(lv.subtitle) + '</p>' +
          '</div>' +
        '</li>';
      }).join("");
      if (empty) empty.hidden = true;
    } else {
      list.innerHTML = "";
      if (empty) empty.hidden = false;
    }
  }
})();
