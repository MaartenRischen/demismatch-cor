/* ============================================================================
   Cor Portal v2 - Reference library renderer.
   Builds the single Library door from the baked snapshot (CorData) ordered as
   the framework's own argument: Need -> Operate -> Mismatch -> Repair ->
   Evidence -> Papers. Section container ids are FIXED by IA-BUILD-CONTRACT sec.5
   (the rail + CorXref deep-links depend on them). Every taxonomy code is a
   CorXref chip (degrades to plain text - no dead links). Counts are live; a
   thin/absent field renders an honest empty-state, never fabricated copy.

   Each render block is independently try/caught: one bad table degrades its own
   section, never the page.
   ============================================================================ */
(function () {
  "use strict";

  var D = window.CorData;
  var X = window.CorXref;

  function esc(v) { return D ? D.esc(v) : String(v == null ? "" : v); }
  function clean(v) { return D ? D.clean(v) : esc(v); }
  function cleanML(v) { return D ? D.cleanMultiline(v) : esc(v); }

  // A code chip via CorXref (link if a surface exists, else plain text).
  function chip(code, text) {
    if (X && typeof X.chip === "function") return X.chip(code, text);
    return '<span class="xref xref--plain">' + esc(text != null ? text : code) + "</span>";
  }
  // Render an array of codes as a chip row; empty -> "".
  function chipRow(codes) {
    if (!codes || !codes.length) return "";
    var out = codes.map(function (c) { return chip(c); }).join("");
    return '<div class="ref-chips">' + out + "</div>";
  }
  // Labeled chip row ("Grounds M1 M4") - omitted entirely when empty.
  function chipRowLabeled(label, codes) {
    if (!codes || !codes.length) return "";
    return '<div class="ref-chiprow">' +
      '<span class="ref-chiprow-lbl">' + esc(label) + "</span>" +
      codes.map(function (c) { return chip(c); }).join("") +
      "</div>";
  }

  // Humanize an underscore/lowercase token ("strongly_supported" -> "strongly supported").
  function humanize(v) {
    if (v == null) return "";
    return D.normalizeDashes(String(v)).replace(/_/g, " ").trim();
  }

  // Grade chip label. Confidence top tier stored as "forced" (decision 2250);
  // rendered as "established". Entailment ("Forces") is a separate chip.
  function gradeLabel(v) {
    var s = humanize(v);
    return s.toLowerCase() === "forced" ? "established" : s;
  }

  // Set inner HTML of a section body, with a calm empty-state fallback.
  function fill(id, html, emptyMsg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = html && html.trim()
      ? html
      : '<p class="ref-empty">' + esc(emptyMsg || "Not yet available in this snapshot.") + "</p>";
  }

  function safe(fn) { try { fn(); } catch (e) { /* one section down, page lives */ } }

  // ---- "as of" build date (frozen dated figure, per the never-hardcode rule) -
  safe(function () {
    var el = document.getElementById("ref-asof");
    if (!el || !D) return;
    var built = (D.meta() || {}).built_at;
    if (!built) return;
    var day = String(built).slice(0, 10); // YYYY-MM-DD
    el.textContent = "Library snapshot as of " + day + ".";
  });

  if (!D) {
    // No data layer: leave the static section blurbs, mark bodies honestly.
    var bodies = document.querySelectorAll(".ref-sec-body");
    for (var i = 0; i < bodies.length; i++) {
      bodies[i].innerHTML = '<p class="ref-empty">Reference data did not load.</p>';
    }
    return;
  }

  /* ======================================================================
     1. NEED / Foundations - flat browse, deep-link into Derivation layers.
     ====================================================================== */
  safe(function () {
    var rows = D.foundationsOrdered() || [];
    var html = rows.map(function (f) {
      // chip() already deep-links foundation codes to derivation.html#deriv-<layer>.
      var head = '<div class="ref-card-top">' +
        chip(f.code) +
        (f.layer ? '<span class="ref-tag">' + esc(humanize(f.layer)) + "</span>" : "") +
        (f.epistemic_grade ? '<span class="ref-tag ref-tag-grade">' + esc(gradeLabel(f.epistemic_grade)) + "</span>" : "") +
        "</div>";
      var name = '<h3 class="ref-card-name">' + clean(f.name || f.code) + "</h3>";
      var stmt = f.statement ? '<p class="ref-card-body">' + clean(f.statement) + "</p>" : "";
      return '<article class="ref-card">' + head + name + stmt + "</article>";
    }).join("");
    fill("ref-foundations-body",
      '<div class="ref-grid">' + html + "</div>",
      "Foundations not yet derived.");
  });

  /* ======================================================================
     2. OPERATE / Convergences.
     ====================================================================== */
  safe(function () {
    var rows = D.convergencesOrdered() || [];
    var html = rows.map(function (c) {
      var lits = Array.isArray(c.independent_literatures) ? c.independent_literatures : [];
      var litList = lits.length
        ? '<ul class="ref-lit">' + lits.map(function (l) {
            return "<li>" + clean(l) + "</li>";
          }).join("") + "</ul>"
        : "";
      // forces_mechanism is often null - only show the chip when present.
      var forces = (c.forces_mechanism)
        ? chipRowLabeled("Forces", [c.forces_mechanism])
        : "";
      var head = '<div class="ref-card-top">' +
        chip(c.code) +
        (c.epistemic_grade ? '<span class="ref-tag ref-tag-grade">' + esc(gradeLabel(c.epistemic_grade)) + "</span>" : "") +
        "</div>";
      return '<article class="ref-card">' +
        head +
        '<h3 class="ref-card-name">' + clean(c.name || c.code) + "</h3>" +
        (c.statement ? '<p class="ref-card-body">' + clean(c.statement) + "</p>" : "") +
        (litList ? '<div class="ref-sub"><span class="ref-sub-lbl">Independent literatures</span>' + litList + "</div>" : "") +
        forces +
        "</article>";
    }).join("");
    fill("ref-convergences-body",
      '<div class="ref-grid">' + html + "</div>",
      "No convergences in this snapshot.");
  });

  /* ======================================================================
     3. OPERATE / Demonstrations.
     ====================================================================== */
  safe(function () {
    var rows = D.demonstrationsOrdered() || [];
    var html = rows.map(function (d) {
      var metric = (d.primary_metric_display)
        ? '<p class="ref-metric">' + clean(d.primary_metric_display) + "</p>"
        : (d.effect_size ? '<p class="ref-metric">' + clean(d.effect_size) + "</p>" : "");
      var src = "";
      if (d.source_work_id != null) {
        var w = D.workById(d.source_work_id);
        if (w) {
          var cite = [w.authors, w.year].filter(Boolean).join(", ");
          src = '<p class="ref-cite">' + clean(w.title || "") +
            (cite ? ' <span class="ref-cite-meta">' + clean(cite) + "</span>" : "") + "</p>";
        }
      }
      var grounds =
        chipRowLabeled("Grounds", d.grounds_mechanisms) +
        chipRowLabeled("Grounds", d.grounds_foundations);
      return '<article class="ref-card ref-card-wide">' +
        '<div class="ref-card-top">' + chip(d.code) +
          (d.metric_family ? '<span class="ref-tag">' + esc(humanize(d.metric_family)) + "</span>" : "") +
        "</div>" +
        '<h3 class="ref-card-name">' + clean(d.name || d.code) + "</h3>" +
        metric +
        (d.what_it_demonstrates ? '<p class="ref-card-body"><b>What it demonstrates.</b> ' + clean(d.what_it_demonstrates) + "</p>" : "") +
        (d.narrative ? '<p class="ref-card-body">' + clean(d.narrative) + "</p>" : "") +
        grounds +
        src +
        "</article>";
    }).join("");
    fill("ref-demonstrations-body", html, "No demonstrations in this snapshot.");
  });

  /* ======================================================================
     4. MISMATCH / Cases - static hub for the 3 KEPT cases. The case pages
     are built in Phase 4; link by filename now. (Old copy said "five times"
     / "four use cases" for 5 cases - bug fixed: 3 cases, count read live.)
     ====================================================================== */
  safe(function () {
    var CASES = [
      {
        slug: "ai-companion",
        n: "Case 01",
        title: "The AI companion trap",
        mechanism: "M3",
        mechanismText: "M3 Social Bonding",
        mismatch: "A proxy bond fires the attachment system without reciprocal human co-regulation.",
        conventional: "Use the tool responsibly; set screen limits.",
        prescription: "An AI must not occupy a Dunbar slot. Restore reliable human co-regulators; route AI toward human connection, not to replace it.",
        recognition: "A chatbot becomes the most responsive relationship in a lonely life, and the loneliness alarm goes quiet for the wrong reason."
      },
      {
        slug: "instagram-depression",
        n: "Case 02",
        title: "Instagram depression",
        mechanism: "M5",
        mechanismText: "M5 Status Monitoring",
        mismatch: "Rank circuitry built for about 150 people is forced to compare against millions of algorithmically selected lives.",
        conventional: "Work on self-esteem; reframe comparison cognitively.",
        prescription: "Restore a bounded reference group where position is stable, fair, and visible. Remove the global proxy; the signal is accurate to the environment.",
        recognition: "Status circuitry built for bounded groups is forced to compare upward against millions of algorithmically selected lives."
      },
      {
        slug: "synthetic-childhood",
        n: "Case 03",
        title: "The synthetic childhood",
        mechanism: "M4",
        mechanismText: "M4 Play, M3 Attachment, M7 Circadian",
        mismatch: "Developmental windows calibrate to a world designed to hold attention, not to the inputs the systems evolved to need.",
        conventional: "Set screen-time limits; pick better apps.",
        prescription: "Restore outdoor unstructured play, stable adult relationships, morning daylight, and movement. The windows close on whatever is present.",
        recognition: "Developmental windows close on a world designed to hold attention, not on a world calibrated to what those systems evolved to need."
      }
    ];

    // Overview table (recognition first; mechanism column deep-links via chip).
    var rowsHTML = CASES.map(function (c) {
      return "<tr>" +
        "<td>" + esc(c.n) + " &middot; " + clean(c.title) + "</td>" +
        "<td>" + chip(c.mechanism) + "</td>" +
        "<td>" + clean(c.mismatch) + "</td>" +
        "<td>" + clean(c.conventional) + "</td>" +
        "<td>" + clean(c.prescription) + "</td>" +
        "</tr>";
    }).join("");

    var table =
      '<p class="ref-cases-intro">Same operation, ' + esc(String(CASES.length)) +
        " times. Each row: the presenting situation, the mechanism it is a signal " +
        "from, the mismatch producing it, the conventional reply, and what Cor " +
        "reads the signal as.</p>" +
      '<div class="ref-table-wrap"><table class="ref-table">' +
        "<thead><tr><th>Case</th><th>Mechanism</th><th>Mismatch</th>" +
        "<th>Conventional advice</th><th>Cor prescription</th></tr></thead>" +
        "<tbody>" + rowsHTML + "</tbody>" +
      "</table></div>";

    // Recognition card grid.
    var cards = CASES.map(function (c) {
      return '<article class="ref-case-card">' +
        '<div class="ref-card-top"><span class="ref-tag">' + esc(c.n) + "</span>" + chip(c.mechanism) + "</div>" +
        '<h3 class="ref-card-name">' + clean(c.title) + "</h3>" +
        '<p class="ref-card-body">' + clean(c.recognition) + "</p>" +
        '<a class="ref-case-link" href="case/' + esc(c.slug) + '.html">Read the case' +
          '<span aria-hidden="true"> -&gt;</span></a>' +
        "</article>";
    }).join("");

    fill("ref-cases-body",
      table +
      '<h3 class="ref-subhead">Start with the life situation, not the terminology.</h3>' +
      '<div class="ref-case-grid">' + cards + "</div>",
      "");
  });

  /* ======================================================================
     5. REPAIR / Applications - A1-A6 ONLY (A7/A8 cut). A1 first.
     ====================================================================== */
  safe(function () {
    var rows = D.applicationsForDisplay() || [];
    var html = rows.map(function (a) {
      var rel =
        chipRowLabeled("Mechanisms", a.relevant_mechanisms) +
        chipRowLabeled("Foundations", a.relevant_foundations);
      return '<article class="ref-card ref-card-wide">' +
        '<div class="ref-card-top">' + chip(a.code) + "</div>" +
        '<h3 class="ref-card-name">' + clean(a.name || a.code) + "</h3>" +
        (a.description ? '<p class="ref-card-body">' + clean(a.description) + "</p>" : "") +
        rel +
        "</article>";
    }).join("");

    // Link to the M3 operationalization worked example. It lives on the M3
    // mechanism-detail page (the operationalization section, id M3-operationalization);
    // there is no standalone worked-example page. chip(M3) deep-links to the same card.
    var worked =
      '<aside class="ref-worked">' +
        '<span class="dia" aria-hidden="true"></span>' +
        '<div class="ref-worked-body">' +
          '<h3 class="ref-worked-title">A worked example</h3>' +
          '<p class="ref-worked-sub">See the resolution-check run end to end on ' +
            chip("M3") + ' - from cue to resolution conditions to an operational test.</p>' +
        "</div>" +
        '<a class="ref-worked-link" href="mechanism.html#M3-operationalization">Open the worked example' +
          '<span aria-hidden="true"> -&gt;</span></a>' +
      "</aside>";

    fill("ref-applications-body", html + worked, "No applications in this snapshot.");
  });

  /* ======================================================================
     6. EVIDENCE / Interpretive calls - static prose port (atlas.html, as-is).
     ====================================================================== */
  safe(function () {
    var CALLS = [
      {
        h: "Affective architecture",
        p: "The framework treats Panksepp's basic-affect architecture (SEEKING, FEAR, RAGE, LUST, CARE, PANIC/GRIEF, PLAY) as the primary structural reference for subcortical motivational systems. Lisa Feldman Barrett's constructionist account of emotion is a serious alternative the framework does not currently adopt. The reasoning: Panksepp's framework integrates more cleanly with comparative neuroscience and the phylogenetic depth principle, and gives the discrete-mechanism handles the application layer needs. The constructionist literature is acknowledged in the Challenges section."
      },
      {
        h: "Inclusive fitness and gene-culture coevolution",
        p: "The framework treats inclusive fitness as the loss function the architecture was selected against (foundation P1). It does not treat gene-culture coevolution as a competing framework but as a refinement that operates within the same selection logic. Researchers who treat the two as fundamentally distinct frames may read this as an interpretive bet."
      },
      {
        h: "Strong vs weak mismatch",
        p: "The framework takes the strong-mismatch position: the modern environment is systematically misaligned with the architecture, and that misalignment is the primary driver of widespread non-pathological distress. Weak-mismatch readings - environments are different but the architecture is sufficiently flexible that the mismatch is mostly absorbed - are addressed in the Challenges section but not adopted."
      },
      {
        h: "Domain-sensitive architecture vs general learning",
        p: "The framework treats the human motivational-emotional architecture as domain-sensitive (domain-specific adaptations exist and can be enumerated), not as the output of a general-purpose learning system. This is a position in an ongoing argument and the framework is not neutral on it."
      }
    ];
    var html = '<div class="ref-prose">' +
      CALLS.map(function (c) {
        return '<h3 class="ref-prose-head">' + clean(c.h) + "</h3>" +
          "<p>" + clean(c.p) + "</p>";
      }).join("") +
      "<p class=\"ref-prose-note\">These are the largest interpretive calls. " +
      "Smaller calls are noted on the individual mechanism page where they apply.</p>" +
      "</div>";
    fill("ref-interpretive-calls-body", html, "");
  });

  /* ======================================================================
     7. EVIDENCE / Gaps - high -> medium -> low.
     ====================================================================== */
  safe(function () {
    var rows = D.gapsByPriority() || [];
    // Reconcile the legacy hero's hardcoded "14 gaps": the count is now driven
    // live from CorData (snapshot Content-Range), surfaced as a section badge,
    // never a literal. If snapshot + legacy ever disagreed, the snapshot wins.
    var titleEl = document.querySelector("#ref-gaps .ref-sec-title");
    if (titleEl && rows.length && !titleEl.querySelector(".ref-sec-count")) {
      titleEl.insertAdjacentHTML("beforeend",
        ' <span class="ref-sec-count">' + esc(String(rows.length)) + "</span>");
    }
    var html = rows.map(function (g) {
      var pr = String(g.priority || "").toLowerCase();
      return '<article class="ref-card">' +
        '<div class="ref-card-top">' + chip(g.code) +
          (pr ? '<span class="ref-tag ref-prio ref-prio-' + esc(pr) + '">' + esc(pr) + " priority</span>" : "") +
        "</div>" +
        '<h3 class="ref-card-name">' + clean(g.name || g.code) + "</h3>" +
        (g.what_is_missing ? '<p class="ref-card-body"><b>Missing.</b> ' + clean(g.what_is_missing) + "</p>" : "") +
        (g.why_it_matters ? '<p class="ref-card-body"><b>Why it matters.</b> ' + clean(g.why_it_matters) + "</p>" : "") +
        (g.current_approach ? '<p class="ref-card-body ref-muted"><b>Current approach.</b> ' + clean(g.current_approach) + "</p>" : "") +
        "</article>";
    }).join("");
    fill("ref-gaps-body", '<div class="ref-grid">' + html + "</div>", "No open questions recorded in this snapshot.");
  });

  /* ======================================================================
     8. EVIDENCE / Domains - new honest grid (never rendered in legacy).
     No code -> link by primary_mechanism chip.
     ====================================================================== */
  safe(function () {
    var rows = D.domainsOrdered() || [];
    var html = rows.map(function (d) {
      var pm = (d.primary_mechanism)
        ? chipRowLabeled("Primary", [d.primary_mechanism])
        : "";
      return '<article class="ref-card">' +
        '<div class="ref-card-top">' +
          (d.cross_cutting ? '<span class="ref-tag ref-tag-cross">Cross-cutting</span>' : "") +
        "</div>" +
        '<h3 class="ref-card-name">' + clean(d.name || "Domain") + "</h3>" +
        (d.description ? '<p class="ref-card-body">' + clean(d.description) + "</p>" : "") +
        pm +
        "</article>";
    }).join("");
    fill("ref-domains-body", '<div class="ref-grid">' + html + "</div>", "No domains in this snapshot.");
  });

  /* ======================================================================
     9. EVIDENCE / Thinkers + works. Tier groups, then the bibliography.
     All from the snapshot - NO live fetch, NO hardcoded counts/dates.
     ====================================================================== */
  safe(function () {
    var groups = D.researchersByTier() || {};
    var TIER_LABEL = {
      foundational: "Foundational",
      empirical: "Empirical",
      adjacent: "Adjacent",
      other: "Other"
    };
    var tierHTML = ["foundational", "empirical", "adjacent", "other"].map(function (k) {
      var arr = groups[k] || [];
      if (!arr.length) return "";
      var names = arr.map(function (r) {
        var inst = (r.institution) ? ' <span class="ref-inst">' + clean(r.institution) + "</span>" : "";
        return '<li>' + clean(r.name || "") + inst + "</li>";
      }).join("");
      return '<div class="ref-tier">' +
        '<h4 class="ref-tier-head">' + esc(TIER_LABEL[k]) + ' <span class="ref-tier-n">' + esc(String(arr.length)) + "</span></h4>" +
        '<ul class="ref-tier-list">' + names + "</ul>" +
        "</div>";
    }).join("");

    // Bibliography: importance buckets (pillar > key > supporting), counts live.
    var works = D.worksOrdered() || [];
    function workLine(w) {
      var bits = [w.authors, w.year].filter(Boolean).join(", ");
      var typ = w.work_type ? humanize(w.work_type) : "";
      return "<li>" +
        '<span class="ref-work-title">' + clean(w.title || "Untitled") + "</span>" +
        (bits ? ' <span class="ref-work-meta">' + clean(bits) + "</span>" : "") +
        (typ ? ' <span class="ref-work-type">' + esc(typ) + "</span>" : "") +
        "</li>";
    }
    function bucket(level, label) {
      var arr = D.worksByImportance(level) || [];
      if (!arr.length) return "";
      return '<div class="ref-workbucket">' +
        '<h4 class="ref-tier-head">' + esc(label) + ' <span class="ref-tier-n">' + esc(String(arr.length)) + "</span></h4>" +
        '<ul class="ref-work-list">' + arr.map(workLine).join("") + "</ul>" +
        "</div>";
    }
    var biblio =
      bucket("pillar", "Pillar works") +
      bucket("key", "Key works") +
      bucket("supporting", "Supporting works");

    var totalWorks = works.length;
    var html =
      '<div class="ref-thinkers-grid">' + tierHTML + "</div>" +
      '<details class="ref-biblio">' +
        '<summary class="ref-biblio-summary">Bibliography' +
          (totalWorks ? ' <span class="ref-tier-n">' + esc(String(totalWorks)) + "</span>" : "") +
        "</summary>" +
        (biblio || '<p class="ref-empty">No works in this snapshot.</p>') +
      "</details>";

    fill("ref-thinkers-body", html, "No thinkers in this snapshot.");
  });

  /* ======================================================================
     10. EVIDENCE / Challenges - HONEST empty-state. There is NO challenges
     table; render whatever challenges() returns, never fabricate. Cross-link
     the G11 gap (challenge-layer depth).
     ====================================================================== */
  safe(function () {
    var ch = D.challenges() || { rows: [], hasRichFields: false, note: "" };
    var html;
    if (ch.rows && ch.rows.length && ch.hasRichFields) {
      // Enriched rows (post re-bake): each challenge is an extraction tagged
      // source_type='challenge', joined to its source work (+ researcher) at
      // build time. Render title/body/citation when present; the code chips it
      // bears on deep-link via CorXref (degrade to plain text - no dead links).
      html = '<div class="ref-grid">' + ch.rows.map(function (r) {
        var title = r.title || r.name || "";
        var body = r.content || r.body || r.statement || "";
        // Don't repeat the title as the body if the join used title for both.
        if (body && title && body === title) body = "";
        // Citation: prefer the pre-joined string, else assemble from parts.
        var cite = r.citation ||
          [r.authors || r.researcher, r.year].filter(Boolean).join(", ");
        var citeHTML = cite
          ? '<p class="ref-cite"><span class="ref-cite-meta">' + clean(cite) + "</span></p>"
          : "";
        // Mechanisms / foundations this challenge bears on -> xref chips.
        var bears =
          chipRowLabeled("Bears on", r.mechanism_codes) +
          chipRowLabeled("Bears on", r.foundation_codes);
        var grade = r.evidence_quality
          ? '<span class="ref-tag ref-tag-grade">' + esc(humanize(r.evidence_quality)) + "</span>"
          : "";
        return '<article class="ref-card">' +
          (grade ? '<div class="ref-card-top">' + grade + "</div>" : "") +
          (title ? '<h3 class="ref-card-name">' + clean(title) + "</h3>" : "") +
          (body ? '<p class="ref-card-body">' + clean(body) + "</p>" : "") +
          bears +
          citeHTML +
          "</article>";
      }).join("") + "</div>";
    } else {
      html =
        '<div class="ref-emptystate">' +
          '<p class="ref-emptystate-lead">' + clean(ch.note ||
            "Challenge layer not yet operationalized in the snapshot.") + "</p>" +
          '<p class="ref-emptystate-sub">The strongest counter-evidence and live ' +
            "disputes will land here once the challenge layer is operationalized. " +
            "That work is tracked as a gap: " + chip("G11") + ".</p>" +
        "</div>";
    }
    fill("ref-challenges-body", html, "");
  });

  /* ======================================================================
     11. PAPERS - bridge thesis + long-read index. Pages built in Phase 5;
     link by filename now. One-line abstracts + "as of" build date.
     ====================================================================== */
  safe(function () {
    var asOf = "";
    var built = (D.meta() || {}).built_at;
    if (built) asOf = String(built).slice(0, 10);

    // Bridge thesis card (BT1), if present. chip(BT1) resolves to this section.
    var bt = D.bridgeThesis();
    var btHTML = "";
    if (bt) {
      var frames = Array.isArray(bt.conflicting_frameworks) ? bt.conflicting_frameworks : [];
      var framesHTML = frames.length
        ? '<ul class="ref-lit">' + frames.map(function (f) {
            return "<li>" + clean(f) + "</li>";
          }).join("") + "</ul>"
        : "";
      btHTML =
        '<article class="ref-card ref-card-wide">' +
          '<div class="ref-card-top">' + chip(bt.code) +
            '<span class="ref-tag">Bridge thesis</span></div>' +
          '<h3 class="ref-card-name">' + clean(bt.name || bt.code) + "</h3>" +
          (framesHTML ? '<div class="ref-sub"><span class="ref-sub-lbl">Conflicting frameworks</span>' + framesHTML + "</div>" : "") +
          (bt.resolution ? '<div class="ref-card-body ref-resolution">' + cleanML(bt.resolution) + "</div>" : "") +
        "</article>";
    }

    var PAPERS = [
      {
        href: "bridge-paper.html",
        title: "The Optimizer Without a Target",
        abstract: "The AI-alignment wedge: why an optimizer with no model of what resolves a human mechanism cannot be aligned by preference satisfaction alone."
      },
      {
        href: "constitutional.html",
        title: "Constitutional",
        abstract: "The model stated for the systems that will design our environments - written to be read by an AI and by the people building one."
      },
      {
        href: "programme.html",
        title: "The Research Programme",
        abstract: "The framework as a Lakatosian research programme: hard core, protective belt, falsifiers, and boundary conditions."
      },
      {
        href: "about.html",
        title: "About Cor",
        abstract: "Start here. What Cor is in plain words, how the atlas was built, what its counts mean, and how to read the framework's epistemic tiers - the ordinal proxy gradient, a cue that fires without supplying what resolves it."
      }
    ];
    var shelf = '<div class="ref-papers-shelf">' + PAPERS.map(function (p) {
      return '<a class="ref-paper" href="' + esc(p.href) + '">' +
        '<h3 class="ref-paper-title">' + clean(p.title) + "</h3>" +
        '<p class="ref-paper-abstract">' + clean(p.abstract) + "</p>" +
        (asOf ? '<span class="ref-paper-asof">as of ' + esc(asOf) + "</span>" : "") +
        "</a>";
    }).join("") + "</div>";

    fill("ref-papers-body", shelf + btHTML, "No papers available.");
  });

  /* ======================================================================
     Rail: scroll-spy + collapsible long sections. Progressive enhancement;
     if any of this fails the page is still fully readable.
     ====================================================================== */
  safe(function () {
    var links = Array.prototype.slice.call(document.querySelectorAll("#ref-rail-nav a[data-rail]"));
    if (!links.length) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("data-rail")] = a; });

    function setCurrent(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-rail") === id;
        a.classList.toggle("is-current", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        // Pick the entry nearest the top that is intersecting.
        var best = null;
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (!best || e.boundingClientRect.top < best.boundingClientRect.top) best = e;
          }
        });
        if (best && best.target.id && byId[best.target.id]) setCurrent(best.target.id);
      }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
      document.querySelectorAll(".ref-section").forEach(function (s) { io.observe(s); });
    }
  });

  // Collapsible sections: a long body gets a toggle. Pure enhancement.
  safe(function () {
    var sections = document.querySelectorAll(".ref-section[data-collapsible]");
    Array.prototype.forEach.call(sections, function (sec) {
      var body = sec.querySelector(".ref-sec-body");
      var head = sec.querySelector(".ref-sec-head");
      if (!body || !head) return;
      // Only collapse genuinely long sections (keeps short ones open + flat).
      if (body.scrollHeight < 1100) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ref-collapse";
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-controls", body.id || (sec.id + "-body"));
      btn.innerHTML = '<span class="ref-collapse-tw" aria-hidden="true">&#9662;</span>' +
        '<span class="ref-collapse-txt">Collapse</span>';
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        sec.classList.toggle("is-collapsed", open);
        btn.querySelector(".ref-collapse-txt").textContent = open ? "Expand" : "Collapse";
      });
      head.appendChild(btn);
    });
  });

})();
