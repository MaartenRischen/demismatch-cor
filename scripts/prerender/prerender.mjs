/* ============================================================================
   prerender.mjs - SESSION 1 (LOCAL PROVING ONLY).

   Runs the site's OWN renderers at build time in headless Chromium, captures the
   rendered innerHTML of each mount, and bakes it into the shell files IN dist/.
   Reusing the shipped renderers means zero drift between crawler view and user
   view; the client JS then re-renders idempotently over the baked HTML.

   Writes ONLY into dist/. Fails loudly (non-zero exit) on any renderer timeout or
   missing mount - a half-baked shell must block, never ship silently.

   Usage:  node prerender.mjs --dist <distDir>     (default: ./dist)
   ============================================================================ */

import { readFile, writeFile } from "node:fs/promises";
import { resolve, join, basename } from "node:path";
import { startServer, injectMount, insertAfterMount, markmapMdToUl } from "./lib.mjs";

const RENDER_TIMEOUT = 15000; // hard per-selector timeout; expiry => a renderer broke => abort.

/* ---- manifest: one entry per target page --------------------------------- */
// waitFor : selectors that must be present + non-empty before capture.
// mounts  : mount selectors ("#id") whose innerHTML is baked into the shell.
// type    : "mechanism" (hash-loop all 15 codes) or "mindmap" (semantic fallback)
//           or undefined (plain innerHTML bake).
const MANIFEST = [
  {
    file: "index.html",
    waitFor: ["#stat-grid .stat", "#door-a-mech"],
    mounts: ["#stat-grid", "#door-a-mech"],
  },
  {
    file: "derivation.html",
    waitFor: ["#stack .layer-block", "#stack .mech-grid .mech-cell"],
    mounts: ["#stack"],
  },
  {
    file: "the-gap.html",
    waitFor: ["#gap-body .gap-domain", "#gap-body .gap-card", "#gap-honesty .gap-banner-txt"],
    mounts: ["#gap-honesty", "#gap-asof", "#gap-body"],
  },
  {
    file: "reference.html",
    waitFor: ["#ref-foundations-body .ref-card", "#ref-papers-body .ref-paper", "#ref-gaps-body .ref-card"],
    mounts: [
      "#ref-asof",
      "#ref-foundations-body", "#ref-convergences-body", "#ref-demonstrations-body",
      "#ref-cases-body", "#ref-applications-body", "#ref-interpretive-calls-body",
      "#ref-gaps-body", "#ref-domains-body", "#ref-thinkers-body",
      "#ref-challenges-body", "#ref-papers-body",
    ],
  },
  {
    file: "mechanisms.html",
    type: "mechanism",
    defaultCode: "M1",
    waitFor: ["#switcher .mech-btn", "#view .ident-code"],
  },
  {
    file: "mechanism.html",
    type: "mechanism",
    defaultCode: "M14",
    waitFor: ["#switcher .mech-btn", "#view .ident-code"],
  },
  {
    file: "mindmap.html",
    type: "mindmap",
    waitFor: [], // the SVG stays client-side; we only need window.COR_MINDMAP_MD.
  },
];

async function launchBrowser() {
  const { chromium } = await import("playwright");
  const tries = [
    { label: "bundled chromium", opts: {} },
    { label: "installed Google Chrome (channel:chrome)", opts: { channel: "chrome" } },
  ];
  let lastErr;
  for (const t of tries) {
    try {
      const b = await chromium.launch({ headless: true, ...t.opts });
      console.log(`  browser: launched ${t.label}`);
      return b;
    } catch (e) { lastErr = e; }
  }
  throw new Error("Could not launch a browser (tried bundled chromium and channel:chrome). " +
    "Run `npx playwright install chromium` in scripts/prerender. Underlying error: " + (lastErr && lastErr.message));
}

async function waitForAll(page, selectors, file) {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { state: "attached", timeout: RENDER_TIMEOUT });
      // also require non-empty content for element mounts
      const nonEmpty = await page.$eval(sel, (el) => (el.innerHTML || el.textContent || "").trim().length > 0).catch(() => true);
      if (!nonEmpty) throw new Error(`selector present but empty: ${sel}`);
    } catch (e) {
      throw new Error(`[${file}] renderer did not complete: waitFor "${sel}" (${e.message})`);
    }
  }
}

async function captureMounts(page, mounts, file) {
  const out = {};
  for (const sel of mounts) {
    const id = sel.replace(/^#/, "");
    const html = await page.$eval(sel, (el) => el.innerHTML).catch(() => null);
    if (html == null) throw new Error(`[${file}] mount not found in DOM: ${sel}`);
    if (!html.trim()) throw new Error(`[${file}] mount rendered EMPTY: ${sel} (renderer ran but produced nothing)`);
    out[id] = html;
  }
  return out;
}

// Mechanism pages: capture the switcher once, then loop all codes via location.hash,
// asserting the #view ident marker flips to each code, and assemble 15 sibling wrappers.
async function processMechanism(page, entry, base, shellHtml) {
  const url = `${base}/${entry.file}`;
  await page.goto(url, { waitUntil: "load", timeout: RENDER_TIMEOUT });
  await waitForAll(page, entry.waitFor, entry.file);

  const nBtn = await page.$$eval("#switcher .mech-btn", (els) => els.length);
  if (nBtn !== 15) throw new Error(`[${entry.file}] expected 15 switcher buttons, got ${nBtn}`);
  const switcherHtml = await page.$eval("#switcher", (el) => el.innerHTML);
  const codes = await page.$$eval("#switcher .mech-btn", (els) => els.map((e) => e.getAttribute("data-code")));

  if (!codes.includes(entry.defaultCode)) {
    throw new Error(`[${entry.file}] default code ${entry.defaultCode} not among switcher codes: ${codes.join(",")}`);
  }

  const views = [];
  for (const code of codes) {
    await page.evaluate((c) => { window.location.hash = "#" + c; }, code);
    try {
      await page.waitForFunction(
        (c) => {
          const el = document.querySelector("#view .ident-code");
          return !!el && el.textContent.trim() === c;
        },
        code,
        { timeout: RENDER_TIMEOUT }
      );
    } catch (e) {
      throw new Error(`[${entry.file}] #view did not re-render to ${code} on hashchange (${e.message})`);
    }
    const vh = await page.$eval("#view", (el) => el.innerHTML);
    if (!vh.trim()) throw new Error(`[${entry.file}] #view empty for ${code}`);
    views.push({ code, html: vh });
  }

  // Assemble all 15 mechanisms as sibling wrappers so a no-JS fetch exposes them
  // all (hash fragments aren't separate URLs to a crawler). Default visible; rest hidden.
  const assembled = "\n" + views.map((v) => {
    const hidden = v.code === entry.defaultCode ? "" : " hidden";
    return `<div class="prerender-mech" id="prerender-${v.code}"${hidden}>${v.html}</div>`;
  }).join("\n") + "\n";

  let html = shellHtml;
  html = injectMount(html, "switcher", switcherHtml);
  html = injectMount(html, "view", assembled);
  return { html, note: `${views.length} mechanisms baked (default ${entry.defaultCode})` };
}

// Plain page: goto, wait, capture each mount's innerHTML, splice into the shell.
async function processPlain(page, entry, base, shellHtml) {
  const url = `${base}/${entry.file}`;
  await page.goto(url, { waitUntil: "load", timeout: RENDER_TIMEOUT });
  await waitForAll(page, entry.waitFor, entry.file);
  const captured = await captureMounts(page, entry.mounts, entry.file);
  let html = shellHtml;
  for (const [id, inner] of Object.entries(captured)) {
    html = injectMount(html, id, inner);
  }
  return { html, note: `${entry.mounts.length} mounts baked` };
}

// Mindmap: do NOT bake the SVG. Read window.COR_MINDMAP_MD, emit a semantic nested
// <ul> into a visually-hidden #mindmap-fallback next to the untouched SVG mount.
async function processMindmap(page, entry, base, shellHtml) {
  const url = `${base}/${entry.file}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: RENDER_TIMEOUT });
  const md = await page.evaluate(() => window.COR_MINDMAP_MD || null);
  if (!md || typeof md !== "string" || md.length < 100) {
    throw new Error(`[${entry.file}] window.COR_MINDMAP_MD unavailable or too short`);
  }
  const ul = markmapMdToUl(md);
  const linkCount = (ul.match(/<a /g) || []).length;
  if (linkCount < 20) throw new Error(`[${entry.file}] mindmap fallback has only ${linkCount} links; tree parse likely failed`);

  const fallback =
    `\n    <div id="mindmap-fallback" class="visually-hidden" data-prerendered="1">` +
    `<nav aria-label="Cor spec map (text outline)">${ul}</nav></div>`;
  // Insert after the #markmap SVG mount; SVG itself stays byte-for-byte client-side.
  const html = insertAfterMount(shellHtml, "markmap", fallback);
  return { html, note: `mindmap fallback baked (${linkCount} deep-links)` };
}

async function main() {
  const args = process.argv.slice(2);
  const di = args.indexOf("--dist");
  const distArg = di >= 0 ? args[di + 1] : "dist";
  const dist = resolve(process.cwd(), distArg);
  console.log(`Pre-render (SESSION 1, local) -> dist: ${dist}\n`);

  const { server, base } = await startServer(dist);
  const browser = await launchBrowser();
  const results = [];
  let failed = null;

  try {
    const page = await browser.newPage();
    for (const entry of MANIFEST) {
      const shellPath = join(dist, entry.file);
      const shellHtml = await readFile(shellPath, "utf8");
      const origSize = Buffer.byteLength(shellHtml, "utf8");

      let res;
      if (entry.type === "mechanism") res = await processMechanism(page, entry, base, shellHtml);
      else if (entry.type === "mindmap") res = await processMindmap(page, entry, base, shellHtml);
      else res = await processPlain(page, entry, base, shellHtml);

      const bakedSize = Buffer.byteLength(res.html, "utf8");
      await writeFile(shellPath, res.html, "utf8");
      results.push({ file: entry.file, origSize, bakedSize, note: res.note });
      console.log(`  OK  ${entry.file.padEnd(18)} ${origSize} -> ${bakedSize} bytes  (${res.note})`);
    }
  } catch (e) {
    failed = e;
  } finally {
    await browser.close();
    server.close();
  }

  if (failed) {
    console.error(`\nABORTED: ${failed.message}`);
    console.error("No further pages baked. (Pages baked before the failure were written; re-run build-public.sh to reset dist/.)");
    process.exit(1);
  }

  // Write a disposable report into dist/ (never the source tree).
  const report = {
    built_by: "scripts/prerender/prerender.mjs",
    session: 1,
    pages: results,
  };
  await writeFile(join(dist, "prerender-report.json"), JSON.stringify(report, null, 2), "utf8");

  console.log(`\nDone. ${results.length} pages baked into ${dist}. Report: dist/prerender-report.json`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
