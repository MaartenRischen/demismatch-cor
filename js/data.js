/* ============================================================================
   Cor Portal v2 - render-time data layer
   Reads the baked snapshot (window.COR_SNAPSHOT, built by build-snapshot.py).
   No runtime DB query: a bad row degrades one card, it never white-screens.
   Responsibilities:
     - clean(): HTML-escape + normalize em/en dashes to hyphens (brand rule:
       hyphens, never dashes, anywhere) + defensive second-pass artifact scrub.
     - typed accessors over the snapshot.
   The snapshot is already scrubbed at build time; the scrub here is a belt-and
   -braces second pass so the page stays clean even if the data layer changes.
   ============================================================================ */
(function (global) {
  "use strict";

  var SNAP = global.COR_SNAPSHOT || { meta: {}, counts: {}, tables: {}, derived: {} };

  // ---- text hygiene ---------------------------------------------------------
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Brand rule: hyphens, never em/en dashes - normalize at render time.
  // em dash, en dash, horizontal bar, minus sign -> spaced hyphen.
  function normalizeDashes(s) {
    if (typeof s !== "string") return s;
    return s
      .replace(/\s*[—–―−]\s*/g, " - ")
      .replace(/[ \t]{2,}/g, " ");
  }

  // Defensive second pass for any scaffolding artifact that slips through.
  var ARTIFACT_RE = [
    /\[\s*epistemic_grade[^\]]*\]/gi,
    /\[[^\]]*\bfrom handoff\b[^\]]*\]/gi,
    /\[[^\]]*\b(?:TODO|FIXME)\b[^\]]*\]/gi,
    /\b(?:TODO|FIXME|XXX)\b:?/g,
    /\b(?:corchestrator|cor-web|cor-spec|cor-app|claude-code|claude-web)\b/gi,
  ];
  function scrub(s) {
    if (typeof s !== "string") return s;
    var out = s;
    ARTIFACT_RE.forEach(function (rx) { out = out.replace(rx, ""); });
    return out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  }

  // Display pipeline: scrub -> normalize dashes -> escape.
  function clean(v) {
    if (v == null) return "";
    return esc(normalizeDashes(scrub(String(v))));
  }
  // Same, but preserve paragraph breaks as <br><br> (returns safe HTML).
  function cleanMultiline(v) {
    if (v == null) return "";
    var t = normalizeDashes(scrub(String(v)));
    return t.split(/\n{2,}/).map(function (p) {
      return esc(p).replace(/\n/g, "<br>");
    }).join("<br><br>");
  }

  // ---- accessors ------------------------------------------------------------
  function table(name) { return (SNAP.tables && SNAP.tables[name]) || []; }
  function counts() { return SNAP.counts || {}; }
  function meta() { return SNAP.meta || {}; }

  var _mechIndex = null;
  function mechanisms() { return table("mechanisms"); }
  function mechanismByCode(code) {
    if (!_mechIndex) {
      _mechIndex = {};
      mechanisms().forEach(function (m) { _mechIndex[m.code] = m; });
    }
    return _mechIndex[code] || null;
  }
  function foundations() { return table("foundations"); }
  function convergences() { return table("convergences"); }
  function convergenceByCode(code) {
    return convergences().filter(function (c) { return c.code === code; })[0] || null;
  }
  // Live evidence-link count for a mechanism. Returns null (not 0) when the
  // value cannot be resolved, so callers can show "unavailable" rather than a
  // misleading figure. 0 is only returned if the mechanism genuinely has none.
  function evidenceCount(code) {
    var map = (SNAP.derived || {}).evidence_counts_by_mechanism;
    if (!map || !(code in map)) return null;
    var v = map[code];
    return typeof v === "number" && isFinite(v) ? v : null;
  }

  // How many mechanisms have a derived proxy gradient (live). Used for the
  // quiet build-honesty marker so no surface reads as more finished than Cor is.
  function gradientCount() {
    return mechanisms().filter(function (m) {
      var pg = m.proxy_gradient_parsed;
      return !!(pg && ((pg.levels && pg.levels.length) || (pg.axes && pg.axes.length)));
    }).length;
  }
  function buildHonesty() {
    var mech = (counts() || {}).mechanisms;
    if (typeof mech !== "number" || !isFinite(mech)) return "";
    return "derived proxy gradients: " + gradientCount() + " of " + mech + " mechanisms";
  }

  // Canonical mechanism ordering: M1..M14 then R1 (numeric within prefix).
  function mechanismsOrdered() {
    return mechanisms().slice().sort(function (a, b) {
      function key(c) {
        var m = /^([A-Za-z]+)(\d+)$/.exec(c || "");
        if (!m) return [c, 0];
        var rank = m[1] === "M" ? 0 : 1; // M before R
        return [rank, parseInt(m[2], 10)];
      }
      var ka = key(a.code), kb = key(b.code);
      return ka[0] - kb[0] || ka[1] - kb[1];
    });
  }

  // Parse the leading phylogenetic age (in Myr) for the depth indicator.
  // Returns { myr:Number|null, label:String, depth:0..1 } - never invents.
  function phyloDepth(ageStr) {
    if (typeof ageStr !== "string" || !ageStr.trim()) return { myr: null, label: "", depth: 0 };
    var s = ageStr.replace(/,/g, "");
    var byr = /~?\s*([\d.]+)\s*Byr/i.exec(s);
    var myr = /~?\s*([\d.]+)\s*Myr/i.exec(s);
    var val = null;
    if (byr) val = parseFloat(byr[1]) * 1000;
    else if (myr) val = parseFloat(myr[1]);
    // Log scale across ~1Myr .. ~3000Myr maps to 0..1 depth.
    var depth = 0;
    if (val != null && val > 0) {
      var lo = Math.log10(1), hi = Math.log10(3000);
      depth = Math.max(0, Math.min(1, (Math.log10(val) - lo) / (hi - lo)));
    }
    return { myr: val, label: normalizeDashes(ageStr.trim()), depth: depth };
  }

  // ===========================================================================
  // Reference-hub + port accessors (added for the v2 IA build).
  // Every prose field is returned RAW from the snapshot; callers MUST run it
  // through clean()/cleanMultiline() at render time (same contract as the
  // existing accessors, which also return raw rows). Helpers that return a
  // derived display string DO clean here and say so in their doc comment.
  // Absent tables degrade to [] / null so callers render honest empty-states.
  // No counts are hardcoded anywhere; callers read counts() or array .length.
  // ===========================================================================

  function has(v) { return typeof v === "string" && v.trim().length > 0; }

  // Sort {code} rows by numeric suffix within letter prefix (A1<A2<B1...).
  function byCodeNum(rows) {
    return rows.slice().sort(function (a, b) {
      var ma = /^([A-Za-z]+)(\d+)$/.exec((a && a.code) || "");
      var mb = /^([A-Za-z]+)(\d+)$/.exec((b && b.code) || "");
      if (!ma || !mb) return String(a && a.code).localeCompare(String(b && b.code));
      if (ma[1] !== mb[1]) return ma[1].localeCompare(mb[1]);
      return parseInt(ma[2], 10) - parseInt(mb[2], 10);
    });
  }

  // ---- convergences (full fields baked) -------------------------------------
  function convergencesOrdered() { return byCodeNum(convergences()); }

  // ---- empirical demonstrations ---------------------------------------------
  function demonstrations() { return table("empirical_demonstrations"); }
  function demonstrationsOrdered() { return byCodeNum(demonstrations()); }
  function demonstrationByCode(code) {
    return demonstrations().filter(function (d) { return d.code === code; })[0] || null;
  }

  // ---- gaps -----------------------------------------------------------------
  function gaps() { return table("gaps"); }
  function gapsOrdered() { return byCodeNum(gaps()); }
  // Priority order high -> medium -> low, then by code, for the evidence lane.
  function gapsByPriority() {
    var rank = { high: 0, medium: 1, low: 2 };
    return gaps().slice().sort(function (a, b) {
      var ra = rank[String(a.priority).toLowerCase()];
      var rb = rank[String(b.priority).toLowerCase()];
      ra = (ra == null ? 99 : ra); rb = (rb == null ? 99 : rb);
      if (ra !== rb) return ra - rb;
      return byCodeNum([a, b])[0] === a ? -1 : 1;
    });
  }

  // ---- domains --------------------------------------------------------------
  function domains() { return table("domains"); }
  // Domains carry no code; sort by name for a stable browse.
  function domainsOrdered() {
    return domains().slice().sort(function (a, b) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }

  // ---- applications ---------------------------------------------------------
  function applications() { return table("applications"); }
  function applicationByCode(code) {
    return applications().filter(function (a) { return a.code === code; })[0] || null;
  }
  // CUT LIST: A7 (AI training data) + A8 (augmentation) are intentionally
  // excluded everywhere in v2 (speculative positioning). Use THIS, never the
  // raw applications(), for any Reference/Repair surface. A1 (AI Alignment)
  // sorts first per the IA, then numeric.
  var APP_EXCLUDE = { A7: true, A8: true };
  function applicationsForDisplay() {
    var rows = applications().filter(function (a) { return !APP_EXCLUDE[a.code]; });
    return byCodeNum(rows).sort(function (a, b) {
      if (a.code === "A1") return -1;
      if (b.code === "A1") return 1;
      return 0;
    });
  }

  // ---- works / bibliography -------------------------------------------------
  function works() { return table("works"); }
  function workById(id) {
    if (!_workIndex) {
      _workIndex = {};
      works().forEach(function (w) { _workIndex[w.id] = w; });
    }
    return _workIndex[id] || null;
  }
  var _workIndex = null;
  // Newest-first, then title. Bibliography default ordering.
  function worksOrdered() {
    return works().slice().sort(function (a, b) {
      var ya = +a.year || 0, yb = +b.year || 0;
      if (ya !== yb) return yb - ya;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }
  // Importance buckets for filtering: pillar > key > supporting.
  function worksByImportance(level) {
    return worksOrdered().filter(function (w) {
      return String(w.importance).toLowerCase() === String(level).toLowerCase();
    });
  }

  // ---- researchers / thinkers -----------------------------------------------
  function researchers() { return table("researchers"); }
  function researcherById(id) {
    if (!_researcherIndex) {
      _researcherIndex = {};
      researchers().forEach(function (r) { _researcherIndex[r.id] = r; });
    }
    return _researcherIndex[id] || null;
  }
  var _researcherIndex = null;
  // Grouped by tier for the thinkers provenance surface. Tiers seen in the
  // snapshot: foundational / empirical / adjacent. Unknown tiers fall into
  // "other" so nothing is silently dropped. Each group sorted by name.
  function researchersByTier() {
    var groups = { foundational: [], empirical: [], adjacent: [], other: [] };
    researchers().forEach(function (r) {
      var k = String(r.tier || "").toLowerCase();
      (groups[k] || groups.other).push(r);
    });
    Object.keys(groups).forEach(function (k) {
      groups[k].sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
    });
    return groups;
  }

  // ---- enriched foundations -------------------------------------------------
  // The snapshot foundation rows carry: code, layer, name, statement,
  // derivation, scope_notes, epistemic_grade. NOTE: there is NO
  // `additional_paragraphs` field in the snapshot - do not expect one. This
  // returns the rows ordered the way the derivation stack reads them
  // (frame -> premise -> property -> consequence), numeric within layer.
  var LAYER_ORDER = { frame: 0, premise: 1, property: 2, consequence: 3 };
  function foundationsOrdered() {
    return foundations().slice().sort(function (a, b) {
      var la = LAYER_ORDER[String(a.layer).toLowerCase()];
      var lb = LAYER_ORDER[String(b.layer).toLowerCase()];
      la = (la == null ? 99 : la); lb = (lb == null ? 99 : lb);
      if (la !== lb) return la - lb;
      var sorted = byCodeNum([a, b]);
      return sorted[0] === a ? -1 : 1;
    });
  }
  function foundationByCode(code) {
    return foundations().filter(function (f) { return f.code === code; })[0] || null;
  }
  function foundationsByLayer(layer) {
    var L = String(layer).toLowerCase();
    return byCodeNum(foundations().filter(function (f) {
      return String(f.layer).toLowerCase() === L;
    }));
  }

  // ---- foundation -> convergence derivation edges ---------------------------
  // The v2_foundation_convergences junction: which foundation(s) each
  // convergence instantiates (foundation_code, convergence_code, relation,
  // confidence, source_note). Absent table degrades to [] so callers render the
  // honest "open / no foundational parent" state (mirrors the MCP's
  // grounded=false). No fabrication: a convergence with no edge (C11, C14) is
  // open by design, never given a filler parent.
  function foundationConvergences() { return table("foundation_convergences"); }
  // The foundation parents of one convergence, ordered by foundation code
  // (numeric within prefix), each joined to its foundation name for display.
  // foundation_name is null when the code has no matching foundation row, so the
  // caller can degrade the deep-link to plain text rather than a broken anchor.
  // An empty array means the convergence is ungrounded (open) - render honestly.
  function foundationParentsFor(convCode) {
    var edges = foundationConvergences().filter(function (e) {
      return e && e.convergence_code === convCode;
    });
    edges = edges.slice().sort(function (a, b) {
      var ra = /^([A-Za-z]+)(\d+)$/.exec((a && a.foundation_code) || "");
      var rb = /^([A-Za-z]+)(\d+)$/.exec((b && b.foundation_code) || "");
      if (!ra || !rb) {
        return String((a && a.foundation_code) || "")
          .localeCompare(String((b && b.foundation_code) || ""));
      }
      if (ra[1] !== rb[1]) return ra[1].localeCompare(rb[1]);
      return parseInt(ra[2], 10) - parseInt(rb[2], 10);
    });
    return edges.map(function (e) {
      var f = foundationByCode(e.foundation_code);
      return {
        foundation_code: e.foundation_code,
        foundation_name: (f && has(f.name)) ? f.name : null,
        relation: e.relation,
        confidence: e.confidence,
        source_note: e.source_note,
      };
    });
  }

  // ---- bridge thesis (Panksepp-Barrett resolution, BT1) ---------------------
  function bridgeTheses() { return table("bridge_theses"); }
  function bridgeThesis() { return bridgeTheses()[0] || null; }

  // ---- challenges (THIN / ABSENT - honesty accessor) ------------------------
  // There is NO `challenges` table in the snapshot. The IA's "Challenges"
  // evidence-lane section depends on a future re-bake. The only challenge-layer
  // content that currently exists is unstructured `spec_role` prose on a few
  // G11-anchor researchers (no title/content/caveat fields anywhere). This
  // accessor returns whatever exists and a flag so callers render an honest
  // "not yet operationalized" empty-state instead of fabricating cards.
  //   -> { rows: [], hasRichFields: false, note: "..." }
  function challenges() {
    var rows = table("challenges"); // [] today; populated only by a re-bake
    var rich = rows.length > 0 && rows.every(function (r) {
      return has(r.title) && (has(r.content) || has(r.body) || has(r.statement));
    });
    return {
      rows: rows,
      hasRichFields: rich,
      // The gap that tracks this work is G11 (challenge-layer depth).
      note: rows.length
        ? (rich ? "" : "Challenge rows present but missing title/content - render minimally.")
        : "Challenge layer not yet operationalized in the snapshot (tracked by gap G11)."
    };
  }

  // ---- EEA-baseline layer ---------------------------------------------------
  // Per-parameter ancestral baseline + modern default + the gap (delta), hung
  // off mechanisms at L5. Rows carry: code, domain, name, eea_baseline,
  // eea_value (object|null), modern_default, gap_statement, resolution_unit,
  // evidence_grade, contested, confidence_note, mechanism_codes[], evidence[].
  // Honesty contract: grades vary (mostly theoretical/thin/contested; only two
  // replicated) and single-population figures are illustrative, not constants -
  // callers MUST foreground evidence_grade + contested. Prose returned raw; run
  // through clean()/cleanMultiline() at render (same contract as every accessor).
  function eeaParameters() { return table("eea_parameters"); }
  function eeaParameterByCode(code) {
    return eeaParameters().filter(function (p) { return p.code === code; })[0] || null;
  }
  // Parameters hung off a given mechanism code (for the mechanism cross-link),
  // ordered by their own code.
  function eeaForMechanism(code) {
    return byCodeNum(eeaParameters().filter(function (p) {
      return (p.mechanism_codes || []).indexOf(code) !== -1;
    }));
  }
  // Grade distribution (live, from the rows) for the section legend.
  function eeaGradeCounts() {
    var out = {};
    eeaParameters().forEach(function (p) {
      var g = p.evidence_grade || "ungraded";
      out[g] = (out[g] || 0) + 1;
    });
    return out;
  }

  // ---- generic any-table presence check for callers -------------------------
  function hasTable(name) {
    return !!(SNAP.tables && Object.prototype.hasOwnProperty.call(SNAP.tables, name)
      && SNAP.tables[name] && SNAP.tables[name].length);
  }

  global.CorData = {
    esc: esc,
    clean: clean,
    cleanMultiline: cleanMultiline,
    normalizeDashes: normalizeDashes,
    scrub: scrub,
    table: table,
    counts: counts,
    meta: meta,
    mechanisms: mechanisms,
    mechanismsOrdered: mechanismsOrdered,
    mechanismByCode: mechanismByCode,
    foundations: foundations,
    foundationsOrdered: foundationsOrdered,
    foundationByCode: foundationByCode,
    foundationsByLayer: foundationsByLayer,
    foundationConvergences: foundationConvergences,
    foundationParentsFor: foundationParentsFor,
    convergences: convergences,
    convergencesOrdered: convergencesOrdered,
    convergenceByCode: convergenceByCode,
    demonstrations: demonstrations,
    demonstrationsOrdered: demonstrationsOrdered,
    demonstrationByCode: demonstrationByCode,
    gaps: gaps,
    gapsOrdered: gapsOrdered,
    gapsByPriority: gapsByPriority,
    domains: domains,
    domainsOrdered: domainsOrdered,
    applications: applications,
    applicationByCode: applicationByCode,
    applicationsForDisplay: applicationsForDisplay,
    works: works,
    worksOrdered: worksOrdered,
    worksByImportance: worksByImportance,
    workById: workById,
    researchers: researchers,
    researcherById: researcherById,
    researchersByTier: researchersByTier,
    bridgeTheses: bridgeTheses,
    bridgeThesis: bridgeThesis,
    challenges: challenges,
    eeaParameters: eeaParameters,
    eeaParameterByCode: eeaParameterByCode,
    eeaForMechanism: eeaForMechanism,
    eeaGradeCounts: eeaGradeCounts,
    hasTable: hasTable,
    evidenceCount: evidenceCount,
    gradientCount: gradientCount,
    buildHonesty: buildHonesty,
    phyloDepth: phyloDepth,
  };

  // Auto-populate the quiet build-honesty marker on any surface that includes
  // a [data-cor-honesty] element (footer/header). One place, every page.
  function initHonestyMarkers() {
    var els = document.querySelectorAll("[data-cor-honesty]");
    if (!els.length) return;
    var t = buildHonesty() || "spec counts unavailable";
    for (var i = 0; i < els.length; i++) els[i].textContent = t;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initHonestyMarkers);
  else initHonestyMarkers();
})(window);
