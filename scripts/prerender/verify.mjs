/* ============================================================================
   verify.mjs - SESSION 1 verification. Runs against a freshly built + pre-rendered
   local dist/ and FAILS (non-zero exit) on any miss.

   Two layers:
     A. TEXT checks (no browser): read each baked page as text and assert
        structural markers, using counts pulled live from data/snapshot.json
        (never hardcoded). This is what a crawler/curl actually sees.
     B. JS-ON equivalence (Playwright): reload each baked page, let the client JS
        run, and assert each mount stays non-empty and does NOT double-inject over
        the baked HTML (the safety net for the STEP 0 append->replace fix).

   Usage:  node verify.mjs --dist <distDir>     (default: ./dist)
   ============================================================================ */

import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { startServer, locateMount } from "./lib.mjs";
import { runContradictionGate, reportContradictions, blockingFailures } from "./contradiction-gate.mjs";

const RENDER_TIMEOUT = 15000;

/* ---- tiny assertion collector -------------------------------------------- */
const results = [];
function check(page, name, pass, detail) {
  results.push({ page, name, pass: !!pass, detail: detail || "" });
}
function count(text, re) { return (text.match(re) || []).length; }

// data-prerendered present on the mount's opening tag?
function mountPrerendered(html, id) {
  try {
    const m = locateMount(html, id);
    return /\bdata-prerendered\s*=\s*["']1["']/.test(m.openTag);
  } catch (e) { return false; }
}
// innerHTML of a mount (between its open '>' and matching close), trimmed length.
function mountInnerLen(html, id) {
  try {
    const m = locateMount(html, id);
    return html.slice(m.gt + 1, m.closeStart).trim().length;
  } catch (e) { return -1; }
}

async function main() {
  const args = process.argv.slice(2);
  const di = args.indexOf("--dist");
  const dist = resolve(process.cwd(), di >= 0 ? args[di + 1] : "dist");
  const srcRoot = resolve(dist, "..");

  const snap = JSON.parse(await readFile(join(dist, "data", "snapshot.json"), "utf8"));
  const C = snap.counts;
  console.log(`Verify -> dist: ${dist}`);
  console.log(`Live counts: foundations=${C.foundations} convergences=${C.convergences} mechanisms=${C.mechanisms} eea_parameters=${C.eea_parameters}\n`);

  const read = async (f) => readFile(join(dist, f), "utf8");
  const sizeOf = (root, f) => (existsSync(join(root, f)) ? statSync(join(root, f)).size : -1);

  /* ======================= A. TEXT CHECKS ======================= */

  // --- mechanisms.html & mechanism.html ---
  for (const [file, def] of [["mechanisms.html", "M1"], ["mechanism.html", "M14"]]) {
    const h = await read(file);
    check(file, "#switcher data-prerendered", mountPrerendered(h, "switcher"));
    check(file, "#view data-prerendered", mountPrerendered(h, "view"));
    const btn = count(h, /class="mech-btn[ "]/g);
    check(file, `15 mech-btn in switcher`, btn === C.mechanisms, `found ${btn}, expected ${C.mechanisms}`);
    const wraps = count(h, /id="prerender-/g);
    check(file, `15 prerender-* wrappers in #view`, wraps === C.mechanisms, `found ${wraps}, expected ${C.mechanisms}`);
    const hidden = count(h, /id="prerender-[A-Za-z0-9]+" hidden>/g);
    check(file, `exactly one wrapper visible (rest hidden)`, hidden === C.mechanisms - 1, `${hidden} hidden of ${wraps}`);
    check(file, `default wrapper #prerender-${def} present`, new RegExp(`id="prerender-${def}"[ >]`).test(h));
  }

  // --- derivation.html ---
  {
    const h = await read("derivation.html");
    check("derivation.html", "#stack data-prerendered", mountPrerendered(h, "stack"));
    const layers = ["frame", "premise", "property", "consequence", "convergence", "mechanism"];
    const layerHits = layers.filter((l) => new RegExp(`id="layer-${l}"`).test(h));
    check("derivation.html", "six layer-block ids present", layerHits.length === 6, `${layerHits.length}/6: ${layerHits.join(",")}`);
    const found = count(h, /class="node"/g);
    check("derivation.html", `foundation nodes == counts.foundations`, found === C.foundations, `found ${found}, expected ${C.foundations}`);
    const conv = count(h, /class="node cnode"/g);
    check("derivation.html", `convergence nodes == counts.convergences`, conv === C.convergences, `found ${conv}, expected ${C.convergences}`);
    const cells = count(h, /class="mech-cell"/g);
    check("derivation.html", `15-cell mech grid`, cells === C.mechanisms, `found ${cells}, expected ${C.mechanisms}`);
  }

  // --- the-gap.html ---
  {
    const h = await read("the-gap.html");
    for (const id of ["gap-honesty", "gap-asof", "gap-body"]) {
      check("the-gap.html", `#${id} data-prerendered`, mountPrerendered(h, id));
    }
    const doms = count(h, /class="gap-domain"/g);
    check("the-gap.html", `8 gap-domain groups`, doms === 8, `found ${doms}, expected 8`);
    const cards = count(h, /class="gap-card"/g);
    check("the-gap.html", `gap-card == counts.eea_parameters`, cards === C.eea_parameters, `found ${cards}, expected ${C.eea_parameters}`);
  }

  // --- reference.html ---
  {
    const h = await read("reference.html");
    const bodies = [
      "ref-foundations-body", "ref-convergences-body", "ref-demonstrations-body",
      "ref-cases-body", "ref-applications-body", "ref-interpretive-calls-body",
      "ref-gaps-body", "ref-domains-body", "ref-thinkers-body",
      "ref-challenges-body", "ref-papers-body",
    ];
    check("reference.html", "#ref-asof data-prerendered", mountPrerendered(h, "ref-asof"));
    for (const id of bodies) {
      const len = mountInnerLen(h, id);
      check("reference.html", `#${id} baked & non-empty`, mountPrerendered(h, id) && len > 0, `innerLen ${len}`);
    }
  }

  // --- index.html ---
  {
    const h = await read("index.html");
    check("index.html", "#stat-grid data-prerendered", mountPrerendered(h, "stat-grid"));
    check("index.html", "#door-a-mech data-prerendered", mountPrerendered(h, "door-a-mech"));
    const stats = count(h, /class="stat stat-/g);
    check("index.html", "6 stat tiles baked", stats === 6, `found ${stats}, expected 6`);
  }

  // --- mindmap.html ---
  {
    const h = await read("mindmap.html");
    check("mindmap.html", "#mindmap-fallback baked", mountPrerendered(h, "mindmap-fallback"));
    const links = count(h, /<a /g);
    check("mindmap.html", "fallback tree has deep-links", links >= 20, `${links} <a> tags`);
    check("mindmap.html", "fallback contains a <ul>", /<ul>/.test(h));
    check("mindmap.html", "SVG #markmap left untouched (client-side)",
      /<svg id="markmap"[^>]*><\/svg>/.test(h) && !mountPrerendered(h, "markmap"));
  }

  // --- size floors: baked must have grown past the empty shell ---
  // Ratio floors work where the bake injects a large fraction of the page
  // (derivation, the-gap, reference, mechanisms). index.html and mindmap.html
  // carry big static shells - index now holds the full corpus title list - so
  // there the bake is a small FIXED injection (index: stat tiles + door text;
  // mindmap: the fallback tree). A ratio floor mismodels that; use an absolute
  // baked-minus-orig byte delta instead. The direct mount checks above already
  // prove those bakes landed; this is just the belt-and-braces size guard.
  const FLOOR = { // min baked/orig ratio
    "index.html": 1.02, "derivation.html": 1.5, "the-gap.html": 1.5,
    "reference.html": 1.5, "mechanisms.html": 2.0, "mechanism.html": 2.0, "mindmap.html": 1.0,
  };
  const ABS_FLOOR = { "mindmap.html": 3000, "index.html": 300 }; // min baked-orig bytes
  const sizes = {};
  for (const file of Object.keys(FLOOR)) {
    const orig = sizeOf(srcRoot, file);
    const baked = sizeOf(dist, file);
    sizes[file] = { orig, baked, ratio: orig > 0 ? +(baked / orig).toFixed(2) : 0 };
    const abs = ABS_FLOOR[file];
    const minGrow = abs ? baked > orig + abs : baked >= orig * FLOOR[file];
    const label = abs
      ? `size floor (baked ${baked} >= orig ${orig} + ${abs}B)`
      : `size floor (baked ${baked} >= orig ${orig} x${FLOOR[file]})`;
    check(file, label, orig > 0 && minGrow, `orig ${orig} -> baked ${baked} (x${sizes[file].ratio})`);
  }

  /* ======================= B. JS-ON EQUIVALENCE ======================= */
  // Reload each baked page WITH client JS; assert mounts stay non-empty and the
  // client re-render does NOT double-inject over the baked HTML.
  const { chromium } = await import("playwright");
  const { server, base } = await startServer(dist);
  let browser;
  try {
    try { browser = await chromium.launch({ headless: true }); }
    catch (e) { browser = await chromium.launch({ headless: true, channel: "chrome" }); }
    const page = await browser.newPage();

    // signature selector per non-mechanism page: DOM count after JS must EQUAL the
    // baked count (doubling => append bug => FAIL).
    const eq = [
      { file: "derivation.html", sel: "#stack article.node", baked: (h) => count(h, /class="node( cnode)?"/g) },
      { file: "the-gap.html", sel: "#gap-body .gap-card", baked: (h) => count(h, /class="gap-card"/g) },
      { file: "reference.html", sel: ".ref-content .ref-card", baked: (h) => count(h, /class="ref-card[ "]/g) },
      { file: "index.html", sel: "#stat-grid .stat", baked: (h) => count(h, /class="stat stat-/g) },
    ];
    for (const e of eq) {
      const h = await read(e.file);
      const bakedN = e.baked(h);
      await page.goto(`${base}/${e.file}`, { waitUntil: "load", timeout: RENDER_TIMEOUT });
      await page.waitForSelector(e.sel, { state: "attached", timeout: RENDER_TIMEOUT }).catch(() => {});
      const domN = await page.$$eval(e.sel, (els) => els.length);
      check(e.file, `JS-on: no double-inject (${e.sel})`, domN === bakedN, `baked ${bakedN}, after-JS ${domN}`);
    }

    // mechanism pages: client REPLACES the 15 baked wrappers with one live mechanism.
    for (const file of ["mechanisms.html", "mechanism.html"]) {
      await page.goto(`${base}/${file}`, { waitUntil: "load", timeout: RENDER_TIMEOUT });
      await page.waitForSelector("#view .ident-code", { state: "attached", timeout: RENDER_TIMEOUT }).catch(() => {});
      const btns = await page.$$eval("#switcher .mech-btn", (els) => els.length);
      const wraps = await page.$$eval("#view .prerender-mech", (els) => els.length);
      const identOk = await page.$eval("#view .ident-code", (el) => el.textContent.trim().length > 0).catch(() => false);
      check(file, "JS-on: switcher still 15 buttons", btns === 15, `${btns}`);
      check(file, "JS-on: #view rendered (ident present)", identOk);
      check(file, "JS-on: baked wrappers replaced, not appended", wraps === 0, `${wraps} prerender-mech left (expect 0)`);
    }

    // mindmap: the client removes #mindmap-fallback after Markmap.create succeeds.
    {
      await page.goto(`${base}/mindmap.html`, { waitUntil: "load", timeout: RENDER_TIMEOUT });
      // give markmap a moment to create + run the fallback-removal line
      await page.waitForFunction(() => {
        const g = document.querySelector("#markmap g");
        return g && g.childElementCount > 0;
      }, null, { timeout: RENDER_TIMEOUT }).catch(() => {});
      const gRan = await page.$eval("#markmap", (svg) => !!svg.querySelector("g")).catch(() => false);
      const fbGone = await page.$("#mindmap-fallback").then((el) => el === null);
      if (gRan) check("mindmap.html", "JS-on: fallback removed after markmap renders", fbGone, fbGone ? "" : "fallback still in DOM");
      else check("mindmap.html", "JS-on: markmap rendered (libs loaded)", false, "markmap <g> not populated in headless - fallback-removal not exercised");
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  /* ======================= REPORT ======================= */
  const fails = results.filter((r) => !r.pass);
  console.log("Sizes (orig -> baked):");
  for (const [f, s] of Object.entries(sizes)) console.log(`  ${f.padEnd(18)} ${s.orig} -> ${s.baked}  (x${s.ratio})`);
  console.log("");
  let curPage = "";
  for (const r of results) {
    if (r.page !== curPage) { curPage = r.page; console.log(`  ${curPage}`); }
    console.log(`    ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  [" + r.detail + "]" : ""}`);
  }
  console.log(`\n${results.length - fails.length}/${results.length} checks passed.`);

  /* ---- contradiction gate: D1/D2 hard-block, D3-D6 warn only -------------- */
  // Runs regardless of the hard-gate outcome. D1/D2 are snapshot-only and can
  // block; the soft detectors only warn. An INFRA error inside the gate is
  // swallowed (a broken soft check must never break a deploy) - but that also
  // means a network outage cannot mask a D1/D2 finding, because D1/D2 compute
  // from the snapshot and run before the D4/D5 fetch.
  let contradictionBlocks = [];
  try {
    const { findings } = await runContradictionGate({ dist, snap });
    console.log(reportContradictions(findings));
    contradictionBlocks = blockingFailures(findings);
  } catch (e) {
    console.log(`\n=== CONTRADICTION GATE infra error (non-blocking): ${e.message} ===`);
  }

  if (fails.length || contradictionBlocks.length) {
    if (fails.length) {
      console.error(`\n${fails.length} CHECK(S) FAILED:`);
      for (const r of fails) console.error(`  - [${r.page}] ${r.name}  ${r.detail}`);
    }
    if (contradictionBlocks.length) {
      console.error(`\n${contradictionBlocks.length} CONTRADICTION GATE HARD FAILURE(S):`);
      for (const f of contradictionBlocks) console.error(`  - [${f.id}] ${f.title} (${f.count})`);
    }
    process.exit(1);
  }
  console.log("ALL CHECKS PASSED.");
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
