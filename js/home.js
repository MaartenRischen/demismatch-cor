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
  // Two tiers, leading with the spec. "spec" = the architecture itself
  // (mechanisms + foundations), rendered large. "evidence" = the supporting
  // base beneath it, rendered smaller. Each entry reads live; absent -> dash.
  var STATS = [
    { key: "mechanisms",   label: "Mechanisms",   tier: "spec" },
    { key: "foundations",  label: "Foundations",  tier: "spec" },
    { key: "convergences", label: "Convergences", tier: "evidence" },
    { key: "works",        label: "Works cited",  tier: "evidence" },
    { key: "extractions",  label: "Extractions",  tier: "evidence" },
    { key: "researchers",  label: "Researchers",  tier: "evidence" },
  ];

  var grid = document.getElementById("stat-grid");
  if (grid) {
    var html = STATS.map(function (s) {
      return "<div class='stat stat-" + s.tier + "'>" +
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

/* ============================================================================
   The Corpus widget - live client-side filter over the baked title list.
   The list is server-baked into index.html (crawlable, prerender-safe); this
   only shows/hides rows as you type. No data dependency, degrades to a plain
   scrollable list if JS is off.
   ============================================================================ */
(function () {
  "use strict";
  var input = document.getElementById("cw-q");
  var list = document.getElementById("cw-list");
  var empty = document.getElementById("cw-empty");
  if (!input || !list) return;

  var items = [].slice.call(list.querySelectorAll(".cw-item"));
  var timer;

  function apply() {
    var q = input.value.trim().toLowerCase();
    var shown = 0;
    for (var i = 0; i < items.length; i++) {
      var hay = items[i].getAttribute("data-t") || "";
      var hit = !q || hay.indexOf(q) !== -1;
      items[i].classList.toggle("is-hidden", !hit);
      if (hit) shown++;
    }
    if (empty) empty.hidden = shown !== 0;
  }

  input.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(apply, 90);
  });
})();
