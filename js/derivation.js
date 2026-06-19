/* ============================================================================
   Cor Portal v2 - derivation view renderer.
   Renders the locked stack top to bottom from CorData (the baked snapshot):
     FRAME -> PREMISE -> PROPERTY -> CONSEQUENCE -> CONVERGENCES -> MECHANISMS.
   Every DB string goes through CorData.clean / cleanMultiline. No fabrication:
   a missing field is omitted, not invented. No live query, no console errors.
   ============================================================================ */
(function () {
  "use strict";

  var C = window.CorData;
  var stack = document.getElementById("stack");
  if (!C || !stack) return;

  // ---- helpers --------------------------------------------------------------
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function has(v) { return typeof v === "string" && v.trim().length > 0; }

  // Sort a list of {code} rows by numeric suffix within their letter prefix.
  function byCodeNum(rows) {
    return rows.slice().sort(function (a, b) {
      var ma = /^([A-Za-z]+)(\d+)$/.exec(a.code || "");
      var mb = /^([A-Za-z]+)(\d+)$/.exec(b.code || "");
      if (!ma || !mb) return String(a.code).localeCompare(String(b.code));
      if (ma[1] !== mb[1]) return ma[1].localeCompare(mb[1]);
      return parseInt(ma[2], 10) - parseInt(mb[2], 10);
    });
  }

  // Human-facing grade label (flat, no jargon). Falls back to the raw value.
  function gradeLabel(g) {
    if (!has(g)) return "";
    var key = g.toLowerCase().trim();
    var map = {
      "frame": "frame",
      "forced": "forced",
      "strongly_supported": "strongly supported",
      "plausible_synthesis": "plausible synthesis",
      "plausible": "plausible",
      "supported": "supported",
      "speculative": "speculative",
    };
    return map[key] || C.clean(g).replace(/_/g, " ");
  }

  // ---- a single foundation node --------------------------------------------
  function foundationNode(f) {
    var node = el("article", "node");
    // Per-foundation anchor so a specific code can be deep-linked. CorXref
    // routes foundation chips to the layer anchor (#deriv-<layer>); this extra
    // per-code id is a harmless finer target and makes "OF1" etc. addressable.
    if (has(f.code)) node.id = "deriv-" + f.code.trim();

    var top = el("div", "node-top");
    top.appendChild(el("span", "node-code", C.clean(f.code)));
    if (has(f.name)) top.appendChild(el("span", "node-name", C.clean(f.name)));
    var gl = gradeLabel(f.epistemic_grade);
    // Suppress the grade chip when it just restates the layer (e.g. frame -> "Frame").
    if (gl && (!has(f.layer) || gl.toLowerCase() !== f.layer.toLowerCase())) {
      top.appendChild(el("span", "node-grade", C.esc(gl)));
    }
    node.appendChild(top);

    if (has(f.statement)) {
      node.appendChild(el("p", "node-statement", C.clean(f.statement)));
    }

    if (has(f.derivation)) {
      var fc = el("div", "node-forced");
      fc.appendChild(el("span", "lbl", "Forced by"));
      fc.appendChild(el("span", "txt", C.clean(f.derivation)));
      node.appendChild(fc);
    }

    if (has(f.scope_notes)) {
      var sc = el("div", "node-scope");
      sc.appendChild(el("span", "lbl", "Scope"));
      sc.appendChild(el("span", "txt", C.clean(f.scope_notes)));
      node.appendChild(sc);
    }

    // Enrichment: additional_paragraphs. The current snapshot carries no such
    // field on any foundation row, so this path is normally dormant - it never
    // fabricates. If the source later grows the field (string OR string[]),
    // each non-empty paragraph renders here, multiline-cleaned. Absence is the
    // honest empty-state: the block is simply omitted, never stubbed.
    var extras = f.additional_paragraphs;
    var paras = Array.isArray(extras) ? extras : (has(extras) ? [extras] : []);
    paras = paras.filter(has);
    if (paras.length) {
      var more = el("div", "node-more");
      paras.forEach(function (p) {
        more.appendChild(el("p", "node-more-para", C.cleanMultiline(p)));
      });
      node.appendChild(more);
    }
    return node;
  }

  // ---- a single convergence node -------------------------------------------
  function convergenceNode(c) {
    var node = el("article", "node cnode");

    var top = el("div", "node-top");
    top.appendChild(el("span", "node-code", C.clean(c.code)));
    if (has(c.name)) top.appendChild(el("span", "node-name", C.clean(c.name)));
    var gl = gradeLabel(c.epistemic_grade);
    if (gl) top.appendChild(el("span", "node-grade", C.esc(gl)));
    node.appendChild(top);

    if (has(c.statement)) {
      node.appendChild(el("p", "node-statement", C.clean(c.statement)));
    }

    // independent literatures -> mono chips
    var lits = Array.isArray(c.independent_literatures)
      ? c.independent_literatures.filter(has) : [];
    if (lits.length) {
      var wrap = el("div", "lits");
      var n = lits.length;
      wrap.appendChild(el("div", "lits-cap",
        "Established independently by " + n + " literature" + (n === 1 ? "" : "s")));
      var chips = el("div", "lits-chips");
      lits.forEach(function (lit) {
        chips.appendChild(el("span", "lit-chip", C.clean(lit)));
      });
      wrap.appendChild(chips);
      node.appendChild(wrap);
    }

    // forces -> mechanism: the route from the derivation door into the atlas
    var fm = has(c.forces_mechanism) ? c.forces_mechanism.trim() : "";
    if (fm) {
      var m = C.mechanismByCode(fm);
      var row = el("div", "forces-mech");
      row.appendChild(el("span", "fm-lbl", "Forces"));
      var a = el("a", "fm-link");
      a.href = "mechanism.html#" + encodeURIComponent(fm);
      a.innerHTML =
        '<span class="fm-ar" aria-hidden="true">-&gt;</span>' +
        '<span class="fm-code">' + C.clean(fm) + "</span>" +
        (m && has(m.name)
          ? '<span class="fm-name">' + C.clean(m.name) + "</span>"
          : "");
      a.setAttribute("aria-label",
        "Forces mechanism " + C.clean(fm) + (m && has(m.name) ? " - " + C.clean(m.name) : ""));
      row.appendChild(a);
      node.appendChild(row);
    } else {
      var none = el("div", "fm-none");
      none.appendChild(el("span", "dia", ""));
      none.appendChild(el("span", null, "No single forced mechanism"));
      node.appendChild(none);
    }
    return node;
  }

  // ---- a layer block --------------------------------------------------------
  // `derivId` (optional) is the canonical CorXref foundation anchor
  // (deriv-frame|deriv-premise|deriv-property|deriv-consequence). Reference's
  // Foundations chips deep-link to these, so the header carries it in addition
  // to the in-page `id` used by the jump nav. An invisible anchor span keeps
  // both ids valid (element ids must be unique).
  function layerBlock(id, num, name, desc, rows, renderNode, derivId) {
    var block = el("section", "layer-block");

    var head = el("div", "layer-head");
    head.id = id;
    if (derivId) {
      var anchor = el("span", "deriv-anchor");
      anchor.id = derivId;
      anchor.setAttribute("aria-hidden", "true");
      head.appendChild(anchor);
    }
    head.appendChild(el("span", "layer-num", num));
    head.appendChild(el("span", "layer-name", name));
    if (desc) head.appendChild(el("span", "layer-desc", desc));
    block.appendChild(head);

    var rail = el("div", "layer-rail");
    if (rows && rows.length) {
      rows.forEach(function (r) { rail.appendChild(renderNode(r)); });
    } else {
      rail.appendChild(el("div", "layer-empty", "No entries recorded for this layer."));
    }
    block.appendChild(rail);
    return block;
  }

  function forcingConnector() {
    var f = el("div", "forcing");
    f.setAttribute("aria-hidden", "true");
    f.appendChild(el("span", "arr", ""));
    f.appendChild(el("span", null, "forces"));
    return f;
  }

  // ---- build the stack ------------------------------------------------------
  // Use the contract's layer accessor (numeric within layer) rather than a
  // local filter, so ordering stays the single source of truth in CorData.
  function ofLayer(layer) {
    return (C.foundationsByLayer ? C.foundationsByLayer(layer) : []) || [];
  }

  var frag = document.createDocumentFragment();

  frag.appendChild(layerBlock(
    "layer-frame", "01", "Frame",
    "What an interface can be. Sets the ground the rest stands on.",
    ofLayer("frame"), foundationNode, "deriv-frame"));
  frag.appendChild(forcingConnector());

  frag.appendChild(layerBlock(
    "layer-premise", "02", "Premise",
    "The starting commitments the frame admits.",
    ofLayer("premise"), foundationNode, "deriv-premise"));
  frag.appendChild(forcingConnector());

  frag.appendChild(layerBlock(
    "layer-property", "03", "Property",
    "What follows about the architecture once the premises hold.",
    ofLayer("property"), foundationNode, "deriv-property"));
  frag.appendChild(forcingConnector());

  frag.appendChild(layerBlock(
    "layer-consequence", "04", "Consequence",
    "What the properties imply at the level of load, markets, and intervention.",
    ofLayer("consequence"), foundationNode, "deriv-consequence"));
  frag.appendChild(forcingConnector());

  // convergences C1..C14, numeric
  var convs = byCodeNum((C.convergences() || []).filter(function (c) { return has(c.code); }));
  frag.appendChild(layerBlock(
    "layer-convergence", "05", "Convergences",
    "Independent literatures arriving at the same shape. Each forces structure below.",
    convs, convergenceNode));
  frag.appendChild(forcingConnector());

  // mechanisms terminal row
  var mechBlock = el("section", "layer-block");
  var mh = el("div", "layer-head");
  mh.id = "layer-mechanism";
  mh.appendChild(el("span", "layer-num", "06"));
  mh.appendChild(el("span", "layer-name", "Mechanisms"));
  mh.appendChild(el("span", "layer-desc", "The architecture the stack forces. Each opens its detail view."));
  mechBlock.appendChild(mh);

  var mRail = el("div", "layer-rail");
  var mechs = C.mechanismsOrdered() || [];
  if (mechs.length) {
    var grid = el("div", "mech-grid");
    mechs.forEach(function (m) {
      var a = el("a", "mech-cell");
      a.href = "mechanism.html#" + encodeURIComponent(m.code);
      a.innerHTML =
        '<span class="mc-code">' + C.clean(m.code) + "</span>" +
        '<span class="mc-name">' + C.clean(m.name) + "</span>" +
        '<span class="mc-ar" aria-hidden="true">-&gt;</span>';
      a.setAttribute("aria-label", C.clean(m.code) + " " + C.clean(m.name) + " - open mechanism detail");
      grid.appendChild(a);
    });
    mRail.appendChild(grid);
    mRail.appendChild(el("p", "mech-note",
      "Each mechanism carries its own resolution conditions and evidence. The detail view shows what resolves it and where the proxy fires the cue without supplying the resolving function."));
  } else {
    mRail.appendChild(el("div", "layer-empty", "No mechanisms recorded."));
  }
  mechBlock.appendChild(mRail);
  frag.appendChild(mechBlock);

  var wrap = el("div", "stack");
  wrap.appendChild(frag);
  stack.appendChild(wrap);

  // ---- footer counts (live from the snapshot) -------------------------------
  var foot = document.getElementById("foot-counts");
  if (foot) {
    var ct = C.counts() || {};
    var parts = [];
    function add(n, label) {
      if (typeof n === "number") parts.push(n + " " + label);
    }
    add(ct.foundations, "foundations");
    add(ct.convergences, "convergences");
    add(ct.mechanisms, "mechanisms");
    foot.textContent = parts.join("  /  ");
  }
})();
