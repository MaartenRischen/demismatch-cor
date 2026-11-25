// Width check of any static site folder at phone and desktop width.
//   node shot-pages.mjs <site root> <out dir> <widths, e.g. 390,1440> <page path> [page path ...] [--find "text"]
// Serves the folder locally, opens each page, prints horizontal overflow and whether --find text is visible,
// and saves a screenshot scrolled to that text (or the top of the page).
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const a = process.argv.slice(2); const fi = a.indexOf('--find'); const find = fi >= 0 ? a[fi + 1] : null; if (fi >= 0) a.splice(fi, 2);
const root = path.resolve(a[0]), out = a[1], widths = a[2].split(',').map(Number), pages = a.slice(3);
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => {
  let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': T[path.extname(p)] || 'application/octet-stream' }); r.end(d); } });
}).listen(8994);
const b = await chromium.launch({ headless: true, channel: 'chrome' });
for (const w of widths) for (const pg of pages) {
  const page = await b.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(`http://localhost:8994/${pg}`); await page.waitForTimeout(900);
  let seen = null;
  if (find) { const els = await page.$$(`text=${find}`); for (const e of els) if (await e.isVisible()) { await e.scrollIntoViewIfNeeded(); seen = true; break; } if (!seen) seen = els.length ? 'present, hidden' : false; }
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const name = pg.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
  await page.screenshot({ path: `${out}/${name}-${w}.png` });
  console.log(w, pg, JSON.stringify({ overflow: over, found: seen }));
  await page.close();
}
await b.close(); srv.close();
