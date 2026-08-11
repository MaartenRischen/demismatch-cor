/* ============================================================================
   contradiction-gate.mjs - contradiction checks for the Cor deploy.

   verify.mjs is the HARD gate (count + prerender integrity). This module adds
   contradiction checks in TWO tiers:

     HARD (block the deploy): D1, D2, D7, D8, D9, D10. Structural, snapshot-only,
       no network dependency, zero false positives across the current corpus. D2 is
       a pure regression test - "forced" must never return as a mechanism grade.
       D7-D10 gate the copy-drift classes found live on 2026-08-11.
     SOFT (WARN only, never blocks): D3, D4, D5, D6. Promote a soft detector to
       hard only after it has run clean across several builds AND, for D4/D5, only
       after removing its network dependency (a fail-soft fetch must never gate).

   Each finding carries `blocking`. A blocking finding with count>0 fails the
   deploy; every other finding only warns.

   Ten detectors, each mapped to a class of defect that actually shipped in this
   corpus (see _audit/DB_AUDIT_FINDINGS.md):

     D1  Held-out (challenge-layer) extraction used as ACTIVE evidence, watching
         BOTH challenge-carrying fields (source_type AND evidence_role); its
         field-mismatch companion D1b (ext-617 shape) is soft.
     D2  Mechanism graded "forced" without a dedicated forcing convergence
         (post-migration regression guard - grade is never literally "forced"
         now, so this is permanently clean unless someone re-introduces it).
     D3  A record asserting a figure another record calls unsupported
         (ED9 / EEA-TOUCH-01). STUBBED: needs a curated claims-ledger.
     D4  Bracketed insertion inside a quote in the CONTENT field, on a row with
         no author_quote (the Hrdy [primate genera] fabrication shape).
     D5  Sentence-length quotation living in CONTENT with no author_quote (the
         structural hole R3 never checks). Expected ~13 = trade-book backlog.
     D6  Captured-asset counts (the mindmap) drifting from the live DB counts
         (the stale-mindmap-PNG case: 22 domains rendered when the DB has 23).
     D7  A surface rendering "Forced by" for a mechanism no convergence forces
         (the mechanism cards + bridge-paper table, live 2026-08-11).
     D8  demismatch.com's hand-coded counts drifting from the snapshot (that site
         has no build step, so its numbers are gated from here).
     D9  A hardcoded architecture total contradicting the DB total (the bridge
         paper enumerating 17 foundations / 14 convergences under its live strip).
     D10 Cor / the atlas / the spec claimed as "ground truth" rather than the
         reference standard preferences get checked against.

   Data sources:
     - D1, D2, D6 read the shipped snapshot.json (what actually deploys).
     - D4, D5 need extraction content + author_quote, which the light snapshot
       projection deliberately omits, so they do a READ-ONLY anon fetch of the
       live corpus. If that fetch fails, those two detectors are skipped with a
       warning (fail-soft) - they never block.

   Usage (standalone):  node contradiction-gate.mjs --dist <distDir>
   Or import { runContradictionGate } and call from verify.mjs.
   ============================================================================ */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Public anon REST endpoint (RLS anon-SELECT only) - identical to the key the
   live site and build-snapshot.py already use. Read-only. */
const API_URL = "https://usgsgroxdblteosyxary.supabase.co/rest/v1";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZ3Nncm94ZGJsdGVvc3l4YXJ5Iiwicm9sZSI6ImFub24i" +
  "LCJpYXQiOjE3NzUxMTkyNjksImV4cCI6MjA5MDY5NTI2OX0." +
  "xuZOTQHtA8u1t8uBHwkcJevfniqf3QttioxFc1yKMMU";

/* Detector 5 length floor: a quoted span this long in CONTENT is doing verbatim
   work the field R3 never checks. 25 lands the current ~13-row trade-book
   backlog; tune here as that backlog clears. */
const QUOTE_LEN_FLOOR = 25;

/* ---- smart-quote model -----------------------------------------------------
   Return every quoted span in `text`: straight/curly double quotes, curly
   single quotes (directional, unambiguous), and straight single quotes that are
   quotation rather than possession. The straight-single rule excludes
   possessives (x'y, s') by requiring the opening ' to not follow a letter and
   the closing ' to not precede a letter. Mirrors the tuned Python prototype. */
function quotedSpans(text) {
  if (!text) return [];
  const out = [];
  const patterns = [
    /"([^"]+)"/g, // straight double
    /“([^”]+)”/g, // curly double  “ ”
    /‘([^’]+)’/g, // curly single  ‘ ’
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) out.push(m[1]);
  }
  // Straight single-quote quotation, possessive-excluding.
  const single = /(?<![A-Za-z])'([A-Za-z][^']*?[A-Za-z.!?,;:)])'(?![A-Za-z])/g;
  let sm;
  while ((sm = single.exec(text)) !== null) out.push(sm[1]);
  return out;
}

function hasAuthorQuote(e) {
  return typeof e.author_quote === "string" && e.author_quote.trim().length > 0;
}

/* ---- read-only anon fetch of extraction content (D4/D5 only) --------------- */
async function fetchExtractionContent() {
  const url =
    `${API_URL}/v2_extractions?select=id,author_quote,content,source_type&order=id`;
  // Hard timeout so a slow/hung endpoint can never stall the deploy (the gate is
  // fail-soft, but only if it actually returns).
  const resp = await fetch(url, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

/* ---- text-readable shipped assets (D7, D9, D10) ---------------------------
   Every .html/.js/.md under dist/, read once and cached per run. Binary assets
   and vendor bundles are skipped: nothing there carries authored claims. */
const _assetCache = new Map();
async function textAssets(dist) {
  if (_assetCache.has(dist)) return _assetCache.get(dist);
  const out = [];
  const walk = async (dir, rel) => {
    let entries;
    try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (e.name === "vendor" || e.name === "node_modules" || e.name === "assets") continue;
        await walk(join(dir, e.name), r);
      } else if (/\.(html|js|md)$/i.test(e.name)) {
        try { out.push([r, await readFile(join(dir, e.name), "utf8")]); } catch { /* skip */ }
      }
    }
  };
  await walk(dist, "");
  _assetCache.set(dist, out);
  return out;
}

/* ---------------------------------------------------------------------------- */
export async function runContradictionGate({ dist, snap, repoRoot, fetchImpl } = {}) {
  dist = dist || resolve(process.cwd(), "dist");
  repoRoot = repoRoot || resolve(dist, "..");
  if (!snap) {
    snap = JSON.parse(await readFile(join(dist, "data", "snapshot.json"), "utf8"));
  }
  const T = snap.tables || {};
  const C = snap.counts || {};
  const findings = [];
  const add = (f) => findings.push({ severity: "warn", blocking: false, ...f });

  /* ===== D1: held-out (challenge) extraction in active evidence ============ */
  /* 'Challenge' is carried by TWO fields: extractions.source_type='challenge'
     (the held-out set) and the per-link evidence_role='challenging' on the
     junctions. Task 136 (2026-07-19): a held-out row could enter through the
     field the gate did not watch. D1 now watches BOTH:
       hard  - held-out extraction linked with an active role anywhere;
       hard  - one extraction linked to the SAME code as both 'challenging' and
               active (internally contradictory whatever its source_type);
       D1b warn - evidence_role='challenging' on a non-challenge source_type.
               Warn, not hard: a primary-sourced contestation is legitimate
               (ext 617, McKenna bedsharing) - the mismatch is ingestion hygiene
               to reconcile, not by itself a contradiction. */
  {
    const srcType = new Map(
      (T.extractions || []).map((e) => [e.id, String(e.source_type || "").toLowerCase()])
    );
    const challengeIds = new Set(
      [...srcType].filter(([, t]) => t === "challenge").map(([id]) => id)
    );
    const ACTIVE = new Set(["primary", "supporting"]);
    const hits = [];
    const roleMismatch = [];
    const rolesByLink = new Map(); // `${extraction_id}|${code}` -> Set(roles)
    const scan = (rows, kind, codeField) => {
      for (const r of rows || []) {
        const role = String(r.evidence_role || "").toLowerCase();
        const code = r[codeField];
        if (challengeIds.has(r.extraction_id) && ACTIVE.has(role)) {
          hits.push(`${kind}: ${code} <- ext ${r.extraction_id} as ${r.evidence_role}`);
        }
        if (role === "challenging" && srcType.get(r.extraction_id) !== "challenge") {
          roleMismatch.push(
            `${kind}: ${code} <- ext ${r.extraction_id} role=challenging, source_type='${srcType.get(r.extraction_id) || "?"}'`
          );
        }
        const key = `${r.extraction_id}|${code}`;
        if (!rolesByLink.has(key)) rolesByLink.set(key, new Set());
        rolesByLink.get(key).add(role);
      }
    };
    scan(T.mechanism_evidence, "mech_evidence", "mechanism_code");
    scan(T.parameter_evidence, "param_evidence", "parameter_code");
    for (const [key, roles] of rolesByLink) {
      if (roles.has("challenging") && (roles.has("primary") || roles.has("supporting"))) {
        const [extId, code] = key.split("|");
        hits.push(`${code} <- ext ${extId} linked as BOTH challenging and active`);
      }
    }
    add({
      id: "D1",
      title: "Held-out (challenge-layer) extraction used as active evidence",
      blocking: true, // HARD gate: structural, snapshot-only, zero-FP.
      count: hits.length,
      hits,
      note:
        `held-out set = source_type='challenge' (${challengeIds.size} rows); ` +
        "active = evidence_role in {primary,supporting}. A challenge is counter-" +
        "evidence and must never count as forward support. Also hard-fails one " +
        "extraction linked to the same code as both challenging and active.",
    });
    add({
      id: "D1b",
      title: "evidence_role='challenging' on a non-challenge source_type",
      count: roleMismatch.length,
      hits: roleMismatch,
      note:
        "the two challenge-carrying fields disagree - reconcile at ingestion. " +
        "Baseline 2026-08-10 = 10 rows (exts 196,197,200,461,508,509,617): " +
        "primary/propagation-sourced contestations, defensible per-link judgments " +
        "(ext 617 McKenna is the type case). Growth past baseline means a new " +
        "unreconciled row entered at ingestion.",
    });
  }

  /* ===== D2: mechanism forced-and-not-entailed (regression guard) ========== */
  {
    const forcingSet = new Set(
      (T.convergences || [])
        .map((c) => c.forces_mechanism)
        .filter((x) => x != null && String(x).trim() !== "")
        .map((x) => String(x).trim())
    );
    // Grade tokens that CLAIM entailment (as opposed to evidence strength).
    const ENTAILMENT_GRADE = /^(forced|entailed|forces)$/i;
    const hits = [];
    for (const m of T.mechanisms || []) {
      const g = String(m.grade || "").trim();
      if (ENTAILMENT_GRADE.test(g) && !forcingSet.has(m.code)) {
        hits.push(`${m.code} grade='${g}' but no convergence forces it`);
      }
    }
    add({
      id: "D2",
      title: "Mechanism graded 'forced' with no dedicated forcing convergence",
      blocking: true, // HARD gate: pure regression test - "forced" must not return as a grade.
      count: hits.length,
      hits,
      note:
        "regression guard: the forced->established migration means no grade reads " +
        "'forced' now, so this is permanently clean unless the entailment claim is " +
        `re-introduced. Forcing convergences: ${[...forcingSet].sort().join(",") || "none"}.`,
    });
  }

  /* ===== D7-D10: the copy-drift classes that have now recurred five times ===
     Findings 1-4 of the 2026-08-11 review were one disease: a claim lives in a
     hand-written copy instead of rendering from the DB, so every correction
     leaves a stale twin next door. These four detectors gate exactly the classes
     that recurred. Every threshold is DERIVED from the snapshot, never typed. */

  /* ===== D7: a surface says "Forced by" about a mechanism nothing forces ==== */
  {
    const forcingCodes = new Set(
      (T.convergences || [])
        .filter((c) => c.forces_mechanism != null && String(c.forces_mechanism).trim() !== "")
        .map((c) => String(c.code).trim())
    );
    const hits = [];
    const files = await textAssets(dist);
    for (const [rel, body] of files) {
      let matched = 0;
      // Three shapes carry this label today: the mechanism card's .forced row,
      // its context-drawer row, and the markdown exports. Anything else that
      // says "Forced by convergence" is an unrecognised shape and also reported.
      const shapes = [
        /<span class="lbl">Forced by convergence<\/span>(.*?)<\/div>/gs,
        /<div class="ctx-label">Forced by convergence<\/div><div class="ctx-val">(.*?)<\/div>/gs,
        /\*\*Forced by convergence:\*\*((?:(?!\\n|\n).)*)/g,
      ];
      for (const re of shapes) {
        let m;
        while ((m = re.exec(body)) !== null) {
          matched++;
          const codes = (m[1].match(/\bC\d{1,2}\b/g) || []);
          for (const c of new Set(codes)) {
            if (!forcingCodes.has(c)) {
              hits.push(`${rel}: "Forced by convergence" cites ${c}, which forces no mechanism`);
            }
          }
        }
      }
      // Renderer source (js/*.js authored here) holds the label as a string
      // literal; its OUTPUT is what ships, and that is checked in the baked
      // .html above. Only baked surfaces get the completeness check.
      const isRendererSource = /\.js$/i.test(rel) && !/-data\.js$/i.test(rel);
      const total = (body.match(/Forced by convergence/g) || []).length;
      if (!isRendererSource && total > matched) {
        hits.push(`${rel}: ${total - matched} "Forced by convergence" occurrence(s) in an unrecognised shape - the label is not being gated there`);
      }
    }
    add({
      id: "D7",
      title: "Surface renders 'Forced by' for a mechanism no convergence forces",
      blocking: true, // HARD: this is the defect the 2026-08-11 review found live on three surfaces.
      count: hits.length,
      hits,
      note:
        `forcing convergences (derived, never hardcoded): ${[...forcingCodes].sort().join(",") || "none"}. ` +
        "Associated mechanisms must read 'Grounded in', matching the derivation page.",
    });
  }

  /* ===== D8: demismatch.com's hand-coded counts vs the live snapshot ======== */
  {
    // demismatch.com is hand-authored static HTML with no build step, so its
    // numbers cannot render from the snapshot. They are gated here instead: a
    // stale front door fails the Cor build rather than shipping quietly.
    const LABELS = [
      ["Foundations", "foundations"],
      ["Mechanisms", "mechanisms"],
      ["Convergences", "convergences"],
      ["Extractions", "extractions"],
      ["Researchers", "researchers"],
      ["Works", "works"],
    ];
    const hits = [];
    let read = 0;
    for (const rel of ["10truths/index.html", "10truths/vision.html"]) {
      let body;
      try { body = await readFile(join(repoRoot, rel), "utf8"); } catch { continue; }
      read++;
      for (const [label, key] of LABELS) {
        const re = new RegExp('<span class="n">(\\d[\\d,]*)</span><span class="l">' + label + "</span>", "g");
        let m;
        while ((m = re.exec(body)) !== null) {
          const shown = Number(m[1].replace(/,/g, ""));
          const live = C[key];
          if (live != null && shown !== live) hits.push(`${rel}: ${label} shows ${shown}, DB has ${live}`);
        }
      }
      // The transparency line: "N extractions from M published works."
      const prose = body.match(/(\d[\d,]*)\s+extractions from\s+(\d[\d,]*)\s+published\s+\w+/);
      if (prose) {
        const ext = Number(prose[1].replace(/,/g, ""));
        const wks = Number(prose[2].replace(/,/g, ""));
        if (C.extractions != null && ext !== C.extractions) hits.push(`${rel}: prose says ${ext} extractions, DB has ${C.extractions}`);
        if (C.works != null && wks !== C.works) hits.push(`${rel}: prose says ${wks} works, DB has ${C.works}`);
      }
    }
    if (!read) hits.push("10truths/ not readable from the build - the front-door counts went ungated");
    add({
      id: "D8",
      title: "demismatch.com hand-coded counts drifted from the snapshot",
      blocking: true, // HARD: these numbers were wrong on three separate reviews.
      count: hits.length,
      hits,
      note:
        "demismatch.com has no build step, so its counts are gated here. When this " +
        "fires, edit 10truths/index.html and 10truths/vision.html in the same commit " +
        "as the re-bake; the mirror Action ships them.",
    });
  }

  /* ===== D9: hardcoded architecture totals vs the DB totals ================= */
  {
    const NOUNS = [
      ["foundations", "foundations"],
      ["convergences", "convergences"],
    ];
    const hits = [];
    const softHits = [];
    for (const [rel, body] of await textAssets(dist)) {
      // Archived versions of a document are frozen on purpose.
      if (/-v\d|archive|changelog/i.test(rel)) continue;
      const text = body.replace(/<[^>]+>/g, " ");
      for (const [noun, key] of NOUNS) {
        const live = C[key];
        if (live == null) continue;
        // (?<![\w-]) keeps "Tier-1 mechanisms" from reading as "1 mechanisms".
        const re = new RegExp("(?<![\\w-])(\\d{1,4})\\s+" + noun + "\\b", "g");
        let m;
        while ((m = re.exec(text)) !== null) {
          const n = Number(m[1]);
          if (n !== live) {
            const ctx = text.slice(Math.max(0, m.index - 70), m.index + 40).replace(/\s+/g, " ").trim();
            hits.push(`${rel}: "${n} ${noun}" but DB has ${live}  ...${ctx}...`);
          }
        }
      }
      // Soft companion: the mechanism count has legitimate partial senses
      // ("the remaining 10 mechanisms", "all 14 mechanisms" = the M-coded set),
      // so a mismatch here is read-and-judge, not an automatic block.
      if (C.mechanisms != null) {
        const re = /(?<![\w-])(\d{1,4})\s+mechanisms\b/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          const n = Number(m[1]);
          if (n !== C.mechanisms) {
            const ctx = text.slice(Math.max(0, m.index - 70), m.index + 40).replace(/\s+/g, " ").trim();
            softHits.push(`${rel}: "${n} mechanisms" vs DB ${C.mechanisms}  ...${ctx}...`);
          }
        }
      }
    }
    add({
      id: "D9",
      title: "Hardcoded architecture total contradicts the DB total",
      blocking: true, // HARD: the bridge paper enumerated a superseded structure under its own live strip.
      count: hits.length,
      hits,
      note:
        `live totals: foundations=${C.foundations}, convergences=${C.convergences}. ` +
        "Archived/changelog files are exempt by filename.",
    });
    add({
      id: "D9b",
      title: "Numeric mechanism count differs from the DB total (read and judge)",
      count: softHits.length,
      hits: softHits,
      note:
        `DB mechanisms=${C.mechanisms}. Partial senses are legitimate (the 10 associated ` +
        "mechanisms; the 14 M-coded ones beside R1). Soft: check each hit is a partial, not a stale total.",
    });
  }

  /* ===== D10: Cor claiming "ground truth" for itself ======================== */
  {
    // "as ground truth" is CORRECT when it names what the field wrongly does with
    // preferences - that is the attack, and it only lands while Cor does not claim
    // the same crown. Every legitimate sentence is allowlisted verbatim below.
    const ALLOW = [
      "treat human preferences as ground truth",
      "treats mismatched preferences as ground truth",
      "treats revealed preferences as ground truth",
      "Treating preferences as ground truth",
      "treats mechanism outputs as ground truth",
      "will treat as ground truth",
      "those systems will treat as ground truth",
      "encoding the proxy contamination as ground truth",
    ];
    const hits = [];
    const assets = [...(await textAssets(dist))];
    for (const rel of ["10truths/index.html", "10truths/vision.html", "10truths/faq.html", "10truths/about.html"]) {
      try { assets.push([rel, await readFile(join(repoRoot, rel), "utf8")]); } catch { /* absent is fine */ }
    }
    for (const [rel, body] of assets) {
      const re = /as ground truth/g;
      let m;
      while ((m = re.exec(body)) !== null) {
        const win = body.slice(Math.max(0, m.index - 130), m.index + 20);
        if (!ALLOW.some((a) => win.includes(a))) {
          hits.push(`${rel}: ...${win.replace(/\s+/g, " ").trim().slice(-120)}...`);
        }
      }
    }
    add({
      id: "D10",
      title: "Cor / the atlas / the spec claimed as 'ground truth'",
      blocking: true, // HARD: the canonical framing is reference standard, not ground truth.
      count: hits.length,
      hits,
      note:
        "Cor is the REFERENCE STANDARD preferences get checked against, not ground " +
        "truth itself. Attack-usage sentences (what the FIELD does with preferences) " +
        "are allowlisted verbatim in this detector - extend the allowlist to add one.",
    });
  }

  /* ===== D3: asserted figure vs 'unsupported' disclaimer (STUBBED) ========= */
  {
    let ledger = { rows: [] };
    const ledgerPath = join(__dirname, "claims-ledger.json");
    try {
      if (existsSync(ledgerPath)) ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
    } catch { /* keep empty */ }
    const rows = Array.isArray(ledger.rows) ? ledger.rows : [];
    add({
      id: "D3",
      title: "Record asserts a figure another record calls unsupported (ED9 / EEA-TOUCH-01)",
      count: 0,
      hits: [],
      stubbed: rows.length === 0,
      note:
        rows.length === 0
          ? "STUBBED: prose-vs-number, not a structural invariant. Needs a curated " +
            "claims-ledger (scripts/prerender/claims-ledger.json); 0 rows seeded. " +
            "Seed the KMC/ED9 pair as row one when a live asserted-vs-disclaimed pair is found."
          : `${rows.length} ledger row(s) - live co-occurrence check would run here.`,
    });
  }

  /* ===== D4 + D5: need extraction content (read-only fetch) ================ */
  let corpus = null;
  let fetchErr = null;
  try {
    corpus = await (fetchImpl || fetchExtractionContent)();
  } catch (e) {
    fetchErr = e;
  }

  if (!corpus) {
    add({
      id: "D4",
      title: "Bracketed insertion inside a content-field quote (Hrdy shape)",
      count: 0, hits: [], skipped: true,
      note: `SKIPPED (fail-soft): could not fetch extraction content (${fetchErr?.message || "unavailable"}).`,
    });
    add({
      id: "D5",
      title: "Sentence-length quotation in content with no author_quote",
      count: 0, hits: [], skipped: true,
      note: `SKIPPED (fail-soft): could not fetch extraction content (${fetchErr?.message || "unavailable"}).`,
    });
  } else {
    /* ----- D4 ----- */
    const d4 = [];
    for (const e of corpus) {
      if (hasAuthorQuote(e)) continue; // legit [RR]/[sic] inside a real verbatim quote is fine
      const spans = quotedSpans(e.content || "");
      const bracketed = spans.find((s) => /\[[^\]]+\]/.test(s));
      if (bracketed) d4.push(`ext ${e.id}: ${bracketed.slice(0, 80)}`);
    }
    add({
      id: "D4",
      title: "Bracketed insertion inside a content-field quote (Hrdy shape)",
      count: d4.length,
      hits: d4,
      note: "scoped to content quotes on rows with NO author_quote, so a real [RR]/[sic] inside a verbatim author_quote (e.g. ext 618) never trips it.",
    });

    /* ----- D5 ----- */
    const d5 = [];
    for (const e of corpus) {
      if (hasAuthorQuote(e)) continue;
      const spans = quotedSpans(e.content || "");
      const longest = spans.reduce((a, s) => (s.length > a.length ? s : a), "");
      if (longest.length >= QUOTE_LEN_FLOOR) {
        d5.push(`ext ${e.id} (${longest.length}): ${longest.slice(0, 70)}`);
      }
    }
    add({
      id: "D5",
      title: "Sentence-length quotation in content with no author_quote",
      count: d5.length,
      hits: d5,
      note: `floor=${QUOTE_LEN_FLOOR} chars. Expected ~13 = the known trade-book backlog (not defects). WARN only until that backlog clears.`,
    });
  }

  /* ===== D6: captured-asset counts (the mindmap) vs live DB ================ */
  {
    // Label -> snapshot.counts key. The mindmap's "Canonical counts" block is the
    // one text-readable captured asset that bakes framework counts.
    const LABELS = [
      ["Foundations", "foundations"],
      ["Convergences", "convergences"],
      ["Mechanisms", "mechanisms"],
      ["Researchers", "researchers"],
      ["Works", "works"],
      ["Extractions", "extractions"],
      ["Mechanism-evidence", "mechanism_evidence"],
      ["Empirical demonstrations", "empirical_demonstrations"],
      ["Applications", "applications"],
      ["Research domains", "domains"],
      ["Bridge theses", "bridge_theses"],
      ["Open questions", "gaps"],
      ["EEA baseline parameters", "eea_parameters"],
    ];
    const hits = [];
    let assetRead = false;
    try {
      const mm = await readFile(join(dist, "js", "mindmap-data.js"), "utf8");
      assetRead = true;
      for (const [label, key] of LABELS) {
        // matches "- 23 Research domains" inside the JS string literal
        const re = new RegExp("(\\d+)\\s+" + label.replace(/[-/]/g, "\\$&"));
        const m = mm.match(re);
        if (!m) continue;
        const asset = Number(m[1]);
        const live = C[key];
        if (live != null && asset !== live) {
          hits.push(`mindmap: ${label} shows ${asset}, DB has ${live}`);
        }
      }
    } catch (e) {
      hits.push(`could not read mindmap asset: ${e.message}`);
    }
    add({
      id: "D6",
      title: "Captured-asset counts drifted from live DB (stale-mindmap case)",
      count: hits.length,
      hits,
      note:
        (assetRead ? "" : "asset unread; ") +
        "text-readable captures only (mindmap markdown). Binary raster captures " +
        "(PNG/JPG screenshots) need OCR or a sidecar count manifest - out of scope here.",
    });
  }

  return { findings, corpusFetched: !!corpus };
}

/* Blocking findings that actually fired (count>0). verify.mjs fails on these. */
export function blockingFailures(findings) {
  return findings.filter((f) => f.blocking && f.count > 0);
}

/* ---- reporter -------------------------------------------------------------- */
export function reportContradictions(findings) {
  const lines = [];
  lines.push("");
  lines.push("=== CONTRADICTION GATE (D1/D2/D7-D10 hard-block; D1b/D3-D6 warn only) ===");
  let warned = 0;
  let failed = 0;
  for (const f of findings) {
    const state = f.skipped
      ? "SKIP"
      : f.stubbed
      ? "STUB"
      : f.count > 0
      ? f.blocking
        ? "FAIL"
        : "WARN"
      : "OK";
    if (state === "WARN") warned++;
    if (state === "FAIL") failed++;
    const tier = f.blocking ? "hard" : "soft";
    lines.push(`  [${state}] ${f.id} (${tier})  ${f.title}  (${f.count} hit${f.count === 1 ? "" : "s"})`);
    if (f.note) lines.push(`         ${f.note}`);
    for (const h of (f.hits || []).slice(0, 20)) lines.push(`         - ${h}`);
    if ((f.hits || []).length > 20) lines.push(`         ... +${f.hits.length - 20} more`);
  }
  lines.push(`  ${failed} hard failure(s), ${warned} soft warning(s).`);
  return lines.join("\n");
}

/* ---- standalone ------------------------------------------------------------ */
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const di = args.indexOf("--dist");
  const dist = resolve(process.cwd(), di >= 0 ? args[di + 1] : "dist");
  runContradictionGate({ dist })
    .then(({ findings }) => {
      console.log(reportContradictions(findings));
      // Exit 1 if a HARD detector (D1/D2/D7-D10) fired; soft warnings never fail.
      process.exit(blockingFailures(findings).length ? 1 : 0);
    })
    .catch((e) => {
      // Infra failure of the gate itself is fail-soft (never blocks a deploy).
      console.error("contradiction-gate infra error (non-blocking):", e.message);
      process.exit(0);
    });
}
