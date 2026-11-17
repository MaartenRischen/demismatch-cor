/* ===========================================================================
   THIS IS WHY - the scroll-scrubbed sequence.

   148 real works travel through the Cor machinery and come out as 20 answers.
   Every sheet is a real work. Every slip is a real finding. Every stamp is a
   real grade with its real count. Every challenge and every gap is real. The
   only two illustrative objects are the rejected "abstract only" sheet and the
   "stitched" slip, and both carry that word on their face.

   Structure of this file
     1  constants, palette, small maths
     2  data load and the canvas atlases (all text is drawn from the corpus)
     3  the scene: shaders, instanced meshes, lines
     4  the chapters: every position is a pure function of p, so a backwards
        scrub retraces the same frames exactly
     5  the DOM overlay: the headline, the captions, the counters, the labels
        welded to the machinery by projection
     6  post: depth of field, film grain, vignette
     7  boot, the fallback switch, and the resize and progress plumbing

   No timeline, no tween state, no wheel handler. The only state that is not a
   function of p is the critically damped spring that gives the paper mass.
   =========================================================================== */

import * as THREE from './vendor/three.module.min.js';

/* ---------------------------------------------------------------- 1 basics */

const CHAP = [0.00, 0.12, 0.24, 0.42, 0.58, 0.70, 0.88, 1.00];

/* Where each of the six approved headline phrases lands in the new cut. Four
   of them belong to the wrangle; the sixth waits for the findings chapter to
   finish, because that is where the 635 come out. */
const LEDE_P = [0.000, 0.162, 0.216, 0.270, 0.320, 0.776];

const PAL = {
  parchment: 0xece0c4,
  parchmentSoft: 0xf2e8cf,
  parchmentDark: 0xddd0b0,
  tan: 0xc4b894,
  oxblood: 0x3a1218,
  oxbloodDeep: 0x2a0c11,
  oxbloodWarm: 0x5a2a32,
  ink: 0x1a0608,
  teal: 0x2d6b6b,
  tealBright: 0x3d8585,
  gold: 0xc4962c,
  goldDim: 0xa5801f,
  muted: 0x8a7d5e,
  paper: 0xfaf8f2,
  label: 0x6b5e42,
};

/* Grade colours, all site tokens. Gold family = strongest empirical footing,
   teal family = design of the evidence, oxblood family = species and dispute,
   warm neutrals = framework level and sparse. Gold is replicated, per brief. */
const GRADE_COL = {
  replicated: 0xc4962c,
  meta_analysis: 0xa5801f,
  longitudinal: 0x2d6b6b,
  clinical: 0x3d8585,
  cross_species: 0x5a2a32,
  contested: 0x3a1218,
  theoretical: 0x8a7d5e,
  thin: 0xc4b894,
};

function keyLerp(p, arr) {
  let i = 0;
  while (i < arr.length - 2 && p > arr[i + 1][0]) i++;
  const t = smooth((p - arr[i][0]) / (arr[i + 1][0] - arr[i][0]));
  return arr[i][1] + (arr[i + 1][1] - arr[i][1]) * t;
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
const smoother = (t) => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
/* seg: the eased 0..1 ramp of p across [a,b]. The whole sequence is built from
   these, which is why scrubbing backwards lands on the same frame. */
const seg = (p, a, b) => smooth((p - a) / (b - a));
const segl = (p, a, b) => clamp01((p - a) / (b - a));
/* a symmetric pulse: 0 at a, 1 in the middle, 0 at b */
const pulse = (p, a, b) => { const t = clamp01((p - a) / (b - a)); return Math.sin(t * Math.PI); };

function hash1(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }
function hash2(n) { const s = Math.sin(n * 269.5 + 11.3) * 24634.6345; return s - Math.floor(s); }
function hash3(n) { const s = Math.sin(n * 419.2 + 3.7) * 15731.743; return s - Math.floor(s); }

/* Catmull-Rom through a list of keys, evaluated on key index space so the
   camera never stops at a key the way a chain of smoothsteps would. */
function crv(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function toHexTriplet(c) {
  return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
}
function css(c) { return '#' + c.toString(16).padStart(6, '0'); }
function mixHex(a, b, t) {
  const r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  const g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  const bl = Math.round(lerp(a & 255, b & 255, t));
  return (r << 16) | (g << 8) | bl;
}

/* ------------------------------------------------------- 2 profile and data */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pickProfile() {
  const w = Math.min(window.innerWidth, document.documentElement.clientWidth);
  const small = w < 760;
  const mem = navigator.deviceMemory || 4;
  const lean = small || mem <= 2;
  return {
    small,
    dpr: lean ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
    /* sheet atlas: 12 columns, 13 rows, one tile per work plus the illustrative one */
    sheet: lean
      ? { tw: 168, th: 119, cols: 12, rows: 13, head: 94, gap: 1 }
      : { tw: 320, th: 226, cols: 12, rows: 13, head: 179, gap: 2 },
    slip: lean
      ? { tw: 128, th: 22, cols: 16, rows: 40 }
      : { tw: 256, th: 44, cols: 16, rows: 40 },
    hero: lean
      ? { tw: 512, th: 112, cols: 2, rows: 9 }
      : { tw: 1024, th: 224, cols: 2, rows: 9 },
    card: lean
      ? { tw: 256, th: 168, cols: 4, rows: 6 }
      : { tw: 512, th: 336, cols: 4, rows: 6 },
    stamp: lean
      ? { tw: 256, th: 128, cols: 2, rows: 5 }
      : { tw: 512, th: 256, cols: 2, rows: 5 },
    /* the close-up record faces of the findings chapter: quote, paper,
       authors, year, location, grade. Sized so one tile lands at about 1:1
       texels when the record is at the lens. */
    /* The record tile is sized to its content, so the face has no dead paper
       on it. A phone gets a squarer tile and bigger type relative to the tile,
       because there the record has to fill the width to stay readable. */
    rec: lean
      ? { tw: 512, th: 304, cols: 2, rows: 3, lines: 4, ts: 1.88 }
      : { tw: 1024, th: 288, cols: 3, rows: 4, lines: 3, ts: 1.00 },
    recCount: lean ? 6 : 12,
    /* how many of the 635 slips get a body in the flock; the counters always
       say 635 because the corpus always has 635 */
    slipCount: lean ? 420 : 635,
    blurScale: lean ? 0.34 : 0.5,
  };
}

async function loadJSON(name) {
  const url = new URL('./' + name, import.meta.url);
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(name + ' ' + res.status);
  return res.json();
}

async function readyFonts() {
  if (!document.fonts) return;
  const faces = [
    '600 20px Spectral', '400 20px Spectral', 'italic 400 20px Spectral',
    '300 20px Spectral', '500 20px Spectral',
    '400 12px "JetBrains Mono"', '500 12px "JetBrains Mono"', '300 12px "JetBrains Mono"',
  ];
  try {
    await Promise.all(faces.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } catch (e) { /* a missing webfont falls back to the stack; never fatal */ }
}

const raf1 = () => new Promise((r) => requestAnimationFrame(r));

/* -------------------------------------------------------- canvas type tools */

function wrapLines(ctx, text, maxW, maxLines) {
  const words = String(text).split(' ');
  const out = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const trial = line ? line + ' ' + words[i] : words[i];
    if (ctx.measureText(trial).width <= maxW || !line) {
      line = trial;
    } else {
      out.push(line);
      line = words[i];
      if (out.length === maxLines) break;
    }
  }
  if (out.length < maxLines && line) out.push(line);
  if (out.length === maxLines) {
    let last = out[maxLines - 1];
    const consumed = out.join(' ').length;
    if (consumed < text.length - 1) {
      while (last.length > 4 && ctx.measureText(last + '...').width > maxW) last = last.slice(0, -1);
      if (consumed < text.length - 1) out[maxLines - 1] = last + '...';
    }
  }
  return out;
}

function fitOneLine(ctx, text, maxW) {
  let t = String(text);
  if (ctx.measureText(t).width <= maxW) return t;
  while (t.length > 3 && ctx.measureText(t + '...').width > maxW) t = t.slice(0, -1);
  return t + '...';
}

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function mkTexture(canvas, mips) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.NoColorSpace;
  t.generateMipmaps = !!mips;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

const SERIF = "Spectral, Georgia, 'Times New Roman', serif";
const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";

/* ------------------------------------------------------------- 2b  atlases */

/* Tile origin in texture space. three uploads canvases with flipY, so canvas
   row r (counted from the top) lands at v = 1 - (r+1)*th/H. */
function tileUV(i, cfg, W, H) {
  const c = i % cfg.cols, r = Math.floor(i / cfg.cols);
  return [(c * cfg.tw) / W, 1 - ((r + 1) * cfg.th) / H];
}

/* The 148 sheet faces: year and type, title, authors in the head band, and the
   real identifier in its own band at the bottom of the tile. Everything else
   on a sheet - the paper, the rules, the accent edge - is procedural, so it
   stays sharp at any distance. Tile 149 is the illustrative rejected sheet. */
function buildSheetAtlas(works, cfg) {
  const W = cfg.cols * cfg.tw, H = cfg.rows * cfg.th;
  const cv = mkCanvas(W, H);
  const g = cv.getContext('2d');
  const k = cfg.tw / 320;
  g.clearRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';

  const draw = (i, w) => {
    const c = i % cfg.cols, r = Math.floor(i / cfg.cols);
    const x0 = c * cfg.tw, y0 = r * cfg.th;
    const pad = Math.round(14 * k);
    const ghost = w === null;

    /* year and work type */
    g.font = Math.round(9.5 * k) + 'px ' + MONO;
    g.fillStyle = ghost ? '#8f8878' : css(PAL.label);
    if ('letterSpacing' in g) g.letterSpacing = Math.round(1.1 * k) + 'px';
    g.fillText(ghost ? '' : String(w.y), x0 + pad, y0 + Math.round(19 * k));
    if ('letterSpacing' in g) g.letterSpacing = '0px';

    /* title */
    const tSize = Math.round(16.5 * k), tLead = Math.round(18.6 * k);
    g.font = '600 ' + tSize + 'px ' + SERIF;
    g.fillStyle = ghost ? '#918a7a' : '#241812';
    const maxW = cfg.tw - pad * 2;
    const lines = wrapLines(g, ghost ? 'abstract only' : w.t, maxW, 4);
    let y = y0 + Math.round(38 * k) + tSize;
    for (let li = 0; li < lines.length; li++) { g.fillText(lines[li], x0 + pad, y); y += tLead; }

    /* authors */
    if (!ghost) {
      g.font = 'italic 400 ' + Math.round(11.5 * k) + 'px ' + SERIF;
      g.fillStyle = '#5f4e40';
      g.fillText(fitOneLine(g, w.a, maxW), x0 + pad, y + Math.round(5 * k));
    }

    /* the identifier band, pressed in later by the shader */
    const idY = y0 + cfg.head + Math.round(2 * k);
    g.font = Math.round(11 * k) + 'px ' + MONO;
    g.fillStyle = ghost ? '#918a7a' : '#4a3f2c';
    if ('letterSpacing' in g) g.letterSpacing = Math.round(0.5 * k) + 'px';
    g.fillText(fitOneLine(g, ghost ? 'abstract only' : w.d, maxW), x0 + pad,
      idY + Math.round(30 * k));
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  };

  for (let i = 0; i < works.length; i++) draw(i, works[i]);
  draw(works.length, null);
  return { canvas: cv, tex: mkTexture(cv, true), W, H, cfg };
}

/* The 635 quote strips. A slip whose extraction carries a verbatim
   author_quote is set in italic; the 113 records with no quote in the archive
   show their content line in roman, so nothing is dressed as a quotation. */
function buildSlipAtlas(findings, cfg, onChunk) {
  const W = cfg.cols * cfg.tw, H = cfg.rows * cfg.th;
  const cv = mkCanvas(W, H);
  const g = cv.getContext('2d');
  const k = cfg.tw / 256;
  g.clearRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';
  const pad = Math.round(6 * k);
  const maxW = cfg.tw - pad * 2 - Math.round(10 * k);
  const qSize = Math.max(5, Math.round(8.2 * k)), qLead = Math.round(9.6 * k);
  const lSize = Math.max(4, Math.round(6 * k));

  const draw = (i, f) => {
    const c = i % cfg.cols, r = Math.floor(i / cfg.cols);
    const x0 = c * cfg.tw + Math.round(9 * k), y0 = r * cfg.th;
    g.font = (f.v ? 'italic 400 ' : '400 ') + qSize + 'px ' + SERIF;
    g.fillStyle = '#241812';
    const lines = wrapLines(g, f.q, maxW, 2);
    let y = y0 + Math.round(12 * k);
    for (let li = 0; li < lines.length; li++) { g.fillText(lines[li], x0, y); y += qLead; }
    g.font = lSize + 'px ' + MONO;
    g.fillStyle = '#6b5e42';
    g.fillText(fitOneLine(g, f.l, maxW), x0, y0 + cfg.th - Math.round(7 * k));
  };

  return (async () => {
    const n = Math.min(findings.length, cfg.cols * cfg.rows);
    for (let i = 0; i < n; i++) {
      draw(i, findings[i]);
      if (i % 160 === 159) { await raf1(); if (onChunk) onChunk(i / n); }
    }
    return { canvas: cv, tex: mkTexture(cv, true), W, H, cfg };
  })();
}

/* Close-up faces: one legible real quote per grade, the illustrative stitched
   slip, and the eight real challenges. Slot order is fixed and read below. */
function buildHeroAtlas(items, cfg) {
  const W = cfg.cols * cfg.tw, H = cfg.rows * cfg.th;
  const cv = mkCanvas(W, H);
  const g = cv.getContext('2d');
  const k = cfg.tw / 1024;
  g.clearRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const c = i % cfg.cols, r = Math.floor(i / cfg.cols);
    const x0 = c * cfg.tw, y0 = r * cfg.th;
    const pad = Math.round(38 * k);
    const stampZone = Math.round(cfg.tw * 0.225);
    const maxW = cfg.tw - pad * 2 - stampZone;

    if (it.kind === 'seam') {
      /* two fragments and the seam between them. No text is invented: the
         label is the only word on it. */
      g.fillStyle = 'rgba(36,24,18,0.30)';
      for (let li = 0; li < 3; li++) {
        const yy = y0 + Math.round((58 + li * 34) * k);
        g.fillRect(x0 + pad, yy, Math.round(300 * k), Math.round(9 * k));
        g.fillRect(x0 + Math.round(384 * k), yy, Math.round((li === 2 ? 210 : 330) * k), Math.round(9 * k));
      }
      g.font = '500 ' + Math.round(19 * k) + 'px ' + MONO;
      g.fillStyle = css(PAL.oxblood);
      if ('letterSpacing' in g) g.letterSpacing = Math.round(4 * k) + 'px';
      g.fillText('stitched', x0 + pad, y0 + cfg.th - Math.round(30 * k));
      if ('letterSpacing' in g) g.letterSpacing = '0px';
      continue;
    }

    if (it.kind === 'challenge') {
      g.font = '600 ' + Math.round(26 * k) + 'px ' + SERIF;
      g.fillStyle = '#2a0c11';
      const lines = wrapLines(g, it.t, maxW, 3);
      let y = y0 + Math.round(56 * k);
      for (let li = 0; li < lines.length; li++) { g.fillText(lines[li], x0 + pad, y); y += Math.round(31 * k); }
      g.font = Math.round(15 * k) + 'px ' + MONO;
      g.fillStyle = '#6b5e42';
      g.fillText(fitOneLine(g, it.a + '  ' + it.y, maxW), x0 + pad, y0 + cfg.th - Math.round(26 * k));
      continue;
    }

    /* a real finding */
    g.font = (it.f.v ? 'italic 400 ' : '400 ') + Math.round(27 * k) + 'px ' + SERIF;
    g.fillStyle = '#241812';
    const lines = wrapLines(g, it.f.q, maxW, 3);
    let y = y0 + Math.round(56 * k);
    for (let li = 0; li < lines.length; li++) { g.fillText(lines[li], x0 + pad, y); y += Math.round(33 * k); }
    g.font = Math.round(14 * k) + 'px ' + MONO;
    g.fillStyle = '#6b5e42';
    g.fillText(fitOneLine(g, it.f.l, maxW), x0 + pad, y0 + cfg.th - Math.round(26 * k));
    /* the grade name sits in the stamp zone and is masked until the stamp lands */
    g.save();
    g.translate(x0 + cfg.tw - Math.round(26 * k), y0 + Math.round(30 * k));
    g.font = '500 ' + Math.round(17 * k) + 'px ' + MONO;
    g.fillStyle = css(GRADE_COL[it.f.g]);
    g.textAlign = 'right';
    if ('letterSpacing' in g) g.letterSpacing = Math.round(2.4 * k) + 'px';
    const gname = it.f.g.replace('_', ' ').toUpperCase();
    g.fillText(gname, 0, 0);
    g.fillText(gname, 0, Math.round(cfg.th * 0.5));
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.textAlign = 'left';
    g.restore();
  }
  return { canvas: cv, tex: mkTexture(cv, false), W, H, cfg };
}

/* The 20 answers, read straight off the real cards in the page. */
function buildCardAtlas(cards, cfg, dark) {
  const W = cfg.cols * cfg.tw, H = cfg.rows * cfg.th;
  const cv = mkCanvas(W, H);
  const g = cv.getContext('2d');
  const k = cfg.tw / 512;
  g.clearRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';
  for (let i = 0; i < cards.length; i++) {
    const c = i % cfg.cols, r = Math.floor(i / cfg.cols);
    const x0 = c * cfg.tw, y0 = r * cfg.th;
    const pad = Math.round(34 * k);
    const maxW = cfg.tw - pad * 2;
    g.font = '500 ' + Math.round(15 * k) + 'px ' + MONO;
    g.fillStyle = css(dark ? PAL.gold : PAL.teal);
    if ('letterSpacing' in g) g.letterSpacing = Math.round(2.2 * k) + 'px';
    g.fillText((cards[i].eyebrow || 'This is why').toUpperCase(), x0 + pad, y0 + Math.round(44 * k));
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.font = '600 ' + Math.round(30 * k) + 'px ' + SERIF;
    g.fillStyle = css(dark ? PAL.parchment : PAL.oxblood);
    const lines = wrapLines(g, cards[i].q, maxW, 4);
    let y = y0 + Math.round(84 * k);
    for (let li = 0; li < lines.length; li++) { g.fillText(lines[li], x0 + pad, y); y += Math.round(35 * k); }
  }
  return { canvas: cv, tex: mkTexture(cv, false), W, H, cfg };
}

/* The close-up records of the findings chapter. One tile per record: the
   quote as it is stored (italic when the archive holds a verbatim
   author_quote, roman when it holds the summary line), then the paper, its
   authors, its year, the location line, and the grade in its own colour.
   Nothing here is written by the page: every line is a field of the record. */
function buildRecordAtlas(items, cfg, dark) {
  const W = cfg.cols * cfg.tw, H = cfg.rows * cfg.th;
  const cv = mkCanvas(W, H);
  const g = cv.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';

  /* The face is set from the top down, so nothing is anchored to an edge and
     the tile has no dead paper on it. `ts` scales the type against the tile
     width: a phone tile is half as wide and needs nearly twice the ratio. */
  const u = (cfg.tw / 1024) * (cfg.ts || 1);
  const MAXL = cfg.lines || 3;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const c = i % cfg.cols, r = Math.floor(i / cfg.cols);
    const x0 = c * cfg.tw, y0 = r * cfg.th;
    const pad = Math.round(0.045 * cfg.tw);
    const maxW = cfg.tw - pad * 2;
    const gl = (it.label || it.f.grade).toUpperCase();
    g.font = '500 ' + Math.round(19 * u) + 'px ' + MONO;
    if ('letterSpacing' in g) g.letterSpacing = Math.round(2.6 * u) + 'px';
    const gw = Math.ceil(g.measureText(gl).width);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    const gradeW = gw + Math.round(0.035 * cfg.tw);

    /* the quote, or the stored summary line when the archive holds no quote */
    const qs = Math.round(30 * u), ql = Math.round(36 * u);
    g.font = (it.f.is_quote ? 'italic 400 ' : '400 ') + qs + 'px ' + SERIF;
    g.fillStyle = '#241812';
    const lines = wrapLines(g, it.f.quote, maxW, MAXL);
    let y = y0 + Math.round(30 * u) + qs;
    for (let li = 0; li < lines.length; li++) { g.fillText(lines[li], x0 + pad, y); y += ql; }

    /* a hairline, then the paper this came off */
    const ry = Math.round(y - ql + 20 * u);
    g.fillStyle = 'rgba(36,24,18,0.26)';
    g.fillRect(x0 + pad, ry, maxW, Math.max(1, Math.round(1.2 * u)));

    const ts = Math.round(23 * u), tl2 = Math.round(27 * u);
    g.font = '600 ' + ts + 'px ' + SERIF;
    g.fillStyle = '#241812';
    const tl = wrapLines(g, it.w.title, maxW - gradeW, 2);
    let ty = ry + Math.round(30 * u);
    for (let li = 0; li < tl.length; li++) { g.fillText(tl[li], x0 + pad, ty); ty += tl2; }
    ty -= tl2;

    g.font = 'italic 400 ' + Math.round(18 * u) + 'px ' + SERIF;
    g.fillStyle = '#5f4e40';
    g.fillText(fitOneLine(g, it.w.authors + '. ' + it.w.year + '.', maxW - gradeW),
      x0 + pad, ty + Math.round(22 * u));

    g.font = Math.round(15 * u) + 'px ' + MONO;
    g.fillStyle = '#6b5e42';
    if ('letterSpacing' in g) g.letterSpacing = '0.5px';
    g.fillText(fitOneLine(g, it.f.where, maxW), x0 + pad, ty + Math.round(48 * u));
    if ('letterSpacing' in g) g.letterSpacing = '0px';

    /* the grade, in its own colour, with its rule under it */
    g.save();
    g.translate(x0 + cfg.tw - pad, ry + Math.round(30 * u));
    g.textAlign = 'right';
    g.font = '500 ' + Math.round(19 * u) + 'px ' + MONO;
    g.fillStyle = css(GRADE_COL[it.f.grade]);
    if ('letterSpacing' in g) g.letterSpacing = Math.round(2.6 * u) + 'px';
    g.fillText(gl, 0, 0);
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.fillRect(-gw, Math.round(11 * u), gw, Math.max(2, Math.round(3 * u)));
    g.restore();
  }
  return { canvas: cv, tex: mkTexture(cv, true), W, H, cfg };
}

/* The rule etched on the entry plane. */
function buildPlateTexture(text, wide) {
  const W = wide ? 2048 : 1024, H = wide ? 192 : 96;
  const cv = mkCanvas(W, H);
  const g = cv.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  let size = Math.round(H * 0.28);
  g.font = size + 'px ' + MONO;
  if ('letterSpacing' in g) g.letterSpacing = Math.round(H * 0.035) + 'px';
  while (g.measureText(text).width > W * 0.9 && size > 8) {
    size -= 1;
    g.font = size + 'px ' + MONO;
  }
  g.fillStyle = '#2f2418';
  g.fillText(text, W / 2, H / 2);
  if ('letterSpacing' in g) g.letterSpacing = '0px';
  return { canvas: cv, tex: mkTexture(cv, false), W, H };
}

/* ------------------------------------------------------- 3  shader library */

const GLSL_COMMON = `
float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),
             mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x), f.y);
}
float bayer2(vec2 a){ a=floor(a); return fract(a.x*0.5 + a.y*a.y*0.75); }
float bayer4(vec2 a){ return bayer2(0.5*a)*0.25 + bayer2(a); }
`;

const FOG_GLSL = `
vec3 applyFog(vec3 col, float depth, vec3 fogCol, float fogD){
  float f = 1.0 - exp(-fogD * depth * depth);
  return mix(col, fogCol, clamp(f, 0.0, 1.0));
}
`;

/* ---- the sheets ---------------------------------------------------------- */

function sheetMaterial(atlas, tileCfg, uni) {
  const th = tileCfg.th, head = tileCfg.head, tw = tileCfg.tw;
  const HV0 = 1 - head / th;                 /* head band, bottom edge in tile v */
  const IV1 = 1 - (head + tileCfg.gap) / th; /* identifier band, top edge in tile v */
  const HEAD_H = (head / tw) / 1.35;         /* the same band as a share of the face */
  const HEAD_B = 0.9545, HEAD_A = HEAD_B - HEAD_H;
  const ID_H = ((th - head - tileCfg.gap) / tw) / 1.35;
  const ID_A = 0.1180, ID_B = ID_A + ID_H;
  const F = (v) => v.toFixed(6);

  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: Object.assign({
      uAtlas: { value: atlas.tex },
      uTileSz: { value: new THREE.Vector2(tw / atlas.W, th / atlas.H) },
      uTilePad: { value: new THREE.Vector2(0.75 / atlas.W, 0.75 / atlas.H) },
      uCurlAmp: { value: 1.0 },
    }, uni),
    vertexShader: `
      attribute vec2 aTile;
      attribute float aSeed;
      attribute vec4 aState;
      uniform float uCurlAmp;
      varying vec2 vUv; varying vec3 vN, vView; varying float vDepth, vSeed;
      varying vec4 vState; varying vec2 vTile;
      void main(){
        vUv = uv; vSeed = aSeed; vState = aState; vTile = aTile;
        vec3 pos = position;
        float cu = aState.w * uCurlAmp;
        float ph = aSeed * 31.4;
        pos.z += cu * (0.11*sin(pos.x*3.4 + ph) + 0.07*sin(pos.y*2.1 - ph*0.7));
        vec3 tx = normalize(vec3(1.0, 0.0, cu*0.374*cos(pos.x*3.4 + ph)));
        vec3 ty = normalize(vec3(0.0, 1.0, cu*0.147*cos(pos.y*2.1 - ph*0.7)));
        vec3 nrm = normalize(cross(tx, ty));
        vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.0);
        vN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * nrm));
        vView = normalize(cameraPosition - wp.xyz);
        vec4 mv = viewMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + FOG_GLSL + `
      uniform sampler2D uAtlas;
      uniform vec2 uTileSz, uTilePad;
      uniform vec3 uFog, uPaper, uLight, uRimCol;
      uniform float uFogD, uAmb, uRim, uInk;
      varying vec2 vUv; varying vec3 vN, vView; varying float vDepth, vSeed;
      varying vec4 vState; varying vec2 vTile;

      vec2 tileUv(vec2 local){
        return vTile + uTilePad + local * (uTileSz - 2.0*uTilePad);
      }
      void main(){
        vec2 u = vUv;
        /* aState.y is the lane: 0 supporting, 1 key, 2 pillar, 3 the one
           illustrative rejected sheet, 4 a real work with no finding extracted
           from it yet. The last two both lose their light; the rejected sheet
           loses more of it, and only it loses its accent. */
        float ghost = step(2.5, vState.y) * step(vState.y, 3.5);
        float unlit = step(3.5, vState.y);
        float wash = ghost * 0.72 + unlit * 0.46;

        float nf = 1.0 - smoothstep(6.0, 20.0, vDepth);
        float grain = vnoise(u * vec2(150.0, 205.0));
        float fibre = vnoise(u * vec2(430.0, 26.0));
        vec3 col = uPaper * (0.972 + (0.046*grain + 0.024*fibre) * nf);
        col *= 1.0 - 0.026*smoothstep(0.62, 1.0, vnoise(u*vec2(8.0, 55.0) + vSeed)) * nf;

        vec3 accent = vState.y < 0.5 ? vec3(0.722,0.663,0.533)
                   : (vState.y < 1.5 ? vec3(0.176,0.420,0.420)
                   : (vState.y < 2.5 ? vec3(0.769,0.588,0.173)
                   : (vState.y < 3.5 ? vec3(0.58,0.56,0.51) : vec3(0.54,0.50,0.42))));
        col = mix(col, accent, smoothstep(0.9690, 0.9716, u.y) * (1.0 - 0.55*unlit));

        /* ruled body, procedural so it never softens with distance */
        float ra = 0.2560, rb = 0.5030;
        if (u.y > ra && u.y < rb) {
          float ry = (u.y - ra) / (rb - ra);
          float fi = floor(ry * 13.0);
          float fr = fract(ry * 13.0);
          float len = 0.60 + 0.28 * h21(vec2(vSeed*13.0, fi));
          float para = step(0.87, h21(vec2(vSeed*7.0 + 3.0, fi)));
          float on = step(0.088, u.x) * step(u.x, 0.088 + len) * (1.0 - para);
          float band = 1.0 - smoothstep(0.13, 0.26, fr);
          float rfade = 1.0 - smoothstep(7.0, 17.0, vDepth);
          col = mix(col, vec3(0.141,0.094,0.071), 0.245 * on * band * rfade * (1.0 - 0.5*ghost - 0.34*unlit));
        }
        col = mix(col, vec3(0.886,0.847,0.761),
                  (1.0 - smoothstep(0.0, 0.0035, abs(u.y - 0.5180))) * step(0.06, u.x) * step(u.x, 0.94)
                  * (1.0 - smoothstep(9.0, 20.0, vDepth)));

        /* head block: year, title, authors */
        float inH = step(${F(HEAD_A)}, u.y) * step(u.y, ${F(HEAD_B)});
        float hv = (u.y - ${F(HEAD_A)}) / ${F(HEAD_B - HEAD_A)};
        float inkMul = gl_FrontFacing ? uInk : uInk * 0.11;
        vec4 head = texture2D(uAtlas, tileUv(vec2(u.x, mix(${F(HV0)}, 1.0, clamp(hv,0.0,1.0)))));
        col = mix(col, head.rgb, head.a * inH * inkMul);

        /* the identifier, pressed in at the entry plane */
        float inI = step(${F(ID_A)}, u.y) * step(u.y, ${F(ID_B)});
        float iv = (u.y - ${F(ID_A)}) / ${F(ID_B - ID_A)};
        vec4 idt = texture2D(uAtlas, tileUv(vec2(u.x, ${F(IV1)} * clamp(iv,0.0,1.0))));
        float stamp = clamp(vState.x, 0.0, 1.0);
        col *= 1.0 - inI * stamp * 0.055 * (1.0 - smoothstep(0.72, 1.0, abs(iv*2.0-1.0)));
        col = mix(col, idt.rgb * 0.92, idt.a * inI * stamp * inkMul);

        float edge = smoothstep(0.0,0.020,u.x) * smoothstep(0.0,0.020,1.0-u.x)
                   * smoothstep(0.0,0.014,u.y) * smoothstep(0.0,0.014,1.0-u.y);
        col *= mix(0.82, 1.0, edge);
        col = mix(col, vec3(dot(col, vec3(0.333))) * 0.90, wash);

        vec3 N = normalize(vN);
        if (!gl_FrontFacing) N = -N;
        float nd = dot(N, normalize(uLight));
        col *= uAmb + (1.0 - uAmb) * (0.34 + 0.66 * max(nd, 0.0));
        float rim = pow(1.0 - abs(dot(N, normalize(vView))), 3.0);
        col += uRim * rim * uRimCol;
        if (!gl_FrontFacing) col *= 0.80;

        col = applyFog(col, vDepth, uFog, uFogD);

        float a = vState.z;
        if (a < 0.996) { if (a < bayer4(gl_FragCoord.xy)) discard; }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/* ---- the slips ----------------------------------------------------------- */

function slipMaterial(atlas, tileCfg, uni, stampZone) {
  const F = (v) => v.toFixed(6);
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: Object.assign({
      uAtlas: { value: atlas.tex },
      uTileSz: { value: new THREE.Vector2(tileCfg.tw / atlas.W, tileCfg.th / atlas.H) },
      uTilePad: { value: new THREE.Vector2(0.75 / atlas.W, 0.75 / atlas.H) },
      uBarW: { value: 0.033 },
    }, uni),
    vertexShader: `
      attribute vec2 aTile;
      attribute float aSeed;
      attribute vec4 aState;
      attribute vec3 aGrade;
      attribute vec2 aFlag;
      varying vec2 vUv; varying vec3 vN, vView, vGrade; varying float vDepth, vSeed;
      varying vec4 vState; varying vec2 vTile, vFlag;
      void main(){
        vUv = uv; vSeed = aSeed; vState = aState; vTile = aTile; vGrade = aGrade; vFlag = aFlag;
        vec3 pos = position;
        float cu = aState.w;
        float ph = aSeed * 21.7;
        pos.z += cu * (0.055*sin(pos.x*2.6 + ph) + 0.03*sin(pos.y*7.0 - ph));
        /* the stitched slip tears along its seam */
        float tear = aState.y;
        float sgn = sign(pos.x + 0.0001);
        pos.x += sgn * tear * 0.62;
        pos.y -= tear * tear * 0.72;
        pos.z += sgn * tear * 0.20;
        vec3 tx = normalize(vec3(1.0, 0.0, cu*0.143*cos(pos.x*2.6 + ph)));
        vec3 ty = normalize(vec3(0.0, 1.0, cu*0.21*cos(pos.y*7.0 - ph)));
        vec3 nrm = normalize(cross(tx, ty));
        vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.0);
        vN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * nrm));
        vView = normalize(cameraPosition - wp.xyz);
        vec4 mv = viewMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + FOG_GLSL + `
      uniform sampler2D uAtlas;
      uniform vec2 uTileSz, uTilePad;
      uniform vec3 uFog, uPaper, uLight, uRimCol;
      uniform float uFogD, uAmb, uRim, uInk, uBarW;
      varying vec2 vUv; varying vec3 vN, vView, vGrade; varying float vDepth, vSeed;
      varying vec4 vState; varying vec2 vTile, vFlag;
      void main(){
        vec2 u = vUv;
        vec3 col = uPaper * (0.974 + 0.048*vnoise(u*vec2(210.0, 60.0) + vSeed)
                 * (1.0 - smoothstep(4.0, 16.0, vDepth)));
        vec2 tu = vTile + uTilePad + u * (uTileSz - 2.0*uTilePad);
        vec4 t = texture2D(uAtlas, tu);
        float stamp = clamp(vState.x, 0.0, 1.0);
        float mask = 1.0;
        ${stampZone > 0 ? `mask = mix(1.0, stamp, step(${F(stampZone)}, u.x));` : ''}
        col = mix(col, t.rgb, t.a * (gl_FrontFacing ? uInk : uInk * 0.11) * mask);

        /* the grade, pressed into the left edge of the slip */
        float bar = (1.0 - smoothstep(uBarW * 0.79, uBarW, u.x)) * stamp;
        col = mix(col, vGrade, bar);
        /* a challenge keeps an oxblood edge on every side */
        float rim2 = 1.0 - smoothstep(0.0, 0.012, u.x) * smoothstep(0.0, 0.012, 1.0-u.x)
                         * smoothstep(0.0, 0.045, u.y) * smoothstep(0.0, 0.045, 1.0-u.y);
        col = mix(col, vec3(0.227,0.071,0.094), rim2 * vFlag.y);
        /* the visible seam on the illustrative stitched slip */
        float seam = (1.0 - smoothstep(0.002, 0.010, abs(u.x - 0.5))) * vFlag.x;
        col = mix(col, vec3(0.35,0.30,0.26), seam * 0.8);

        float edge = smoothstep(0.0,0.010,u.x) * smoothstep(0.0,0.010,1.0-u.x)
                   * smoothstep(0.0,0.045,u.y) * smoothstep(0.0,0.045,1.0-u.y);
        col *= mix(0.80, 1.0, edge);

        vec3 N = normalize(vN);
        if (!gl_FrontFacing) N = -N;
        col *= uAmb + (1.0 - uAmb) * (0.36 + 0.64 * max(dot(N, normalize(uLight)), 0.0));
        col += uRim * pow(1.0 - abs(dot(N, normalize(vView))), 3.0) * uRimCol;
        if (!gl_FrontFacing) col *= 0.82;
        col = applyFog(col, vDepth, uFog, uFogD);

        float a = vState.z;
        if (a < 0.996) { if (a < bayer4(gl_FragCoord.xy)) discard; }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/* ---- ground, contact shadows, entry plane, nodes, stamps, ribbons -------- */

function groundMaterial(uni) {
  return new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: `
      varying vec2 vUv; varying float vDepth; varying vec3 vW;
      void main(){
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xyz;
        vec4 mv = viewMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + FOG_GLSL + `
      uniform vec3 uFog, uGround; uniform float uFogD, uFade;
      varying vec2 vUv; varying float vDepth; varying vec3 vW;
      void main(){
        float nf = 1.0 - smoothstep(5.0, 20.0, vDepth);
        vec3 col = uGround * (0.94 + 0.11*vnoise(vW.xz * 1.7)
                 + 0.055*vnoise(vW.xz * 8.0) * nf);
        col *= 0.86 + 0.14 * smoothstep(40.0, 2.0, length(vW.xz));
        col = applyFog(col, vDepth, uFog, uFogD);
        col = mix(uFog, col, uFade);
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

function shadowMaterial(uni) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: uni,
    vertexShader: `
      attribute float aAlpha;
      varying vec2 vUv; varying float vA;
      void main(){
        vUv = uv; vA = aAlpha;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uCol; varying vec2 vUv; varying float vA;
      void main(){
        vec2 q = (vUv - 0.5) * 2.0;
        float r = length(q * vec2(1.0, 0.88));
        float d = exp(-r * r * 2.6) * (1.0 - smoothstep(0.72, 1.0, r));
        gl_FragColor = vec4(uCol, d * vA);
      }`,
  });
}

function plateMaterial(plate, uni) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: Object.assign({ uPlate: { value: plate.tex } }, uni),
    vertexShader: `
      varying vec2 vUv; varying float vDepth;
      void main(){
        vUv = uv;
        vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + `
      uniform sampler2D uPlate;
      uniform vec3 uGlow, uEtch;
      uniform float uOpacity, uPlateY, uPlateH, uPlateX, uPlateW;
      varying vec2 vUv; varying float vDepth;
      void main(){
        vec2 u = vUv;
        float core = exp(-pow((u.y - 0.5) * 4.6, 2.0));
        float sideFade = smoothstep(0.0, 0.09, u.x) * smoothstep(0.0, 0.09, 1.0 - u.x);
        vec3 col = uGlow;
        float a = (0.055 + 0.60 * core) * sideFade;
        /* two rules cut across the slot, above and below the line of text */
        float rule = (1.0 - smoothstep(0.0, 0.0016, abs(u.y - 0.552)))
                   + (1.0 - smoothstep(0.0, 0.0016, abs(u.y - 0.452)));
        col = mix(col, uEtch, clamp(rule, 0.0, 1.0) * 0.7 * sideFade);
        a = max(a, clamp(rule, 0.0, 1.0) * 0.85 * sideFade);
        float ty = (u.y - uPlateY) / uPlateH;
        float tx = (u.x - uPlateX) / uPlateW;
        if (ty > 0.0 && ty < 1.0 && tx > 0.0 && tx < 1.0) {
          vec4 t = texture2D(uPlate, vec2(tx, ty));
          col = mix(col, uEtch, t.a);
          a = max(a, t.a * sideFade);
        }
        float scan = 0.035 * vnoise(vec2(u.y * 260.0, 0.5));
        gl_FragColor = vec4(col * (1.0 + scan), a * uOpacity);
      }`,
  });
}

/* The mechanism nodes. They are OPAQUE with a dithered edge, not blended: a
   blended overlay writes no depth, the depth of field then reads whatever is
   behind it, and every node comes back as a soft blob. Written as a solid body
   the disc keeps its own depth, sits in focus, and reads as a disc with a ring
   round it. Brightness is the share of that mechanism's evidence that has
   arrived, so a node lights because its threads landed. */
function nodeMaterial(uni) {
  return new THREE.ShaderMaterial({
    transparent: false, depthWrite: true, side: THREE.DoubleSide,
    uniforms: uni,
    vertexShader: `
      attribute vec3 aPos; attribute vec3 aCol; attribute vec2 aState;
      uniform float uSize;
      varying vec2 vUv; varying vec3 vC; varying float vLit, vA;
      void main(){
        vUv = uv; vC = aCol; vLit = aState.x; vA = aState.y;
        vec4 mv = viewMatrix * modelMatrix * vec4(aPos, 1.0);
        mv.xy += position.xy * uSize * (0.70 + 0.30*aState.x);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + `
      varying vec2 vUv; varying vec3 vC; varying float vLit, vA;
      void main(){
        vec2 q = (vUv - 0.5) * 2.0;
        float r = length(q);
        float aa = 0.022;
        float disc = 1.0 - smoothstep(0.44 - aa, 0.44 + aa, r);
        float ring = smoothstep(0.64 - aa, 0.64 + aa, r)
                   * (1.0 - smoothstep(0.775 - aa, 0.775 + aa, r));
        float cover = clamp(disc + ring, 0.0, 1.0);

        vec3 body = mix(vC * 0.48, vC * 1.30, vLit);
        vec3 col = mix(body, mix(body, vec3(1.0), 0.30 * vLit),
                       1.0 - smoothstep(0.0, 0.34, r));
        /* a darker rim inside the edge, so the disc has a body on parchment */
        col = mix(col, body * 0.46, smoothstep(0.30, 0.44, r) * disc * 0.60);
        col = mix(col, mix(vC * 0.40, vC * 1.20, vLit), ring);

        float a = cover * vA;
        if (a < 0.996) { if (a < h21(gl_FragCoord.xy)) discard; }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/* depthW: a ribbon that writes depth stays in focus. The tethers do not (they
   run across the sheets they came off, and z-fighting there costs more than the
   blur does); the evidence threads and the challenge threads do. */
function ribbonMaterial(uni, depthW) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: !!depthW, side: THREE.DoubleSide,
    uniforms: uni,
    vertexShader: `
      attribute vec3 aA; attribute vec3 aB; attribute vec3 aCol; attribute vec2 aState;
      uniform vec2 uRes; uniform float uThick;
      varying vec3 vC; varying float vA, vAcross;
      void main(){
        vC = aCol; vA = aState.x; vAcross = position.x * 2.0;
        mat4 vp = projectionMatrix * viewMatrix;
        vec4 ca = vp * vec4(aA, 1.0);
        vec4 cb = vp * vec4(aB, 1.0);
        float t = clamp(position.y + 0.5, 0.0, 1.0);
        vec4 cc = mix(ca, cb, t);
        vec2 na = ca.xy / max(ca.w, 0.0001);
        vec2 nb = cb.xy / max(cb.w, 0.0001);
        vec2 d = nb - na;
        d = (length(d) < 1e-6) ? vec2(1.0, 0.0) : normalize(d * uRes);
        vec2 perp = vec2(-d.y, d.x) * 2.0 / uRes;
        cc.xy += perp * position.x * uThick * aState.y * cc.w;
        gl_Position = cc;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vA, vAcross;
      void main(){
        float soft = 1.0 - smoothstep(0.35, 1.0, abs(vAcross));
        gl_FragColor = vec4(vC, vA * soft);
      }`,
  });
}

/* The stamp heads. A milled brass block: the face normal is derived from the
   box position so the edges can be chamfered per fragment, the chamfer is a
   fixed width in WORLD units (the long beam and the small head get the same
   lip, not the same fraction of themselves), and the grade name is cut into
   the face as a groove rather than painted on it: the atlas alpha drives both
   the depth of the cut and the normal of its walls, so the word catches the
   key light on one side and holds shadow on the other. */
function blockMaterial(atlas, tileCfg, uni) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign({
      uPlate: { value: atlas.tex },
      uTileSz: { value: new THREE.Vector2(tileCfg.tw / atlas.W, tileCfg.th / atlas.H) },
      uTilePad: { value: new THREE.Vector2(0.75 / atlas.W, 0.75 / atlas.H) },
    }, uni),
    vertexShader: `
      attribute vec3 aCol; attribute float aAlpha; attribute vec2 aTile;
      varying vec3 vC, vLocal, vScale, vAx, vAy, vAz, vView;
      varying float vDepth, vA;
      varying vec2 vUv, vTile;
      void main(){
        vC = aCol; vA = aAlpha; vLocal = position; vUv = uv; vTile = aTile;
        vec3 sc = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz),
                       length(instanceMatrix[2].xyz));
        vScale = sc;
        mat3 im = mat3(instanceMatrix[0].xyz / max(sc.x, 1e-4),
                       instanceMatrix[1].xyz / max(sc.y, 1e-4),
                       instanceMatrix[2].xyz / max(sc.z, 1e-4));
        mat3 nm = mat3(modelMatrix) * im;
        vAx = nm[0]; vAy = nm[1]; vAz = nm[2];
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vView = cameraPosition - wp.xyz;
        vec4 mv = viewMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + FOG_GLSL + `
      uniform vec3 uFog, uLight, uBody, uSpec; uniform float uFogD, uAmb;
      uniform sampler2D uPlate; uniform vec2 uTileSz, uTilePad;
      varying vec3 vC, vLocal, vScale, vAx, vAy, vAz, vView;
      varying float vDepth, vA;
      varying vec2 vUv, vTile;
      void main(){
        vec3 aL = abs(vLocal);
        vec3 an = step(0.49999, aL);
        vec3 fn = normalize(an * sign(vLocal) + vec3(0.0, 0.0, 1e-5));

        /* the chamfer, a fixed width in world units */
        vec3 bw = min(vec3(0.075) / max(vScale, vec3(0.04)), vec3(0.40));
        vec3 e = (1.0 - an) * smoothstep(vec3(0.5) - bw, vec3(0.5), aL) * sign(vLocal);
        float bev = clamp(length(e), 0.0, 1.0);
        vec3 nO = normalize(fn + e * 1.35);

        /* the grade name, cut into the face of its own head */
        float face = step(0.9, fn.z) * (1.0 - smoothstep(0.20, 0.80, bev));
        vec2 tuv = vTile + uTilePad + vUv * (uTileSz - 2.0*uTilePad);
        vec4 t = texture2D(uPlate, tuv);
        float ink = t.a * face;
        vec2 dp = uTileSz * 0.0042;
        float gx = texture2D(uPlate, tuv + vec2(dp.x, 0.0)).a
                 - texture2D(uPlate, tuv - vec2(dp.x, 0.0)).a;
        float gy = texture2D(uPlate, tuv + vec2(0.0, dp.y)).a
                 - texture2D(uPlate, tuv - vec2(0.0, dp.y)).a;
        nO = normalize(nO + vec3(gx, -gy, 0.0) * 2.1 * face);

        vec3 N = normalize(vAx * nO.x + vAy * nO.y + vAz * nO.z);
        vec3 L = normalize(uLight);
        vec3 V = normalize(vView);
        vec3 H = normalize(L + V);
        float nd = max(dot(N, L), 0.0);
        float nh = max(dot(N, H), 0.0);

        /* brass, drawn along the length of the block */
        float brush = vnoise(vec2(vLocal.x * 190.0, vLocal.y * 9.0));
        float mill = vnoise(vLocal.xy * 11.0) * (1.0 - smoothstep(10.0, 30.0, vDepth));
        vec3 base = mix(uBody, vC, step(vLocal.y, -0.44));
        base *= 0.90 + 0.13 * brush + 0.06 * mill;
        vec3 col = base * (uAmb + (1.0 - uAmb) * (0.22 + 0.78 * nd));
        col += uSpec * pow(nh, 30.0) * (0.40 + 0.60 * brush);
        /* the specular line the chamfer carries along every edge */
        col += uSpec * smoothstep(0.42, 1.0, bev) * pow(nh, 6.0) * 0.50;
        /* the groove sits below the face, so it loses the key and keeps its ink */
        col *= 1.0 - 0.60 * ink;
        col = mix(col, t.rgb * 0.66, ink * 0.40);

        col = applyFog(col, vDepth, uFog, uFogD);
        /* The rack arrives out of the haze and goes back into it: the colour
           reaches the fog BEFORE the dither opens the block up, so the fade
           never shows as speckle on the brass. */
        col = mix(uFog, col, smoothstep(0.32, 1.0, vA));
        float d = smoothstep(0.0, 0.42, vA);
        if (d < 0.996) { if (d < h21(gl_FragCoord.xy)) discard; }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/* the eight stamp faces */
function buildStampAtlas(cfg) {
  const W = cfg.cols * cfg.tw, H = cfg.rows * cfg.th;
  const cv = mkCanvas(W, H);
  const g = cv.getContext('2d');
  const k = cfg.tw / 512;
  g.clearRect(0, 0, W, H);
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  for (let i = 0; i < GORDER.length; i++) {
    const c = i % cfg.cols, r = Math.floor(i / cfg.cols);
    const x0 = c * cfg.tw, y0 = r * cfg.th;
    const words = GORDER[i].split('_');
    const tint = mixHex(GRADE_COL[GORDER[i]], 0xf4ecd8, 0.52);
    g.fillStyle = css(tint);
    let size = Math.round(46 * k);
    const fit = (txt) => {
      let sz = size;
      g.font = '500 ' + sz + 'px ' + MONO;
      if ('letterSpacing' in g) g.letterSpacing = Math.round(6 * k) + 'px';
      while (g.measureText(txt).width > cfg.tw * 0.80 && sz > 8) {
        sz -= 2;
        g.font = '500 ' + sz + 'px ' + MONO;
      }
      return sz;
    };
    if (words.length === 1) {
      fit(words[0].toUpperCase());
      g.fillText(words[0].toUpperCase(), x0 + cfg.tw / 2, y0 + cfg.th * 0.52);
    } else {
      size = Math.round(38 * k);
      fit(words[0].toUpperCase());
      g.fillText(words[0].toUpperCase(), x0 + cfg.tw / 2, y0 + cfg.th * 0.36);
      fit(words[1].toUpperCase());
      g.fillText(words[1].toUpperCase(), x0 + cfg.tw / 2, y0 + cfg.th * 0.66);
    }
    if ('letterSpacing' in g) g.letterSpacing = '0px';
    g.fillStyle = css(GRADE_COL[GORDER[i]]);
    g.fillRect(x0 + Math.round(cfg.tw * 0.11), y0 + Math.round(cfg.th * 0.845),
      Math.round(cfg.tw * 0.78), Math.round(9 * k));
  }
  return { canvas: cv, tex: mkTexture(cv, false), W, H, cfg };
}

function cardMaterial(atlas, tileCfg, uni) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: Object.assign({
      uAtlas: { value: atlas.tex },
      uTileSz: { value: new THREE.Vector2(tileCfg.tw / atlas.W, tileCfg.th / atlas.H) },
      uTilePad: { value: new THREE.Vector2(0.75 / atlas.W, 0.75 / atlas.H) },
    }, uni),
    vertexShader: `
      attribute vec2 aTile; attribute vec4 aState;
      varying vec2 vUv, vTile; varying float vDepth; varying vec4 vState; varying vec3 vN, vView;
      void main(){
        vUv = uv; vTile = aTile; vState = aState;
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * (mat3(instanceMatrix) * normal));
        vView = normalize(cameraPosition - wp.xyz);
        vec4 mv = viewMatrix * wp;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_COMMON + FOG_GLSL + `
      uniform sampler2D uAtlas; uniform vec2 uTileSz, uTilePad;
      uniform vec3 uFog, uCardBg, uRule, uLight;
      uniform float uFogD, uAmb, uInk, uTileAspect;
      varying vec2 vUv, vTile; varying float vDepth; varying vec4 vState; varying vec3 vN, vView;
      void main(){
        vec2 u = vUv;
        vec3 col = uCardBg * (0.985 + 0.03*vnoise(u*vec2(160.0,110.0)));
        float border = 1.0 - smoothstep(0.0, 0.006, u.x) * smoothstep(0.0, 0.006, 1.0-u.x)
                           * smoothstep(0.0, 0.009, u.y) * smoothstep(0.0, 0.009, 1.0-u.y);
        col = mix(col, uRule, border);
        float k = max(vState.y, 0.001) / uTileAspect;
        vec2 cu = vec2(u.x, 1.0 - (1.0 - u.y) * k);
        vec4 t = texture2D(uAtlas, vTile + uTilePad + clamp(cu, 0.0, 1.0) * (uTileSz - 2.0*uTilePad));
        col = mix(col, t.rgb, t.a * uInk * vState.x * step(0.0, cu.y));
        col *= uAmb + (1.0 - uAmb) * (0.42 + 0.58 * max(dot(normalize(vN), normalize(uLight)), 0.0));
        col = applyFog(col, vDepth, uFog, uFogD);
        float a = vState.z;
        if (a < 0.996) { if (a < bayer4(gl_FragCoord.xy)) discard; }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/* ------------------------------------------------------- 4  the sequence */

const Z_PLANE = -6, Z_EXTRACT = -19, Z_RACK = -37, Z_LATTICE = -52,
      Z_NODES = -72, Z_CARDS = -84, CAM_END_Z = -80;

const RESTAMP_Y = [
  [0.400, 12.0], [0.452, 1.55], [0.474, 0.42], [0.496, -0.06], [0.520, -0.52],
  [0.548, -2.20], [0.590, -9.0], [0.640, -18.0],
];
const GORDER = ['replicated', 'meta_analysis', 'longitudinal', 'clinical',
                'cross_species', 'contested', 'theoretical', 'thin'];
const LANE_SUB = 3;   /* every lane is the same width, so the rank of eight
                         heads is a rank; the count shows in column length */

const COPY = {
  lede: [
    '148 peer-reviewed works went in.',
    'Cor traced every claim to its page,',
    'quoted it word for word,',
    'graded it,',
    'and tried to break it.',
    '635 findings came out.',
  ],
  plate: 'DOI or PMID, or the physical book. Full text, never an abstract.',
  stitched: 'A stitched quote is fabrication. Out.',
  downgrade: 'When in doubt, the grade goes down. Never up.',
  ledger: '8 challenges logged. 16 open gaps published next to the claims.',
  converge: '635 findings -> 15 mechanisms',
  skip: 'skip the sequence',
  /* COPY-STRINGS-v2. The counts are filled from evidence.json at boot, so the
     line on screen is whatever the archive holds on the day it is served. */
  unlit: 'not yet extracted',
  findings: '{on} of {all} findings are graded on evidence. {rep} of them replicated, the top grade.',
  findings2: 'on evidence: {grades}',
  mostRep: 'The works with the most replicated findings',
  tally: '{r} of {n} findings replicated',
};

/* ------------------------------------------------- 4a  the cut in p ------ */

/* THE CUT. p is the reader's scroll through the track. q is the clock the
   machinery runs on, and it is a pure function of p, so a backwards scrub is
   still exact. The keys below are the budget:

     THE SHELF      p 0.00 - 0.15   the 148 works, pillars first and nearest
     THE WRANGLE    p 0.15 - 0.35   one pass: gate, quotes, grades, challenges
     THE FINDINGS   p 0.35 - 0.80   the records themselves, q held at 0.700
     CONVERGENCE    p 0.80 - 0.90
     LANDING        p 0.90 - 1.00

   The wrangle keys are shaped, not evenly spaced: the beats worth watching
   (the DOI press, the tear, the double press, the challenges arriving) get
   more of p than the transits between them, which is how a pass that used to
   run 0.58 of the track fits in 0.20 without any object being cut. */
const QKEYS = [
  [0.000, 0.000], [0.150, 0.128],
  [0.168, 0.190], [0.186, 0.238], [0.208, 0.290], [0.228, 0.334],
  [0.250, 0.410], [0.268, 0.448], [0.294, 0.518], [0.318, 0.586],
  [0.334, 0.646], [0.350, 0.700],
  [0.800, 0.700], [0.900, 0.876], [1.000, 1.000],
];
const Q_HOLD = 0.700;

function qOf(p) {
  let i = 0;
  while (i < QKEYS.length - 2 && p > QKEYS[i + 1][0]) i++;
  const a = QKEYS[i], b = QKEYS[i + 1];
  const t = clamp01((p - a[0]) / (b[0] - a[0]));
  return a[1] + (b[1] - a[1]) * t;
}

/* The findings chapter runs on its own clock. fx is how much of the frame it
   owns: 0 through the wrangle, 1 across the middle, back to 0 as the lattice
   reassembles and the convergence takes over. Everything the old machinery
   would otherwise be doing at q = 0.700 is scaled by 1 - fx. */
function fxOf(p) {
  return smoother((p - 0.346) / 0.026) * (1 - smoother((p - 0.772) / 0.028));
}

/* THE MANIFEST ROLL. Every English work in the corpus, one at a time, the
   title very big and centred with one small line of data under it, running up
   the middle of the frame over the field of paper. 147 entries: the one
   non-English work stays in the corpus, on the shelf and in every count, and
   is left out of the roll only. The data is roll.json, built by
   scripts/this-is-why/gen-roll.py.

   THE BUDGET. Type that big makes a list about six times taller than the v1
   rows, so the roll is no longer squeezed into the front of the shelf: it has
   its own section AHEAD of the whole track. Every chapter keeps its exact
   absolute pixel length, the roll's length is added in front of them, and the
   p mapping shifts by rollFrac. Nothing after the roll changed.

   ROLL_RATIO is the pacing rule, not a length: the list moves this many
   pixels for every pixel of scroll. The length is derived at resize() from
   the real measured list, never guessed. ROLL_MAX_VH caps the whole track at
   2000vh: 8vh of chapters plus at most 12vh of roll. If the cap bites, the
   ratio rises and the roll runs faster; it never drops an entry.

   ROLL_GEOM is where the travel is complete, ROLL_FADE where the opacity
   starts down and ROLL_OUT where it has gone, all three as a fraction of the
   roll's OWN section. The window is already empty before the fade begins, so
   the fade itself is never seen. The headline block is held down until
   ROLL_OUT and only then comes back, so the two are never both on screen: no
   frame has ink in both boxes, which is what the clearance check reads.

   rollEase is the pacing, and it is the only place the pacing lives. It is
   flat now: ROLL_TAIL 0, one constant pixel rate from the first entry to the
   last, which is what ROLL_RATIO promises. v1 ran a 0.55 tail that lifted the
   last fifth by 46 percent, because 148 rows crammed into 0.158 of the track
   dragged at the end; with the roll on its own budget that reason is gone,
   and a rate that climbs makes a late entry pass half again faster than an
   early one. Raise ROLL_TAIL only with a reason, and never per entry: a long
   title takes longer to pass than a short one, and that is correct. The
   curve is the integral of the velocity profile 1 + s * smoothstep,
   normalised, so f(0) = 0, f(1) = 1 and the rate never steps. */
const ROLL_RATIO = 3.5, ROLL_MAX_VH = 12, ROLL_TAIL = 0;
const ROLL_GEOM = 0.978, ROLL_FADE = 0.982, ROLL_OUT = 0.990;

function rollEase(t) {
  if (!ROLL_TAIL) return clamp01(t);
  const u = clamp01((t - 0.78) / 0.22);
  return (t + 0.22 * ROLL_TAIL * (u * u * u - u * u * u * u * 0.5))
       / (1 + 0.11 * ROLL_TAIL);
}

/* THE FIT. Every title is ONE line, and the line runs the width of the roll
   window, which is the stage less 3vw on each side. The size is fitted per
   title so the line lands on that width: measured at one reference size and
   scaled, never guessed. Both ends of the clamp are anchored at the two
   stages the brief names - 30px and 56px at a 1440 stage, 17px and 30px at
   390 - and run straight between them, so there is no step at a breakpoint
   and no second set of numbers in the narrow profile.

   The meta line is fitted the same way inside a much tighter range. The brief
   asked for a fixed meta size with the author cut doing all the work; at 390
   that cannot hold the year and the publication of the longest rows at any
   readable size, and it took the publication off a third of the list. Letting
   the size breathe about two pixels keeps the publication whole on nearly all
   of it, and the variation is invisible in a dim mono line.

   Width scales linearly with the size because every letter-spacing here is in
   em, so ONE measurement per string is enough for any size. FIT_SAFE is the
   margin that absorbs the last fraction of a pixel of hinting difference
   between the reference size and the fitted one.

   FIT_MARK is the only new string the roll prints. It is the literal
   parentheses, not a horizontal-ellipsis character, and it is always preceded
   by a space. */
const FIT_REF = 100;
const FIT_MARK = ' (...)';
const FIT_SAFE = 0.997;
const FIT_TLH = 1.12, FIT_MLH = 1.5;

/* The cadence. Every entry is the same height, which is what makes the roll
   read as a steady beat now that the blocks are two lines. The height is the
   one a title at the CAP needs plus the padding below, and a smaller title
   spends the difference on its own padding rather than on the space between
   its two lines: the pair stays tight and the air goes between entries, where
   it belongs. fitPad is that padding at the cap, grown from the v2 22px
   because two-line blocks in the same window would otherwise read as a list.
   Anchored the same way as the type: 34px at a 390 stage, 44px at 1440. */
function fitPad(vw) { return Math.round(clamp(34 + ((vw - 390) / 1050) * 10, 30, 52)); }

function fitRange(vw) {
  const t = (vw - 390) / 1050;
  return [clamp(17 + t * 13, 15, 34), clamp(30 + t * 26, 26, 62)];
}
function fitMetaRange(vw) {
  const t = (vw - 390) / 1050;
  return [clamp(8 + t * 1.6, 7.6, 11), clamp(10.5 + t * 2, 10, 14)];
}

/* a prefix stops at a word, and a comma or a colon left hanging at the end of
   it goes with the words it belonged to. */
const fitTrim = (s) => s.replace(/[\s,;:.]+$/, '');

/* the title's cut candidates, the most words first. The mark is measured with
   the words, so what is picked is what is printed. */
function fitTitleCuts(t) {
  const w = t.split(' '), out = [];
  for (let k = w.length - 1; k >= 1; k--) {
    const p = fitTrim(w.slice(0, k).join(' '));
    if (p) out.push(p + FIT_MARK);
  }
  return out;
}

/* the meta line, and its cut candidates. The authors go first, at the
   separator the row actually uses: 11 rows separate authors with a semicolon
   and carry commas INSIDE the names, so splitting those on a comma would cut
   a person in half. The year is never cut. The publication is only cut when
   one author, the year and the publication together still do not fit, which
   at 390 is the only way to keep the year and the publication on the line at
   all; at 1440 it never happens. */
const fitMetaTail = (r) => ' - ' + r.y + (r.p ? ' - ' + r.p : '');
const fitMetaFull = (r) => r.a + fitMetaTail(r);
function fitMetaCuts(r) {
  const tail = fitMetaTail(r);
  const sep = r.a.indexOf(';') >= 0 ? ';' : ',';
  const au = r.a.split(sep).map((x) => x.trim()).filter(Boolean);
  const out = [];
  for (let k = au.length - 1; k >= 1; k--) out.push(au.slice(0, k).join(sep + ' ') + FIT_MARK + tail);
  const one = au[0] + (au.length > 1 ? FIT_MARK : '');
  if (r.p) {
    const pw = r.p.split(' ');
    for (let k = pw.length - 1; k >= 1; k--) {
      const p = fitTrim(pw.slice(0, k).join(' '));
      if (p) out.push(one + ' - ' + r.y + ' - ' + p + FIT_MARK);
    }
  }
  return out;
}

/* the five grades that count as evidence, in order, and where each band sits
   in the findings chapter. Filled at boot from evidence.json. */
const REC_SPAN = [0.366, 0.706];

class Sequence {
  constructor(root, data, ev, prof, theme) {
    this.root = root;
    this.data = data;
    this.ev = ev;
    this.prof = prof;
    this.theme = theme;
    this.p = 0;
    this.pv = 0;
    this.pRaw = 0;
    this.rollA = 0;
    this.rollLen = 0;
    this.rollFrac = 0;
    this.target = 0;
    this.vh = window.innerHeight;
    this.vw = document.documentElement.clientWidth;
    this.cardRects = [];
    this.rectsDirty = true;
    this.scratch = {
      v: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(),
      s: new THREE.Vector3(1, 1, 1), m: new THREE.Matrix4(), pv: new THREE.Vector3(),
    };
  }

  /* ---------------------------------------------------- layout, once ----- */
  layout() {
    this.narrow = !!this.prof.small;
    const d = this.data;
    const works = d.works, finds = d.findings;
    this.N = works.length + 1;                 /* the illustrative sheet is last */
    this.M = Math.min(finds.length, this.prof.slipCount);

    /* The field. The 60 pillar works lie in the near rows, so the camera opens
       on Darwin, Tinbergen, Bowlby, Harlow, Hamilton, Trivers, Panksepp and
       Sapolsky at reading distance; the 63 key works are behind them and the
       25 supporting works at the back. Inside a band the order is the corpus
       order, which is by year. */
    const IMPRANK = { p: 0, k: 1, u: 2 };
    const rank = (i) => (IMPRANK[works[i].k] === undefined ? 2 : IMPRANK[works[i].k]);
    const field = works.map((w, i) => i);
    field.sort((a, b) => rank(a) - rank(b) || a - b);
    this.fieldSlot = new Int32Array(works.length);
    for (let s = 0; s < field.length; s++) this.fieldSlot[field[s]] = s;

    /* a work with no finding extracted from it yet stays unlit and says so */
    this.shUnlit = new Uint8Array(this.N);
    this.unlitList = [];
    const ev = this.ev;
    if (ev) {
      const hasFind = new Set();
      for (const key in ev.findings) hasFind.add(ev.findings[key].work);
      for (let i = 0; i < works.length; i++) {
        if (!hasFind.has(works[i].i)) { this.shUnlit[i] = 1; this.unlitList.push(i); }
      }
    }

    /* field of sheets: 14 across, rows back, jittered */
    const cols = 14, cellX = 1.26, cellZ = 1.74;
    this.shHome = new Float32Array(this.N * 3);
    this.shRot = new Float32Array(this.N * 3);
    this.shSeed = new Float32Array(this.N);
    this.shAccent = new Float32Array(this.N);
    this.shRank = new Int32Array(this.N);
    this.shU = new Float32Array(this.N);
    this.shPos = new Float32Array(this.N * 3);
    const order = [];
    for (let i = 0; i < works.length; i++) {
      const slot = this.fieldSlot[i];
      const c = slot % cols, r = Math.floor(slot / cols);
      const h1 = hash1(slot + 1), h2 = hash2(slot + 1), h3 = hash3(slot + 1);
      this.shHome[i * 3] = (c - (cols - 1) / 2) * cellX + (h1 - 0.5) * 0.52;
      this.shHome[i * 3 + 1] = 0.062 + (slot % 9) * 0.0042;
      this.shHome[i * 3 + 2] = 25.9 - r * cellZ + (h2 - 0.5) * 0.62;
      this.shRot[i * 3] = -Math.PI / 2;
      this.shRot[i * 3 + 1] = 0;
      this.shRot[i * 3 + 2] = (h3 - 0.5) * 0.52;
      this.shSeed[i] = h1 * 7.3 + h2 * 2.1;
      this.shAccent[i] = this.shUnlit[i] ? 4
        : works[i].k === 'p' ? 2 : works[i].k === 'k' ? 1 : 0;
      /* the wave snakes forward row by row, nearest row first */
      const cc = slot % cols;
      order.push([r * cols + (r % 2 ? cols - 1 - cc : cc), i]);
    }
    order.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < order.length; k++) {
      const i = order[k][1];
      this.shRank[i] = k;
      this.shU[i] = k / Math.max(1, order.length - 1);
    }
    /* the illustrative sheet: it never lies in the field, it arrives at the plane */
    const gi = works.length;
    this.shHome[gi * 3] = -2.6; this.shHome[gi * 3 + 1] = 2.3; this.shHome[gi * 3 + 2] = 6.0;
    this.shRot[gi * 3] = 0; this.shRot[gi * 3 + 1] = 0; this.shRot[gi * 3 + 2] = 0.06;
    this.shSeed[gi] = 4.2; this.shAccent[gi] = 3; this.shRank[gi] = -1; this.shU[gi] = 0.5;

    /* One sheet is held in front of the camera while its identifier is pressed
       in, so the reader can read a real DOI going into the record. It is a real
       work, chosen for carrying a DOI and for arriving at the plane late enough
       that the press lands while the camera is on it. */
    this.witness = -1;
    for (let i = 0; i < works.length; i++) {
      const u = this.shU[i];
      if (u > 0.17 && u < 0.38 && !this.shUnlit[i] && /^DOI /.test(works[i].d)) {
        this.witness = i; break;
      }
    }
    if (this.witness < 0) {
      for (let i = 0; i < works.length; i++) if (/^DOI /.test(works[i].d)) { this.witness = i; break; }
    }

    /* index of each work id, so a finding can find its sheet */
    const wIndex = new Map();
    for (let i = 0; i < works.length; i++) wIndex.set(works[i].i, i);
    this.wIndex = wIndex;

    /* the eight grading lanes, width by sub-column count, centred on zero */
    const SUBW = 0.80, GAPW = 0.98;
    const laneW = LANE_SUB * SUBW;
    const total = GORDER.length * laneW + GAPW * (GORDER.length - 1);
    this.lanes = {};
    let x = -total / 2;
    for (const g of GORDER) {
      this.lanes[g] = { x0: x, sub: LANE_SUB, w: laneW, cx: x + laneW / 2, count: 0, rows: 1 };
      x += laneW + GAPW;
    }
    this.laneW = laneW;
    for (let j = 0; j < this.M; j++) { const g = finds[j].g; if (this.lanes[g]) this.lanes[g].count++; }
    /* Every lane runs the same length at the same speed. What differs is how
       densely it is filled, so the column itself reports the count: theoretical
       is a solid stream, thin is a trickle. */
    this.rackTop = 8.5;
    this.rackTravel = 52.0;
    for (const g of GORDER) {
      const L = this.lanes[g];
      L.rows = Math.max(1, Math.ceil(L.count / L.sub));
      L.spacing = clamp(34.0 / L.rows, 0.30, 3.4);
    }

    /* mechanism nodes: a constellation, golden angle, gently varied in depth */
    const mechs = d.mechanisms;
    this.nodePos = new Float32Array(mechs.length * 3);
    this.nodeIndex = new Map();
    for (let k = 0; k < mechs.length; k++) {
      const a = k * 2.399963, r = 5.4 * Math.sqrt((k + 0.55) / mechs.length);
      this.nodePos[k * 3] = Math.cos(a) * r * (this.narrow ? 0.62 : 1.62);
      this.nodePos[k * 3 + 1] = Math.sin(a) * r * (this.narrow ? 1.16 : 0.94);
      this.nodePos[k * 3 + 2] = Z_NODES + (hash1(k + 21) - 0.5) * 5.5;
      this.nodeIndex.set(mechs[k].c, k);
    }

    /* per finding: lane cell, lattice cell, flock point, node, seed */
    const M = this.M;
    this.slWork = new Int32Array(M);
    this.slGrade = new Int32Array(M);
    this.slSeed = new Float32Array(M);
    this.slLaneX = new Float32Array(M);
    this.slRow = new Float32Array(M);
    this.slOrder = new Float32Array(M);
    this.slLat = new Float32Array(M * 3);
    this.slFlock = new Float32Array(M * 3);
    this.slNode = new Int32Array(M);
    this.slNodeOff = new Float32Array(M * 3);
    this.slPos = new Float32Array(M * 3);
    this.slHero = new Int32Array(M).fill(-1);

    const laneFill = {};
    for (const g of GORDER) laneFill[g] = 0;
    const latCols = this.narrow ? 13 : 27, latRows = Math.ceil(M / latCols);
    for (let j = 0; j < M; j++) {
      const f = finds[j];
      const wi = wIndex.has(f.w) ? wIndex.get(f.w) : 0;
      this.slWork[j] = wi;
      this.slGrade[j] = Math.max(0, GORDER.indexOf(f.g));
      this.slSeed[j] = hash1(j + 101) * 9.1 + hash2(j + 7) * 3.3;
      const L = this.lanes[f.g] || this.lanes.theoretical;
      const n = laneFill[f.g]++;
      const sub = n % L.sub, row = Math.floor(n / L.sub);
      this.slLaneX[j] = L.x0 + (sub + 0.5) * SUBW + (hash3(j) - 0.5) * 0.10;
      this.slRow[j] = row * L.spacing;
      this.slOrder[j] = row / Math.max(1, L.rows - 1);
      /* lattice: a wide wall, bowed slightly toward the reader at its edges */
      const lc = j % latCols, lr = Math.floor(j / latCols);
      const lx = (lc - (latCols - 1) / 2) * (this.narrow ? 0.90 : 0.94)
               + (hash1(j + 3) - 0.5) * 0.10;
      const ly = ((latRows - 1) / 2 - lr) * 0.545 + 0.5 + (hash2(j + 5) - 0.5) * 0.07;
      this.slLat[j * 3] = lx;
      this.slLat[j * 3 + 1] = ly;
      this.slLat[j * 3 + 2] = Z_LATTICE + (lx * lx) / 58 + (hash3(j + 9) - 0.5) * 0.5;
      /* flock: a loose swarm just past the extraction bar */
      const fa = hash1(j + 31) * 6.2831, fr = 1.15 + hash2(j + 31) * 3.45;
      this.slFlock[j * 3] = Math.cos(fa) * fr * 1.62;
      this.slFlock[j * 3 + 1] = 2.3 + Math.sin(fa) * fr * 1.48;
      this.slFlock[j * 3 + 2] = Z_EXTRACT - 1.6 - hash3(j + 31) * 5.6;
      /* the node this finding's evidence runs to, and where it sits around it */
      const codes = f.m || [];
      const ni = codes.length && this.nodeIndex.has(codes[0][0]) ? this.nodeIndex.get(codes[0][0]) : -1;
      this.slNode[j] = ni;
      const na = hash1(j + 61) * 6.2831, nr = 0.35 + hash2(j + 61) * 1.5;
      this.slNodeOff[j * 3] = Math.cos(na) * nr * 1.5;
      this.slNodeOff[j * 3 + 1] = Math.sin(na) * nr;
      this.slNodeOff[j * 3 + 2] = (hash3(j + 61) - 0.5) * 2.4;
    }
    this.latRows = latRows; this.latCols = latCols;

    this.layoutFindings();

    /* evidence links: every (finding, mechanism) junction that has a body */
    const links = [];
    for (let j = 0; j < M; j++) {
      const codes = finds[j].m || [];
      for (let a = 0; a < codes.length; a++) {
        const ni = this.nodeIndex.get(codes[a][0]);
        if (ni === undefined) continue;
        links.push(j, ni, codes[a][1]);
      }
    }
    this.links = new Int32Array(links);
    this.linkCount = links.length / 3;
    /* how much evidence each mechanism is owed, so a node can brighten by the
       share of it that has landed rather than by the clock */
    this.nodeLinks = new Int32Array(mechs.length);
    this.nodeArrived = new Float32Array(mechs.length);
    for (let l = 0; l < this.linkCount; l++) this.nodeLinks[this.links[l * 3 + 1]]++;

    /* the eight close-up findings, one per grade, and the eight challenges */
    this.heroPicks = [];
    const byGrade = new Map();
    for (let j = 0; j < M; j++) {
      const f = finds[j];
      if (!f.v || f.q.length < 60) continue;
      if (!byGrade.has(f.g) && d.heroes.indexOf(f.i) >= 0) byGrade.set(f.g, j);
    }
    for (let j = 0; j < M && byGrade.size < GORDER.length; j++) {
      const f = finds[j];
      if (!f.v || f.q.length < 60) continue;
      if (!byGrade.has(f.g)) byGrade.set(f.g, j);
    }
    for (const g of GORDER) {
      const j = byGrade.has(g) ? byGrade.get(g) : 0;
      this.heroPicks.push(j);
      this.slHero[j] = this.heroPicks.length - 1;
    }
    this.restampHero = Math.max(0, GORDER.indexOf('contested'));
    /* put each close-up finding at the head of its own lane, swapping cells with
       whatever sat there, so it crosses the press line under the camera */
    const headOf = {};
    for (let j = 0; j < M; j++) {
      const g = finds[j].g;
      if (headOf[g] === undefined && this.slRow[j] === 0) headOf[g] = j;
    }
    for (const j of this.heroPicks) {
      const g = finds[j].g;
      const k = headOf[g];
      if (k === undefined || k === j) continue;
      const rx = this.slLaneX[j], rr = this.slRow[j], ro = this.slOrder[j];
      this.slLaneX[j] = this.slLaneX[k]; this.slRow[j] = this.slRow[k]; this.slOrder[j] = this.slOrder[k];
      this.slLaneX[k] = rx; this.slRow[k] = rr; this.slOrder[k] = ro;
      headOf[g] = j;
    }
    /* each close-up crosses the press line at its own moment, and the one the
       camera settles on crosses while the caption is up */
    this.restampX = this.slLaneX[this.heroPicks[this.restampHero]];
    for (let h = 0; h < this.heroPicks.length; h++) {
      const j = this.heroPicks[h];
      const gpWant = h === this.restampHero ? 0.400 : 0.20 + h * 0.068;
      this.slRow[j] = gpWant * this.rackTravel - this.rackTop;
    }
  }

  /* ------------------------------------------------- the findings chapter */
  /* Everything the middle of the piece needs, worked out once: which of the
     635 findings are graded on evidence, when each band lands, where each
     record sits in the wall, which twelve come to the lens, which eight works
     carry the most replicated findings, and which papers tuck under which
     answer at the end. All of it read off evidence.json. */
  layoutFindings() {
    const ev = this.ev, M = this.M, finds = this.data.findings;
    this.slEv = new Float32Array(M * 3);
    this.slEvStage = new Float32Array(M * 3);
    this.slEvT = new Float32Array(M);
    this.slEvOn = new Uint8Array(M);
    this.slRec = new Int32Array(M).fill(-1);
    this.recPick = [];
    this.mrList = [];
    this.tuckList = [];
    this.bands = [];
    if (!ev) return;

    /* the real count behind each grade, and the share of the chapter it owns */
    const gc = {};
    for (const key in ev.findings) {
      const g = ev.findings[key].grade;
      gc[g] = (gc[g] || 0) + 1;
    }
    this.gradeCount = gc;
    const ON = ev.on_evidence;
    let onTotal = 0;
    for (const g of ON) onTotal += gc[g] || 0;
    this.onTotal = onTotal;
    /* the depth each band lies at: replicated nearest, then back by grade */
    const ZB = [[-48, -60], [-60, -64], [-64, -69], [-69, -78], [-78, -86]];
    let acc = 0;
    for (let b = 0; b < ON.length; b++) {
      const n = gc[ON[b]] || 0;
      const p0 = REC_SPAN[0] + (acc / onTotal) * (REC_SPAN[1] - REC_SPAN[0]);
      acc += n;
      const p1 = REC_SPAN[0] + (acc / onTotal) * (REC_SPAN[1] - REC_SPAN[0]);
      this.bands.push({ k: ON[b], label: ev.grade_label[ON[b]] || ON[b], n, p0, p1,
                        z0: ZB[b][0], z1: ZB[b][1] });
    }

    /* every slip that carries a grade on evidence takes a place in the wall */
    const seen = new Array(ON.length).fill(0);
    for (let j = 0; j < M; j++) {
      const gi = this.slGrade[j];
      const on = gi < ON.length;
      this.slEvOn[j] = on ? 1 : 0;
      const h1 = hash1(j + 401), h2 = hash2(j + 401), h3 = hash3(j + 401);
      let z, t;
      if (on) {
        const B = this.bands[gi];
        const rank = seen[gi]++;
        const f = B.n > 1 ? clamp01(rank / (B.n - 1)) : 0.5;
        z = lerp(B.z0, B.z1, hash1(j + 91));
        t = lerp(B.p0, B.p1 - 0.012, f);
      } else {
        z = -88 - h3 * 28;
        t = REC_SPAN[0] - 0.004;
      }
      /* the slab keeps the same share of the frame at every depth, so the
         field reads as one body rather than a cone */
      const d = Math.max(6, -33 - z);
      const wide = on ? 1 : 1.75;
      const hw = (0.34 * d + 1.0) * wide, hh = (0.240 * d + 0.6) * wide;
      const x = (h1 - 0.5) * 2 * hw, y = (h2 - 0.5) * 2 * hh - 0.15;
      this.slEv[j * 3] = x; this.slEv[j * 3 + 1] = y; this.slEv[j * 3 + 2] = z;
      /* it glides in from further back, so an arrival is a move, not a pop */
      this.slEvStage[j * 3] = x * 1.28;
      this.slEvStage[j * 3 + 1] = y * 1.22;
      this.slEvStage[j * 3 + 2] = z - 21.0;
      this.slEvT[j] = t;
    }

    /* the twelve records that come to the lens: grade order, best-founded
       work first, one per work, a verbatim quote wherever the archive has one */
    const IMP = { pillar: 0, key: 1, supporting: 2 };
    const need = this.prof.recCount >= 12
      ? [5, 1, 1, 3, 2]
      : [2, 1, 1, 1, 1];
    const used = new Set();
    const byId = new Map();
    for (let j = 0; j < M; j++) byId.set(finds[j].i, j);
    for (let b = 0; b < ON.length; b++) {
      const want = need[b] || 0;
      if (!want) continue;
      const cand = [];
      for (const key in ev.findings) {
        const f = ev.findings[key];
        if (f.grade !== ON[b]) continue;
        const w = ev.works[String(f.work)];
        if (!w) continue;
        cand.push([f, w]);
      }
      cand.sort((A, B) => {
        const ia = IMP[A[1].importance] === undefined ? 9 : IMP[A[1].importance];
        const ib = IMP[B[1].importance] === undefined ? 9 : IMP[B[1].importance];
        if (ia !== ib) return ia - ib;
        const qa = A[0].is_quote ? 0 : 1, qb = B[0].is_quote ? 0 : 1;
        if (qa !== qb) return qa - qb;
        const ba = (A[0].quote.length >= 90 && A[0].quote.length <= 200) ? 0 : 1;
        const bb = (B[0].quote.length >= 90 && B[0].quote.length <= 200) ? 0 : 1;
        if (ba !== bb) return ba - bb;
        if (A[0].quote.length !== B[0].quote.length) return B[0].quote.length - A[0].quote.length;
        return A[0].id - B[0].id;
      });
      let got = 0;
      for (const [f, w] of cand) {
        if (used.has(f.work)) continue;
        used.add(f.work);
        const wi = this.wIndex.has(f.work) ? this.wIndex.get(f.work) : -1;
        this.recPick.push({ f, w, wi, label: ev.grade_label[f.grade] || f.grade });
        if (byId.has(f.id)) this.slRec[byId.get(f.id)] = this.recPick.length - 1;
        if (++got === want) break;
      }
    }
    const R = this.recPick.length;
    this.recStride = R > 1 ? (REC_SPAN[1] - REC_SPAN[0] - 0.056) / (R - 1) : 0.05;
    for (let h = 0; h < R; h++) {
      this.recPick[h].t0 = REC_SPAN[0] + h * this.recStride;
      this.recPick[h].side = (h % 2) ? 1 : -1;
    }

    /* the eight works that carry the most replicated findings */
    for (const m of (ev.most_replicated || []).slice(0, 8)) {
      const wi = this.wIndex.has(m.work) ? this.wIndex.get(m.work) : -1;
      if (wi < 0) continue;
      this.mrList.push({ wi, r: m.replicated, n: m.findings });
    }

    /* the three papers that tuck under each answer as it lands */
    const cards = ev.cards || [];
    for (let i = 0; i < cards.length; i++) {
      const tw = (cards[i].top_works || []).slice(0, 3);
      for (let s = 0; s < tw.length; s++) {
        const wi = this.wIndex.has(tw[s]) ? this.wIndex.get(tw[s]) : -1;
        if (wi >= 0) this.tuckList.push({ card: i, wi, slot: s });
      }
    }
  }

  /* ---------------------------------------------------- the scene -------- */
  build(canvas, atlases) {
    const dark = this.theme === 'dark';
    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: false, stencil: false,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setPixelRatio(this.prof.dpr);
    renderer.autoClear = true;
    this.renderer = renderer;

    const T = dark
      ? { fog: 0x230a10, paper: 0xf0e5cb, ground: 0x160609, amb: 0.20, rim: 0.40,
          rimCol: [1.0, 0.86, 0.62], bg: 0x230a10, cardBg: 0x3a1218, rule: 0x7a4048,
          glow: [0.98, 0.88, 0.64], etch: [0.10, 0.03, 0.05], shadow: [0.02, 0.0, 0.01] }
      : { fog: 0xdccbA4, paper: 0xf8f4e9, ground: 0xd2c19c, amb: 0.50, rim: 0.07,
          rimCol: [1.0, 0.97, 0.90], bg: 0xdccbA4, cardBg: 0xddd0b0, rule: 0x3a1218,
          glow: [1.0, 0.98, 0.92], etch: [0.18, 0.14, 0.09], shadow: [0.20, 0.13, 0.07] };
    this.T = T;

    const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
    const C3 = (h) => new THREE.Vector3(...toHexTriplet(h));
    this.uni = {
      uFog: { value: C3(T.fog) },
      uFogD: { value: 0.00042 },
      uPaper: { value: C3(T.paper) },
      uLight: { value: new THREE.Vector3(-0.42, 0.74, 0.52).normalize() },
      uAmb: { value: T.amb },
      uRim: { value: T.rim },
      uRimCol: { value: V3(T.rimCol) },
      uInk: { value: 1.0 },
    };
    const U = this.uni;
    const share = () => ({
      uFog: U.uFog, uFogD: U.uFogD, uPaper: U.uPaper, uLight: U.uLight,
      uAmb: U.uAmb, uRim: U.uRim, uRimCol: U.uRimCol, uInk: U.uInk,
    });

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(T.bg);
    scene.fog = new THREE.FogExp2(T.fog, Math.sqrt(U.uFogD.value));
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.35, 220);

    const iAttr = (n, size, usage) => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size);
      if (usage) a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };

    /* ground and contact shadows -------------------------------------- */
    const groundUni = {
      uFog: U.uFog, uFogD: U.uFogD, uGround: { value: C3(T.ground) }, uFade: { value: 1 },
    };
    this.groundUni = groundUni;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 190, 1, 1), groundMaterial(groundUni));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 6);
    ground.frustumCulled = false;
    scene.add(ground);
    this.ground = ground;

    const shGeo = new THREE.PlaneGeometry(2.0, 2.5).rotateX(-Math.PI / 2);
    shGeo.setAttribute('aAlpha', iAttr(this.N, 1, true));
    this.shadowUni = { uCol: { value: V3(T.shadow) } };
    const shadows = new THREE.InstancedMesh(shGeo, shadowMaterial(this.shadowUni), this.N);
    shadows.frustumCulled = false;
    shadows.renderOrder = 1;
    scene.add(shadows);
    this.shadows = shadows;

    /* the 148 sheets plus the illustrative one ------------------------- */
    const sheetGeo = new THREE.PlaneGeometry(1, 1.35, 5, 7);
    sheetGeo.setAttribute('aTile', iAttr(this.N, 2));
    sheetGeo.setAttribute('aSeed', iAttr(this.N, 1));
    sheetGeo.setAttribute('aState', iAttr(this.N, 4, true));
    const A = atlases;
    const sheets = new THREE.InstancedMesh(sheetGeo, sheetMaterial(A.sheet, A.sheet.cfg, share()), this.N);
    sheets.frustumCulled = false;
    sheets.renderOrder = 2;
    scene.add(sheets);
    this.sheets = sheets;
    const st = sheetGeo.getAttribute('aTile'), ss = sheetGeo.getAttribute('aSeed');
    for (let i = 0; i < this.N; i++) {
      const uv = tileUV(i, A.sheet.cfg, A.sheet.W, A.sheet.H);
      st.setXY(i, uv[0], uv[1]);
      ss.setX(i, this.shSeed[i]);
    }
    st.needsUpdate = true; ss.needsUpdate = true;

    /* the entry plane -------------------------------------------------- */
    const plate = buildPlateTexture(COPY.plate, true);
    this.plateUni = {
      uGlow: { value: V3(T.glow) }, uEtch: { value: V3(T.etch) },
      uOpacity: { value: 0 }, uPlateY: { value: 0.4766 }, uPlateH: { value: 0.0469 },
      uPlateX: { value: 0.39 }, uPlateW: { value: 0.22 },
    };
    const planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(25, 11, 1, 1), plateMaterial(plate, this.plateUni));
    planeMesh.position.set(0, 3.40, Z_PLANE);
    planeMesh.frustumCulled = false;
    planeMesh.renderOrder = 6;
    scene.add(planeMesh);
    this.plane = planeMesh;

    /* the 635 slips ---------------------------------------------------- */
    const slipGeo = new THREE.PlaneGeometry(1.9, 0.326, 7, 2);
    slipGeo.setAttribute('aTile', iAttr(this.M, 2));
    slipGeo.setAttribute('aSeed', iAttr(this.M, 1));
    slipGeo.setAttribute('aState', iAttr(this.M, 4, true));
    slipGeo.setAttribute('aGrade', iAttr(this.M, 3));
    slipGeo.setAttribute('aFlag', iAttr(this.M, 2));
    const slips = new THREE.InstancedMesh(slipGeo, slipMaterial(A.slip, A.slip.cfg, share(), 0), this.M);
    slips.frustumCulled = false;
    slips.renderOrder = 3;
    scene.add(slips);
    this.slips = slips;
    const pt = slipGeo.getAttribute('aTile'), ps = slipGeo.getAttribute('aSeed'),
          pg = slipGeo.getAttribute('aGrade');
    for (let j = 0; j < this.M; j++) {
      const uv = tileUV(j, A.slip.cfg, A.slip.W, A.slip.H);
      pt.setXY(j, uv[0], uv[1]);
      ps.setX(j, this.slSeed[j]);
      const c = toHexTriplet(GRADE_COL[GORDER[this.slGrade[j]]]);
      pg.setXYZ(j, c[0], c[1], c[2]);
    }
    pt.needsUpdate = true; ps.needsUpdate = true; pg.needsUpdate = true;

    /* the close-ups: eight real findings, the stitched slip, eight challenges */
    this.HN = 17;
    const heroGeo = new THREE.PlaneGeometry(2.9, 0.634, 9, 3);
    heroGeo.setAttribute('aTile', iAttr(this.HN, 2));
    heroGeo.setAttribute('aSeed', iAttr(this.HN, 1));
    heroGeo.setAttribute('aState', iAttr(this.HN, 4, true));
    heroGeo.setAttribute('aGrade', iAttr(this.HN, 3));
    heroGeo.setAttribute('aFlag', iAttr(this.HN, 2));
    const heroes = new THREE.InstancedMesh(heroGeo, slipMaterial(A.hero, A.hero.cfg, share(), 0.775), this.HN);
    heroes.frustumCulled = false;
    heroes.renderOrder = 4;
    scene.add(heroes);
    this.heroes = heroes;
    const ht = heroGeo.getAttribute('aTile'), hs = heroGeo.getAttribute('aSeed'),
          hg = heroGeo.getAttribute('aGrade'), hf = heroGeo.getAttribute('aFlag');
    for (let i = 0; i < this.HN; i++) {
      const uv = tileUV(i, A.hero.cfg, A.hero.W, A.hero.H);
      ht.setXY(i, uv[0], uv[1]);
      hs.setX(i, hash1(i + 200) * 6.0);
      if (i < 8) {
        const c = toHexTriplet(GRADE_COL[GORDER[i]]);
        hg.setXYZ(i, c[0], c[1], c[2]);
        hf.setXY(i, 0, 0);
      } else if (i === 8) {
        hg.setXYZ(i, 0.55, 0.52, 0.47);
        hf.setXY(i, 1, 0);
      } else {
        const c = toHexTriplet(PAL.oxblood);
        hg.setXYZ(i, c[0], c[1], c[2]);
        hf.setXY(i, 0, 1);
      }
    }
    ht.needsUpdate = true; hs.needsUpdate = true; hg.needsUpdate = true; hf.needsUpdate = true;

    /* the records of the findings chapter, and the paper each one came off.
       The record is a slip, at a size where its tile lands about one texel to
       one pixel when it reaches the lens; the paper behind it is the same
       sheet mesh and the same atlas the shelf was built from. */
    this.RN = this.recPick.length;
    if (this.RN) {
      const recAsp = A.rec.cfg.tw / A.rec.cfg.th;
      const recGeo = new THREE.PlaneGeometry(3.6, 3.6 / recAsp, 9, 3);
      recGeo.setAttribute('aTile', iAttr(this.RN, 2));
      recGeo.setAttribute('aSeed', iAttr(this.RN, 1));
      recGeo.setAttribute('aState', iAttr(this.RN, 4, true));
      recGeo.setAttribute('aGrade', iAttr(this.RN, 3));
      recGeo.setAttribute('aFlag', iAttr(this.RN, 2));
      const recMat = slipMaterial(A.rec, A.rec.cfg, share(), 0);
      recMat.uniforms.uBarW.value = 0.019;
      const records = new THREE.InstancedMesh(recGeo, recMat, this.RN);
      records.frustumCulled = false;
      records.renderOrder = 5;
      scene.add(records);
      this.records = records;
      const rt2 = recGeo.getAttribute('aTile'), rs2 = recGeo.getAttribute('aSeed'),
            rg2 = recGeo.getAttribute('aGrade'), rf2 = recGeo.getAttribute('aFlag');
      for (let h = 0; h < this.RN; h++) {
        const uv = tileUV(h, A.rec.cfg, A.rec.W, A.rec.H);
        rt2.setXY(h, uv[0], uv[1]);
        rs2.setX(h, hash1(h + 311) * 6.0);
        const c = toHexTriplet(GRADE_COL[this.recPick[h].f.grade] || PAL.muted);
        rg2.setXYZ(h, c[0], c[1], c[2]);
        rf2.setXY(h, 0, 0);
      }
      rt2.needsUpdate = true; rs2.needsUpdate = true; rg2.needsUpdate = true; rf2.needsUpdate = true;
    }

    /* the papers that tuck under each answer at the landing */
    this.TN = this.tuckList.length;
    if (this.TN) {
      const tGeo = new THREE.PlaneGeometry(1, 1.35, 3, 4);
      tGeo.setAttribute('aTile', iAttr(this.TN, 2));
      tGeo.setAttribute('aSeed', iAttr(this.TN, 1));
      tGeo.setAttribute('aState', iAttr(this.TN, 4, true));
      const tuck = new THREE.InstancedMesh(tGeo, sheetMaterial(A.sheet, A.sheet.cfg, share()), this.TN);
      tuck.frustumCulled = false;
      tuck.renderOrder = 8;
      tuck.visible = false;
      scene.add(tuck);
      this.tuck = tuck;
      const tt = tGeo.getAttribute('aTile'), ts2 = tGeo.getAttribute('aSeed');
      for (let i = 0; i < this.TN; i++) {
        const uv = tileUV(this.tuckList[i].wi, A.sheet.cfg, A.sheet.W, A.sheet.H);
        tt.setXY(i, uv[0], uv[1]);
        ts2.setX(i, this.shSeed[this.tuckList[i].wi]);
      }
      tt.needsUpdate = true; ts2.needsUpdate = true;
    }

    /* ribbons: tethers, evidence threads, challenge threads ------------- */
    const mkRibbon = (count, thick, order, depthW) => {
      const g = new THREE.PlaneGeometry(1, 1, 1, 1);
      g.setAttribute('aA', iAttr(count, 3, true));
      g.setAttribute('aB', iAttr(count, 3, true));
      g.setAttribute('aCol', iAttr(count, 3, true));
      g.setAttribute('aState', iAttr(count, 2, true));
      const uni = { uRes: { value: new THREE.Vector2(1, 1) }, uThick: { value: thick } };
      const m = new THREE.InstancedMesh(g, ribbonMaterial(uni, depthW), count);
      m.frustumCulled = false;
      m.renderOrder = order;
      scene.add(m);
      return { mesh: m, uni, geo: g, count, base: thick };
    };
    this.tethers = mkRibbon(this.M, 1.15, 5, false);
    this.threads = mkRibbon(this.linkCount, 1.45, 5, true);
    this.redThreads = mkRibbon(8, 3.6, 7, true);

    /* the stamp heads -------------------------------------------------- */
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    blockGeo.setAttribute('aCol', iAttr(18, 3));
    blockGeo.setAttribute('aAlpha', iAttr(18, 1, true));
    blockGeo.setAttribute('aTile', iAttr(18, 2));
    this.blockUni = {
      uFog: U.uFog, uFogD: U.uFogD, uLight: U.uLight, uAmb: U.uAmb,
      uBody: { value: C3(dark ? 0x8a6f34 : 0x9c8040) },
      uSpec: { value: V3(dark ? [1.0, 0.88, 0.64] : [1.0, 0.96, 0.83]) },
    };
    const blocks = new THREE.InstancedMesh(blockGeo,
      blockMaterial(A.stamp, A.stamp.cfg, this.blockUni), 18);
    blocks.frustumCulled = false;
    blocks.renderOrder = 3;
    scene.add(blocks);
    this.blocks = blocks;
    const bc = blockGeo.getAttribute('aCol');
    for (let i = 0; i < 8; i++) {
      const c = toHexTriplet(GRADE_COL[GORDER[i]]);
      bc.setXYZ(i, c[0], c[1], c[2]);
    }
    const bodyC = toHexTriplet(dark ? 0x53421f : 0x5c4a24);
    bc.setXYZ(8, bodyC[0], bodyC[1], bodyC[2]);
    bc.setXYZ(9, bodyC[0], bodyC[1], bodyC[2]);
    for (let i = 10; i < 18; i++) bc.setXYZ(i, bodyC[0], bodyC[1], bodyC[2]);
    const bt = blockGeo.getAttribute('aTile');
    for (let i = 0; i < 18; i++) {
      const uv = tileUV(i < 8 ? i : 9, A.stamp.cfg, A.stamp.W, A.stamp.H);
      bt.setXY(i, uv[0], uv[1]);
    }
    bc.needsUpdate = true; bt.needsUpdate = true;

    /* The shadow each head throws on the press line as it comes down. It is
       what tells the reader the head is a solid thing arriving at a surface
       rather than a rectangle sliding on a layer of its own. */
    const psGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
    psGeo.setAttribute('aAlpha', iAttr(8, 1, true));
    const pshadows = new THREE.InstancedMesh(psGeo, shadowMaterial(this.shadowUni), 8);
    pshadows.frustumCulled = false;
    pshadows.renderOrder = 2;
    scene.add(pshadows);
    this.pressShadows = pshadows;

    /* the mechanism nodes ---------------------------------------------- */
    const nodeGeo = new THREE.PlaneGeometry(2, 2, 1, 1);
    const K = this.data.mechanisms.length;
    nodeGeo.setAttribute('aPos', iAttr(K, 3, true));
    nodeGeo.setAttribute('aCol', iAttr(K, 3));
    nodeGeo.setAttribute('aState', iAttr(K, 2, true));
    this.nodeUni = { uSize: { value: 0.90 } };
    const nodes = new THREE.InstancedMesh(nodeGeo, nodeMaterial(this.nodeUni), K);
    nodes.frustumCulled = false;
    nodes.renderOrder = 8;
    scene.add(nodes);
    this.nodes = nodes;
    const np = nodeGeo.getAttribute('aPos'), nc = nodeGeo.getAttribute('aCol');
    for (let k = 0; k < K; k++) {
      np.setXYZ(k, this.nodePos[k * 3], this.nodePos[k * 3 + 1], this.nodePos[k * 3 + 2]);
      const c = toHexTriplet(dark ? PAL.gold : PAL.teal);
      nc.setXYZ(k, c[0], c[1], c[2]);
    }
    np.needsUpdate = true; nc.needsUpdate = true;

    /* the 20 answers ---------------------------------------------------- */
    this.CN = atlases.cards ? atlases.cardList.length : 0;
    if (this.CN) {
      const cardGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
      cardGeo.setAttribute('aTile', iAttr(this.CN, 2));
      cardGeo.setAttribute('aState', iAttr(this.CN, 4, true));
      this.cardUni = {
        uFog: U.uFog, uFogD: U.uFogD, uLight: U.uLight, uAmb: U.uAmb, uInk: U.uInk,
        uCardBg: { value: C3(T.cardBg) }, uRule: { value: C3(T.rule) },
        uTileAspect: { value: A.cards.cfg.tw / A.cards.cfg.th },
      };
      const cards = new THREE.InstancedMesh(cardGeo, cardMaterial(A.cards, A.cards.cfg, this.cardUni), this.CN);
      cards.frustumCulled = false;
      cards.renderOrder = 9;
      scene.add(cards);
      this.cards = cards;
      const ct = cardGeo.getAttribute('aTile');
      for (let i = 0; i < this.CN; i++) {
        const uv = tileUV(i, A.cards.cfg, A.cards.W, A.cards.H);
        ct.setXY(i, uv[0], uv[1]);
      }
      ct.needsUpdate = true;
    }

    this.fogA = C3(T.fog).clone();
    this.fogB = C3(dark ? 0x2a0c11 : 0xece0c4);
    this.bgA = new THREE.Color(T.bg);
    this.bgB = new THREE.Color(dark ? 0x2a0c11 : 0xece0c4);
    this.buildPost();
    this.buildCamKeys();
  }

  /* ---------------------------------------------------- post ------------- */
  buildPost() {
    const depth = new THREE.DepthTexture(2, 2);
    depth.type = THREE.UnsignedIntType;
    depth.minFilter = THREE.NearestFilter;
    depth.magFilter = THREE.NearestFilter;
    this.rtScene = new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: true, stencilBuffer: false, depthTexture: depth,
      type: THREE.UnsignedByteType, colorSpace: THREE.NoColorSpace,
    });
    const half = () => new THREE.WebGLRenderTarget(2, 2, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: false, stencilBuffer: false,
      type: THREE.UnsignedByteType, colorSpace: THREE.NoColorSpace,
    });
    this.rtA = half();
    this.rtB = half();

    this.fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fsGeo = new THREE.PlaneGeometry(2, 2);
    const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

    this.blurMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uStep: { value: new THREE.Vector2() } },
      vertexShader: VS,
      fragmentShader: `
        uniform sampler2D tSrc; uniform vec2 uStep; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
          c += (texture2D(tSrc, vUv + uStep*1.3846153846).rgb
              + texture2D(tSrc, vUv - uStep*1.3846153846).rgb) * 0.3162162162;
          c += (texture2D(tSrc, vUv + uStep*3.2307692308).rgb
              + texture2D(tSrc, vUv - uStep*3.2307692308).rgb) * 0.0702702703;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });

    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        tSharp: { value: null }, tBlur: { value: null }, tDepth: { value: null },
        uRes: { value: new THREE.Vector2(1, 1) },
        uNear: { value: 0.35 }, uFar: { value: 220 },
        uFocus: { value: 8 }, uSharp: { value: 3 }, uSoft: { value: 20 },
        uGrain: { value: 0.030 }, uVig: { value: 0.30 }, uP: { value: 0 },
        uWarm: { value: new THREE.Vector3(1.0, 0.995, 0.982) },
        uLift: { value: 0.0 },
      },
      vertexShader: VS,
      fragmentShader: GLSL_COMMON + `
        uniform sampler2D tSharp, tBlur, tDepth;
        uniform vec2 uRes; uniform vec3 uWarm;
        uniform float uNear, uFar, uFocus, uSharp, uSoft, uGrain, uVig, uP, uLift;
        varying vec2 vUv;
        void main(){
          vec3 sharp = texture2D(tSharp, vUv).rgb;
          vec3 blur = texture2D(tBlur, vUv).rgb;
          float d = texture2D(tDepth, vUv).x;
          float ndc = d * 2.0 - 1.0;
          float lin = (2.0*uNear*uFar) / (uFar + uNear - ndc*(uFar - uNear));
          float coc = smoothstep(uSharp, uSoft, abs(lin - uFocus));
          vec3 col = mix(sharp, blur, coc);
          col *= uWarm;
          col += uLift * blur * 0.5;
          vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
          col *= 1.0 - uVig * dot(q, q) * 1.35;
          float g = h21(floor(vUv * uRes) * 0.613 + uP * 311.0) - 0.5;
          col += g * uGrain * (0.55 + 0.45 * (1.0 - clamp(dot(col, vec3(0.333)), 0.0, 1.0)));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.fsMesh = new THREE.Mesh(this.fsGeo, this.compMat);
    this.fsScene = new THREE.Scene();
    this.fsScene.add(this.fsMesh);
  }

  /* ---------------------------------------------------- camera ----------- */
  buildCamKeys() {
    const cx = this.restampX !== undefined ? this.restampX : this.lanes.contested.cx;
    const n = this.narrow;
    this.camKeys = [
      /* The shelf. The camera opens low over the near rows, which are the 60
         pillar works, and glides forward across them before it lifts: title
         and authors are at reading distance for the whole first pass. */
      { p: 0.000, e: [1.45, 1.88, 28.1], t: [0.35, 0.00, 23.6], f: 40 },
      { p: 0.032, e: [0.55, 2.24, 25.9], t: [-0.20, 0.00, 21.0], f: 40 },
      { p: 0.066, e: [-0.75, 3.05, 24.1], t: [0.10, 0.10, 16.8], f: 41 },
      { p: 0.098, e: [0.50, 3.90, 23.0], t: [0.00, 0.62, 13.0], f: 42 },
      { p: 0.128, e: [0.75, 4.30, 24.2], t: [0.00, 2.45, 11.5], f: 43 },
      { p: 0.168, e: [0.40, 4.25, 14.6], t: [0.00, 2.95, 1.6], f: 44 },
      { p: 0.208, e: [0.10, 3.45, 3.4], t: [0.00, 3.10, -8.4], f: 44 },
      { p: 0.244, e: [0.00, 3.10, -8.4], t: [0.10, 3.00, -17.4], f: 44 },
      { p: 0.290, e: [2.90, 3.20, -12.2], t: [0.40, 2.55, -21.0], f: 45 },
      { p: 0.348, e: [3.50, 2.95, -10.8], t: [0.80, 2.45, -19.8], f: 45 },
      { p: 0.402, e: [0.40, 2.40, -14.8], t: [0.00, 1.95, -24.4], f: 46 },
      { p: 0.440, e: [cx * 0.6, 0.85, n ? -20.0 : -23.0], t: [cx * 0.4, 0.30, -37.0], f: 41 },
      { p: 0.470, e: [cx - 0.30, 0.72, n ? -29.2 : -31.9], t: [cx - 0.20, 0.62, -36.4], f: 37 },
      { p: 0.496, e: [cx - 0.30, 0.02, n ? -29.0 : -31.6], t: [cx - 0.20, 0.06, -36.4], f: 35 },
      { p: 0.528, e: [n ? this.lanes.replicated.cx + 1.0 : cx * 0.55, 0.35, n ? -11.0 : -27.0],
        t: [n ? this.lanes.replicated.cx + 1.0 : 0, 0.05, -37.0], f: 40 },
      { p: 0.572, e: [n ? this.lanes.cross_species.cx : 0, 0.55, n ? -11.0 : -15.6],
        t: [n ? this.lanes.cross_species.cx : 0, 0.10, -37.0], f: 42 },
      { p: 0.600, e: [n ? this.lanes.thin.cx - 1.2 : 0, 0.45, n ? -11.0 : -13.4],
        t: [n ? this.lanes.thin.cx - 1.2 : 0, 0.05, -37.0], f: 42 },
      { p: 0.640, e: [0.00, 0.35, -26.0], t: [0.00, 0.10, -47.0], f: 42 },
      { p: 0.672, e: [0.55, 0.45, -28.4], t: [0.00, 0.05, -51.0], f: 41 },
      { p: 0.706, e: [-1.00, 0.25, -30.2], t: [0.00, 0.05, -51.5], f: 40 },
      { p: 0.760, e: [0.00, 0.40, -42.0], t: [0.00, 0.05, -60.0], f: 42 },
      { p: 0.830, e: [0.00, 0.20, -55.0], t: [0.00, 0.00, -70.0], f: 42 },
      { p: 0.885, e: [0.00, 0.00, -64.0], t: [0.00, 0.00, -73.0], f: 40 },
      { p: 0.901, e: [0.00, 0.00, -76.0], t: [0.00, 0.00, -83.0], f: 37 },
      { p: 0.912, e: [0.00, 0.00, CAM_END_Z], t: [0.00, 0.00, Z_CARDS], f: 36 },
      { p: 1.000, e: [0.00, 0.00, CAM_END_Z], t: [0.00, 0.00, Z_CARDS], f: 36 },
    ];

    /* The findings chapter has its own track, in p rather than q. It starts
       and ends on the q = 0.700 pose, so the hand-over in and out of the
       chapter is a blend between two identical frames and shows no seam. The
       camera barely travels: the records come to the lens, the wall builds
       behind them, and the frame stays a composition the reader can stop on. */
    this.findKeys = [
      { p: 0.350, e: [-1.00, 0.25, -30.2], t: [0.00, 0.05, -51.5], f: 40 },
      { p: 0.410, e: [-0.62, 0.36, -30.9], t: [0.16, 0.14, -52.4], f: 39 },
      { p: 0.480, e: [0.52, 0.22, -31.8], t: [-0.10, 0.08, -53.2], f: 38 },
      { p: 0.550, e: [-0.46, 0.34, -32.6], t: [0.14, 0.14, -54.0], f: 38 },
      { p: 0.620, e: [0.44, 0.20, -33.4], t: [-0.10, 0.06, -54.8], f: 38 },
      { p: 0.688, e: [-0.30, 0.30, -34.2], t: [0.10, 0.10, -55.6], f: 39 },
      { p: 0.740, e: [0.00, 0.22, -34.8], t: [0.00, 0.08, -56.2], f: 37 },
      { p: 0.782, e: [0.00, 0.26, -33.0], t: [0.00, 0.06, -54.0], f: 39 },
      { p: 0.820, e: [-1.00, 0.25, -30.2], t: [0.00, 0.05, -51.5], f: 40 },
    ];
  }

  keyAt(K, p, endHold) {
    if (endHold && p >= endHold) return K[K.length - 1];
    let i = 0;
    while (i < K.length - 2 && p > K[i + 1].p) i++;
    const t = clamp01((p - K[i].p) / (K[i + 1].p - K[i].p));
    const k0 = K[Math.max(0, i - 1)], k1 = K[i], k2 = K[i + 1], k3 = K[Math.min(K.length - 1, i + 2)];
    const e = [0, 0, 0], tg = [0, 0, 0];
    for (let a = 0; a < 3; a++) {
      e[a] = crv(k0.e[a], k1.e[a], k2.e[a], k3.e[a], t);
      tg[a] = crv(k0.t[a], k1.t[a], k2.t[a], k3.t[a], t);
    }
    return { e, t: tg, f: lerp(k1.f, k2.f, smooth(t)) };
  }

  camAt(q, p, fx) {
    const a = this.keyAt(this.camKeys, q, 0.912);
    if (!(fx > 0.0005)) return a;
    const b = this.keyAt(this.findKeys, p, 0);
    const e = [0, 0, 0], tg = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      e[i] = lerp(a.e[i], b.e[i], fx);
      tg[i] = lerp(a.t[i], b.t[i], fx);
    }
    return { e, t: tg, f: lerp(a.f, b.f, fx) };
  }

  updateCamera(q, p, fx) {
    const k = this.camAt(q, p, fx);
    const c = this.camera;
    /* The compositions are framed for a wide screen. On a tall one the camera
       steps back and opens up a little, so the same things stay in frame. */
    const g = this.frameComp || 1;
    c.position.set(
      k.t[0] + (k.e[0] - k.t[0]) * g,
      k.t[1] + (k.e[1] - k.t[1]) * g,
      k.t[2] + (k.e[2] - k.t[2]) * g
    );
    c.up.set(0, 1, 0);
    c.lookAt(k.t[0], k.t[1], k.t[2]);
    /* No hysteresis on the field of view. The findings chapter works out where
       a record has to sit from the live fov, so a fov that lags by a thousandth
       of a degree moves the record by a fraction of a pixel and the dither
       pattern under it flips: a rewind would then not be exact. */
    const fov = k.f + (g - 1) * 5.0;
    if (c.fov !== fov) { c.fov = fov; c.updateProjectionMatrix(); }
    c.updateMatrixWorld();
  }

  /* ------------------------------------------------- the records --------- */

  /* Where each of the twelve records is at this p, and where the paper it came
     off sits behind it. Worked out once a frame, before anything that needs
     it: the record bodies, the sheets behind them, and the focus pull. */
  placeRecords(p, fx) {
    this.recBody = this.recBody || new Float32Array(Math.max(1, this.RN | 0));
    this.recXf = this.recXf || [];
    this.recNear = 0; this.recW = 0;
    if (!this.RN) return;
    const cam = this.camera, m = cam.matrixWorld.elements;
    const rx = m[0], ry = m[1], rz = m[2];      /* camera right */
    const ux = m[4], uy = m[5], uz = m[6];      /* camera up */
    const fwx = -m[8], fwy = -m[9], fwz = -m[10];
    const halfTan = Math.tan(cam.fov * Math.PI / 360);
    /* the distance at which a record covers about four fifths of the frame
       width, whatever the screen is */
    const lensD = clamp(1.8 / ((this.narrow ? 0.88 : 0.70) * halfTan * cam.aspect), 3.2, 26);
    this.lensD = lensD;
    const hwL = halfTan * cam.aspect * lensD, hhL = halfTan * lensD;

    for (let h = 0; h < this.RN; h++) {
      const R = this.recPick[h];
      const ph = (p - R.t0) / 0.056;
      const live = fx > 0.0005 && ph > -0.05 && ph < 1.06;
      this.recBody[h] = live ? clamp01(1.6 * Math.sin(clamp01(ph) * Math.PI)) : 0;
      if (!live) { this.recXf[h] = null; continue; }
      /* Out of the wall, to the lens, then back and up. A record leaves by
         receding, not by crossing in front: the next one is already on its way
         to the same spot, and two of them at the lens is unreadable. */
      const arrive = smoother(ph / 0.22);
      const leave = smoother((ph - 0.60) / 0.34);
      const dNear = lerp(lensD + 15.5, lensD, arrive);
      const d = lerp(dNear, lensD * 1.90, leave);
      const side = R.side;
      const sx = lerp(side * 3.4, side * 0.06, arrive);
      const sy = lerp((hash1(h + 51) - 0.5) * 1.6, 0.06, arrive) + leave * 1.90;
      const off = lerp(1.0, 0.0, arrive);
      const px = cam.position.x + fwx * d + rx * (sx * hwL) + ux * (sy * hhL);
      const py = cam.position.y + fwy * d + ry * (sx * hwL) + uy * (sy * hhL);
      const pz = cam.position.z + fwz * d + rz * (sx * hwL) + uz * (sy * hhL);
      const sc = (d / lensD) * (1 - 0.10 * off);
      /* a record only comes up as it nears the lens, so the one still on its
         way in does not compete with the one being read */
      const alpha = smoother(ph / 0.17) * (1 - smoother((ph - 0.62) / 0.13));
      const tilt = (1 - arrive) * side * 0.42 + leave * 0.30;
      /* the paper it came off, tucked behind its own right shoulder */
      const nar = this.narrow;
      const oR = (nar ? 0.16 : 0.972) * hwL * sc;
      const oU = (nar ? 0.40 : 0.560) * hhL * sc;
      const oB = 1.25 * sc;
      this.recXf[h] = {
        x: px, y: py, z: pz, sc, alpha, tilt, arrive, leave, ph, d,
        sx: px + rx * oR + ux * oU + fwx * oB,
        sy: py + ry * oR + uy * oU + fwy * oB,
        sz: pz + rz * oR + uz * oU + fwz * oB,
        sw: (nar ? 0.40 : 0.243) * 2 * hwL * sc,
      };
      if (alpha > this.recW) this.recW = alpha;
      if (alpha > 0.30 && (this.recNear === 0 || d < this.recNear)) this.recNear = d;
    }
  }

  updateRecords(p, fx) {
    if (!this.RN || !this.records) return;
    const S = this.scratch;
    const geo = this.records.geometry;
    const st = geo.getAttribute('aState');
    let any = 0;
    /* A record that is not in flight is folded to nothing rather than left on
       its last matrix. The dither that opens a face up passes a few fragments
       even at alpha zero, and a stale matrix would put those few pixels
       somewhere that depends on where the reader has been, which would break
       an exact rewind. */
    for (let h = 0; h < this.RN; h++) {
      const X = this.recXf[h];
      if (!X) {
        S.v.set(0, 0, Z_LATTICE); S.q.set(0, 0, 0, 1); S.s.set(0, 0, 0);
        S.m.compose(S.v, S.q, S.s);
        this.records.setMatrixAt(h, S.m);
        st.setXYZW(h, 1, 0, 0, 0.16); continue;
      }
      const a = X.alpha * fx;
      if (a > 0.004) any = 1;
      S.e.set(0.03 * Math.sin(p * 3.1 + h) * (1 - X.arrive),
        X.tilt, (hash3(h + 17) - 0.5) * 0.05 * (1 - X.arrive) + X.leave * 0.16);
      S.q.setFromEuler(S.e);
      S.v.set(X.x, X.y, X.z);
      S.s.set(X.sc, X.sc, 1);
      S.m.compose(S.v, S.q, S.s);
      this.records.setMatrixAt(h, S.m);
      st.setXYZW(h, 1, 0, a, 0.16);
    }
    this.records.visible = any === 1;
    this.records.instanceMatrix.needsUpdate = true;
    st.needsUpdate = true;
  }

  /* The sheets mesh does two more jobs after the shelf is gone: the paper
     behind each record, and the eight works that carry the most replicated
     findings. Both are real instances of the same 148 faces, so a work is
     always the same object wherever it turns up. */
  updateSheetsEvidence(p, fx, state, shAlpha) {
    const S = this.scratch;
    for (let h = 0; h < this.RN; h++) {
      const X = this.recXf[h], wi = this.recPick[h].wi;
      if (!X || wi < 0) continue;
      S.e.set(0.02, -0.13, 0.075 + X.leave * 0.12);
      S.q.setFromEuler(S.e);
      S.v.set(X.sx, X.sy, X.sz);
      S.s.set(X.sw, X.sw, 1);
      S.m.compose(S.v, S.q, S.s);
      this.sheets.setMatrixAt(wi, S.m);
      state.setXYZW(wi, 1, this.shAccent[wi], X.alpha * fx, 0.16);
      shAlpha.setX(wi, 0);
    }

    /* the most replicated works, coming forward with their tallies */
    const MR = this.mrList.length;
    this.mrScreen = this.mrScreen || [];
    const cam = this.camera, m = cam.matrixWorld.elements;
    const rx = m[0], ry = m[1], rz = m[2], ux = m[4], uy = m[5], uz = m[6];
    const fwx = -m[8], fwy = -m[9], fwz = -m[10];
    const halfTan = Math.tan(cam.fov * Math.PI / 360);
    const nar = this.narrow;
    const cols = nar ? 2 : 8, rows = nar ? 4 : 1;
    const d0 = 16;
    this.mrD = d0;
    const hw = halfTan * cam.aspect * d0, hh = halfTan * d0;
    /* the rank is laid out as a share of the frame, so it fills the same part
       of a laptop and a phone: eight across on a wide screen, two by four on a
       narrow one, each sheet tall enough to read its title */
    const wFrac = nar ? 0.280 : 0.0935;
    const sw = wFrac * 2 * hw;
    const gxStep = wFrac * 2 * 1.18;
    const gyStep = (sw * 1.35 * (nar ? 1.16 : 1.22)) / Math.max(0.001, hh);
    for (let k = 0; k < MR; k++) {
      const t0 = 0.700 + k * 0.0055;
      const inn = smoother((p - t0) / 0.030);
      const out = smoother((p - 0.762 - k * 0.0018) / 0.024);
      const a = inn * (1 - out) * fx;
      this.mrScreen[k] = null;
      if (a <= 0.004) { continue; }
      const c = k % cols, r = Math.floor(k / cols);
      const gx = (c - (cols - 1) / 2) * gxStep;
      const gy = ((rows - 1) / 2 - r) * gyStep + (nar ? 0.06 : 0.16);
      const d = lerp(d0 + 26, d0, inn) * (1 + out * 0.28);
      const px = cam.position.x + fwx * d + rx * (gx * hw) + ux * (gy * hh);
      const py = cam.position.y + fwy * d + ry * (gx * hw) + uy * (gy * hh);
      const pz = cam.position.z + fwz * d + rz * (gx * hw) + uz * (gy * hh);
      const sc = sw * (d / d0);
      S.e.set(0.015, -gx * 0.16, (hash3(k + 61) - 0.5) * 0.04);
      S.q.setFromEuler(S.e);
      S.v.set(px, py, pz);
      S.s.set(sc, sc, 1);
      S.m.compose(S.v, S.q, S.s);
      const wi = this.mrList[k].wi;
      this.sheets.setMatrixAt(wi, S.m);
      state.setXYZW(wi, 1, this.shAccent[wi], a, 0.14);
      shAlpha.setX(wi, 0);
      /* The tallies sit in two ranks, so eight of them fit under eight works
         without running into each other. With only two columns there is no
         room to centre them either, so each one is hung off the outer side of
         its own work. */
      const drop = sc * 1.35 * (0.52 + (k % 2) * (nar ? 0.0 : 0.22));
      const align = nar ? (c === 0 ? 'translate(-100%,3px)' : 'translate(0,3px)')
                        : 'translate(-50%,4px)';
      this.mrScreen[k] = [px - ux * drop, py - uy * drop, pz - uz * drop, a, align];
    }
    this.mrOn = MR ? smoother((p - 0.694) / 0.020) * (1 - smoother((p - 0.766) / 0.024)) * fx : 0;
    this.mrDim = MR ? smoother((p - 0.706) / 0.026) * (1 - smoother((p - 0.766) / 0.024)) * fx : 0;
  }

  /* The papers each answer stands on, arriving under it as it lands. Three per
     card, the top three works of that card in evidence.json, each one the same
     sheet face the shelf opened with. */
  updateTuck(q, p) {
    if (!this.TN || !this.tuck || !this.cardWorld) return;
    const S = this.scratch;
    const geo = this.tuck.geometry;
    const st = geo.getAttribute('aState');
    let any = 0;
    for (let i = 0; i < this.TN; i++) {
      const T = this.tuckList[i];
      const w = this.cardWorld[T.card];
      const park = () => {
        S.v.set(0, 0, Z_CARDS); S.q.set(0, 0, 0, 1); S.s.set(0, 0, 0);
        S.m.compose(S.v, S.q, S.s);
        this.tuck.setMatrixAt(i, S.m);
        st.setXYZW(i, 1, 0, 0, 0.2);
      };
      if (!w) { park(); continue; }
      const t0 = 0.902 + (T.card / Math.max(1, this.CN)) * 0.020;
      const fly = smoother((q - (t0 - 0.006)) / 0.018);
      const tuckT = smoother((q - (t0 + 0.020)) / 0.018);
      const a = fly * (1 - smoother((q - (t0 + 0.046)) / 0.014));
      if (a <= 0.004) { park(); continue; }
      any = 1;
      const lane = (T.slot - 1);
      /* readable in front of the answer, then down and behind its lower edge */
      const wide = w.w * 0.44;
      const sc = lerp(wide * 0.96, wide * 0.34, tuckT);
      const x = w.x + lane * lerp(w.w * 0.30, w.w * 0.11, tuckT);
      const y = lerp(w.y - w.h * 0.5 - 1.15, w.y + w.h * 0.10, fly)
              - tuckT * (w.h * 0.56 + sc * 0.42);
      const z = lerp(Z_CARDS - 3.4, Z_CARDS + 0.55, fly) - tuckT * 0.85;
      S.e.set(0, 0, lane * lerp(0.10, 0.035, tuckT) + (1 - fly) * 0.22 * lane);
      S.q.setFromEuler(S.e);
      S.v.set(x, y, z);
      S.s.set(sc, sc, 1);
      S.m.compose(S.v, S.q, S.s);
      this.tuck.setMatrixAt(i, S.m);
      st.setXYZW(i, 1, this.shAccent[T.wi], a, 0.10);
    }
    this.tuck.visible = any === 1;
    this.tuck.instanceMatrix.needsUpdate = true;
    st.needsUpdate = true;
  }

  /* ---------------------------------------------------- the sheets ------- */
  updateSheets(q, p, fx) {
    const S = this.scratch, W = this.data.works.length;
    const geo = this.sheets.geometry;
    const state = geo.getAttribute('aState');
    const shAlpha = this.shadows.geometry.getAttribute('aAlpha');
    const groundOn = 1 - seg(q, 0.185, 0.265);
    /* while one record is held up to the lens, whatever is in front of it steps
       out of the light rather than crossing the shot */
    const wWin = this.witness >= 0
      ? smoother((q - 0.230) / 0.016) * (1 - smoother((q - 0.272) / 0.018)) : 0;
    const cam = this.camera.position;
    const wDist = wWin > 0.001
      ? Math.hypot(0.26 - cam.x, 3.02 - cam.y, -12.2 - cam.z) : 0;

    for (let i = 0; i < W; i++) {
      const u = this.shU[i], rank = this.shRank[i];
      const s = clamp01((q - 0.098 - 0.052 * u) / 0.190);
      const h1 = hash1(i + 11), h2 = hash2(i + 11), h3 = hash3(i + 11);
      const laneX = ((rank % 6) - 2.5) * 2.86 + (h1 - 0.5) * 0.5;
      const qy = 2.55 + h2 * 1.9;

      const a = smoother(s / 0.16);
      const b = smoother((s - 0.17) / 0.30);
      const c = smoother((s - 0.48) / 0.11);
      const d = smoother((s - 0.60) / 0.24);
      const e = smoother((s - 0.84) / 0.16);

      let x = this.shHome[i * 3], y = this.shHome[i * 3 + 1], z = this.shHome[i * 3 + 2];
      /* lift in place, then queue, then through the plane, then to extraction */
      x = lerp(x, x + (h3 - 0.5) * 0.5, a);
      y = lerp(y, 1.35 + h2 * 0.8, a);
      z = lerp(z, z - 0.7, a);
      x = lerp(x, laneX, b); y = lerp(y, qy, b); z = lerp(z, -2.6, b);
      /* a lateral swing on the way in, so the queue reads as a body in motion */
      x += Math.sin(b * Math.PI) * (h1 - 0.5) * 1.7 * (1 - c);
      y += Math.sin(b * Math.PI) * 0.7 * (h2 - 0.35);
      x = lerp(x, laneX * 0.92, c); y = lerp(y, qy, c); z = lerp(z, -9.6, c);
      x = lerp(x, laneX * 0.52, d); y = lerp(y, 2.4 + h2 * 1.9, d); z = lerp(z, Z_EXTRACT, d);
      x = lerp(x, laneX * 2.9, e); y = lerp(y, 7.5 + h1 * 4.0, e); z = lerp(z, Z_EXTRACT - 6.5, e);

      let stamp = smoother((s - 0.47) / 0.05);
      let kick = 1 + 0.05 * pulse(s, 0.468, 0.560);
      if (i === this.witness) {
        /* held up to the lens: the record, its authors, its year, its DOI */
        const wt = wWin;
        if (wt > 0.001) {
          x = lerp(x, 0.26, wt); y = lerp(y, 3.02, wt); z = lerp(z, -12.2, wt);
          stamp = Math.max(stamp, smoother((q - 0.247) / 0.014));
          kick = 1 + 0.055 * pulse(q, 0.246, 0.270) * wt;
          this.witnessBlend = wt;
        } else { this.witnessBlend = 0; }
      }
      let alpha = 1 - e;
      alpha *= smooth((Math.hypot(x - cam.x, y - cam.y, z - cam.z) - 0.55) / 0.85);
      if (wWin > 0.001 && i !== this.witness) {
        const dd = Math.hypot(x - cam.x, y - cam.y, z - cam.z);
        alpha *= 1 - wWin * (1 - smooth((dd - (wDist - 1.5)) / 1.4));
      }
      const curl = 0.035 + 0.90 * Math.sin(Math.min(a, 1) * Math.PI * 0.5) * (1 - e * 0.5);

      S.e.set(
        lerp(-Math.PI / 2, 0, a) + 0.07 * Math.sin(s * 5.0 + h1 * 6.0) * a,
        0.26 * Math.sin(h2 * 6.3 + s * 3.4) * a,
        this.shRot[i * 3 + 2] * (1 - a * 0.72) + 0.10 * Math.sin(h3 * 5.1 + s * 2.6) * a
      );
      if (i === this.witness && this.witnessBlend > 0.001) {
        const wb = this.witnessBlend;
        S.e.set(S.e.x * (1 - wb) + 0.02 * wb,
          S.e.y * (1 - wb) + 0.05 * wb,
          S.e.z * (1 - wb) - 0.03 * wb);
      }
      S.q.setFromEuler(S.e);
      S.v.set(x, y, z);
      S.s.set(kick, kick, 1);
      S.m.compose(S.v, S.q, S.s);
      this.sheets.setMatrixAt(i, S.m);
      this.shPos[i * 3] = x; this.shPos[i * 3 + 1] = y; this.shPos[i * 3 + 2] = z;
      state.setXYZW(i, stamp, this.shAccent[i], alpha, curl);

      /* contact shadow on the ground, only while the sheet is near it */
      const lift = clamp01(y / 1.6);
      S.v.set(this.shHome[i * 3] + (x - this.shHome[i * 3]) * 0.25 + 0.16,
        0.006, this.shHome[i * 3 + 2] - 0.24);
      S.q.set(0, 0, 0, 1);
      const sc = 0.62 + lift * 0.75;
      S.s.set(sc, 1, sc);
      S.m.compose(S.v, S.q, S.s);
      this.shadows.setMatrixAt(i, S.m);
      shAlpha.setX(i, groundOn * (1 - lift * 0.8) * 0.40);
    }

    /* the illustrative sheet: it meets the plane and falls away */
    const gi = W;
    const gs = clamp01((q - 0.150) / 0.082);
    const app = smoother((q - 0.142) / 0.020);
    const fall = smoother((gs - 0.55) / 0.45);
    const gx = lerp(-2.6, -1.1, smoother(gs / 0.55));
    const gy = lerp(3.4, 3.0, smoother(gs / 0.55)) - 9.5 * fall * fall;
    const gz = lerp(6.0, -2.2, smoother(gs / 0.55)) - 1.6 * fall;
    S.e.set(0.4 * fall, 0.5 * fall, 0.06 + 2.4 * fall);
    S.q.setFromEuler(S.e);
    S.v.set(gx, gy, gz);
    S.s.set(1, 1, 1);
    S.m.compose(S.v, S.q, S.s);
    this.sheets.setMatrixAt(gi, S.m);
    const gAlpha = app * (1 - smoother((gs - 0.62) / 0.38));
    state.setXYZW(gi, 0, 3, gAlpha, 0.5);
    shAlpha.setX(gi, 0);
    this.ghostPos = [gx, gy + 0.55, gz];
    this.ghostAlpha = gAlpha;

    const evMode = fx > 0.0015;
    if (evMode) this.updateSheetsEvidence(p, fx, state, shAlpha);
    else { this.mrOn = 0; this.mrScreen = this.mrScreen || []; }

    this.sheets.visible = q < 0.415 || evMode;
    this.sheets.instanceMatrix.needsUpdate = true;
    this.shadows.instanceMatrix.needsUpdate = true;
    state.needsUpdate = true;
    shAlpha.needsUpdate = true;
    this.shadows.visible = groundOn > 0.01;
  }

  /* ---------------------------------------------------- the slips -------- */
  updateSlips(q, p, fx) {
    const S = this.scratch, M = this.M;
    const geo = this.slips.geometry;
    const state = geo.getAttribute('aState');
    const hgeo = this.heroes.geometry;
    const hstate = hgeo.getAttribute('aState');
    const tA = this.tethers.geo.getAttribute('aA');
    const tB = this.tethers.geo.getAttribute('aB');
    const tC = this.tethers.geo.getAttribute('aCol');
    const tS = this.tethers.geo.getAttribute('aState');
    const tetherCol = toHexTriplet(this.theme === 'dark' ? 0xc4b894 : 0x6b5e42);

    const cp = this.camera.position;
    const gp = segl(q, 0.420, 0.600);
    const stamped = [0, 0, 0, 0, 0, 0, 0, 0];
    const laneTotals = [0, 0, 0, 0, 0, 0, 0, 0];
    let anyTether = 0;

    for (let j = 0; j < M; j++) {
      const wi = this.slWork[j];
      const gi = this.slGrade[j];
      const g = GORDER[gi];
      const L = this.lanes[g];
      const h1 = hash1(j + 13), h2 = hash2(j + 13), h3 = hash3(j + 13);
      /* every slip runs a beat behind its own sheet, so a group flocks */
      const qs = q - (0.028 * this.shU[wi] + 0.016 * h1);
      laneTotals[gi]++;

      /* where it peels off its sheet */
      let x = this.shPos[wi * 3] + (h1 - 0.5) * 0.34;
      let y = this.shPos[wi * 3 + 1] + (h2 - 0.5) * 0.9;
      let z = this.shPos[wi * 3 + 2] + 0.10 + h3 * 0.06;
      const px = x, py = y, pz = z;

      /* the rack: a vertical descent through the press line, its own lane */
      let rawY = this.rackTop + this.slRow[j] - gp * this.rackTravel;
      /* the one finding the camera settles on passes the press line slowly, so
         the head can come down twice while it is still under it */
      if (this.slHero[j] === this.restampHero) rawY = keyLerp(q, RESTAMP_Y);
      const floorY = -4.6 - (j % 9) * 0.26;
      const dy = (rawY - floorY) / 2.4;
      const yRack = dy > 8 ? rawY : floorY + 2.4 * Math.log(1 + Math.exp(dy));
      const st = smoother((0.16 - yRack) / 0.34);
      if (st > 0.5) stamped[gi]++;

      const t1 = smoother((qs - 0.262) / 0.110);
      const t2 = smoother((qs - 0.400) / 0.062);
      const t3 = smoother((q - 0.598) / 0.078);
      const t4 = smoother((q - 0.716) / 0.140);
      const t5 = smoother((q - 0.878) / 0.060);

      x = lerp(x, this.slFlock[j * 3], t1);
      y = lerp(y, this.slFlock[j * 3 + 1], t1);
      z = lerp(z, this.slFlock[j * 3 + 2], t1);
      /* the flock breathes while it holds */
      const sw = pulse(qs, 0.262, 0.430) * (1 - t2);
      x += sw * 1.45 * Math.sin(j * 2.31 + qs * 11.0);
      y += sw * 0.90 * Math.sin(j * 1.77 + qs * 8.4);
      z += sw * 1.20 * Math.sin(j * 0.97 + qs * 6.2);

      x = lerp(x, this.slLaneX[j], t2);
      y = lerp(y, yRack, t2);
      z = lerp(z, Z_RACK + (h3 - 0.5) * 0.9, t2);

      x = lerp(x, this.slLat[j * 3], t3);
      y = lerp(y, this.slLat[j * 3 + 1], t3);
      z = lerp(z, this.slLat[j * 3 + 2], t3);

      const ni = this.slNode[j];
      let nx, ny, nz;
      if (ni >= 0) {
        nx = this.nodePos[ni * 3] + this.slNodeOff[j * 3];
        ny = this.nodePos[ni * 3 + 1] + this.slNodeOff[j * 3 + 1];
        nz = this.nodePos[ni * 3 + 2] + this.slNodeOff[j * 3 + 2];
      } else {
        /* a finding with no mechanism junction drifts wide and dims; it is not
           pretended into the constellation */
        nx = this.slLat[j * 3] * 2.3;
        ny = this.slLat[j * 3 + 1] * 2.3;
        nz = Z_NODES + 6.0;
      }
      x = lerp(x, nx, t4); y = lerp(y, ny, t4); z = lerp(z, nz, t4);
      x = lerp(x, nx * 0.25, t5); y = lerp(y, ny * 0.25, t5); z = lerp(z, Z_CARDS + 2.0, t5);

      /* THE FINDINGS. The lattice opens out into the wall of graded records:
         each finding that carries a grade on evidence glides forward into its
         band at its own moment, replicated first; the rest of the corpus sits
         out past them and stays dim. Both are the same 635 bodies, so nothing
         is added and nothing is hidden. */
      let evA = 0;
      const evOn = this.slEvOn ? this.slEvOn[j] : 0;
      if (fx > 0.0005) {
        const ar = evOn ? smoother((p - this.slEvT[j]) / 0.034) : 1;
        const ex = lerp(this.slEvStage[j * 3], this.slEv[j * 3], ar);
        const ey = lerp(this.slEvStage[j * 3 + 1], this.slEv[j * 3 + 1], ar);
        const ez = lerp(this.slEvStage[j * 3 + 2], this.slEv[j * 3 + 2], ar);
        x = lerp(x, ex, fx); y = lerp(y, ey, fx); z = lerp(z, ez, fx);
        evA = (evOn ? lerp(0.16, 1.0, ar) : 0.34) * (1 - 0.58 * (this.mrDim || 0));
      }

      const born = smoother((qs - 0.248) / 0.026);
      let alpha = born * (1 - t5) * (ni < 0 ? 1 - 0.55 * t4 : 1);
      alpha *= smooth((Math.hypot(x - cp.x, y - cp.y, z - cp.z) - 0.42) / 0.7);
      let scale = lerp(0.74, 0.37, t2);
      scale = lerp(scale, 0.52, t3);
      scale = lerp(scale, 0.17, t4);
      scale = lerp(scale, 0.05, t5);
      if (fx > 0.0005) {
        alpha = lerp(alpha, evA * smooth((Math.hypot(x - cp.x, y - cp.y, z - cp.z) - 3.2) / 3.0), fx);
        scale = lerp(scale, evOn ? 0.88 : 0.58, fx);
        /* whichever finding is at the lens as a record does not also sit in
           the wall as a strip */
        if (this.slRec[j] >= 0) alpha *= 1 - this.recBody[this.slRec[j]] * fx;
      }

      const hero = this.slHero[j];
      if (hero >= 0) {
        /* the close-up carries this finding instead; the body count is unchanged */
        const bump = 1 + 1.9 * Math.max(pulse(q, 0.276, 0.404), pulse(q, 0.442, 0.548));
        S.e.set(0.04 * Math.sin(q * 4 + h1 * 6), 0.10 * Math.sin(q * 3 + h2 * 6), (h3 - 0.5) * 0.05);
        S.q.setFromEuler(S.e);
        S.v.set(x, y, z + 1.15 * (bump - 1));
        const hs = scale * (1.9 / 2.9) * bump;
        S.s.set(hs, hs, 1);
        S.m.compose(S.v, S.q, S.s);
        this.heroes.setMatrixAt(hero, S.m);
        hstate.setXYZW(hero, st, 0, alpha * (1 - fx), 0.35);
        alpha *= fx;
        if (hero === this.restampHero) this.restampPos = [x, y, z + 1.15 * (bump - 1)];
      }

      S.e.set(
        0.10 * Math.sin(q * 5.0 + h1 * 6.3) * (1 - t3),
        0.22 * Math.sin(q * 3.4 + h2 * 6.3) * (1 - t3) * (1 - t2 * 0.7),
        (h3 - 0.5) * 0.42 * (1 - t2) + (h3 - 0.5) * 0.04
      );
      S.q.setFromEuler(S.e);
      S.v.set(x, y, z);
      S.s.set(scale, scale, 1);
      S.m.compose(S.v, S.q, S.s);
      this.slips.setMatrixAt(j, S.m);
      state.setXYZW(j, st, 0, alpha, 0.55 * (1 - t3));
      this.slPos[j * 3] = x; this.slPos[j * 3 + 1] = y; this.slPos[j * 3 + 2] = z;

      /* the tether back to the sheet it came from, for a beat only */
      const ta = born * (1 - smoother((qs - 0.300) / 0.052)) * 0.75;
      tA.setXYZ(j, px, py, pz);
      tB.setXYZ(j, x, y, z);
      tC.setXYZ(j, tetherCol[0], tetherCol[1], tetherCol[2]);
      tS.setXY(j, ta, 1);
      if (ta > 0.01) anyTether = 1;
    }

    this.stamped = stamped;
    this.laneTotals = laneTotals;
    /* in the wall of records the grade edge is the only thing a strip can say
       at that distance, so it is given room to say it */
    this.slips.material.uniforms.uBarW.value = lerp(0.033, 0.070, fx);
    this.slips.visible = q > 0.242 && q < 0.952;
    this.slips.instanceMatrix.needsUpdate = true;
    state.needsUpdate = true;
    this.tethers.mesh.visible = anyTether === 1;
    if (anyTether) {
      tA.needsUpdate = true; tB.needsUpdate = true; tC.needsUpdate = true; tS.needsUpdate = true;
    }

    this.updateHeroExtras(q, p, hstate, fx);
    this.heroes.visible = q > 0.255 && q < 0.90 && fx < 0.995;
    this.heroes.instanceMatrix.needsUpdate = true;
    hstate.needsUpdate = true;
  }

  /* the stitched slip and the eight challenges live on the same mesh */
  updateHeroExtras(q, p, hstate, fx) {
    const S = this.scratch;

    /* the illustrative stitched slip: it tears and goes */
    const app = smoother((q - 0.300) / 0.030);
    const tear = smoother((q - 0.352) / 0.030);
    const gone = smoother((q - 0.358) / 0.048);
    const sx = 2.75, sy = 2.98, sz = -15.0;
    S.e.set(0.03, 0.16, -0.02 + 0.22 * tear);
    S.q.setFromEuler(S.e);
    S.v.set(sx, sy - 0.5 * tear * tear, sz);
    S.s.set(0.82, 0.82, 1);
    S.m.compose(S.v, S.q, S.s);
    this.heroes.setMatrixAt(8, S.m);
    hstate.setXYZW(8, 0, tear, app * (1 - gone), 0.3);
    this.stitchPos = [sx, sy + 0.34, sz];
    this.stitchAlpha = app * (1 - gone);

    /* The eight challenges belong to the wrangle. They attach, they are read,
       and they are gone before the findings chapter opens; they do not come
       back when the machinery clock starts again. */
    const chalOut = 1 - smoother((p - 0.342) / 0.020);

    /* the eight real challenges, pinned in front of the lattice in red thread */
    const rA = this.redThreads.geo.getAttribute('aA');
    const rB = this.redThreads.geo.getAttribute('aB');
    const rC = this.redThreads.geo.getAttribute('aCol');
    const rS = this.redThreads.geo.getAttribute('aState');
    const red = toHexTriplet(this.theme === 'dark' ? 0xc4505c : 0x6e1420);
    const out = smoother((q - 0.714) / 0.030);
    for (let c = 0; c < 8; c++) {
      const col = this.narrow ? c % 2 : c % 4;
      const row = this.narrow ? 3 - Math.floor(c / 2) : (c < 4 ? 1 : 0);
      const tc = 0.594 + c * 0.0056;
      const en = smoother((q - tc) / 0.032);
      const side = col % 2 ? 1 : -1;
      const x0 = side * 22, y0 = (row ? 8 : -8), z0 = -32.0;
      const x1 = this.narrow ? (col - 0.5) * 1.55
        : (row ? (col - 1.5) * 2.84 - 0.35 : (col - 1.5) * 2.50 + 2.15);
      const y1 = this.narrow ? 3.55 - row * 2.35 : (row ? 1.30 : -1.62);
      const z1 = -39.6 - col * 0.86 - row * 0.55;
      const x = lerp(x0, x1, en), y = lerp(y0, y1, en), z = lerp(z0, z1, en);
      S.e.set(0.02, (0.5 - col * 0.33) * 0.12, (hash1(c + 5) - 0.5) * 0.07 + (1 - en) * side * 0.6);
      S.q.setFromEuler(S.e);
      S.v.set(x, y, z);
      const sc = 1.34;
      S.s.set(sc, sc, 1);
      S.m.compose(S.v, S.q, S.s);
      this.heroes.setMatrixAt(9 + c, S.m);
      hstate.setXYZW(9 + c, 1, 0, en * (1 - out) * chalOut, 0.3);
      /* the thread runs back into the lattice and stays visible */
      const cell = ((c * 79) % this.M);
      rA.setXYZ(c, x, y, z);
      rB.setXYZ(c, this.slPos[cell * 3], this.slPos[cell * 3 + 1], this.slPos[cell * 3 + 2]);
      rC.setXYZ(c, red[0], red[1], red[2]);
      rS.setXY(c, en * (1 - out) * chalOut, 1);
    }
    rA.needsUpdate = true; rB.needsUpdate = true; rC.needsUpdate = true; rS.needsUpdate = true;
    this.redThreads.mesh.visible = q > 0.575 && q < 0.752 && chalOut > 0.004;
  }

  /* ---------------------------------------------------- the rack --------- */
  updateRack(q, fx) {
    const S = this.scratch;
    const geo = this.blocks.geometry;
    const alpha = geo.getAttribute('aAlpha');
    const on = smoother((q - 0.418) / 0.026) * (1 - smoother((q - 0.606) / 0.038));
    const gp = segl(q, 0.420, 0.600);
    this.rackAnchor = this.rackAnchor || [];
    const psA = this.pressShadows.geometry.getAttribute('aAlpha');
    for (let i = 0; i < 8; i++) {
      const L = this.lanes[GORDER[i]];
      let press = Math.pow(0.5 - 0.5 * Math.cos((gp * 6.0 + i * 0.11) * 6.2831853), 2.4);
      if (i === this.restampHero) {
        /* the head comes down once, lifts with nothing printed, and comes down
           again on the grade this finding actually carries */
        press = Math.max(press, Math.pow(pulse(q, 0.446, 0.474), 2.2));
        press = Math.max(press, Math.pow(pulse(q, 0.480, 0.516), 1.5));
      }
      const y = 1.72 - 0.92 * press;
      S.v.set(L.cx, y, Z_RACK + 1.30);
      S.q.set(0, 0, 0, 1);
      S.s.set(L.w * 0.96, 1.16, 1.02);
      S.m.compose(S.v, S.q, S.s);
      this.blocks.setMatrixAt(i, S.m);
      alpha.setX(i, on);
      /* the shaft that carries the head down from the beam */
      const shaftTop = 2.74, shaftBot = y + 0.58;
      S.v.set(L.cx, (shaftTop + shaftBot) / 2, Z_RACK + 1.30);
      S.s.set(0.30, Math.max(0.02, shaftTop - shaftBot), 0.30);
      S.m.compose(S.v, S.q, S.s);
      this.blocks.setMatrixAt(10 + i, S.m);
      alpha.setX(10 + i, on);
      /* the contact shadow: it tightens and darkens as the head comes down */
      const tight = lerp(1.30, 0.94, press);
      S.v.set(L.cx, 0.19, Z_RACK + 0.90);
      S.s.set(L.w * tight, 0.86 * tight, 1);
      S.m.compose(S.v, S.q, S.s);
      this.pressShadows.setMatrixAt(i, S.m);
      psA.setX(i, on * (0.09 + 0.66 * press * press));
      /* the running count sits in one row above the beam, like a ledger head */
      this.rackAnchor[i] = [L.cx, 3.42, Z_RACK + 1.30];
    }
    /* the beam the heads hang from, and the rail the slips pass */
    S.q.set(0, 0, 0, 1);
    S.v.set(0, 2.74, Z_RACK + 1.30); S.s.set(30, 0.30, 0.74);
    S.m.compose(S.v, S.q, S.s); this.blocks.setMatrixAt(8, S.m);
    alpha.setX(8, on);
    S.v.set(0, 0.02, Z_RACK + 0.66); S.s.set(30, 0.09, 0.40);
    S.m.compose(S.v, S.q, S.s); this.blocks.setMatrixAt(9, S.m);
    alpha.setX(9, on);
    this.blocks.instanceMatrix.needsUpdate = true;
    alpha.needsUpdate = true;
    this.blocks.visible = on > 0.01;
    this.pressShadows.visible = on > 0.01;
    if (this.pressShadows.visible) {
      this.pressShadows.instanceMatrix.needsUpdate = true;
      psA.needsUpdate = true;
    }
    this.rackOn = on;
  }

  /* ---------------------------------------------------- threads ---------- */
  updateThreads(q, fx) {
    const T = this.threads;
    const na = this.nodeArrived;
    const vis = q > 0.688 && q < 0.945 && fx < 0.5;
    T.mesh.visible = vis;
    if (!vis) {
      const f = q >= 0.945 ? 1 : 0;
      for (let k = 0; k < na.length; k++) na[k] = f * this.nodeLinks[k];
      this.linksArrived = f * this.linkCount;
      return;
    }
    na.fill(0);
    const A = T.geo.getAttribute('aA'), B = T.geo.getAttribute('aB');
    const C = T.geo.getAttribute('aCol'), St = T.geo.getAttribute('aState');
    const dark = this.theme === 'dark';
    const cPrim = toHexTriplet(dark ? 0xc4b894 : 0x6b5e42);
    const cSupp = toHexTriplet(dark ? 0x8a7d5e : 0xa79878);
    const cChal = toHexTriplet(dark ? 0xc25260 : 0x8a1f2b);
    const out = 1 - smoother((q - 0.882) / 0.046);
    let arrived = 0;
    for (let l = 0; l < this.linkCount; l++) {
      const j = this.links[l * 3], k = this.links[l * 3 + 1], role = this.links[l * 3 + 2];
      const aRaw = smoother((q - 0.702 - 0.055 * hash1(l + 3)) / 0.095);
      const a = aRaw * out;
      if (aRaw > 0.5) { arrived++; na[k]++; }
      A.setXYZ(l, this.slPos[j * 3], this.slPos[j * 3 + 1], this.slPos[j * 3 + 2]);
      B.setXYZ(l, this.nodePos[k * 3], this.nodePos[k * 3 + 1], this.nodePos[k * 3 + 2]);
      const c = role === 2 ? cChal : role === 1 ? cSupp : cPrim;
      C.setXYZ(l, c[0], c[1], c[2]);
      St.setXY(l, a * (role === 2 ? 0.95 : role === 1 ? 0.44 : 0.60), role === 2 ? 2.2 : 1.0);
    }
    this.linksArrived = arrived;
    A.needsUpdate = true; B.needsUpdate = true; C.needsUpdate = true; St.needsUpdate = true;
  }

  /* ---------------------------------------------------- the nodes -------- */
  updateNodes(q, fx) {
    const geo = this.nodes.geometry;
    const pos = geo.getAttribute('aPos'), st = geo.getAttribute('aState');
    const vis = smoother((q - 0.686) / 0.046) * (1 - smoother((q - 0.878) / 0.032)) * (1 - fx);
    const collapse = smoother((q - 0.876) / 0.044);
    const K = this.data.mechanisms.length;
    this.nodeScreen = this.nodeScreen || [];
    for (let k = 0; k < K; k++) {
      const owed = this.nodeLinks[k];
      const lit = owed > 0
        ? clamp01(this.nodeArrived[k] / owed)
        : smoother((q - 0.710 - 0.026 * hash1(k + 41)) / 0.120);
      const x = lerp(this.nodePos[k * 3], this.nodePos[k * 3] * 0.18, collapse);
      const y = lerp(this.nodePos[k * 3 + 1], this.nodePos[k * 3 + 1] * 0.18, collapse);
      const z = lerp(this.nodePos[k * 3 + 2], Z_CARDS - 3.2, collapse);
      pos.setXYZ(k, x, y, z);
      st.setXY(k, lit, vis);
      this.nodeScreen[k] = [x, y, z];
    }
    pos.needsUpdate = true; st.needsUpdate = true;
    this.nodes.visible = vis > 0.02;
    this.nodeVis = vis;
  }

  /* ---------------------------------------------------- the answers ------ */
  updateCards(q) {
    if (!this.CN || !this.cardWorld) return;
    const S = this.scratch;
    const geo = this.cards.geometry;
    const st = geo.getAttribute('aState');
    const live = q > 0.874;
    this.cards.visible = live;
    if (!live) return;
    for (let i = 0; i < this.CN; i++) {
      const w = this.cardWorld[i];
      const ni = this.cardNode[i];
      const ox = ni >= 0 ? this.nodePos[ni * 3] * 0.20 : 0;
      const oy = ni >= 0 ? this.nodePos[ni * 3 + 1] * 0.20 : 0;
      const t0 = 0.886 + (i / this.CN) * 0.024;
      const t = smoother((q - t0) / 0.050);
      const x = lerp(ox, w.x, t), y = lerp(oy, w.y, t), z = lerp(Z_CARDS - 3.2, Z_CARDS, t);
      const sc = lerp(0.08, 1, t);
      S.v.set(x, y, z);
      S.e.set(0, 0, (1 - t) * (hash1(i + 71) - 0.5) * 0.3);
      S.q.setFromEuler(S.e);
      S.s.set(w.w * sc, w.h * sc, 1);
      S.m.compose(S.v, S.q, S.s);
      this.cards.setMatrixAt(i, S.m);
      st.setXYZW(i, smoother((q - t0 - 0.016) / 0.030), w.w / Math.max(0.001, w.h),
        smoother((q - t0) / 0.020), 0);
    }
    this.cards.instanceMatrix.needsUpdate = true;
    st.needsUpdate = true;
  }

  /* ---------------------------------------------------- atmosphere ------- */
  updateAtmosphere(q, p, fx) {
    const key = (arr) => {
      let i = 0;
      while (i < arr.length - 2 && q > arr[i + 1][0]) i++;
      const t = clamp01((q - arr[i][0]) / (arr[i + 1][0] - arr[i][0]));
      return lerp(arr[i][1], arr[i + 1][1], smooth(t));
    };
    const FOCUS = [
      [0.000, 4.6, 2.2, 15.0], [0.045, 8.0, 3.0, 20.0], [0.090, 13.0, 4.5, 30.0],
      [0.130, 13.0, 5.0, 30.0], [0.200, 11.5, 4.2, 26.0], [0.280, 9.5, 3.2, 22.0],
      [0.340, 7.6, 2.6, 17.0], [0.400, 9.5, 3.4, 21.0], [0.445, 7.6, 2.6, 17.0],
      [0.492, 4.4, 1.3, 9.0], [0.535, 11.0, 4.0, 24.0], [0.578, 23.0, 8.5, 42.0],
      [0.612, 20.0, 7.0, 38.0], [0.648, 9.0, 2.8, 26.0], [0.700, 9.2, 3.0, 27.0],
      [0.740, 17.0, 6.0, 34.0], [0.830, 16.0, 6.0, 32.0], [0.885, 10.0, 4.0, 26.0],
      [0.925, 10.5, 4.0, 24.0], [0.945, 4.05, 1.6, 10.0], [1.000, 4.05, 1.6, 10.0],
    ];
    let fi = 0;
    while (fi < FOCUS.length - 2 && q > FOCUS[fi + 1][0]) fi++;
    const ft = smooth(clamp01((q - FOCUS[fi][0]) / (FOCUS[fi + 1][0] - FOCUS[fi][0])));
    const cu = this.compMat.uniforms;
    let focus = lerp(FOCUS[fi][1], FOCUS[fi + 1][1], ft);
    let sharp = lerp(FOCUS[fi][2], FOCUS[fi + 1][2], ft);
    let soft = lerp(FOCUS[fi][3], FOCUS[fi + 1][3], ft);
    /* Through the findings chapter the lens holds whichever record is in front
       of it, and lets the wall behind it go to depth. When the eight most
       replicated works come forward, the focus goes back to them. */
    if (fx > 0.0005) {
      const mr = this.mrOn || 0;
      const wallD = 17.0;
      const rd = this.recNear > 0 ? this.recNear : wallD;
      const fD = lerp(lerp(wallD, rd, this.recW || 0), (this.mrD || 16), mr);
      focus = lerp(focus, fD, fx);
      sharp = lerp(sharp, lerp(2.6, 5.4, mr), fx);
      soft = lerp(soft, lerp(30.0, 34.0, mr), fx);
    }
    cu.uFocus.value = focus;
    cu.uSharp.value = sharp;
    cu.uSoft.value = soft;
    cu.uP.value = p;
    cu.uVig.value = this.theme === 'dark' ? 0.34 : 0.26;
    cu.uGrain.value = this.theme === 'dark' ? 0.038 : 0.030;
    cu.uLift.value = this.theme === 'dark' ? 0.10 : 0.0;

    this.groundUni.uFade.value = 1 - smoother((q - 0.200) / 0.090);
    this.ground.visible = this.groundUni.uFade.value > 0.01;
    this.plateUni.uOpacity.value =
      smoother((q - 0.110) / 0.036) * (1 - smoother((q - 0.194) / 0.026));
    this.plane.visible = this.plateUni.uOpacity.value > 0.005;
    this.uni.uFogD.value = q < 0.14
      ? lerp(0.00085, 0.00046, smooth(q / 0.135))
      : lerp(0.00046, 0.00066, smooth((q - 0.55) / 0.35));
    if (this.scene.fog) this.scene.fog.density = Math.sqrt(this.uni.uFogD.value);
    const hand = smooth((q - 0.900) / 0.060);
    if (hand !== this.lastHand) {
      this.lastHand = hand;
      this.uni.uFog.value.copy(this.fogA).lerp(this.fogB, hand);
      this.scene.background.copy(this.bgA).lerp(this.bgB, hand);
      if (this.scene.fog) this.scene.fog.color.copy(this.uni.uFog.value);
    }
  }

  /* ---------------------------------------------------- the overlay ------ */
  buildOverlay(el) {
    this.ui = {
      wrap: el,
      stage: el.querySelector('.tiw-seq-stage'),
      canvas: el.querySelector('.tiw-seq-canvas'),
      skip: el.querySelector('.tiw-seq-skip'),
      ledeBox: el.querySelector('.tiw-seq-lede'),
      lede: Array.from(el.querySelectorAll('.tiw-seq-lede > span')),
      h1: el.querySelector('.tiw-seq-h1slot'),
      cap: el.querySelector('.tiw-seq-cap'),
      tally: el.querySelector('.tiw-seq-tally'),
      tallyN: el.querySelector('.tiw-seq-tally u'),
      tallyL: el.querySelector('.tiw-seq-tally i'),
      ledger: el.querySelector('.tiw-seq-ledger'),
      gaps: el.querySelector('.tiw-seq-gaplist'),
      tags: el.querySelector('.tiw-seq-tags'),
    };
    const U = this.ui;
    U.skip.textContent = COPY.skip;

    /* the sixteen open gaps, ticking past under the challenge ledger */
    const gapFrag = document.createDocumentFragment();
    for (const g of this.data.gaps) {
      const s = document.createElement('span');
      const i = document.createElement('i');
      i.textContent = g.c;
      s.appendChild(i);
      s.appendChild(document.createTextNode(g.n));
      gapFrag.appendChild(s);
    }
    U.gaps.appendChild(gapFrag);
    U.ledger.querySelector('strong').textContent = COPY.ledger;

    /* THE MANIFEST ROLL: one entry per work, in the order roll.json holds them,
       which is by year. Two lines and nothing else - the title on one line,
       then the authors, the year and the publication on one small line under
       it, joined by a spaced hyphen. Data only, printed as stored: a work that
       carries no journal in any registry prints its kind, which is what the
       file holds. Both lines are set here at their full length and are sized
       and, where they have to be, cut by fitRoll() at the first resize.
       Entries are static; only the list moves. */
    U.roll = el.querySelector('.tiw-seq-roll');
    U.rollList = el.querySelector('.tiw-seq-rolllist');
    this.rollEnt = [];
    if (U.rollList && this.roll) {
      const rows = this.roll.rows;
      const rollFrag = document.createDocumentFragment();
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const li = document.createElement('li');
        li.className = 'tiw-seq-rent';
        const ti = document.createElement('b');
        ti.textContent = r.t;
        const meta = document.createElement('i');
        meta.textContent = fitMetaFull(r);
        li.appendChild(ti);
        li.appendChild(meta);
        rollFrag.appendChild(li);
        this.rollEnt.push({ r: r, li: li, b: ti, i: meta });
      }
      U.rollList.appendChild(rollFrag);
    }

    /* While the roll runs, the first headline phrase moves to a single centred
       line at the bottom of the stage and the headline block itself is held
       down. It is the SAME string: the text is taken from the phrase that is
       already in the page, so there is no second copy of the copy anywhere.
       It rises and goes down on --tiw-roll; the headline block is let go only
       after that has reached zero, so the two are never both on screen. */
    if (U.roll && U.lede.length) {
      const rh = document.createElement('p');
      rh.className = 'tiw-seq-rollhead';
      rh.setAttribute('aria-hidden', 'true');
      rh.textContent = U.lede[0].textContent;
      U.roll.parentNode.insertBefore(rh, U.roll.nextSibling);
      U.rollHead = rh;
    }

    /* labels welded to the machinery */
    const mkTag = (cls, em, b) => {
      const t = document.createElement('div');
      t.className = 'tiw-seq-tag ' + cls;
      if (em !== null) { const e = document.createElement('em'); e.textContent = em; t.appendChild(e); }
      if (b !== null) { const s = document.createElement('b'); s.textContent = b; t.appendChild(s); }
      U.tags.appendChild(t);
      return t;
    };
    const gradeByKey = {};
    for (const g of this.data.grades) gradeByKey[g.k] = g;
    this.gradeReal = GORDER.map((g) => (gradeByKey[g] ? gradeByKey[g].c : 0));
    U.gradeTags = GORDER.map((g, i) => {
      const t = mkTag('is-grade', g.replace('_', ' '), '0');
      t.style.color = css(GRADE_COL[g]);
      return t;
    });
    U.nodeTags = this.data.mechanisms.map((m) => mkTag('is-node', m.c, m.n));
    U.callGhost = mkTag('is-call', null, 'abstract only');
    U.callSeam = mkTag('is-call', null, 'stitched');

    /* the 13 works with nothing extracted from them yet say so on the shelf */
    U.unlitTags = (this.unlitList || []).map(() => mkTag('is-unlit', null, COPY.unlit));

    /* the works that carry the most replicated findings, each with its tally */
    U.mrTags = (this.mrList || []).map((m) =>
      mkTag('is-mr', null, COPY.tally.replace('{r}', m.r).replace('{n}', m.n)));

    /* the second line of the findings caption, and the ledger of the five
       grades that count as evidence, filling band by band as the wall builds */
    const capWrap = document.createElement('div');
    capWrap.className = 'tiw-seq-capwrap';
    capWrap.setAttribute('aria-hidden', 'true');
    U.cap.parentNode.insertBefore(capWrap, U.cap);
    capWrap.appendChild(U.cap);
    const cap2 = document.createElement('p');
    cap2.className = 'tiw-seq-cap2';
    capWrap.appendChild(cap2);
    U.cap2 = cap2;
    U.capWrap = capWrap;

    const ev = this.ev;
    if (ev) {
      this.copyFindings = COPY.findings
        .replace('{on}', ev.totals.on_evidence)
        .replace('{all}', ev.totals.findings)
        .replace('{rep}', ev.totals.replicated);
      this.copyFindings2 = COPY.findings2.replace('{grades}',
        ev.on_evidence.map((g) => ev.grade_label[g] || g).join(', '));
    }
    const rail = document.createElement('div');
    rail.className = 'tiw-seq-rail';
    rail.setAttribute('aria-hidden', 'true');
    U.railRows = [];
    const maxN = (this.bands || []).reduce((a, b) => Math.max(a, b.n), 1);
    for (const B of (this.bands || [])) {
      const row = document.createElement('div');
      row.className = 'tiw-seq-railrow';
      const b = document.createElement('b');
      b.textContent = String(B.n);
      const em = document.createElement('em');
      em.textContent = B.label;
      const bar = document.createElement('span');
      bar.style.width = (14 + 86 * (B.n / maxN)).toFixed(1) + '%';
      const fill = document.createElement('i');
      bar.appendChild(fill);
      row.appendChild(b); row.appendChild(em); row.appendChild(bar);
      row.style.color = css(GRADE_COL[B.k] || PAL.muted);
      rail.appendChild(row);
      U.railRows.push({ row, fill });
    }
    U.wrap.querySelector('.tiw-seq-ui').appendChild(rail);
    U.rail = rail;

    this.cache = { tally: '', label: '', cap: '', cap2: '', ledeOp: '',
                   grade: new Array(8).fill(-1) };
  }

  setTag(el, wx, wy, wz, alpha, extra) {
    const hide = () => {
      if (el.style.opacity !== '0') el.style.opacity = '0';
      if (el.style.transform !== '') el.style.transform = '';
    };
    if (alpha <= 0.004) { hide(); return; }
    const v = this.scratch.pv.set(wx, wy, wz).project(this.camera);
    if (v.z > 1) { hide(); return; }
    const x = (v.x * 0.5 + 0.5) * this.stageW;
    const y = (-v.y * 0.5 + 0.5) * this.stageH;
    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) ' + extra;
    el.style.opacity = alpha.toFixed(3);
  }

  updateOverlay(q, p, fx) {
    const U = this.ui, vh = this.stageH;
    const out = smoother((q - 0.878) / 0.032);
    let ledeMax = 0;

    /* THE MANIFEST ROLL. A pure function of the raw scroll, so a backwards
       scrub runs it backwards exactly. Three writes a frame: one transform on
       the list, one custom property that fades the list, its scrim and the
       headline line together, and nothing per entry. Past the roll's section
       the transform is the same clamped value every time, so nothing is left
       on a stale layer. */
    const rollT = clamp01(this.pRaw / Math.max(1e-6, this.rollFrac));
    let rollA = 0;
    if (U.rollList && this.rollTravel) {
      rollA = 1 - smoother((rollT - ROLL_FADE) / (ROLL_OUT - ROLL_FADE));
      /* whole pixels: a fractional offset lets the compositor raster the same
         glyphs at two different sub-pixel origins, which is enough to make a
         rewind differ in the type even when every value is identical. At this
         rate a pixel of quantisation is invisible and the text stays crisp. */
      const ry = Math.round(this.rollY0 - rollEase(clamp01(rollT / ROLL_GEOM)) * this.rollTravel);
      U.rollList.style.transform = 'translate3d(0,' + ry + 'px,0)';
      U.wrap.style.setProperty('--tiw-roll', rollA.toFixed(3));
    }
    this.rollA = rollA;
    /* While the roll runs the stage prints the roll, the skip link and the one
       headline line at the bottom, and nothing else. The headline block and
       the works counter are held down for the whole of the roll's section and
       are let go only after the roll's opacity has reached zero, so the two
       are never on screen together and the handover has no overlap in it. */
    const notRoll = smoother((rollT - ROLL_OUT) / (1 - ROLL_OUT));

    /* The headline writes itself phrase by phrase, and holds what it wrote.
       It is keyed in p, not in the machinery clock: four of the six phrases
       belong to the wrangle now, and the fifth waits for the findings chapter
       to finish. Through the middle of the piece the block steps back so the
       records carry the frame, and comes up again with its last line. */
    const ledeMute = lerp(1, 0.34, smoother((p - 0.366) / 0.028)
      * (1 - smoother((p - 0.742) / 0.030)));
    for (let i = 0; i < U.lede.length; i++) {
      const inn = smoother((p - (LEDE_P[i] - 0.004)) / 0.020);
      const nxt = i < 5 ? smoother((p - (LEDE_P[i + 1] - 0.004)) / 0.020) : 0;
      const op = inn * (1 - 0.66 * nxt) * (1 - out) * (i === 5 ? 1 : ledeMute);
      const el = U.lede[i];
      el.style.opacity = op.toFixed(3);
      el.style.transform = 'translate3d(0,' + ((1 - inn) * 13).toFixed(1) + 'px,0)';
      if (op > ledeMax) ledeMax = op;
    }
    /* The whole block goes down for the roll, not phrase by phrase: while the
       roll is up the headline's own box carries no ink at all, which is what
       the clearance check reads. Its plate goes with it.
       The write is cached and the property is REMOVED once the roll is over,
       so past the roll the element is exactly what it was before this pass. A
       standing inline opacity, even at 1, changes how Chromium rasters the
       glyphs underneath it, and the frames after the roll then differ from the
       old build by a shade of antialiasing. */
    const ledeOp = notRoll < 1 ? notRoll.toFixed(3) : '';
    if (this.cache.ledeOp !== ledeOp) {
      U.ledeBox.style.opacity = ledeOp;
      this.cache.ledeOp = ledeOp;
    }
    ledeMax *= notRoll;
    U.wrap.style.setProperty('--tiw-scrim', Math.max(ledeMax * 0.92, fx * 0.52).toFixed(3));

    /* the last three words lock, then settle above the answers */
    const h1In = smoother((q - 0.890) / 0.030);
    const rise = smoother((q - 0.902) / 0.058);
    const y = lerp(vh * 0.40, this.h1Top, rise);
    U.h1.style.opacity = h1In.toFixed(3);
    U.h1.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0) scale(' +
      lerp(1.05, 1, rise).toFixed(4) + ')';

    /* captions: the rules the machine runs on */
    let cap = '', capA = 0;
    const capWin = (a, b, txt) => {
      const v = smoother((q - a) / 0.018) * (1 - smoother((q - b) / 0.020));
      if (v > capA) { capA = v; cap = txt; }
    };
    capWin(0.132, 0.230, COPY.plate);
    capWin(0.312, 0.398, COPY.stitched);
    capWin(0.448, 0.540, COPY.downgrade);
    capWin(0.726, 0.858, COPY.converge);
    /* the findings chapter and the most replicated works are keyed in p */
    let cap2 = '', cap2A = 0;
    const capP = (a, b, txt, second) => {
      const v = smoother((p - a) / 0.016) * (1 - smoother((p - b) / 0.018));
      if (v > capA) { capA = v; cap = txt; }
      if (second && v > cap2A) { cap2A = v; cap2 = second; }
    };
    if (this.copyFindings) capP(0.356, 0.694, this.copyFindings, this.copyFindings2);
    capP(0.694, 0.772, COPY.mostRep, '');
    if (cap && this.cache.cap !== cap) { U.cap.textContent = cap; this.cache.cap = cap; }
    U.cap.style.opacity = capA.toFixed(3);
    if (U.cap2) {
      if (this.cache.cap2 !== cap2) { U.cap2.textContent = cap2; this.cache.cap2 = cap2; }
      U.cap2.style.opacity = cap2A.toFixed(3);
    }
    /* the caption plate belongs to the findings chapter, where paper runs
       right through the words; the wrangle already has the top scrim */
    if (U.capWrap) U.capWrap.style.setProperty('--tiw-capscrim',
      (Math.max(capA, cap2A) * smoother((fx - 0.10) / 0.30)).toFixed(3));
    U.wrap.style.setProperty('--tiw-scrim-top',
      Math.max(capA * 0.55, this.rackOn || 0, (this.ledgerA || 0) * 0.9,
        (this.railA || 0) * 0.62).toFixed(3));

    /* the tally, ticking like a ledger */
    let n = 0, label = '', tallyA = 0;
    const tallyWin = (a, b, val, lab) => {
      const v = smoother((q - a) / 0.020) * (1 - smoother((q - b) / 0.024));
      if (v > tallyA) { tallyA = v; n = val; label = lab; }
    };
    const worksLit = Math.round(148 * smoother(q / 0.098));
    let found = 0;
    for (let j = 0; j < this.M; j++) {
      const wi = this.slWork[j];
      const qs = q - (0.028 * this.shU[wi] + 0.016 * hash1(j + 13));
      if (qs > 0.261) found++;
    }
    const scaleUp = 635 / Math.max(1, this.M);
    let gradedTotal = 0;
    for (let i = 0; i < 8; i++) gradedTotal += this.stamped[i];
    tallyWin(0.004, 0.126, worksLit, 'works');
    tallyWin(0.256, 0.416, Math.min(635, Math.round(found * scaleUp)), 'findings');
    tallyWin(0.434, 0.602, Math.min(635, Math.round(gradedTotal * scaleUp)), 'graded');
    tallyWin(0.712, 0.868, Math.min(this.data.counts.links,
      Math.round((this.linksArrived || 0) * (this.data.counts.links / Math.max(1, this.linkCount)))),
      'evidence links');
    const ns = String(n);
    if (this.cache.tally !== ns) { U.tallyN.textContent = ns; this.cache.tally = ns; }
    if (this.cache.label !== label) { U.tallyL.textContent = label; this.cache.label = label; }
    U.tally.style.opacity = (tallyA * notRoll).toFixed(3);

    /* the ledger of challenges, with the open gaps ticking past */
    const ledA = smoother((q - 0.598) / 0.022) * (1 - smoother((q - 0.716) / 0.026))
      * (1 - smoother((p - 0.346) / 0.014));
    this.ledgerA = ledA;
    U.ledger.style.opacity = ledA.toFixed(3);
    if (ledA > 0.004) {
      const w = segl(q, 0.606, 0.720) * Math.max(0, this.data.gaps.length - 4);
      U.gaps.style.transform = 'translate3d(0,' + (-w * this.gapLine).toFixed(1) + 'px,0)';
    } else if (U.gaps.style.transform !== '') U.gaps.style.transform = '';

    /* grade heads: real name, real count, filling as the slips pass */
    const rackA = this.rackOn || 0;
    for (let i = 0; i < 8; i++) {
      const t = U.gradeTags[i];
      const a = this.rackAnchor && this.rackAnchor[i];
      const shown = Math.min(this.gradeReal[i],
        Math.round(this.stamped[i] * (this.gradeReal[i] / Math.max(1, this.laneTotals[i]))));
      if (this.cache.grade[i] !== shown) {
        t.lastChild.textContent = String(shown);
        this.cache.grade[i] = shown;
      }
      /* the counts step aside for the ledger rather than crossing it */
      if (a) this.setTag(t, a[0], a[1], a[2], rackA * (1 - (this.ledgerA || 0)),
        'translate(-50%,-100%)');
      else t.style.opacity = '0';
    }

    /* mechanism nodes: code and name, next to the point they belong to */
    const nodeA = this.nodeVis || 0;
    /* the label clears the ring, whatever the node's distance is */
    const halfTan = Math.tan(this.camera.fov * Math.PI / 360);
    const nsz = this.nodeUni.uSize.value;
    const ncp = this.camera.position;
    for (let k = 0; k < U.nodeTags.length; k++) {
      const s = this.nodeScreen && this.nodeScreen[k];
      if (s) {
        const d = Math.max(0.5, Math.hypot(s[0] - ncp.x, s[1] - ncp.y, s[2] - ncp.z));
        const off = Math.round((0.90 * nsz / (halfTan * d)) * (this.stageH / 2)) + 10;
        /* a node near the right edge takes its label on the other side, so the
           name is never cut off by the frame */
        const sx = (this.scratch.pv.set(s[0], s[1], s[2]).project(this.camera).x * 0.5 + 0.5)
                 * this.stageW;
        const flip = sx + off + (U.nodeTagW ? U.nodeTagW[k] : 130) > this.stageW - 14;
        U.nodeTags[k].classList.toggle('is-left', flip);
        this.setTag(U.nodeTags[k], s[0], s[1], s[2], nodeA * 0.95,
          flip ? 'translate(calc(-100% - ' + off + 'px),-50%)'
               : 'translate(' + off + 'px,-50%)');
      } else this.setTag(U.nodeTags[k], 0, 0, 0, 0, '');
    }

    /* the two illustrative objects carry their word */
    if (this.ghostPos) {
      this.setTag(U.callGhost, this.ghostPos[0], this.ghostPos[1], this.ghostPos[2],
        this.ghostAlpha, 'translate(-50%,-100%)');
    }
    if (this.stitchPos) {
      this.setTag(U.callSeam, this.stitchPos[0], this.stitchPos[1], this.stitchPos[2],
        this.stitchAlpha, 'translate(-50%,-100%)');
    }

    /* the ledger of the findings chapter: the five grades that count as
       evidence, their real counts, and how much of each band has arrived */
    const railA = fx * (1 - smoother((p - 0.706) / 0.024));
    this.railA = railA;
    if (U.rail) {
      U.rail.style.opacity = railA.toFixed(3);
      for (let b = 0; b < U.railRows.length; b++) {
        const R = U.railRows[b];
        if (railA <= 0.004) {
          if (R.fill.style.transform !== '') R.fill.style.transform = '';
          R.row.classList.remove('is-live');
          continue;
        }
        const B = this.bands[b];
        const f = clamp01((p - B.p0) / Math.max(0.004, B.p1 - B.p0));
        R.fill.style.transform = 'scaleX(' + f.toFixed(4) + ')';
        R.row.classList.toggle('is-live', f > 0.002 && f < 0.999);
      }
    }

    /* the works nothing has been extracted from yet, on the shelf */
    const unlitA = smoother((p - 0.004) / 0.020) * (1 - smoother((p - 0.116) / 0.020));
    if (U.unlitTags) {
      const cpu = this.camera.position;
      for (let k = 0; k < U.unlitTags.length; k++) {
        const i = this.unlitList[k];
        const x = this.shPos[i * 3], y = this.shPos[i * 3 + 1], z = this.shPos[i * 3 + 2];
        const d = Math.hypot(x - cpu.x, y - cpu.y, z - cpu.z);
        const a = unlitA * smooth((d - 3.0) / 2.4) * (1 - smooth((d - 12.0) / 7.0));
        this.setTag(U.unlitTags[k], x, y + 0.05, z + 0.62, a, 'translate(-50%,-50%)');
      }
    }

    /* the tallies of the eight works with the most replicated findings */
    if (U.mrTags) {
      for (let k = 0; k < U.mrTags.length; k++) {
        const sc = this.mrScreen && this.mrScreen[k];
        this.setTag(U.mrTags[k], sc ? sc[0] : 0, sc ? sc[1] : 0, sc ? sc[2] : 0,
          sc ? sc[3] : 0, sc ? sc[4] : 'translate(-50%,4px)');
      }
    }

    /* the hand-over: the canvas dissolves onto the real cards underneath */
    const fade = smoother((q - 0.966) / 0.030);
    U.canvas.style.opacity = (1 - fade).toFixed(3);
    U.stage.style.backgroundColor = fade > 0.001
      ? 'rgba(' + this.bgRGB + ',' + (1 - fade).toFixed(3) + ')' : '';
    U.stage.style.pointerEvents = fade > 0.5 ? 'none' : '';
    U.skip.style.opacity = (1 - smoother((q - 0.858) / 0.036)).toFixed(3);
    document.documentElement.style.setProperty('--tiw-cards-in',
      smoother((q - 0.944) / 0.042).toFixed(3));
  }

  /* ---------------------------------------------------- frame ------------ */
  update(pr) {
    /* pr is the reader's scroll through the WHOLE track, the roll's own
       section included. p is the scroll through the CHAPTERS, which is the
       clock every line below is written in: the roll holds it at 0 and hands
       over at exactly 0 where the shelf begins, so no beat after the roll
       moved by a pixel. q is the machinery clock, a pure function of p. fx is
       how much of the frame the findings chapter owns. */
    this.pRaw = pr;
    const p = this.rollFrac ? clamp01((pr - this.rollFrac) / (1 - this.rollFrac)) : pr;
    const q = qOf(p);
    const fx = fxOf(p);
    this.q = q; this.fx = fx;
    this.updateCamera(q, p, fx);
    this.placeRecords(p, fx);
    this.updateSheets(q, p, fx);
    this.updateSlips(q, p, fx);
    this.updateRecords(p, fx);
    this.updateRack(q, fx);
    this.updateThreads(q, fx);
    this.updateNodes(q, fx);
    this.updateCards(q);
    this.updateTuck(q, p);
    this.updateAtmosphere(q, p, fx);
    this.updateOverlay(q, p, fx);
  }

  render() {
    const r = this.renderer;
    r.setRenderTarget(this.rtScene);
    r.clear();
    r.render(this.scene, this.camera);
    this.lastCalls = r.info.render.calls;
    this.lastTris = r.info.render.triangles;

    const bm = this.blurMat, u = bm.uniforms;
    this.fsMesh.material = bm;
    const sx = 1 / this.hw, sy = 1 / this.hh;
    u.tSrc.value = this.rtScene.texture; u.uStep.value.set(sx, 0);
    r.setRenderTarget(this.rtA); r.render(this.fsScene, this.fsCam);
    u.tSrc.value = this.rtA.texture; u.uStep.value.set(0, sy);
    r.setRenderTarget(this.rtB); r.render(this.fsScene, this.fsCam);
    u.tSrc.value = this.rtB.texture; u.uStep.value.set(sx * 2.2, 0);
    r.setRenderTarget(this.rtA); r.render(this.fsScene, this.fsCam);
    u.tSrc.value = this.rtA.texture; u.uStep.value.set(0, sy * 2.2);
    r.setRenderTarget(this.rtB); r.render(this.fsScene, this.fsCam);

    const cu = this.compMat.uniforms;
    cu.tSharp.value = this.rtScene.texture;
    cu.tBlur.value = this.rtB.texture;
    cu.tDepth.value = this.rtScene.depthTexture;
    cu.uNear.value = this.camera.near;
    cu.uFar.value = this.camera.far;
    this.fsMesh.material = this.compMat;
    r.setRenderTarget(null);
    r.render(this.fsScene, this.fsCam);
  }

  /* ------------------------------------------------- the roll's type ----- */
  /* One line per title, fitted to the width of the roll window. Two batched
     passes and two forced layouts, at boot and on any resize that changes the
     width; a height-only resize, which is what a mobile URL bar does, returns
     at once. Nothing here runs in the frame loop, and what it leaves behind is
     294 font sizes and, for the lines that had to be cut, 294 strings. */
  fitRoll() {
    const U = this.ui, ents = this.rollEnt;
    if (!U || !U.roll || !U.rollList || !ents || !ents.length) return;
    const target = U.roll.clientWidth;
    if (!target || target === this.fitW) return;
    this.fitW = target;
    const lim = target * FIT_SAFE;
    const tR = fitRange(this.vw), mR = fitMetaRange(this.vw);
    const n = ents.length;
    const probe = (box, tag, str) => {
      const e = document.createElement(tag);
      e.textContent = str;
      box.appendChild(e);
      return e;
    };

    /* PASS ONE. Every full string, once, at FIT_REF. The appends are free; the
       first read is the one forced layout and every read after it is served
       from that same layout, because nothing is written in between. Width is
       linear in the size - all the letter-spacing here is in em - so one
       measurement answers for every size the string could take. */
    const box = document.createElement('div');
    box.className = 'tiw-seq-fit';
    const pr = [];
    for (let i = 0; i < n; i++) {
      pr.push(probe(box, 'b', ents[i].r.t));
      pr.push(probe(box, 'i', fitMetaFull(ents[i].r)));
    }
    U.roll.appendChild(box);
    const w = new Array(pr.length);
    for (let i = 0; i < pr.length; i++) w[i] = pr[i].getBoundingClientRect().width;

    const need = [];
    for (let i = 0; i < n; i++) {
      const e = ents[i];
      e.ts = Math.min(tR[1], (lim / Math.max(1, w[i * 2])) * FIT_REF);
      e.tcut = e.ts < tR[0];
      if (e.tcut) e.ts = tR[0];
      e.ts = Math.floor(e.ts * 10) / 10;
      e.tt = e.r.t;
      e.ms = Math.min(mR[1], (lim / Math.max(1, w[i * 2 + 1])) * FIT_REF);
      e.mcut = e.ms < mR[0];
      if (e.mcut) e.ms = mR[0];
      e.ms = Math.floor(e.ms * 10) / 10;
      e.mt = fitMetaFull(e.r);
      if (e.tcut || e.mcut) need.push(i);
    }

    /* PASS TWO. The candidates for the lines that still overran at the floor
       size, all of them in the box at once and read in one go again. The
       candidates come longest first, so the first that fits is the one that
       loses the fewest words. What is measured is the whole printed string,
       the mark included, so what is picked is exactly what is printed. */
    if (need.length) {
      box.textContent = '';
      const grp = [];
      for (let j = 0; j < need.length; j++) {
        const e = ents[need[j]];
        if (e.tcut) {
          const c = fitTitleCuts(e.r.t);
          grp.push({ e: e, k: 't', c: c, el: c.map((str) => probe(box, 'b', str)) });
        }
        if (e.mcut) {
          const c = fitMetaCuts(e.r);
          grp.push({ e: e, k: 'm', c: c, el: c.map((str) => probe(box, 'i', str)) });
        }
      }
      for (let j = 0; j < grp.length; j++) {
        const g = grp[j], sz = g.k === 't' ? g.e.ts : g.e.ms;
        if (!g.c.length) { if (g.k === 't') g.e.tcut = false; else g.e.mcut = false; continue; }
        let pick = g.c.length - 1;
        for (let k = 0; k < g.c.length; k++) {
          if ((g.el[k].getBoundingClientRect().width * sz) / FIT_REF <= lim) { pick = k; break; }
        }
        if (g.k === 't') g.e.tt = g.c[pick]; else g.e.mt = g.c[pick];
      }
    }
    U.roll.removeChild(box);

    /* THE CADENCE. Every entry is set to the same height, so the roll beats
       evenly however the type under it varies. The height is what a title at
       the cap needs; a smaller title spends the difference on its own padding,
       not on the space between its two lines, so an entry always reads as one
       pair and the air lands between entries. */
    const gap = Math.round(mR[1] * 0.8);
    const pad = fitPad(this.vw);
    const eh = Math.round(tR[1] * FIT_TLH) + gap + Math.round(mR[1] * FIT_MLH) + pad * 2;
    this.rollEH = eh;
    U.rollList.style.setProperty('--tiw-rgap', gap + 'px');
    for (let i = 0; i < n; i++) {
      const e = ents[i];
      const p = Math.max(0, (eh - e.ts * FIT_TLH - gap - e.ms * FIT_MLH) / 2);
      e.li.style.padding = p.toFixed(1) + 'px 0';
      e.b.style.fontSize = e.ts + 'px';
      if (e.b.textContent !== e.tt) e.b.textContent = e.tt;
      e.i.style.fontSize = e.ms + 'px';
      if (e.i.textContent !== e.mt) e.i.textContent = e.mt;
    }
  }

  /* ---------------------------------------------------- measure ---------- */
  resize() {
    const de = document.documentElement;
    this.vw = de.clientWidth;
    this.vh = window.innerHeight;
    this.stageW = this.vw;
    this.stageH = this.vh;
    de.style.setProperty('--tiw-vh', this.vh + 'px');
    de.style.setProperty('--tiw-vw', this.vw + 'px');

    /* THE ROLL AND THE BUDGET. The list is measured here and nowhere else: no
       layout read runs in the frame loop. The roll's scroll length is DERIVED
       from the real list height, so the list moves ROLL_RATIO px for every px
       of scroll whatever the type ends up measuring, and it is capped so the
       whole track stays inside 2000vh. The chapters keep their 8vh - the roll
       is added in front of them - which is why nothing after it changed.
       rollY0 puts the first entry already inside the window at p = 0; the
       extra part of a window on the travel is what empties the window before
       the fade starts.

       The type is fitted FIRST, because the list height it produces is what
       the whole budget is derived from. Change the fit and the roll re-times
       itself; there is no length written down anywhere. */
    this.fitRoll();
    this.rollLen = 0;
    if (this.ui && this.ui.roll && this.ui.rollList) {
      this.rollWinH = this.ui.roll.clientHeight || 1;
      this.rollH = this.ui.rollList.offsetHeight || 1;
      this.rollY0 = Math.round(this.rollWinH * 0.44);
      this.rollTravel = this.rollY0 + this.rollH + this.rollWinH * 0.45;
      this.rollLen = Math.min(Math.round(this.rollTravel / ROLL_RATIO),
                              Math.round(this.vh * ROLL_MAX_VH));
      this.rollRatio = this.rollTravel / Math.max(1, this.rollLen);
    }
    const trackH = Math.round(this.vh * 8) + this.rollLen;
    de.style.setProperty('--tiw-track-h', trackH + 'px');
    const par = this.trackEl.parentElement;
    const pr = par.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(par).paddingLeft) || 0;
    de.style.setProperty('--tiw-bleed', (-(pr.left + pad)).toFixed(1) + 'px');
    de.style.setProperty('--tiw-lead', (pr.left + pad).toFixed(1) + 'px');
    this.fitLanding();
    de.style.setProperty('--tiw-pull', -(this.vh - this.headroom) + 'px');

    const tr = this.trackEl.getBoundingClientRect();
    this.trackTop = tr.top + window.scrollY;
    this.trackLen = Math.max(1, trackH - this.vh);
    /* how much of the reader's scroll the roll owns. Everything downstream
       reads the CHAPTER clock, which is this shift taken back out again. */
    this.rollFrac = this.rollLen / this.trackLen;

    const dpr = this.prof.dpr;
    this.renderer.setSize(this.stageW, this.stageH, false);
    this.camera.aspect = this.stageW / this.stageH;
    this.frameComp = clamp(Math.sqrt(1.55 / this.camera.aspect), 1, 1.36);
    this.camera.updateProjectionMatrix();
    const pw = Math.round(this.stageW * dpr), ph = Math.round(this.stageH * dpr);
    this.rtScene.setSize(pw, ph);
    this.hw = Math.max(4, Math.round(pw * this.prof.blurScale));
    this.hh = Math.max(4, Math.round(ph * this.prof.blurScale));
    this.rtA.setSize(this.hw, this.hh);
    this.rtB.setSize(this.hw, this.hh);
    this.compMat.uniforms.uRes.value.set(pw, ph);
    for (const rb of [this.tethers, this.threads, this.redThreads]) {
      rb.uni.uRes.value.set(pw, ph);
      rb.uni.uThick.value = rb.base * dpr;
    }
    this.nodeUni.uSize.value = this.prof.small ? 0.66 : 0.90;

    const g0 = this.ui.gaps.firstElementChild;
    this.gapLine = g0 ? g0.getBoundingClientRect().height : 20;

    /* how wide each mechanism label runs, so it can be laid on whichever side
       of its node keeps the whole name inside the frame */
    this.ui.nodeTagW = this.ui.nodeTags.map((t) => t.offsetWidth || 130);
    this.measureCards();
  }

  /* The landing composition. At p = 1 the reader has to see the h1, the
     banner, the standfirst and the first row of real cards at once. The banner
     and the standfirst are real DOM whose height depends on the copy and on
     the width, so they are measured and the h1 is given whatever room is left,
     rather than sized from a guess. Everything downstream reads this.headroom,
     which is what --tiw-pull is built from. */
  fitLanding() {
    const de = document.documentElement;
    const vh = this.vh;
    const top = Math.round(clamp(vh * 0.045, 14, 46));
    const gap = Math.round(clamp(vh * 0.030, 12, 36));
    const row = Math.round(clamp(vh * 0.19, 84, 210));
    const sh = this.sharedEl ? Math.ceil(this.sharedEl.getBoundingClientRect().height) : 0;
    const h1 = this.ui && this.ui.h1 ? this.ui.h1.querySelector('.tiw-h1') : null;
    let size = clamp(this.vw * (this.narrow ? 0.155 : 0.100), 34, 160);
    let h = size * 0.9;
    for (let i = 0; i < 8; i++) {
      de.style.setProperty('--tiw-h1-size', size.toFixed(1) + 'px');
      h = h1 ? h1.offsetHeight : size * 0.9;
      if (top + h + gap + sh + row <= vh || size <= 34.5) break;
      size = Math.max(34, size * 0.88);
    }
    this.h1Top = top;
    this.sharedH = sh;
    this.headroom = Math.round(top + h + gap);
  }

  measureCards() {
    if (!this.cardEls || !this.cardEls.length) return;
    const sy = window.scrollY, sx = window.scrollX;
    this.cardDoc = this.cardEls.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + sx, y: r.top + sy, w: r.width, h: r.height };
    });
    const g = this.frameComp || 1;
    const dist = Math.abs(Z_CARDS - CAM_END_Z) * g;
    const halfH = Math.tan(((36 + (g - 1) * 5.0) * Math.PI / 180) / 2) * dist;
    const halfW = halfH * (this.stageW / this.stageH);
    const endScroll = this.trackTop + this.trackLen;
    this.cardWorld = this.cardDoc.map((r) => ({
      x: ((r.x + r.w / 2) / this.stageW * 2 - 1) * halfW,
      y: -((r.y - endScroll + r.h / 2) / this.stageH * 2 - 1) * halfH,
      w: (r.w / this.stageW) * 2 * halfW,
      h: (r.h / this.stageH) * 2 * halfH,
    }));
  }

  readProgress() {
    return clamp01(((window.scrollY || window.pageYOffset) - this.trackTop) / this.trackLen);
  }

  /* critically damped, so the paper carries mass and still rewinds exactly */
  step(dt) {
    const w = 11.5;
    const d = this.p - this.target;
    this.pv += (-2 * w * this.pv - w * w * d) * dt;
    this.p = clamp01(this.p + this.pv * dt);
    if (Math.abs(this.p - this.target) < 2e-6 && Math.abs(this.pv) < 2e-5) {
      this.p = this.target; this.pv = 0;
    }
  }

  draw() {
    const t0 = performance.now();
    this.update(this.p);
    this.render();
    this.drawMs = performance.now() - t0;
    this.drawAcc = (this.drawAcc || 0) + this.drawMs;
    this.drawN = (this.drawN || 0) + 1;
  }

  start() {
    this.last = performance.now();
    this.lastDrawn = -1;
    this.idle = 99;
    this.force = false;
    const loop = (now) => {
      this.rafId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
      this.last = now;
      this.target = this.readProgress();
      this.step(dt);
      const moved = Math.abs(this.p - this.lastDrawn) > 1.2e-5;
      if (moved || this.idle < 3 || this.force) {
        this.draw();
        this.lastDrawn = this.p;
        this.idle = moved ? 0 : this.idle + 1;
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }
}

/* ------------------------------------------------------- 7  boot --------- */

function hasWebGL2() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!gl) return false;
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return true;
  } catch (e) { return false; }
}

function readCards() {
  const els = Array.from(document.querySelectorAll('.tiw main.grid > details.card'));
  return els.map((el) => {
    const q = el.querySelector('h2 .eyebrow-q');
    const eb = el.querySelector('h2 .eyebrow');
    const link = el.querySelector('a[href*="mechanism.html#"]');
    let code = '';
    if (link) {
      const m = link.getAttribute('href').match(/#([MR]\d+)/);
      if (m) code = m[1];
    }
    return { el, q: q ? q.textContent.trim() : '', code,
             eyebrow: eb ? eb.textContent.trim() : 'This is why' };
  }).filter((c) => c.q);
}

async function boot() {
  const wrap = document.getElementById('tiw-seq');
  if (!wrap) return;
  if (REDUCED) return;
  const track = document.getElementById('tiw-seq-track');
  const stage = wrap.querySelector('.tiw-seq-stage');
  const canvas = wrap.querySelector('.tiw-seq-canvas');
  if (!track || !stage || !canvas) return;
  if (!hasWebGL2()) return;

  const prof = pickProfile();
  const theme = wrap.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  let data, ev, roll;
  try {
    const all = await Promise.all([loadJSON('corpus.json'), loadJSON('evidence.json'),
                                   loadJSON('roll.json')]);
    data = all[0]; ev = all[1]; roll = all[2];
  } catch (e) { return; }   /* any file missing leaves the baked page up */
  await readyFonts();

  const cardList = readCards().slice(0, data.counts.answers || 20);
  const seq = new Sequence(wrap, data, ev, prof, theme);
  seq.trackEl = track;
  seq.roll = roll;
  /* the banner and the standfirst: one block, on the page in both states */
  seq.sharedEl = document.getElementById('tiw-shared');
  seq.cardEls = cardList.map((c) => c.el);
  seq.cardNode = cardList.map((c) => {
    const mechs = data.mechanisms;
    for (let k = 0; k < mechs.length; k++) if (mechs[k].c === c.code) return k;
    return -1;
  });
  seq.layout();

  const atlases = {};
  atlases.sheet = buildSheetAtlas(data.works, prof.sheet);
  await raf1();
  atlases.slip = await buildSlipAtlas(data.findings.slice(0, seq.M), prof.slip);
  const heroItems = [];
  for (let h = 0; h < 8; h++) heroItems.push({ kind: 'find', f: data.findings[seq.heroPicks[h]] });
  heroItems.push({ kind: 'seam' });
  for (const c of data.challenges.slice(0, 8)) heroItems.push({ kind: 'challenge', t: c.t, a: c.a, y: c.y });
  atlases.hero = buildHeroAtlas(heroItems, prof.hero);
  atlases.stamp = buildStampAtlas(prof.stamp);
  atlases.rec = buildRecordAtlas(seq.recPick, prof.rec, theme === 'dark');
  await raf1();
  atlases.cardList = cardList;
  atlases.cards = buildCardAtlas(cardList, prof.card, theme === 'dark');
  await raf1();

  seq.bgRGB = theme === 'dark' ? '29,8,12' : '230,217,187';
  seq.buildOverlay(wrap);
  seq.build(canvas, atlases);

  /* the page keeps exactly one h1: the real one moves into the stage */
  const h1 = document.querySelector('.tiw-fallback .tiw-h1');
  if (h1) seq.ui.h1.appendChild(h1);
  document.documentElement.classList.add('tiw-seq-on');
  await raf1();

  seq.resize();
  seq.target = seq.readProgress();
  seq.p = seq.target;
  seq.draw();
  seq.start();

  let rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => { seq.resize(); seq.draw(); }, 120);
  };
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
  document.addEventListener('toggle', () => {
    requestAnimationFrame(() => { seq.measureCards(); });
  }, true);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(seq.rafId);
    document.documentElement.classList.remove('tiw-seq-on');
  });

  window.__tiwSeq = seq;
  window.__tiwSettle = () => { seq.p = seq.target = seq.readProgress(); seq.pv = 0; seq.draw(); };
  window.__tiwPerf = (ms) => new Promise((res) => {
    seq.force = true;
    let n = 0;
    seq.drawAcc = 0; seq.drawN = 0;
    const t0 = performance.now();
    const tick = () => {
      n++;
      if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      else {
        seq.force = false;
        const el = performance.now() - t0;
        res({ fps: Math.round((n * 1000) / el),
              drawMs: Math.round((seq.drawAcc / Math.max(1, seq.drawN)) * 100) / 100,
              calls: seq.lastCalls, tris: seq.lastTris });
      }
    };
    requestAnimationFrame(tick);
  });
  window.__tiwReady = true;
}

boot().catch((e) => {
  /* any failure leaves the baked static hero in place. The reason is kept on
     the window so a check can read it; nothing is written to the console. */
  window.__tiwErr = (e && e.message) ? e.message : String(e);
});
