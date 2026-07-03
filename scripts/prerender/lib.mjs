/* ============================================================================
   lib.mjs - shared helpers for the Cor pre-render (SESSION 1, local proving).

   Three concerns:
     1. A trivial static HTTP server over dist/ (so pages behave as in prod,
        not file://).
     2. String-level mount injection: splice captured innerHTML into an EXISTING
        empty mount element in a shell file, keeping its opening tag+attributes
        and adding data-prerendered="1". Never touches anything else. Aborts if
        the mount id is not found exactly once.
     3. markmap-markdown -> semantic nested <ul> (for the mindmap fallback), so
        no-JS/crawler fetches get the full tree as real deep-links.

   No external deps here (playwright is only used by prerender.mjs/verify.mjs).
   ============================================================================ */

import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, normalize, extname } from "node:path";

/* ---------------------------------------------------------------------------
   1. Static server
   --------------------------------------------------------------------------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// Serve `rootDir` over localhost on an ephemeral port. Resolves to { server, port, base }.
export async function startServer(rootDir) {
  const server = http.createServer(async (req, res) => {
    try {
      let pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      if (pathname.endsWith("/")) pathname += "index.html";
      // Prevent path traversal: normalize and strip leading slashes, join under root.
      const safe = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "").replace(/^[/\\]+/, "");
      const filePath = join(rootDir, safe);
      if (!filePath.startsWith(rootDir)) { res.writeHead(403); res.end("forbidden"); return; }
      const buf = await readFile(filePath);
      res.writeHead(200, { "content-type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream" });
      res.end(buf);
    } catch (e) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  return { server, port, base: `http://127.0.0.1:${port}` };
}

/* ---------------------------------------------------------------------------
   2. Mount injection (string-level, surgical)
   --------------------------------------------------------------------------- */
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// Find the index just past the '>' that closes the opening tag starting at openStart,
// respecting quoted attribute values. Returns the index OF the '>' (not past it).
function openTagGt(html, openStart) {
  let q = null;
  for (let i = openStart + 1; i < html.length; i++) {
    const ch = html[i];
    if (q) { if (ch === q) q = null; }
    else if (ch === '"' || ch === "'") q = ch;
    else if (ch === ">") return i;
  }
  return -1;
}

// Find the matching close tag for `tag`, starting the scan at fromIdx (which must be
// just past the element's own opening '>'). Handles nested same-tag elements.
// Returns { closeStart, closeEnd } or null.
function matchingClose(html, tag, fromIdx) {
  const re = new RegExp(`<${escapeRegExp(tag)}(?=[\\s/>])|</${escapeRegExp(tag)}\\s*>`, "gi");
  re.lastIndex = fromIdx;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === "/") { depth--; if (depth === 0) return { closeStart: m.index, closeEnd: re.lastIndex }; }
    else depth++;
  }
  return null;
}

// Add attr="val" to an opening tag string, before the final '>'. No-op if present.
function addAttr(openTag, name, val) {
  if (new RegExp(`\\b${escapeRegExp(name)}\\s*=`).test(openTag)) return openTag;
  return openTag.replace(/>$/, ` ${name}="${val}">`);
}

// Locate the single element carrying id="ID" (or id='ID'). Throws unless found
// exactly once. Returns { openStart, gt, tag, openTag, closeStart, closeEnd }.
export function locateMount(html, id) {
  const idRe = new RegExp(`\\bid\\s*=\\s*("${escapeRegExp(id)}"|'${escapeRegExp(id)}')`, "g");
  const ms = [...html.matchAll(idRe)];
  if (ms.length !== 1) {
    throw new Error(`mount id="${id}": found ${ms.length} occurrence(s), expected exactly 1 (never a partial bake)`);
  }
  const idIdx = ms[0].index;
  const openStart = html.lastIndexOf("<", idIdx);
  if (openStart < 0) throw new Error(`mount id="${id}": could not find opening '<'`);
  const gt = openTagGt(html, openStart);
  if (gt < 0) throw new Error(`mount id="${id}": unterminated opening tag`);
  const openTag = html.slice(openStart, gt + 1);
  const tm = /^<([a-zA-Z][\w:-]*)/.exec(openTag);
  if (!tm) throw new Error(`mount id="${id}": could not parse tag name from ${openTag.slice(0, 40)}`);
  const tag = tm[1];
  const close = matchingClose(html, tag, gt + 1);
  if (!close) throw new Error(`mount id="${id}": no matching </${tag}> found`);
  return { openStart, gt, tag, openTag, closeStart: close.closeStart, closeEnd: close.closeEnd };
}

// Replace the innerHTML of the element with id=ID, adding data-prerendered="1" to
// its opening tag. Keeps the opening tag (+attrs) and the closing tag verbatim.
export function injectMount(html, id, innerHTML) {
  const m = locateMount(html, id);
  const newOpen = addAttr(m.openTag, "data-prerendered", "1");
  const closeTag = html.slice(m.closeStart, m.closeEnd);
  return html.slice(0, m.openStart) + newOpen + innerHTML + closeTag + html.slice(m.closeEnd);
}

// Insert `insertHtml` immediately AFTER the element with id=ID (used to add the
// mindmap fallback next to the SVG mount, which must stay untouched).
export function insertAfterMount(html, id, insertHtml) {
  const m = locateMount(html, id);
  return html.slice(0, m.closeEnd) + insertHtml + html.slice(m.closeEnd);
}

/* ---------------------------------------------------------------------------
   3. markmap markdown -> semantic nested <ul>
   --------------------------------------------------------------------------- */
function escHtml(t) {
  return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escAttr(t) {
  return String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
// Escape text, then promote *em* and `code` to real tags. (Applied to non-link runs.)
function fmtText(t) {
  let e = escHtml(t);
  e = e.replace(/`([^`]+)`/g, "<code>$1</code>");
  e = e.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return e;
}
// Inline markdown -> HTML: links + em + code. Everything else escaped.
function inline(s) {
  let out = "", last = 0;
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(s))) {
    out += fmtText(s.slice(last, m.index));
    out += `<a href="${escAttr(m[2].trim())}">${fmtText(m[1])}</a>`;
    last = re.lastIndex;
  }
  out += fmtText(s.slice(last));
  return out;
}

// Convert a markmap markdown string (frontmatter + headings + nested bullets)
// into a nested <ul>. Headings and bullets both become <li>; nesting is by
// heading level (# = 1) and list indentation (2 spaces per level under the
// current heading). Leaf deep-links ([text](href)) are preserved as <a href>.
export function markmapMdToUl(md) {
  // Strip leading YAML frontmatter (--- ... ---).
  let body = md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  const lines = body.split(/\r?\n/);

  const items = []; // { depth, html }
  let curHeadingDepth = 0;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(raw);
    if (h) {
      const depth = h[1].length;
      curHeadingDepth = depth;
      items.push({ depth, html: inline(h[2].trim()) });
      continue;
    }
    const li = /^(\s*)[-*+]\s+(.*)$/.exec(raw);
    if (li) {
      const indent = li[1].replace(/\t/g, "  ").length;
      const depth = curHeadingDepth + 1 + Math.floor(indent / 2);
      items.push({ depth, html: inline(li[2].trim()) });
      continue;
    }
    // Loose paragraph line under a heading: treat as a child of the heading.
    items.push({ depth: curHeadingDepth + 1, html: inline(raw.trim()) });
  }

  // Build a tree from the (monotonic-ish) depth sequence.
  const root = { children: [] };
  const stack = [{ depth: 0, node: root }];
  for (const it of items) {
    while (stack.length > 1 && stack[stack.length - 1].depth >= it.depth) stack.pop();
    const parent = stack[stack.length - 1].node;
    const node = { html: it.html, children: [] };
    parent.children.push(node);
    stack.push({ depth: it.depth, node });
  }

  function render(nodes) {
    if (!nodes.length) return "";
    return "<ul>" + nodes.map((n) =>
      "<li>" + n.html + render(n.children) + "</li>"
    ).join("") + "</ul>";
  }
  return render(root.children);
}
