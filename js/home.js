/* ============================================================================
   Cor Portal v2 - home / two-door landing.
   Populates the live stats strip, the door-A mechanism count, and the footer
   counts from CorData (the baked snapshot). Never fabricates, never hardcodes a
   count: every number is read at load. A missing count degrades to a dash, the
   page never white-screens.
   ============================================================================ */
(function () {
  "use strict";

  var D = window.CorData;

  // ---- helpers -------------------------------------------------------------
  // Render an integer count, or a calm em-free dash when the field is absent.
  function num(v) {
    return (typeof v === "number" && isFinite(v)) ? String(v) : "-";
  }
  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  if (!D) {
    // Data layer failed to load - leave the static copy, show an honest dash.
    setText("foot-counts", "counts unavailable");
    return;
  }

  var counts = D.counts() || {};

  // ---- stats strip ---------------------------------------------------------
  // Ordered, restrained selection. Each entry reads live; absent -> dash.
  var STATS = [
    { key: "foundations",  label: "Foundations" },
    { key: "mechanisms",   label: "Mechanisms" },
    { key: "convergences", label: "Convergences" },
    { key: "works",        label: "Works cited" },
    { key: "extractions",  label: "Extractions" },
    { key: "researchers",  label: "Researchers" },
  ];

  var grid = document.getElementById("stat-grid");
  if (grid) {
    var html = STATS.map(function (s) {
      return "<div class='stat'>" +
        "<dt class='n'>" + num(counts[s.key]) + "</dt>" +
        "<dd class='lbl'>" + s.label + "</dd>" +
      "</div>";
    }).join("");
    grid.innerHTML = html;
  }

  // ---- door A: name the count live, no hardcoded "15" ----------------------
  var mechN = counts.mechanisms;
  if (typeof mechN === "number" && isFinite(mechN)) {
    setText("door-a-mech", mechN + " motivational-emotional systems");
  }

  // ---- footer counts -------------------------------------------------------
  // A short, live, mono signature line. Built only from present counts.
  var footBits = [];
  function push(key, singular, plural) {
    var v = counts[key];
    if (typeof v === "number" && isFinite(v)) {
      footBits.push(v + " " + (v === 1 ? singular : plural));
    }
  }
  push("mechanisms", "mechanism", "mechanisms");
  push("foundations", "foundation", "foundations");
  push("convergences", "convergence", "convergences");
  push("works", "work", "works");

  setText("foot-counts", footBits.length ? footBits.join(" - ") : "counts unavailable");

})();
