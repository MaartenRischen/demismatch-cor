/* ============================================================================
   the-gap.js - renders "The Gap" (the EEA-baseline layer) for Cor Portal v2.

   Reads only window.CorData (the baked snapshot). No runtime fetch. Every DB
   string runs through CorData.clean()/cleanMultiline() (hyphens-only, escaped).
   No fabrication: a parameter with no evidence renders an honest "full-text-
   pending" line, never an invented citation.

   Honesty contract (Cor decision #1557): these are contested measured numbers,
   not derived spec. The grade badge + contested flag + "illustrative, not
   constants" caveat are load-bearing UI, here - never spliced into spec prose.
   IIFE on window. Works on file://.
   ============================================================================ */
(function (global) {
  "use strict";

  var D = global.CorData || null;
  var X = global.CorXref || null;

  // Narrative domain order (social mismatch is primary) + display labels.
  var DOMAIN_ORDER = [
    "social_structure", "care_development", "touch_contact", "circadian_sensory",
    "subsistence_timeuse", "diet_metabolic", "threat_safety", "information_environment",
  ];
  var DOMAIN_LABELS = {
    social_structure: "Social structure",
    care_development: "Care & development",
    touch_contact: "Touch & contact",
    circadian_sensory: "Circadian & sensory",
    subsistence_timeuse: "Subsistence & time-use",
    diet_metabolic: "Diet & metabolic",
    threat_safety: "Threat & safety",
    information_environment: "Information environment",
  };
  // Grade -> confidence tier (drives the badge colour class). Reuses Cor's own
  // evidence_quality vocab; never invents a grade.
  // Keyed by PUBLIC label (GRADING-RUBRIC-v2.md); the raw value maps through
  // CorData.gradePublic first, so the badge text and its colour always agree.
  var GRADE_TIER = {
    "tested many times": "strong",
    "tested once": "moderate", "seen in animals": "moderate",
    "argued, not yet tested": "neutral",
    "contested": "weak",
  };
  function label(g) { return D && D.gradePublic ? D.gradePublic(g) : String(g || ""); }

  function esc(s) { return D ? D.esc(s) : String(s == null ? "" : s); }
  function clean(s) { return D ? D.clean(s) : esc(s); }
  function cleanML(s) { return D ? D.cleanMultiline(s) : esc(s); }

  function gradeBadge(grade) {
    var l = label(grade);
    var tier = GRADE_TIER[l] || "neutral";
    return '<span class="gap-grade gap-grade--' + esc(tier) + '" title="how well tested (Cor evidence label)">' + clean(l) + "</span>";
  }

  function mechChips(codes) {
    if (!codes || !codes.length) return "";
    var chips = codes.map(function (c) {
      if (X && typeof X.chip === "function") return X.chip(c);
      return '<span class="xref">' + esc(c) + "</span>";
    }).join("");
    return '<div class="gap-mechs">' + chips + "</div>";
  }

  // eea_value (object|null) -> a compact mono block (pretty JSON), or "".
  function valueBlock(v) {
    if (v == null || (typeof v === "object" && !Object.keys(v).length)) return "";
    var json;
    try { json = JSON.stringify(v, null, 2); } catch (e) { return ""; }
    return '<div class="gap-row"><div class="gap-k">EEA value</div>' +
      '<div class="gap-v"><pre class="gap-json">' + esc(json) + "</pre></div></div>";
  }

  function evidenceBlock(ev) {
    if (!ev || !ev.length) {
      return '<div class="gap-row"><div class="gap-k">Evidence</div>' +
        '<div class="gap-v"><p class="gap-none">No evidence link yet - the primary source is not in Cor. ' +
        "This parameter rests on its mechanism link and the prose; full-text-pending.</p></div></div>";
    }
    var items = ev.map(function (e) {
      var meta = "ext#" + esc(e.extraction_id) +
        (e.evidence_quality ? " &middot; " + clean(label(e.evidence_quality)) : "") +
        (e.evidence_role ? " &middot; " + clean(e.evidence_role) : "");
      var quote = e.author_quote
        ? '<q class="gap-quote">' + clean(e.author_quote) + "</q>"
        : (e.content ? '<span class="gap-snippet">' + clean(e.content) + "</span>" : "");
      return '<li class="gap-ev"><span class="gap-ev-meta">' + meta + "</span>" + quote + "</li>";
    }).join("");
    return '<div class="gap-row"><div class="gap-k">Evidence (' + ev.length + ')</div>' +
      '<div class="gap-v"><ul class="gap-ev-list">' + items + "</ul></div></div>";
  }

  function row(k, v) {
    if (v == null || !String(v).trim()) return "";
    return '<div class="gap-row"><div class="gap-k">' + esc(k) + '</div>' +
      '<div class="gap-v">' + cleanML(v) + "</div></div>";
  }

  function card(p) {
    var contested = p.contested
      ? '<span class="gap-contested" title="genuinely disputed in the literature">contested</span>'
      : "";
    return '<article class="gap-card" id="' + esc(p.code) + '">' +
      '<header class="gap-card-head">' +
        '<div class="gap-card-h">' +
          '<h3 class="gap-card-title">' + clean(p.name) + "</h3>" +
          '<p class="gap-card-code">' + esc(p.code) + " &middot; " + clean((DOMAIN_LABELS[p.domain] || p.domain)) + "</p>" +
        "</div>" +
        '<div class="gap-card-badges">' + gradeBadge(p.evidence_grade) + contested + "</div>" +
      "</header>" +
      mechChips(p.mechanism_codes) +
      row("EEA baseline", p.eea_baseline) +
      valueBlock(p.eea_value) +
      row("Modern default", p.modern_default) +
      row("The gap", p.gap_statement) +
      row("Resolution unit", p.resolution_unit) +
      (p.confidence_note ? '<div class="gap-row gap-row--conf"><div class="gap-k">Confidence</div><div class="gap-v">' + cleanML(p.confidence_note) + "</div></div>" : "") +
      evidenceBlock(p.evidence) +
      "</article>";
  }

  function honestyBanner() {
    var raw = D.eeaGradeCounts ? D.eeaGradeCounts() : {};
    var counts = {};
    Object.keys(raw).forEach(function (g) { var l = label(g); counts[l] = (counts[l] || 0) + raw[g]; });
    var order = D.PUBLIC_GRADE_ORDER || Object.keys(counts);
    var legend = order.filter(function (l) { return counts[l]; }).map(function (l) {
      return '<span class="gap-leg ' + "gap-grade--" + (GRADE_TIER[l] || "neutral") + '">' + esc(l) + " &middot; " + counts[l] + "</span>";
    }).join("");
    var banner =
      "This layer holds EEA numbers <b>next to</b> the spec, not inside it. Each label says how well the " +
      "ancestral figure was tested: <b>tested many times</b>, <b>tested once</b>, <b>seen in animals</b>, " +
      "<b>argued, not yet tested</b> or <b>contested</b>. Most of the information environment is held out. " +
      "Exact figures from single forager populations are <b>illustrative, not constants</b>.";
    return '<p class="gap-banner-txt">' + banner + "</p>" +
      (legend ? '<div class="gap-legend">' + legend + "</div>" : "");
  }

  function render() {
    if (!D) return;
    var asof = document.getElementById("gap-asof");
    var built = (D.meta() || {}).built_at;
    if (asof && built) asof.textContent = "As of the " + String(built).slice(0, 10) + " build.";

    var hon = document.getElementById("gap-honesty");
    if (hon) hon.innerHTML = honestyBanner();

    var body = document.getElementById("gap-body");
    if (!body) return;
    var params = D.eeaParameters ? D.eeaParameters() : [];
    if (!params.length) {
      body.innerHTML = '<p class="gap-empty">The EEA-baseline layer is not in this build yet. ' +
        "Re-bake the snapshot to populate it.</p>";
      return;
    }

    // group by domain, in narrative order; unknown domains appended.
    var byDom = {};
    params.forEach(function (p) { (byDom[p.domain] = byDom[p.domain] || []).push(p); });
    var domains = DOMAIN_ORDER.filter(function (d) { return byDom[d]; })
      .concat(Object.keys(byDom).filter(function (d) { return DOMAIN_ORDER.indexOf(d) === -1; }));

    var html = domains.map(function (dom) {
      var rows = byDom[dom].slice().sort(function (a, b) {
        return String(a.code).localeCompare(String(b.code));
      });
      var cards = rows.map(card).join("");
      return '<section class="gap-domain" id="dom-' + esc(dom) + '">' +
        '<header class="gap-domain-head">' +
          '<h2 class="gap-domain-title">' + clean(DOMAIN_LABELS[dom] || dom) + "</h2>" +
          '<span class="gap-domain-count">' + rows.length + "</span>" +
        "</header>" +
        '<div class="gap-cards">' + cards + "</div>" +
        "</section>";
    }).join("");
    body.innerHTML = html;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})(window);
