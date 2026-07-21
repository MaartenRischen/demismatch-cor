/* ============================================================================
   The Corpus - browsable evidence grid (js/corpus.js)
   ----------------------------------------------------------------------------
   Ported from the standalone corpus-grid mock. Data is baked into the page as
   a <script id="corpus" type="application/json"> block (verbatim from the Cor
   DB: list_works, titles + authors as-is, "why" the atlas's own curation note).
   No runtime fetch, no fabrication. All DOM ids are `cx-` prefixed and every
   element lives inside `.corpus-app`, so this never touches the shared chrome.

   INTERACTION
     - Search (title or author), live.            "/" focuses the search box.
     - Filter by importance tier and by work type; sort; shuffle.
     - Click / Enter a card -> reader panel with the full record.
       In the reader: <- / -> step the result set; Esc closes.
   ============================================================================ */
(function () {
  "use strict";
  var dataEl = document.getElementById("corpus");
  if (!dataEl) return;
  var ALL = JSON.parse(dataEl.textContent);

  var TYPE_LABEL = { paper: "Paper", book: "Book", review: "Review", meta_analysis: "Meta-analysis", chapter: "Chapter" };
  var IMP_RANK = { pillar: 0, key: 1, supporting: 2 };
  var TYPE_RANK = { paper: 0, review: 1, meta_analysis: 2, chapter: 3, book: 4 };

  // ---- hero stats (live to the baked data) ----
  var byImp = function (i) { return ALL.filter(function (w) { return w.importance === i; }).length; };
  var yrs = ALL.map(function (w) { return w.year; }).filter(Boolean);
  var withDoi = ALL.filter(function (w) { return w.doi; }).length;
  var stats = [
    { n: ALL.length, k: "works", cls: "" },
    { n: byImp("pillar"), k: "pillars", cls: "pillar" },
    { n: byImp("key"), k: "key", cls: "key" },
    { n: byImp("supporting"), k: "supporting", cls: "supp" },
    { n: (Math.min.apply(null, yrs) + "-" + Math.max.apply(null, yrs)), k: "years", cls: "" },
    { n: withDoi, k: "with DOI", cls: "" }
  ];
  var statsEl = document.getElementById("cx-stats");
  if (statsEl) {
    statsEl.innerHTML = stats.map(function (s) {
      return '<div class="cx-stat ' + s.cls + '"><div class="n">' + s.n + '</div><div class="k">' + s.k + '</div></div>';
    }).join("");
  }

  // ---- state ----
  var state = { q: "", imp: "all", type: "all", sort: "importance", shuffled: null };
  var view = [];

  var norm = function (s) { return (s || "").toLowerCase(); };
  var esc = function (s) {
    return (s == null ? "" : String(s)).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  };

  function compute() {
    var rows = ALL.filter(function (w) {
      if (state.imp !== "all" && w.importance !== state.imp) return false;
      if (state.type !== "all" && w.work_type !== state.type) return false;
      if (state.q) { var t = norm(w.title) + " " + norm(w.authors); if (t.indexOf(state.q) === -1) return false; }
      return true;
    });
    if (state.shuffled) {
      var order = state.shuffled;
      rows.sort(function (a, b) { return order.indexOf(a.id) - order.indexOf(b.id); });
    } else {
      rows.sort(sorter(state.sort));
    }
    view = rows;
    render();
  }

  function sorter(k) {
    switch (k) {
      case "year_desc": return function (a, b) { return b.year - a.year || a.title.localeCompare(b.title); };
      case "year_asc":  return function (a, b) { return a.year - b.year || a.title.localeCompare(b.title); };
      case "author":    return function (a, b) { return a.authors.localeCompare(b.authors) || a.year - b.year; };
      case "title":     return function (a, b) { return a.title.localeCompare(b.title); };
      case "type":      return function (a, b) { return (TYPE_RANK[a.work_type] - TYPE_RANK[b.work_type]) || IMP_RANK[a.importance] - IMP_RANK[b.importance] || a.year - b.year; };
      default:          return function (a, b) { return (IMP_RANK[a.importance] - IMP_RANK[b.importance]) || a.year - b.year; };
    }
  }

  // ---- greeked body: deterministic per work id, memoized ----
  var greekCache = {};
  function seedRng(id) {
    var a = (id * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0; var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function greekCol(rng) {
    var out = "", lines = 20 + Math.floor(rng() * 6), sinceBreak = 0;
    for (var i = 0; i < lines; i++) {
      sinceBreak++;
      var paraEnd = sinceBreak >= 3 && rng() < 0.32;
      var w = paraEnd ? (38 + rng() * 24) : (74 + rng() * 24);
      out += '<i class="' + (paraEnd ? "gap" : "") + '" style="width:' + w.toFixed(0) + '%"></i>';
      if (paraEnd) sinceBreak = 0;
    }
    return out;
  }
  function greekFor(id) {
    if (greekCache[id]) return greekCache[id];
    var r = seedRng(id);
    var html = '<div class="gcol">' + greekCol(r) + '</div><div class="gcol">' + greekCol(r) + '</div>';
    greekCache[id] = html; return html;
  }

  function cardHTML(w, idx) {
    var foot = w.doi ? "doi:" + w.doi
             : w.pmid ? "pmid:" + w.pmid
             : w.phys ? "physical collection"
             : "no external id";
    return '<button class="cx-card" data-idx="' + idx + '" title="' + esc(w.title) + '">' +
      '<div class="cx-sheet">' +
        '<span class="band ' + w.importance + '"></span>' +
        '<div class="pad">' +
          '<div class="eyebrow2"><span>' + (TYPE_LABEL[w.work_type] || w.work_type) + '</span><span>' + (w.year || "") + '</span></div>' +
          '<div class="hr"></div>' +
          '<h3 class="p-title">' + esc(w.title) + '</h3>' +
          '<div class="p-auth">' + esc(w.authors) + '</div>' +
          '<div class="hr2"></div>' +
          '<div class="p-body">' + greekFor(w.id) + '</div>' +
          '<div class="p-foot">' + esc(foot) + '</div>' +
        '</div>' +
      '</div>' +
    '</button>';
  }

  var grid = document.getElementById("cx-grid");
  var countEl = document.getElementById("cx-count");
  function render() {
    grid.innerHTML = view.length
      ? view.map(cardHTML).join("")
      : '<div class="cx-empty">No works match. <a href="#" id="cx-clr" style="color:var(--teal-deep)">Clear filters</a></div>';
    countEl.innerHTML = "Showing <b>" + view.length + "</b> of " + ALL.length + (state.shuffled ? " &middot; shuffled" : "");
    var clr = document.getElementById("cx-clr");
    if (clr) clr.onclick = function (e) { e.preventDefault(); resetAll(); };
  }

  // ---- reader ----
  var scrim = document.getElementById("cx-scrim"), reader = document.getElementById("cx-reader"),
      rbody = document.getElementById("cx-rbody"), posEl = document.getElementById("cx-pos"),
      prevB = document.getElementById("cx-prev"), nextB = document.getElementById("cx-next");
  var cur = -1;

  function openReader(i) {
    if (i < 0 || i >= view.length) return;
    cur = i;
    var w = view[i];
    var links = [];
    if (w.doi)  links.push('<a href="https://doi.org/' + encodeURIComponent(w.doi) + '" target="_blank" rel="noopener">DOI &#8599;</a>');
    if (w.pmid) links.push('<a href="https://pubmed.ncbi.nlm.nih.gov/' + encodeURIComponent(w.pmid) + '/" target="_blank" rel="noopener">PubMed &#8599;</a>');
    if (w.phys) links.push('<span title="Held in the physical collection">In physical collection</span>');
    if (!links.length) links.push('<span>No external identifier</span>');

    rbody.innerHTML =
      '<div class="r-meta">' +
        '<span class="imp ' + w.importance + '">' + w.importance + '</span>' +
        '<span class="c-type">' + (TYPE_LABEL[w.work_type] || w.work_type) + '</span>' +
        '<span class="c-year">' + (w.year || "") + '</span>' +
      '</div>' +
      '<h2 class="r-title">' + esc(w.title) + '</h2>' +
      '<div class="r-auth">' + esc(w.authors) + '</div>' +
      '<div class="r-prov">' + links.join("") + '</div>' +
      '<div class="r-sec why"><h4>Why it is in Cor</h4><p>' + esc(w.why) + '</p></div>' +
      (w.summary ? '<div class="r-sec sum"><h4>Extracted summary</h4><p>' + esc(w.summary) + '</p></div>' : "");
    posEl.textContent = (i + 1) + " / " + view.length;
    prevB.disabled = i <= 0; nextB.disabled = i >= view.length - 1;
    scrim.classList.add("show"); reader.classList.add("show");
    reader.setAttribute("aria-hidden", "false");
    rbody.scrollTop = 0;
    try { history.replaceState(null, "", "#w=" + w.id); } catch (_) {}
  }
  function closeReader() {
    scrim.classList.remove("show"); reader.classList.remove("show");
    reader.setAttribute("aria-hidden", "true"); cur = -1;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
  }
  function step(d) { if (cur < 0) return; var n = cur + d; if (n >= 0 && n < view.length) openReader(n); }

  grid.addEventListener("click", function (e) { var c = e.target.closest(".cx-card"); if (c) openReader(+c.dataset.idx); });
  scrim.addEventListener("click", closeReader);
  document.getElementById("cx-close").addEventListener("click", closeReader);
  prevB.addEventListener("click", function () { step(-1); });
  nextB.addEventListener("click", function () { step(1); });

  // ---- controls ----
  var qEl = document.getElementById("cx-q"), typeEl = document.getElementById("cx-type"), sortEl = document.getElementById("cx-sort");
  var qTimer;
  qEl.addEventListener("input", function () {
    clearTimeout(qTimer);
    qTimer = setTimeout(function () { state.q = norm(qEl.value.trim()); compute(); }, 90);
  });
  document.getElementById("cx-impSeg").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    state.imp = b.dataset.imp;
    [].forEach.call(e.currentTarget.children, function (x) { x.setAttribute("aria-pressed", x === b); });
    compute();
  });
  typeEl.addEventListener("change", function () { state.type = typeEl.value; compute(); });
  sortEl.addEventListener("change", function () { state.sort = sortEl.value; state.shuffled = null; compute(); });
  document.getElementById("cx-shuffle").addEventListener("click", function () {
    var ids = view.map(function (w) { return w.id; });
    for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp; }
    state.shuffled = ids; compute();
  });
  function resetAll() {
    state.q = ""; state.imp = "all"; state.type = "all"; state.sort = "importance"; state.shuffled = null;
    qEl.value = ""; typeEl.value = "all"; sortEl.value = "importance";
    [].forEach.call(document.getElementById("cx-impSeg").children, function (x, i) { x.setAttribute("aria-pressed", i === 0); });
    compute();
  }
  document.getElementById("cx-reset").addEventListener("click", resetAll);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeReader(); return; }
    if (reader.classList.contains("show")) {
      if (e.key === "ArrowRight") { step(1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); }
      return;
    }
    if (e.key === "/" && document.activeElement !== qEl) { e.preventDefault(); qEl.focus(); qEl.select(); }
  });

  compute();

  // deep link: #w=<id> opens that work directly
  (function () {
    var m = /(?:^|#)w=(\d+)/.exec(location.hash); if (!m) return;
    var id = +m[1], i = view.findIndex(function (w) { return w.id === id; });
    if (i >= 0) openReader(i);
  })();
})();
