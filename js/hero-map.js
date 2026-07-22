/* ============================================================================
   Cor Portal v2 - hero map (home page).
   Renders the generated map (window.COR_MINDMAP_MD) as a COMPACT interactive
   overview beside the hero: top sections expanded, pan + click to open branches,
   every node deep-links into the spec. Wheel-zoom is disabled so the page still
   scrolls normally over it; the full Map surface (mindmap.html) is one click away.
   Scripts are `defer`-loaded after the hero HTML, so the text never waits on this.
   ============================================================================ */
(function () {
  "use strict";
  var M = window.markmap;
  var svg = document.getElementById("hero-markmap");
  var SRC = window.COR_MINDMAP_MD;
  if (!M || !M.Markmap || !M.Transformer || !svg || !SRC) return;  // hero text stands alone

  var result = new M.Transformer().transform(SRC);
  var fm = result.frontmatter || {};
  var opts = M.deriveOptions(fm.markmap);
  // Compact + page-friendly: show the top sections (root + its sections), let the
  // page scroll past. markmap counts the root as level 1, so 2 reveals the sections.
  opts.initialExpandLevel = 2;
  opts.zoom = false;     // don't hijack wheel scroll on the landing page
  opts.pan = true;       // drag to explore
  opts.fitRatio = 0.9;   // a hair of breathing room inside the frame
  // A markmap grows rightward without bound; in this narrow hero column an
  // expanded branch would overflow the frame and be clipped out of sight. autoFit
  // re-frames the whole tree to the SVG on EVERY render (the vendored renderData
  // ends with `autoFit && this.fit()`), so the visible tree always fits the window
  // no matter how deep it is expanded.
  opts.autoFit = true;
  opts.maxInitialScale = 1.9;  // headroom so the wider window enlarges the tree, not blows it up

  var mm = M.Markmap.create(svg, opts, result.root);

  function fit() { try { mm.fit(); } catch (e) {} }
  // A bare fit() reuses markmap's cached layout rect. On the stacked (mobile)
  // layout the map sits far down a long page that is still reflowing when markmap
  // first lays out, so that cached rect can be stale and fit() centers against the
  // wrong box, pushing the tree off-frame. setData() forces a FRESH measure +
  // relayout against the settled DOM, then we fit - so re-render on the settle
  // passes, not just re-fit.
  function relayout() { return Promise.resolve(mm.setData(result.root)).then(fit); }

  // markmap only measures node boxes correctly while the SVG is IN the viewport;
  // laid out off-screen the tree collapses / fits to the wrong box. On wide screens
  // the map is above the fold (fine at load), but on the stacked layout it sits
  // far down the page, so a load-time relayout runs off-screen and the tree never
  // appears. An IntersectionObserver re-lays-out the moment the frame scrolls into
  // view - the one time it both can measure correctly and the user can see it.
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        io.disconnect();   // one-shot: don't reset the user's open branches on re-scroll
        relayout();
      }
    }, { threshold: 0.15 });
    io.observe(svg);
  } else {
    relayout();
  }
  // Settle passes for the above-the-fold case (next frames + fonts arriving).
  requestAnimationFrame(function () { requestAnimationFrame(relayout); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  // Re-fit on resize so it stays framed as the responsive column reflows (a bare
  // fit() reframes to the new box without resetting any branches the user opened).
  var t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(fit, 200);
  });

  // Recenter control: a stray pan can drift the tree off-frame; snap it back.
  var recenter = document.getElementById("hero-map-recenter");
  if (recenter) recenter.addEventListener("click", fit);
})();
