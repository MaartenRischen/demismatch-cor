/* ============================================================================
   Cor Portal v2 - mechanism INDEX renderer.
   Builds a scannable grid of all 15 real mechanisms from the baked snapshot
   (CorData). Whole card links to mechanism.html#<code>. Only M14 carries the
   derived-proxy badge. Never fabricates: every count is live, a thin field is
   omitted, evidence is shown with an honest "index in progress" note.
   Degrades to a calm empty state; never white-screens, never throws.
   ============================================================================ */
(function () {
  "use strict";

  var D = window.CorData;
  var grid = document.getElementById("mx-grid");
  var empty = document.getElementById("mx-empty");
  var foot = document.getElementById("foot-counts");

  // ---- hero lead count (live, never hardcoded) -----------------------------
  // Inject the mechanism count in front of "systems". Mirror js/home.js: a
  // present count reads "<n> systems..."; a missing one leaves the word out
  // and the lead stays grammatical ("Systems that produce...").
  if (D) {
    try {
      var leadN = (D.counts() || {}).mechanisms;
      if (typeof leadN === "number" && isFinite(leadN)) {
        var countEl = document.getElementById("mx-count");
        var sysEl = document.getElementById("mx-lead-systems");
        if (countEl) countEl.textContent = leadN + " ";
        if (sysEl) sysEl.textContent = "systems";
      }
    } catch (e) { /* leave the static lead as-is */ }
  }

  // ---- footer counts (live, never hardcoded) -------------------------------
  // Mirror js/home.js: " - " join + singular/plural guard so it never reads
  // "1 mechanisms".
  if (D && foot) {
    try {
      var counts = D.counts() || {};
      var footBits = [];
      var pushCount = function (key, singular, plural) {
        var v = counts[key];
        if (typeof v === "number" && isFinite(v)) {
          footBits.push(v + " " + (v === 1 ? singular : plural));
        }
      };
      pushCount("mechanisms", "mechanism", "mechanisms");
      pushCount("convergences", "convergence", "convergences");
      pushCount("works", "work", "works");
      foot.textContent = footBits.length ? footBits.join(" - ") : "";
    } catch (e) { /* leave footer empty rather than break */ }
  }

  if (!D || !grid) { if (empty) empty.hidden = false; return; }

  var esc = D.esc, clean = D.clean;

  // Humanize a grade token for the index chip (DB stores e.g.
  // "strongly_supported"). Underscores -> spaces; never invents a value.
  function gradeLabel(g) {
    if (g == null) return "";
    return D.normalizeDashes(String(g)).replace(/_/g, " ").trim();
  }

  function hasGradient(m) {
    var pg = m && m.proxy_gradient_parsed;
    return !!(pg && ((pg.levels && pg.levels.length) || (pg.axes && pg.axes.length)));
  }

  // Five small depth bars from the parsed phylogenetic age (older = more lit).
  // Reads ONLY CorData.phyloDepth; if there is no parseable age, no bars.
  function phyloBars(depth) {
    var lit = Math.max(0, Math.min(5, Math.round(depth * 5)));
    var out = "";
    for (var i = 0; i < 5; i++) {
      var h = 5 + i * 2; // 5..13px, oldest tier tallest
      out += "<i class='" + (i < lit ? "lit" : "") + "' style='height:" + h + "px'></i>";
    }
    return out;
  }

  function card(m) {
    var pd = D.phyloDepth(m.phylogenetic_age || "");
    var ev = D.evidenceCount(m.code);
    var grade = gradeLabel(m.grade);

    var top =
      "<div class='mx-top'>" +
        "<span class='mx-code'>" + esc(m.code) + "</span>" +
        (grade ? "<span class='mx-grade'>" + esc(grade) + "</span>" : "") +
        (m.tier != null ? "<span class='mx-tier'>Tier " + esc(m.tier) + "</span>" : "") +
        (hasGradient(m)
          ? "<span class='mx-badge'><span class='pip' aria-hidden='true'></span>Proxy gradient</span>"
          : "<span class='mx-badge mx-badge-pending'>Gradient: not yet derived</span>") +
      "</div>";

    var name = "<h2 class='mx-name'>" + clean(m.name || m.code) + "</h2>";

    var gloss = m.eli5
      ? "<p class='mx-gloss'>" + clean(m.eli5) + "</p>"
      : "";

    // Live count only. If it cannot be resolved, say so - never a fake figure.
    var hasEv = typeof ev === "number" && ev >= 0;
    var evRow = hasEv
      ? "<div class='mx-stat'>" +
          "<span class='n'>" + esc(ev) + "</span>" +
          "<span class='lbl'>evidence links</span>" +
          "<span class='mx-progress'>index in progress</span>" +
        "</div>"
      : "<div class='mx-stat'><span class='lbl'>evidence count unavailable</span></div>";

    var phyloRow = pd.label
      ? "<div class='mx-phylo'>" +
          "<span class='mx-phylo-bars' aria-hidden='true'>" + phyloBars(pd.depth) + "</span>" +
          "<span class='mx-phylo-age'>" + esc(D.normalizeDashes(pd.label)) + "</span>" +
        "</div>"
      : "";

    var foot = "<div class='mx-foot'>" + evRow + phyloRow + "</div>";

    return "<a class='mx-card' href='mechanism.html#" + esc(m.code) + "'>" +
             top + name + gloss + foot +
           "</a>";
  }

  var rows;
  try { rows = D.mechanismsOrdered() || []; }
  catch (e) { rows = []; }

  if (!rows.length) { empty.hidden = false; return; }

  var html = "";
  for (var i = 0; i < rows.length; i++) {
    try { html += "<li>" + card(rows[i]) + "</li>"; }
    catch (e) { /* skip one bad row, keep the grid */ }
  }

  if (!html) { empty.hidden = false; return; }
  grid.innerHTML = html;
})();
