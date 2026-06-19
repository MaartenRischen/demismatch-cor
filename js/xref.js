/* ============================================================================
   Cor Portal v2 - cross-reference resolver (window.CorXref).
   A single source of truth for turning a taxonomy code (M1-M14, R1, OF/P/DA/DC
   foundations, C* convergences, ED* demonstrations, A* applications, G* gaps,
   BT* bridge thesis) into { label, href }.

   CONTRACT (relied on by every later agent):
     - CorXref.resolve(code) -> { code, label, href|null, kind }
     - CorXref.href(code)    -> String|null
     - CorXref.chip(code [, text]) -> safe HTML string. If href is null the code
       renders as PLAIN TEXT (a <span>), NEVER a dead link. No dead links, ever.

   A code only earns an href when a real surface exists for it in THIS snapshot:
     - mechanism codes resolve only if CorData.mechanismByCode(code) exists
       (so the cut/absent ones degrade to plain text);
     - foundation codes resolve only if CorData.foundationByCode(code) exists,
       and deep-link to the derivation layer anchor (derivation.html#deriv-<layer>);
     - C / ED / A / G / BT resolve to Reference section anchors, but ONLY if the
       row exists in the snapshot (and, for applications, is not on the cut list).
   Load order: snapshot-data.js -> data.js -> xref.js -> page script.
   Degrades safely if CorData is missing (everything becomes plain text).
   ============================================================================ */
(function (global) {
  "use strict";

  var C = global.CorData || null;

  function esc(v) {
    if (C && typeof C.esc === "function") return C.esc(v);
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Foundation layer -> derivation anchor. The derivation page MUST expose
  // these ids (see IA-BUILD-CONTRACT). Code-level anchors are not guaranteed;
  // the layer anchor is the canonical home for any foundation code.
  var FOUNDATION_LAYER_ANCHOR = {
    frame: "deriv-frame",
    premise: "deriv-premise",
    property: "deriv-property",
    consequence: "deriv-consequence"
  };

  // Reference section anchors (must match the ids the Reference page renders;
  // see IA-BUILD-CONTRACT "Reference section ids").
  var REF = {
    convergences: "ref-convergences",
    demonstrations: "ref-demonstrations",
    applications: "ref-applications",
    gaps: "ref-gaps",
    papers: "ref-papers" // bridge thesis lives in the Papers shelf
  };

  function classify(code) {
    if (typeof code !== "string") return null;
    var c = code.trim().toUpperCase();
    if (!c) return null;
    if (/^M\d+$/.test(c)) return { kind: "mechanism", code: c };
    if (/^R\d+$/.test(c)) return { kind: "mechanism", code: c }; // R1 Touch
    if (/^(OF|P|DA|DC)\d+$/.test(c)) return { kind: "foundation", code: c };
    if (/^C\d+$/.test(c)) return { kind: "convergence", code: c };
    if (/^ED\d+$/.test(c)) return { kind: "demonstration", code: c };
    if (/^A\d+$/.test(c)) return { kind: "application", code: c };
    if (/^G\d+$/.test(c)) return { kind: "gap", code: c };
    if (/^BT\d+$/.test(c)) return { kind: "bridge", code: c };
    return { kind: "unknown", code: c };
  }

  // Resolve a code to { code, label, href|null, kind }. href:null => plain text.
  function resolve(code) {
    var info = classify(code);
    if (!info) return { code: String(code || ""), label: String(code || ""), href: null, kind: "unknown" };
    var c = info.code;
    var label = c;
    var href = null;

    if (!C) return { code: c, label: label, href: null, kind: info.kind };

    switch (info.kind) {
      case "mechanism": {
        var m = C.mechanismByCode(c);
        if (m) {
          if (m.name) label = c + " " + m.name;
          href = "mechanism.html#" + c;
        }
        break;
      }
      case "foundation": {
        var f = C.foundationByCode(c);
        if (f) {
          if (f.name) label = c + " " + f.name;
          var anchor = FOUNDATION_LAYER_ANCHOR[String(f.layer).toLowerCase()];
          href = anchor ? ("derivation.html#" + anchor) : "derivation.html";
        }
        break;
      }
      case "convergence": {
        var cv = C.convergenceByCode(c);
        if (cv) {
          if (cv.name) label = c + " " + cv.name;
          href = "reference.html#" + REF.convergences;
        }
        break;
      }
      case "demonstration": {
        var d = C.demonstrationByCode ? C.demonstrationByCode(c) : null;
        if (d) {
          if (d.name) label = c + " " + d.name;
          href = "reference.html#" + REF.demonstrations;
        }
        break;
      }
      case "application": {
        // applicationsForDisplay() already drops the cut A7/A8; only link to a
        // surface that actually renders the row.
        var shown = C.applicationsForDisplay ? C.applicationsForDisplay() : [];
        var a = null;
        for (var i = 0; i < shown.length; i++) { if (shown[i].code === c) { a = shown[i]; break; } }
        if (a) {
          if (a.name) label = c + " " + a.name;
          href = "reference.html#" + REF.applications;
        } else if (C.applicationByCode && C.applicationByCode(c)) {
          // exists in data but is cut from display (A7/A8): label it, no link.
          var raw = C.applicationByCode(c);
          if (raw.name) label = c + " " + raw.name;
        }
        break;
      }
      case "gap": {
        var g = null, gl = C.gaps ? C.gaps() : [];
        for (var j = 0; j < gl.length; j++) { if (gl[j].code === c) { g = gl[j]; break; } }
        if (g) {
          if (g.name) label = c + " " + g.name;
          href = "reference.html#" + REF.gaps;
        }
        break;
      }
      case "bridge": {
        var bt = C.bridgeThesis ? C.bridgeThesis() : null;
        if (bt && bt.code === c) {
          if (bt.name) label = c + " " + bt.name;
          href = "reference.html#" + REF.papers;
        }
        break;
      }
      default:
        break;
    }
    return { code: c, label: label, href: href, kind: info.kind };
  }

  function href(code) { return resolve(code).href; }

  // Render a cross-reference chip as a safe HTML string.
  //   - text overrides the visible text (defaults to the bare code).
  //   - If href resolves: <a class="xref" href data-code title="full label">.
  //   - If not: <span class="xref xref--plain" data-code title="full label">.
  // The full resolved label is exposed only as a title (tooltip); the visible
  // text stays compact unless the caller passes text.
  function chip(code, text) {
    var r = resolve(code);
    var visible = esc(text != null ? text : r.code);
    var titleAttr = (r.label && r.label !== r.code) ? (' title="' + esc(r.label) + '"') : "";
    var dataAttr = ' data-code="' + esc(r.code) + '"';
    if (r.href) {
      return '<a class="xref" href="' + esc(r.href) + '"' + dataAttr + titleAttr + '>' + visible + "</a>";
    }
    return '<span class="xref xref--plain"' + dataAttr + titleAttr + ">" + visible + "</span>";
  }

  global.CorXref = {
    resolve: resolve,
    href: href,
    chip: chip
  };
})(window);
