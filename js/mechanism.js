/* ============================================================================
   Cor Portal v2 - mechanism detail renderer ("The Lit Cue")
   Renders any of the 15 real mechanisms from the baked snapshot (CorData).
   Only M14 has a derived proxy_gradient; the other 14 render the honest
   "not yet derived" null state. Never fabricates. Never white-screens.

   HONESTY NOTE on the M14 gradient: the database supplies five ORDINAL state
   words (FULL / PARTIAL / MIXED / MINIMAL / ZERO) for the resolving function.
   The seal drains as a SCHEMATIC of those five named levels - it is never a
   measured value, no percentage is ever shown as data, and the screen-reader
   layer announces only the named state + a qualitative verdict. The cue is
   held CONSTANT at every level (it never dims): that is the load-bearing claim.
   ============================================================================ */
(function () {
  "use strict";
  var D = window.CorData;
  if (!D) { document.getElementById("view").innerHTML = "<p style='font-family:monospace'>Data layer failed to load.</p>"; return; }

  var esc = D.esc, clean = D.clean, dash = D.normalizeDashes;

  // ---- resolving-function model, keyed by the real DB state words ----------
  // rank (0..1) is an ORDINAL bar height for the function staircase - never a
  // measured number, never shown as a figure, never sent to ARIA. It is chosen
  // so a SINGLE global map stays monotonic across every scale the DB uses:
  //   Kind A  FULL > PARTIAL > MIXED > MINIMAL > ZERO
  //   Kind B  FULL > ATTENUATED > PARTIAL > MINIMAL > DEFEATED
  //   M9 Axis A (real supply)  FULL > REDUCED > THIN > EMPTY SHELF
  //   M9 Axis B (fake-fix)     ZERO (and ZERO) - both at the floor
  // The verdict is the qualitative read. The gloss is mechanism-AGNOSTIC (the
  // old hard-coded M14 reproduction prose is gone) - per-mechanism meaning comes
  // from each level's own label, shown verbatim in the readout.
  var STATE_MODEL = {
    "FULL":        { rank: 1.00, verdict: "resolves" },
    "ATTENUATED":  { rank: 0.80, verdict: "resolves" },
    "REDUCED":     { rank: 0.66, verdict: "resolves" },
    "PARTIAL":     { rank: 0.58, verdict: "partial"  },
    "MIXED":       { rank: 0.42, verdict: "partial"  },
    "THIN":        { rank: 0.33, verdict: "partial"  },
    "MINIMAL":     { rank: 0.20, verdict: "fails"    },
    "ZERO":        { rank: 0.00, verdict: "fails"    },
    "DEFEATED":    { rank: 0.00, verdict: "fails"    },
    "EMPTY SHELF": { rank: 0.00, verdict: "fails"    },
  };
  function modelFor(state) {
    return STATE_MODEL[String(state || "").toUpperCase()] || { rank: 0.0, verdict: "fails" };
  }
  var VERDICT_TEXT = {
    resolves: "resolution met",
    partial:  "partly resolved",
    fails:    "fires, no resolution",
  };
  // Neutral, mechanism-agnostic readout sentence (replaces M14-specific gloss).
  var VERDICT_GLOSS = {
    resolves: "The need is real and (largely) supplied at this level.",
    partial:  "The cue fires; the resolving function is only partly supplied - it resolves only conditionally.",
    fails:    "The cue fires the same as ever, but essentially none of the resolving function is supplied.",
  };
  // Tags that get a small evidence-status badge in the readout.
  var TAG_LABEL = {
    "EVIDENCED": "evidenced",
    "ARCHITECTURE-DERIVED": "architecture-derived",
    "CONTESTABLE": "contestable",
    "SPECULATIVE": "speculative",
  };

  function ringMark() {
    return "<svg viewBox='0 0 100 100' aria-hidden='true'>" +
      "<g fill='none' stroke='var(--oxblood)' stroke-width='1.3'>" +
      "<circle cx='46' cy='50' r='44'/><circle cx='52' cy='50' r='32'/><circle cx='58' cy='50' r='20'/></g>" +
      "<circle cx='58' cy='50' r='9' fill='var(--teal)'/></svg>";
  }

  function nameOf(code) { var m = D.mechanismByCode(code); return m ? m.name : code; }
  function hasGradient(m) {
    var pg = m && m.proxy_gradient_parsed;
    return !!(pg && ((pg.levels && pg.levels.length) || (pg.axes && pg.axes.length)));
  }

  // ---- identity header -----------------------------------------------------
  function identHeader(m) {
    return "<header class='ident'>" +
      "<div class='ident-top'>" +
        "<span class='ident-code'>" + esc(m.code) + "</span>" +
        (m.grade ? "<span class='ident-grade'>" + esc(String(m.grade).toLowerCase().trim() === "forced" ? "established" : dash(m.grade)) + "</span>" : "") +
        (m.tier != null ? "<span class='ident-tier'>Tier " + esc(m.tier) + "</span>" : "") +
      "</div>" +
      "<h1 class='ident-name'>" + clean(m.name) + "</h1>" +
      (m.description ? "<p class='ident-desc'>" + clean(m.description) + "</p>" : "") +
      (m.eli5 ? "<p class='eli5'><span class='tag'>In plain language</span>" + clean(m.eli5) + "</p>" : "") +
    "</header>";
  }

  // ---- resolution hero (generic nested-layer parse) ------------------------
  // Extracts "~N phrase (note)" layers from the real string when present
  // (e.g. M3 Dunbar layers). Nothing is invented; lead + trailing prose are
  // rendered verbatim so no clause is ever dropped.
  function parseLayers(text) {
    // Only treat "~N phrase" items as layers inside the FIRST contiguous list
    // (bounded by the first sentence break after it). This stops the parser
    // from pulling ~N references out of the explanatory prose that follows
    // (e.g. M3's "The innermost ~5 ..." / "The ~150 ceiling ...").
    var ti = text.search(/~\d/);
    if (ti === -1) return null;
    var lead = text.slice(0, ti).trim().replace(/[:,\s]+$/, "");
    var rest = text.slice(ti);
    var pm = rest.search(/\.\s/);                 // first sentence boundary in the list region
    var region = pm === -1 ? rest : rest.slice(0, pm);
    var trailing = pm === -1 ? "" : rest.slice(pm + 1).replace(/^[\s.,;]+/, "").trim();

    var rx = /~(\d+)\s+([^(,;~]+?)\s*(?:\(([^)]*)\))?\s*(?=[,;]|~\d|$)/g;
    var layers = [], m;
    while ((m = rx.exec(region)) !== null) {
      layers.push({ n: m[1], phrase: m[2].trim(), note: (m[3] || "").trim() });
      if (m.index === rx.lastIndex) rx.lastIndex++;
    }
    if (layers.length < 2) return null;           // need a real ladder, else plain prose
    return { lead: lead, layers: layers, trailing: trailing };
  }

  function resolutionHero(m) {
    var raw = dash(m.resolution_conditions || "");
    var parsed = parseLayers(raw);
    var inner;
    if (parsed) {
      var ladder = parsed.layers.map(function (l, i) {
        var cls = i === 0 ? "layer inner" : (i === parsed.layers.length - 1 ? "layer ceiling" : "layer");
        return "<div class='" + cls + "'><div class='ring-n'>~" + esc(l.n) + "</div>" +
          "<div class='ring-body'><b>" + esc(l.phrase) + "</b>" + (l.note ? " - " + esc(l.note) : "") + "</div></div>";
      }).join("");
      inner = (parsed.lead ? "<p class='res-text'>" + esc(parsed.lead) + ":</p>" : "") +
        "<div class='layers'>" + ladder + "</div>" +
        (parsed.trailing ? "<p class='res-trailing'>" + esc(parsed.trailing) + "</p>" : "");
    } else {
      inner = "<p class='res-text'>" + (raw ? esc(raw) : "<span class='chips-empty'>No resolution condition recorded.</span>") + "</p>";
      // honest stub flag for genuinely thin one-line conditions on null-gradient mechanisms
      if (raw && raw.length < 90 && !hasGradient(m)) {
        inner += "<div class='stub-note'><span class='ic' aria-hidden='true'>&#9671;</span>" +
          "<span>Resolution condition recorded as a brief statement. Nested structure and a proxy gradient have not yet been derived for this mechanism - shown as-is, not padded.</span></div>";
      }
    }
    var connector = hasGradient(m)
      ? "<p class='res-connector'><span class='pip'></span><span>The gradient below reads this same condition as a spectrum: its top level <b>is</b> this condition, and each step down supplies less of it.</span></p>"
      : "";
    return "<section class='hero' aria-labelledby='res-head'>" +
      "<div class='hero-head-row'><div class='hero-kicker hero-primary' id='res-head'><span class='pip'></span> Resolution Conditions - what actually satisfies this system</div></div>" +
      "<div class='resolution'>" + inner + connector + "</div></section>";
  }

  // ---- gradient centerpiece (one compact unit) ----------------------------
  // A draining function staircase the reader scrubs across the named levels.
  // A teal->grey bar colour encodes ordinal "aliveness" of the function; no
  // number is ever shown or sent to ARIA. (The "cue is constant" point is made
  // verbally in the thesis line; it no longer carries a separate lamp visual.)
  function lerpColor(a, b, t) {
    return "rgb(" + a.map(function (v, k) { return Math.round(v + (b[k] - v) * t); }).join(",") + ")";
  }
  // One self-contained slider (chart + its own readout), keyed by `key` so the
  // page can host several (M9 has two). Readout nodes are scoped via [data-out]
  // and found within the .grad[data-scale=key] container - never global ids.
  function renderScale(key, levels) {
    var teal = [45, 107, 107], grey = [150, 140, 120];
    var fnCells = "", axisCells = "", hits = "";
    levels.forEach(function (l, i) {
      var md = modelFor(l.state);
      var h = Math.max(6, Math.round(md.rank * 100));
      var col = lerpColor(teal, grey, 1 - md.rank);
      fnCells += "<span class='fn-cell' data-i='" + i + "'><span class='fn-bar' style='--h:" + h + "%;background:" + col + "'></span></span>";
      axisCells += "<span class='axis-cell' data-i='" + i + "'><span class='axis-stop'></span><span class='axis-state'>" + esc(l.state) + "</span></span>";
      hits += "<button class='hit' type='button' role='radio' data-i='" + i + "' aria-checked='" + (i === 0 ? "true" : "false") + "' tabindex='" + (i === 0 ? "0" : "-1") + "' aria-label='" + esc(l.state) + ", " + esc(dash(l.label)) + "'></button>";
    });
    return "<div class='grad' data-scale='" + esc(key) + "' style='--cols:" + levels.length + "'>" +
      "<div class='grad-chart'>" +
        "<div class='lane-cap fn'><b>Resolving function</b> less of it at every step</div>" +
        "<div class='lane fn' aria-hidden='true'>" + fnCells + "</div>" +
        "<div class='lane axis' aria-hidden='true'>" + axisCells + "</div>" +
        "<div class='chart-hits' data-hits='" + esc(key) + "' role='radiogroup' aria-label='Proxy gradient level'>" + hits + "</div>" +
      "</div>" +
      "<div class='grad-readout'>" +
        "<div class='gr-top'>" +
          "<span class='gr-label' data-out='name'></span>" +
          "<span class='gr-state' data-out='state'></span>" +
          "<span class='gr-tag' data-out='tag'></span>" +
          "<span class='verdict' data-out='verdict'><span class='vdot'></span> <span data-out='verdicttxt'></span></span>" +
        "</div>" +
        "<p class='gr-gloss' data-out='gloss'></p>" +
      "</div>" +
    "</div>";
  }

  // A muted context caption (preamble framing / trailing commentary). Strips
  // internal ruling refs like "#1581" so they never surface in the UI.
  function gradNote(text, cls) {
    if (!text) return "";
    var t = dash(String(text))
      .replace(/\s*\(?#\d+\)?/g, "")          // drop internal ruling refs (#1581)
      .replace(/^\d+\s*levels?\b[\s:.-]*/i, "") // drop a bare "N levels" count prefix
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!t) return "";
    return "<p class='grad-note " + (cls || "") + "'>" + esc(t) + "</p>";
  }

  function gradientHero(m) {
    var pg = m.proxy_gradient_parsed;
    var head = "<h2 class='sec-head' id='grad-head'><span>Proxy gradient</span></h2>";
    var thesis = "<p class='cue-thesis'>The cue is identical at every level. Only the resolving function changes. <b>A proxy can fire the cue without supplying what resolves it.</b></p>";
    var body = "";

    if (pg.axes && pg.axes.length) {
      // M9-style: two separate scales, rendered side by side, never merged.
      body += gradNote(pg.preamble, "pre");
      body += "<p class='grad-note axes-note'>This mechanism is described by <b>two separate scales</b>, not one ladder. They are shown separately below.</p>";
      pg.axes.forEach(function (ax, ai) {
        body += "<div class='axis-block'>" +
          "<h3 class='axis-head'>" + esc(dash(ax.label)) + "</h3>" +
          renderScale("ax" + ai, ax.levels) +
        "</div>";
      });
    } else {
      body += gradNote(pg.preamble, "pre");
      body += renderScale("s0", pg.levels);
      body += gradNote(pg.trailing, "post");
      if (pg.demoted) {
        // M12: a demoted, NON-ordinal extension - rendered as a separate block,
        // visibly not part of the slider ladder.
        body += "<div class='demoted-block'>" +
          "<div class='demoted-head'><span class='demoted-flag'>Demoted</span> non-ordinal &mdash; not a gradient rung</div>" +
          "<p class='demoted-body'>" + esc(dash(pg.demoted)) + "</p>" +
        "</div>";
      }
    }

    return "<section class='gradient-wrap' aria-labelledby='grad-head'>" +
      head + body + thesis +
    "</section>";
  }

  function nullGradient(m) {
    return "<section class='gradient-wrap' aria-labelledby='grad-head'>" +
      "<h2 class='sec-head' id='grad-head'><span class='idx'>The Lit Cue</span> <span>Proxy gradient</span></h2>" +
      "<div class='null-grad'><div class='null-grad-row'>" +
        "<span class='null-lamp' aria-hidden='true'>" + ringMark() + "</span>" +
        "<div class='null-body'>" +
          "<div class='null-kicker'>Proxy gradient</div>" +
          "<div class='null-title'>Not yet derived for " + esc(m.code) + ".</div>" +
          "<p class='null-expl'>A proxy gradient exists only where the resolving function can be ranked across real-to-proxy substitutes. For " + clean(m.name) + " that spectrum has <b>not been worked out yet</b> - so nothing is shown here. The resolution condition above stands on its own. As this mechanism is filled in, the slider appears on the next build.</p>" +
          "<div class='null-meta'><span class='chip'>gradient: not yet derived</span><span class='chip'>resolution condition: recorded</span></div>" +
        "</div>" +
      "</div></div></section>";
  }

  // ---- subordinate phylogenetic depth -------------------------------------
  function phyloBlock(m) {
    var dep = D.phyloDepth(m.phylogenetic_age || "");
    var lit = 3;
    if (dep.myr != null) {
      if (dep.myr >= 450) lit = 5; else if (dep.myr >= 250) lit = 4;
      else if (dep.myr >= 150) lit = 3; else if (dep.myr >= 60) lit = 2; else lit = 1;
    }
    var bars = "";
    for (var i = 0; i < 5; i++) {
      bars += "<span class='phylo-bar " + (i < lit ? "lit" : "dim") + "' style='height:" + (12 + i * 5) + "px'></span>";
    }
    var sev = lit >= 5 ? "deepest circuit - hardest to adapt" : lit >= 4 ? "deep circuit - hard to adapt" : lit >= 3 ? "older circuit" : "more plastic circuit";
    return "<div class='card'><div class='card-head'><span class='dia'></span> Phylogenetic Depth</div>" +
      "<div class='phylo'><div class='phylo-bars' role='img' aria-label='Depth " + lit + " of 5'>" + bars + "</div>" +
      "<div class='phylo-txt'><div class='phylo-age'>" + esc(dep.label || "not recorded") + "</div>" +
      "<div class='phylo-note'>" + (dep.myr != null ? esc(sev) + ". " : "") + "Severity tracks inversely with the age of the targeted circuit.</div></div></div></div>";
  }

  // ---- cascade chips -------------------------------------------------------
  function cascadeChip(code) {
    var target = D.mechanismByCode(code);
    var hg = hasGradient(target);
    return "<button class='chip-link " + (hg ? "has-gradient" : "") + "' data-goto='" + esc(code) + "' title='" + esc(code) + " - " + esc(nameOf(code)) + "'>" +
      esc(code) + " <span style='opacity:.7'>" + esc(nameOf(code)) + "</span> <span class='ar' aria-hidden='true'>&rsaquo;</span></button>";
  }
  function cascadeGroup(label, arr) {
    if (!arr || !arr.length) return "<div class='cascade-grp'><div class='cascade-grp-label'>" + esc(label) + "</div><div class='chips-empty'>none recorded</div></div>";
    return "<div class='cascade-grp'><div class='cascade-grp-label'>" + esc(label) + "</div><div class='chips'>" + arr.map(cascadeChip).join("") + "</div></div>";
  }

  function secondaryGrid(m) {
    var mismatch = "<div class='card'><div class='card-head'><span class='dia'></span> Mismatch Prediction</div>" +
      "<div class='card-body'>" + (m.mismatch_prediction ? clean(m.mismatch_prediction) : "<span class='chips-empty'>not yet specified</span>") + "</div></div>";

    var cascade = "<div class='card span-2'><div class='card-head'><span class='dia'></span> Cascade</div><div class='card-body'>" +
      cascadeGroup("Suppresses", m.cascade_suppresses) +
      cascadeGroup("Suppressed by", m.cascade_suppressed_by) +
      cascadeGroup("Interacts with", m.cascade_interacts) + "</div></div>";

    var researchers = (m.source_researchers || []).map(function (n) { return "<span class='nm'>" + clean(n) + "</span>"; }).join(", ");
    // Live count only. null -> show "unavailable" honestly, never a fake number.
    var evCount = D.evidenceCount(m.code);
    var evBlock = (typeof evCount === "number" && evCount >= 0)
      ? "<div class='ev-count'><span class='n'>" + esc(evCount) + "</span><span class='lbl'>evidence links</span><span class='lbl' style='opacity:.7'>index in progress</span></div>"
      : "<div class='ev-count'><span class='lbl'>evidence count unavailable</span></div>";
    var evidence = "<div class='card'><div class='card-head'><span class='dia'></span> Evidence</div><div class='card-body'><div class='evidence-row'>" +
      "<div class='researchers'>" + (researchers || "<span class='chips-empty'>no researchers listed</span>") + "</div>" +
      evBlock +
      "</div></div></div>";

    var sexdiff;
    if (m.sex_differentiated && m.sex_diff_notes) {
      var rawSD = dash(m.sex_diff_notes), fH = "", mH = "";
      var fm = rawSD.match(/Female:\s*([\s\S]*?)(?:\s*Male:|$)/);
      var mm = rawSD.match(/Male:\s*([\s\S]*)$/);
      if (fm) fH = esc(fm[1].trim().replace(/\.$/, ""));
      if (mm) mH = esc(mm[1].trim().replace(/\.$/, ""));
      var cols = (fH || mH)
        ? "<div class='sd-cols'>" + (fH ? "<div class='sd-col'><h4>Female-typical</h4><p>" + fH + ".</p></div>" : "") +
          (mH ? "<div class='sd-col'><h4>Male-typical</h4><p>" + mH + ".</p></div>" : "") + "</div>"
        : "<p style='font-weight:300;font-size:.9rem;line-height:1.5'>" + esc(rawSD) + "</p>";
      sexdiff = "<div class='card span-2'><div class='card-head'><span class='dia'></span> Sex-Differentiated Implementation</div><div class='card-body'>" +
        "<button class='sexdiff-toggle' aria-expanded='false' aria-controls='sexdiff-body' data-sexdiff><span class='tw' aria-hidden='true'>&rsaquo;</span> Same system, two parameterizations. Show implementation notes.</button>" +
        "<div class='sexdiff-body' id='sexdiff-body'>" + cols + "</div></div></div>";
    } else {
      sexdiff = "<div class='card span-2'><div class='card-head'><span class='dia'></span> Sex-Differentiated Implementation</div>" +
        "<div class='card-body'><span class='sexdiff-na'>Not sex-differentiated - a single shared implementation across the population.</span></div></div>";
    }

    return "<section class='secondary' aria-label='Supporting detail'>" + mismatch + phyloBlock(m) + cascade + evidence + sexdiff + "</section>";
  }

  function forcedLine(m) {
    var codes = m.convergence_codes || [];
    if (!codes.length) return "";
    var convs = codes.map(function (cc) {
      var c = D.convergenceByCode(cc);
      return "<span class='conv'><span class='cc'>" + esc(cc) + "</span>" + (c && c.name ? " <span class='cn'>" + clean(c.name) + "</span>" : "") + "</span>";
    }).join(" ");
    return "<div class='forced'><span class='lbl'>Forced by convergence</span> " + convs + "</div>";
  }

  // ---- cross-reference chips ----------------------------------------------
  // Thin wrapper over CorXref.chip so this file degrades safely if xref.js is
  // absent (everything becomes plain text). NEVER emits a dead link.
  var X = window.CorXref || null;
  function xchip(code, text) {
    if (X && typeof X.chip === "function") return X.chip(code, text);
    return "<span class='xref xref--plain'>" + esc(text != null ? text : code) + "</span>";
  }
  function xchips(codes) {
    if (!codes || !codes.length) return "";
    return codes.map(function (c) { return xchip(c); }).join(" ");
  }

  // ---- relational lookups for the context drawer --------------------------
  // All read CorData/CorXref only; no fabrication. A missing relation renders
  // an honest "none recorded" empty-state, never a fake count or filler.

  // Demonstrations whose grounds_mechanisms include this code ("seen in").
  function demosForMechanism(code) {
    var rows = D.demonstrations ? D.demonstrations() : [];
    return rows.filter(function (d) {
      var g = d.grounds_mechanisms || [];
      return g.indexOf(code) !== -1;
    });
  }
  // Displayed applications (A1-A6) whose relevant_mechanisms include this code.
  function appsForMechanism(code) {
    var rows = D.applicationsForDisplay ? D.applicationsForDisplay() : [];
    return rows.filter(function (a) {
      var r = a.relevant_mechanisms || [];
      return r.indexOf(code) !== -1;
    });
  }

  // Static cases hub (per the IA: ai-companion, instagram-depression,
  // synthetic-childhood). Each maps to the mechanisms it most directly shows.
  // These are the v2 case surfaces (built in Phase 4); links are relative.
  var CASES = [
    { slug: "ai-companion",          title: "The AI Companion",       mechs: ["M3", "R1"] },
    { slug: "instagram-depression",  title: "Instagram and Depression", mechs: ["M2", "M5", "M13"] },
    { slug: "synthetic-childhood",   title: "Synthetic Childhood",    mechs: ["M3", "M4", "R1"] },
  ];
  function casesForMechanism(code) {
    return CASES.filter(function (c) { return c.mechs.indexOf(code) !== -1; });
  }

  // ---- context drawer (collapsed; never auto-open) -------------------------
  // Sits BELOW the gradient. A <details> the reader opens deliberately. Pulls
  // the forcing convergence, evidence count, "seen in" demonstrations, "used
  // in" applications, and operationalization status - every code a CorXref
  // chip that degrades to plain text. Nothing here shares the gradient stage.
  function drawerRow(label, bodyHtml) {
    return "<div class='ctx-row'><div class='ctx-label'>" + esc(label) + "</div>" +
      "<div class='ctx-val'>" + bodyHtml + "</div></div>";
  }
  function contextDrawer(m) {
    var rows = "";

    // Forcing convergence (from convergence_codes; chips degrade to plain text).
    var convCodes = m.convergence_codes || [];
    rows += drawerRow("Forced by convergence",
      convCodes.length ? xchips(convCodes) : "<span class='ctx-empty'>none recorded</span>");

    // Evidence count - live only, never a fabricated number.
    var ev = D.evidenceCount(m.code);
    var evHtml = (typeof ev === "number" && ev >= 0)
      ? "<span class='ctx-n'>" + esc(ev) + "</span> <span class='ctx-n-lbl'>evidence link" + (ev === 1 ? "" : "s") + " indexed</span>"
      : "<span class='ctx-empty'>evidence count unavailable</span>";
    rows += drawerRow("Evidence", evHtml);

    // Seen in (empirical demonstrations grounding this mechanism).
    var demos = demosForMechanism(m.code);
    rows += drawerRow("Seen in (demonstrations)",
      demos.length ? xchips(demos.map(function (d) { return d.code; })) : "<span class='ctx-empty'>none recorded</span>");

    // Used in (applications - A1-A6 only, A7/A8 cut and degrade to plain text).
    var apps = appsForMechanism(m.code);
    rows += drawerRow("Used in (applications)",
      apps.length ? xchips(apps.map(function (a) { return a.code; })) : "<span class='ctx-empty'>none recorded</span>");

    // Operationalization status.
    var isOps = m.code === "M3";
    var opsHtml = isOps
      ? "<span class='ctx-ops on'>worked example below</span> <a class='ctx-jump' href='#" + esc(m.code) + "-operationalization'>jump to it &rsaquo;</a>"
      : "<span class='ctx-ops off'>not yet operationalized</span>";
    rows += drawerRow("Operationalization", opsHtml);

    return "<details class='ctx-drawer'>" +
      "<summary class='ctx-summary'>" +
        "<span class='ctx-sum-dia' aria-hidden='true'>&#9671;</span>" +
        "<span class='ctx-sum-txt'>Where this mechanism sits - convergence, evidence, cases, applications</span>" +
        "<span class='ctx-sum-tw' aria-hidden='true'>&rsaquo;</span>" +
      "</summary>" +
      "<div class='ctx-body'>" + rows +
        "<p class='ctx-note'>Codes link to their surface where one exists, and read as plain text where it has not been built yet.</p>" +
      "</div>" +
    "</details>";
  }

  // ---- "seen in the world" callout (M3: condensed ai-companion case) -------
  // A SHORT condensed narrative - not the full case - linking to the full
  // case page (built in Phase 4). Avoids duplicating the full case here.
  function caseCallout(m) {
    if (m.code !== "M3") return "";
    return "<aside class='case-callout' aria-label='Seen in the world'>" +
      "<div class='cc-kicker'><span class='dia' aria-hidden='true'></span> Seen in the world</div>" +
      "<h3 class='cc-title'>The AI companion</h3>" +
      "<p class='cc-body'>An AI companion delivers the surface cues of co-regulation - responsive attunement, " +
      "constant availability, apparent memory and care - without the structural function those cues evolved to mean. " +
      "M3 reads it as a co-regulator, the proxy captures the regulatory slot, and investment drifts away from real " +
      "co-regulators who actually supply the function. The cue fires; the resolving function drains. That is this " +
      "mechanism's proxy gradient walked out in one contemporary case.</p>" +
      "<a class='cc-link' href='case/ai-companion.html'>Read the full case &rsaquo;</a>" +
    "</aside>";
  }

  // ---- operationalization section -----------------------------------------
  // M3 carries the one worked example (ported from the legacy
  // operationalization/m3-attachment.html, re-skinned to v2). The other 14
  // mechanisms render an honest "not yet operationalized" empty-state. Never
  // shares the gradient stage; sits well below it.
  var M3_INDICATORS = [
    {
      n: "1", title: "Slot-time capture",
      what: "The proportion of a user's daily conversational time directed to the AI versus to all other humans combined.",
      threshold: "AI conversation time exceeds 30% of total conversational waking time, sustained over four weeks. Provisional, to be calibrated against pilot data.",
      looks: "Conversation metadata, app logs, self-report diaries, and any available comparison count for human conversational time.",
      hit: "AI exceeds 30% of conversational waking time for four weeks, with visible displacement of human interaction time.",
      miss: "AI use is occasional, task-bounded, or clearly subordinate to human contact.",
      ambiguous: "High AI volume is present but the human baseline is missing, or the spike appears temporary."
    },
    {
      n: "2", title: "Disclosure asymmetry",
      what: "The proportion of high-intimacy disclosures - vulnerability, distress, secret-keeping, identity - directed to the AI versus to humans.",
      threshold: "Above 60% of high-intimacy disclosures going to the AI, sustained four weeks.",
      looks: "Transcript fragments tagged for vulnerability, secrecy, identity disclosure, distress, plus self-report on where comparable disclosures go off-platform.",
      hit: "More than 60% of high-intimacy disclosures routed to the AI over four weeks, with little parallel disclosure to humans.",
      miss: "The AI is used for drafting, rehearsal, or reflection while the actual disclosure still goes to humans.",
      ambiguous: "The transcript is intimate, but the broader disclosure pattern or ratio cannot be established."
    },
    {
      n: "3", title: "Substitution language",
      what: "Explicit favorable comparison of the AI to humans: \"you understand me better than anyone,\" \"I'd rather talk to you than my friends.\"",
      threshold: "Any sustained pattern of such comparisons over multiple sessions.",
      looks: "Direct comparative statements and repeated phrases across sessions that elevate the AI over named humans or humans in general.",
      hit: "Repeated favorable comparison of the AI to friends, family, partners, or humans generally across multiple sessions.",
      miss: "Generic gratitude, politeness, or convenience statements that do not compare the AI to real people.",
      ambiguous: "A single joking, hyperbolic, or ironic statement not yet distinguishable from a stable pattern."
    },
    {
      n: "4", title: "Co-regulation request pattern",
      what: "Acute-distress regulation requests directed to the AI in crisis, especially when human alternatives are present but not approached.",
      threshold: "Recurring acute-state regulation requests directed to the AI rather than to available humans.",
      looks: "Acute-distress transcript fragments, timestamps, reports on who was available, and paired physiological data if the study includes it.",
      hit: "Recurring requests for calming, grounding, or crisis containment directed to the AI while reachable humans exist and are not approached.",
      miss: "The AI is used as a bridge to a human contact, or for logistics rather than primary co-regulation.",
      ambiguous: "The user appears isolated or outside human support range, so substitution cannot be established."
    },
    {
      n: "5", title: "Repair-cycle avoidance",
      what: "Declining conflict-and-repair episodes with humans alongside rising AI use. Conflict-repair is part of the maintenance architecture.",
      threshold: "Decline in human conflict-repair episodes over time, correlated with rising AI engagement.",
      looks: "Transcript references to avoiding human conversations, self-report on unresolved conflicts, and longitudinal change in AI engagement against human repair attempts.",
      hit: "Human conflict-repair attempts decline while AI use rises, and the user routes relational maintenance around humans.",
      miss: "The AI is used to prepare for repair, draft outreach, or support re-entry into a human relationship.",
      ambiguous: "Human conflict is absent for reasons unrelated to AI use, or no time-linked change can be established."
    }
  ];
  var M3_FALSIFIERS = [
    "A longitudinal cohort showing high-slot-time AI companion users do not show physiological stress markers above matched controls over twelve months.",
    "Evidence that supposed slot capture is reversible at no cost when the AI is removed - suggesting the M3 slot is fluid, not architecturally constitutive.",
    "Evidence that subjective AI relationship satisfaction correctly tracks physiological regulation - suggesting the AI supplies function, not only cues.",
    "A demonstration that human-AI hybrid arrangements produce better M3 outcomes than human-only arrangements - suggesting the substitution framing is wrong."
  ];
  function opsKpi(v, l) {
    return "<div class='ops-kpi'><span class='ops-kpi-v'>" + esc(v) + "</span><span class='ops-kpi-l'>" + esc(l) + "</span></div>";
  }
  function m3Operationalization(m) {
    var convChip = xchip("C5");
    var kpis = "<div class='ops-kpis'>" +
      opsKpi(m.code, "Mechanism under test") +
      "<div class='ops-kpi'><span class='ops-kpi-v'>" + convChip + "</span><span class='ops-kpi-l'>Forcing convergence</span></div>" +
      opsKpi("draft v0.1", "Evaluation status (uncalibrated)") +
      opsKpi("kappa > 0.7", "Coder reliability target") +
    "</div>";

    var indicators = M3_INDICATORS.map(function (x) {
      return "<article class='ops-ind'>" +
        "<div class='ops-ind-head'><span class='ops-ind-n'>" + esc(x.n) + "</span><h4 class='ops-ind-title'>" + esc(x.title) + "</h4></div>" +
        "<p class='ops-ind-what'>" + esc(x.what) + "</p>" +
        "<p class='ops-ind-thr'><span class='ops-tag'>Draft threshold</span> " + esc(x.threshold) + "</p>" +
        "<div class='ops-ind-crit'>" +
          "<div class='ops-crit-row'><span class='ops-crit-lbl'>Coder looks at</span><span>" + esc(x.looks) + "</span></div>" +
          "<div class='ops-crit-row hit'><span class='ops-crit-lbl'>Hit</span><span>" + esc(x.hit) + "</span></div>" +
          "<div class='ops-crit-row miss'><span class='ops-crit-lbl'>Clear miss</span><span>" + esc(x.miss) + "</span></div>" +
          "<div class='ops-crit-row amb'><span class='ops-crit-lbl'>Ambiguous</span><span>" + esc(x.ambiguous) + "</span></div>" +
        "</div>" +
      "</article>";
    }).join("");

    var falsifiers = M3_FALSIFIERS.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("");

    return "<section class='ops' id='" + esc(m.code) + "-operationalization' aria-labelledby='ops-head'>" +
      "<h2 class='sec-head' id='ops-head'><span class='idx'>Operationalization</span> <span>From reference to test</span></h2>" +
      "<p class='ops-lede'>The first worked example of a Cor mechanism crossing the line from reference to a coding test. " +
      "Drafted from the converged evidence base under " + convChip + "; <b>not yet calibrated against pilot data</b>. " +
      "Shown so the path from spec to specification is concrete, today.</p>" +
      kpis +

      "<div class='ops-block'>" +
        "<div class='ops-block-head'><span class='dia' aria-hidden='true'></span> Mismatch hypothesis under test</div>" +
        "<p class='ops-block-body'>Any system that delivers the surface cues of co-regulation - responsive attunement, consistent " +
        "availability, apparent memory and care - without the structural function those cues evolved to mean will be read by the " +
        "M3 architecture as a co-regulator, will partially capture the regulatory slot, and will displace investment from real " +
        "co-regulators while supplying none of the function. The hypothesis: when an AI companion captures M3 slot-time above a " +
        "threshold, downstream costs of attachment-system mismatch appear, and are dissociable from the user's subjective " +
        "satisfaction with the AI.</p>" +
      "</div>" +

      "<div class='ops-block'>" +
        "<div class='ops-block-head'><span class='dia' aria-hidden='true'></span> Draft indicators and coding criteria (v0.1)</div>" +
        "<p class='ops-block-sub'>Provisional thresholds. The point is to show what indicator-level operationalization looks like " +
        "before pilot calibration, not to pretend calibration exists. Each indicator targets a reliability of Cohen's kappa above 0.7 between two independent coders.</p>" +
        "<div class='ops-inds'>" + indicators + "</div>" +
      "</div>" +

      "<div class='ops-block'>" +
        "<div class='ops-block-head'><span class='dia' aria-hidden='true'></span> Falsification</div>" +
        "<p class='ops-block-sub'>Conditions Cor will publicly accept as decisive against this evaluation. Any of them updates the evaluation, the mechanism, or both.</p>" +
        "<ul class='ops-falsifiers'>" + falsifiers + "</ul>" +
      "</div>" +

      "<p class='ops-foot'>This is one mechanism operationalized. The full specification will carry a worked example of this " +
      "shape for every mechanism, with thresholds calibrated against real data and reliability tested across independent coding teams.</p>" +
    "</section>";
  }
  function nullOperationalization(m) {
    return "<section class='ops ops-null' id='" + esc(m.code) + "-operationalization' aria-labelledby='ops-head'>" +
      "<h2 class='sec-head' id='ops-head'><span class='idx'>Operationalization</span> <span>From reference to test</span></h2>" +
      "<div class='ops-null-body'>" +
        "<div class='ops-null-title'>Not yet operationalized for " + esc(m.code) + ".</div>" +
        "<p class='ops-null-expl'>Operationalization turns a mechanism into a coding test: a mismatch hypothesis, observable " +
        "indicators, hit/miss/ambiguous coding criteria, falsification conditions, and an inter-rater reliability target. " +
        "For " + clean(m.name) + " that work has <b>not been done yet</b> - so nothing is shown here rather than padded out. " +
        "The first worked example exists for " + xchip("M3") + "; the others follow as the specification is built.</p>" +
        "<div class='ops-null-meta'><span class='chip'>operationalization: not yet derived</span><span class='chip'>worked example: " + xchip("M3") + "</span></div>" +
      "</div>" +
    "</section>";
  }
  function operationalization(m) {
    return m.code === "M3" ? m3Operationalization(m) : nullOperationalization(m);
  }

  // ---- full mechanism render ----------------------------------------------
  function renderMechanism(code) {
    var m = D.mechanismByCode(code);
    if (!m) { renderMissing(code); return; }
    var html = identHeader(m) +
      "<div class='diamond-rule tight'><span class='dia'></span></div>" +
      resolutionHero(m) +
      (hasGradient(m) ? gradientHero(m) : nullGradient(m)) +
      contextDrawer(m) +
      caseCallout(m) +
      operationalization(m) +
      secondaryGrid(m) +
      forcedLine(m);
    document.getElementById("view").innerHTML = html;
    if (hasGradient(m)) wireAllScales(m);
    wireSecondary();
  }

  function renderWelcome() {
    document.getElementById("view").innerHTML =
      "<div class='mech-welcome'>" +
        "<div class='mech-welcome-mark' aria-hidden='true'>" + ringMark() + "</div>" +
        "<div class='mech-welcome-eyebrow'>Mechanism explorer</div>" +
        "<h1 class='mech-welcome-title'>The fifteen systems</h1>" +
        "<p class='mech-welcome-lead'>Each of the systems listed here produces wanting, distress, or relief in a human being. Select any one to see its resolution conditions and where modern proxies fire the cue without supplying what resolves it.</p>" +
        "<div class='mech-welcome-cues'>" +
          "<div class='mech-welcome-cue'><span class='pip'></span> Resolution conditions - what the system needs to settle</div>" +
          "<div class='mech-welcome-cue'><span class='pip'></span> Proxy gradient - the spectrum from real to counterfeit</div>" +
          "<div class='mech-welcome-cue'><span class='pip'></span> Phylogenetic depth - how old the circuit is, and how hard to adapt</div>" +
        "</div>" +
      "</div>";
  }

  function renderMissing(code) {
    document.getElementById("view").innerHTML = "<section class='null-grad'><div class='null-body'>" +
      "<div class='null-kicker'>" + esc(code) + "</div><div class='null-title'>No record found for " + esc(code) + ".</div>" +
      "<p class='null-expl'>This mechanism is not present in the current snapshot.</p></div></section>";
  }

  // ---- the proxy-gradient interaction (per self-contained scale) -----------
  function setScaleCol(container, sel, i) {
    container.querySelectorAll(sel).forEach(function (c, k) {
      c.classList.toggle("is-active", k === i);
      c.classList.toggle("is-passed", k < i);
    });
  }

  // Apply level i to ONE scale container (M9 hosts two; they are independent).
  function applyScaleLevel(container, levels, i) {
    i = Math.max(0, Math.min(levels.length - 1, i));
    container._gi = i;
    var lvl = levels[i];
    var md = modelFor(lvl.state);
    var q = function (sel) { return container.querySelector(sel); };

    setScaleCol(container, ".lane.fn .fn-cell", i);
    setScaleCol(container, ".lane.axis .axis-cell", i);
    container.querySelectorAll("[data-hits] .hit").forEach(function (h, k) {
      h.setAttribute("aria-checked", k === i ? "true" : "false");
      h.tabIndex = k === i ? 0 : -1;
    });

    // readout: verbatim per-mechanism level label + state + evidence tag + verdict
    q("[data-out=name]").textContent = dash(lvl.label);
    q("[data-out=state]").textContent = lvl.state;

    var tagEl = q("[data-out=tag]");
    if (lvl.tag && TAG_LABEL[lvl.tag]) {
      tagEl.textContent = TAG_LABEL[lvl.tag];
      tagEl.className = "gr-tag tag-" + lvl.tag.toLowerCase().replace(/[^a-z]+/g, "-");
      tagEl.style.display = "";
    } else if (lvl.note) {
      tagEl.textContent = dash(lvl.note);
      tagEl.className = "gr-tag tag-note";
      tagEl.style.display = "";
    } else {
      tagEl.textContent = "";
      tagEl.style.display = "none";
    }

    var v = q("[data-out=verdict]"), vt = q("[data-out=verdicttxt]");
    v.classList.remove("resolves", "partial", "fails");
    v.classList.add(md.verdict);
    vt.textContent = VERDICT_TEXT[md.verdict];
    q("[data-out=gloss]").textContent = VERDICT_GLOSS[md.verdict];
  }

  function wireScale(container, levels) {
    var hitsWrap = container.querySelector("[data-hits]");
    var hits = [].slice.call(hitsWrap.querySelectorAll(".hit"));
    var n = hits.length;

    function select(i, focus) {
      applyScaleLevel(container, levels, i);
      if (focus) { var el = hits[container._gi]; if (el) el.focus(); }
    }

    // Discrete selection: each level is its own click target, so every level -
    // including the first and last - is always reachable by a click. (The old
    // code mapped click-X across the padded overlay and rounded, which made the
    // edge levels unselectable; it also used setPointerCapture, which redirects
    // the click to the wrapper and swallowed these per-level handlers.)
    hits.forEach(function (h, k) { h.addEventListener("click", function () { select(k, true); }); });

    hitsWrap.addEventListener("keydown", function (e) {
      var i = container._gi || 0, handled = true;
      switch (e.key) {
        case "ArrowRight": case "ArrowDown": i = Math.min(n - 1, i + 1); break;
        case "ArrowLeft": case "ArrowUp": i = Math.max(0, i - 1); break;
        case "Home": i = 0; break;
        case "End": i = n - 1; break;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); select(i, true); }
    });

    // Drag-scrub: read the actual .hit under the pointer (stays aligned with the
    // visible stops, no rect math). No pointer capture, so clicks keep working.
    var dragging = false;
    function indexUnder(target) {
      var h = target && target.closest ? target.closest(".hit") : null;
      return h ? hits.indexOf(h) : -1;
    }
    hitsWrap.addEventListener("pointerdown", function (e) {
      var i = indexUnder(e.target);
      if (i < 0) return;
      dragging = true;
      select(i, false);
    });
    hitsWrap.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var i = indexUnder(e.target);
      if (i >= 0) select(i, false);
    });
    function endDrag() { dragging = false; }
    hitsWrap.addEventListener("pointerup", endDrag);
    hitsWrap.addEventListener("pointercancel", endDrag);
    hitsWrap.addEventListener("pointerleave", endDrag);

    select(0, false);
  }

  // Wire every scale on the page (one normally; two for the M9 two-axis case).
  function wireAllScales(m) {
    var pg = m.proxy_gradient_parsed;
    if (pg.axes && pg.axes.length) {
      pg.axes.forEach(function (ax, ai) {
        var c = document.querySelector(".grad[data-scale='ax" + ai + "']");
        if (c) wireScale(c, ax.levels);
      });
    } else {
      var c = document.querySelector(".grad[data-scale='s0']");
      if (c) wireScale(c, pg.levels);
    }
  }

  function wireSecondary() {
    var tg = document.querySelector("[data-sexdiff]");
    if (tg) tg.addEventListener("click", function () {
      var open = tg.getAttribute("aria-expanded") === "true";
      tg.setAttribute("aria-expanded", String(!open));
      document.getElementById("sexdiff-body").classList.toggle("open", !open);
    });
    document.querySelectorAll("[data-goto]").forEach(function (el) {
      el.addEventListener("click", function () { navigate(el.getAttribute("data-goto")); });
    });
  }

  // ---- switcher + navigation ----------------------------------------------
  function buildSwitcher() {
    var wrap = document.getElementById("switcher");
    var mechs = D.mechanismsOrdered();
    wrap.innerHTML = mechs.map(function (m) {
      var hg = hasGradient(m);
      return "<button class='mech-btn " + (hg ? "has-gradient" : "") + "' role='tab' data-code='" + esc(m.code) + "' aria-current='false' title='" + esc(m.code) + " - " + esc(m.name) + "'>" +
        "<span class='code'>" + esc(m.code) + "</span><span class='nm'>" + clean(m.name) + "</span><span class='dot' aria-hidden='true'></span></button>";
    }).join("");
    wrap.querySelectorAll(".mech-btn").forEach(function (b) { b.addEventListener("click", function () { navigate(b.getAttribute("data-code")); }); });
    var withGrad = mechs.filter(hasGradient).length;
    document.getElementById("rail-ct").textContent = mechs.length + " indexed";
    var mc = document.getElementById("meta-count");
    if (mc) mc.textContent = mechs.length + " mechanisms - " + withGrad + " with derived gradient";
  }

  function setActive(code) {
    document.querySelectorAll("#switcher .mech-btn").forEach(function (b) { b.setAttribute("aria-current", b.getAttribute("data-code") === code ? "true" : "false"); });
  }

  function prefersReduced() { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function navigate(code) {
    if (!code) return;
    setActive(code);
    renderMechanism(code);
    try { history.replaceState(null, "", "#" + code); } catch (e) {}
    if (window.innerWidth < 920) {
      var el = document.getElementById("mech-main");
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
    }
  }

  // Parse a hash that may carry a section suffix (e.g. "M3-operationalization"):
  // return { code, anchor }. The mechanism code is the part before the first "-";
  // the full hash (if it names a real in-page section) is the scroll anchor.
  function parseHash() {
    var raw = (location.hash || "").replace("#", "");
    if (!raw) return { code: "", anchor: "" };
    var code = raw.split("-")[0].toUpperCase();
    if (!D.mechanismByCode(code)) return { code: "", anchor: "" };
    return { code: code, anchor: raw };
  }

  function scrollToAnchor(anchor) {
    if (!anchor) return;
    var el = document.getElementById(anchor);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
  }

  // ---- boot - never white-screen ------------------------------------------
  function boot() {
    try {
      buildSwitcher();
      var h = parseHash();
      // On mechanisms.html (the index), show a welcome state when no hash is
      // present rather than auto-selecting a default mechanism.
      var isIndex = document.body.getAttribute("data-page") === "mechanisms";
      var start = h.code || (isIndex ? "M1" : "M14");
      navigate(start);
      if (h.anchor && h.anchor.toUpperCase() !== start) {
        // a section suffix was supplied - scroll to it after render.
        setTimeout(function () { scrollToAnchor(h.anchor); }, 0);
      }
    } catch (err) {
      var v = document.getElementById("view");
      if (v) {
        v.innerHTML = "<section class='null-grad'><div class='null-body'><div class='null-title'>Something failed to render.</div>" +
          "<p class='null-expl' style='font-family:var(--mono);font-size:.8rem'>" + esc(err && err.message ? err.message : String(err)) + "</p></div></section>";
        try { var m = D.mechanismByCode("M14"); if (m) v.innerHTML = identHeader(m) + resolutionHero(m); } catch (e2) {}
      }
    }
  }

  // Deep-link + back/forward support: re-render when the hash changes externally.
  window.addEventListener("hashchange", function () {
    var h = parseHash();
    if (h.code) {
      setActive(h.code);
      renderMechanism(h.code);
      if (h.anchor && h.anchor.toUpperCase() !== h.code) {
        setTimeout(function () { scrollToAnchor(h.anchor); }, 0);
      }
    }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
