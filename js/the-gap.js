/* ============================================================================
   the-gap.js - renders the EEA-baseline records, with a plain layer:
   - three records (EEA-SOC-01, EEA-CARE-01, EEA-DIET-02) open with one or two
     everyday sentences, their public label with the reason for it, and a line on
     how to read the card. Every plain sentence was checked against its record.
     The sentences add no claim the record does not make.
   - row names in plain words; raw data, the evidence list and the rubric-v1
     notes folded into <details>, still in the HTML for crawlers and AIs.
   - one "contested" badge where the grade and the contested flag both say it.
   ============================================================================ */
(function (global) {
  "use strict";

  var D = global.CorData || null;
  var X = global.CorXref || null;

  // Narrative domain order (social mismatch is primary) + display labels.
  var DOMAIN_ORDER = [
    "social_structure", "mating_reproduction", "care_development", "touch_contact", "circadian_sensory",
    "subsistence_timeuse", "diet_metabolic", "threat_safety", "information_environment",
  ];
  var DOMAIN_LABELS = {
    social_structure: "Social structure",
    mating_reproduction: "Mating & reproduction",
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


  // ---- the plain layer (three records so far) -------------------------------
  var PLAIN = {
    "EEA-SOC-01": {
      says: [
        "In the world humans evolved in, people were known in rings, each about three times the size of the one inside: about 5 to lean on, 15 whose loss would hurt deeply, about 50 friends, and about 150 kept up with at one time, the ceiling. A camp held about 30 of them.",
        "Today a person can have hundreds or thousands of contacts, and the inner rings stay just as small."
      ],
      why: "The rings hold up in modern network data. The exact sizes are disputed, 150 most of all, so read them as rough."
    },
    "EEA-CARE-01": {
      says: [
        "In the world humans evolved in, a baby was cared for by many people: the father, grandmothers, aunts, older brothers and sisters, and trusted people outside the family.",
        "The modern household leaves that work to one or two adults. That is a shortage of hands, and no failure of the parents."
      ],
      why: "Separate field teams saw many people caring for babies in forager groups from the Hadza to the Aka. How much of the care came from others varied a lot. The idea that humans are cooperative breeders, and the calorie argument behind it, are Sarah Hrdy's reading. The label does not cover them."
    },
    "EEA-DIET-02": {
      says: [
        "Ancestral food was full of fiber and bulk and slow to eat, so feeling full kept pace with the calories eaten.",
        "Ultra-processed food is built to the levels of sugar, fat and salt that make people crave it most, with the fiber stripped out, so people keep eating after the body would have stopped them."
      ],
      why: "The modern half rests on Michael Moss's reporting from inside the food industry. The ancestral half rests on reconstructions, and the ancestral fiber figure (100 to 150 grams a day, against about 20 today) is disputed."
    }
  };
  var HOW_TO_READ = "How to read this card: EEA means the world humans evolved in. The label says how well the ancestral picture was tested. Below are the ancestral picture, today's, the gap between them, and the findings behind it.";

  function plainBlock(p) {
    var pl = PLAIN[p.code];
    if (!pl) return "";
    var l = label(p.evidence_grade);
    var says = pl.says.map(function (t) { return esc(t); }).join(" ");
    return '<div class="pv-plain">' +
      '<p class="pv-says">' + says + "</p>" +
      '<p class="pv-why"><b class="pv-lab pv-lab--' + esc(GRADE_TIER[l] || "neutral") + '">' + esc(l.charAt(0).toUpperCase() + l.slice(1)) + ".</b> " + esc(pl.why) + "</p>" +
      '<p class="pv-how">' + esc(HOW_TO_READ) + "</p>" +
      "</div>" +
      '<p class="pv-detail-h">The detail</p>';
  }

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
    return '<div class="gap-mechs"><span class="pv-mechs-k">Systems involved</span>' + chips + "</div>";
  }

  // eea_value (object|null) -> a compact mono block (pretty JSON), or "".
  function valueBlock(v) {
    if (v == null || (typeof v === "object" && !Object.keys(v).length)) return "";
    var json;
    try { json = JSON.stringify(v, null, 2); } catch (e) { return ""; }
    return '<details class="pv-fold"><summary>Raw data</summary>' +
      '<pre class="gap-json">' + esc(json) + "</pre></details>";
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
    return '<details class="pv-fold"><summary>The ' + ev.length + (ev.length === 1 ? " finding" : " findings") + ' behind this record</summary>' +
      '<ul class="gap-ev-list">' + items + "</ul></details>";
  }

  function row(k, v) {
    if (v == null || !String(v).trim()) return "";
    return '<div class="gap-row"><div class="gap-k">' + esc(k) + '</div>' +
      '<div class="gap-v">' + cleanML(v) + "</div></div>";
  }

  // Confidence note: the rubric-v2 line stays in view; the v1 history folds.
  function confidence(p) {
    var note = p.confidence_note;
    if (!note || !String(note).trim()) return "";
    var parts = String(note).split(/\n\s*\n(?=Earlier grading notes)/);
    var current = /^Grade, rubric v2/.test(parts[0]) ? parts[0] : "";
    var older = current ? parts.slice(1).join("\n\n") : String(note);
    var out = "";
    if (current) out += '<div class="gap-row gap-row--conf"><div class="gap-k">Why this label</div><div class="gap-v">' + cleanML(current) + "</div></div>";
    if (older) out += '<details class="pv-fold"><summary>' + (current ? "Earlier grading notes" : "Grading notes") + "</summary>" +
      '<div class="pv-fold-txt">' + cleanML(older) + "</div></details>";
    return out;
  }

  function card(p) {
    var l = label(p.evidence_grade);
    var contested = (p.contested && l !== "contested")
      ? '<span class="gap-contested" title="genuinely disputed in the literature">contested</span>'
      : "";
    var isPlain = !!PLAIN[p.code];
    return '<article class="gap-card"' + (isPlain ? ' data-plain="1"' : "") + ' id="' + esc(p.code) + '">' +
      '<header class="gap-card-head">' +
        '<div class="gap-card-h">' +
          '<h3 class="gap-card-title">' + clean(p.name) + "</h3>" +
          '<p class="gap-card-code">' + esc(p.code) + " &middot; " + clean((DOMAIN_LABELS[p.domain] || p.domain)) + "</p>" +
        "</div>" +
        '<div class="gap-card-badges">' + gradeBadge(p.evidence_grade) + contested + "</div>" +
      "</header>" +
      plainBlock(p) +
      mechChips(p.mechanism_codes) +
      row("How humans lived", p.eea_baseline) +
      row("How humans live now", p.modern_default) +
      row("The gap", p.gap_statement) +
      row("What counts", p.resolution_unit) +
      confidence(p) +
      valueBlock(p.eea_value) +
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
    // The cards render after load, so the browser cannot jump to #EEA-... by
    // itself (the live page is pre-rendered and can). Jump once they exist.
    var id = decodeURIComponent((global.location.hash || "").slice(1));
    var target = id && document.getElementById(id);
    if (target) target.scrollIntoView({ block: "start" });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
})(window);
