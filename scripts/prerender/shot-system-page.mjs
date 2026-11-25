// Screenshot check of a system page's "Sex differences in the findings" card at phone and desktop width.
//   node shot-system-page.mjs <out dir> [codes, default M3 M14 M5]
// Serves ../../dist on a local port, opens mechanism.html for each code, reports overflow and the card.
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const root = path.resolve('../../dist'); const out = process.argv[2]; const codes = process.argv.slice(3).length ? process.argv.slice(3) : ['M3', 'M14', 'M5'];
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => {
  let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': T[path.extname(p)] || 'application/octet-stream' }); r.end(d); } });
}).listen(8993);
const b = await chromium.launch({ headless: true, channel: 'chrome' });
for (const w of [390, 1440]) for (const c of codes) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 } });
  await pg.goto(`http://localhost:8993/mechanism.html#${c}`); await pg.waitForTimeout(1500);
  const o = await pg.evaluate(() => {
    const vis = [...document.querySelectorAll('.card-head')].filter(e => e.offsetParent && /Sex/.test(e.textContent)); const card = vis[0] && vis[0].parentElement;
    return { over: document.documentElement.scrollWidth - window.innerWidth, cards: vis.length, links: card ? card.querySelectorAll('a').length : 0, text: card ? card.textContent.slice(0, 140) : '',
      shown: (document.querySelector('.mech-btn.active, .mech-btn[aria-current]') || {}).textContent, old: /Not sex-differentiated|two parameterizations/.test(document.body.innerText) };
  });
  console.log(w, c, JSON.stringify(o));
  for (const e of await pg.$$('text=Sex differences in the findings')) if (await e.isVisible()) { await e.scrollIntoViewIfNeeded(); await pg.screenshot({ path: `${out}/cor-${c}-${w}.png` }); break; }
  await pg.close();
}
await b.close(); srv.close();
