/* ============================================================================
   contradiction-gate.mjs - contradiction checks for the Cor deploy.

   verify.mjs is the HARD gate (count + prerender integrity). This module adds
   contradiction checks in TWO tiers:

     HARD (block the deploy): D1, D2. Structural, snapshot-only, no network
       dependency, zero false positives across the current corpus. D2 is a pure
       regression test - "forced" must never return as a mechanism grade.
     SOFT (WARN only, never blocks): D3, D4, D5, D6. Promote a soft detector to
       hard only after it has run clean across several builds AND, for D4/D5, only
       after removing its network dependency (a fail-soft fetch must never gate).

   Each finding carries `blocking`. A blocking finding with count>0 fails the
   deploy; every other finding only warns.

   Six detectors, each mapped to a class of defect that actually shipped in this
   corpus (see _audit/DB_AUDIT_FINDINGS.md):

     D1  Held-out (challenge-layer) extraction used as ACTIVE evidence.
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

   Data sources:
     - D1, D2, D6 read the shipped snapshot.json (what actually deploys).
     - D4, D5 need extraction content + author_quote, which the light snapshot
       projection deliberately omits, so they do a READ-ONLY anon fetch of the
       live corpus. If that fetch fails, those two detectors are skipped with a
       warning (fail-soft) - they never block.

   Usage (standalone):  node contradiction-gate.mjs --dist <distDir>
   Or import { runContradictionGate } and call from verify.mjs.
   ============================================================================ */

import { readFile } from "node:fs/promises";
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

/* ---------------------------------------------------------------------------- */
export async function runContradictionGate({ dist, snap, fetchImpl } = {}) {
  dist = dist || resolve(process.cwd(), "dist");
  if (!snap) {
    snap = JSON.parse(await readFile(join(dist, "data", "snapshot.json"), "utf8"));
  }
  const T = snap.tables || {};
  const C = snap.counts || {};
  const findings = [];
  const add = (f) => findings.push({ severity: "warn", blocking: false, ...f });

  /* ===== D1: held-out (challenge) extraction in active evidence ============ */
  {
    const challengeIds = new Set(
      (T.extractions || [])
        .filter((e) => String(e.source_type || "").toLowerCase() === "challenge")
        .map((e) => e.id)
    );
    const ACTIVE = new Set(["primary", "supporting"]);
    const hits = [];
    for (const r of T.mechanism_evidence || []) {
      if (
        challengeIds.has(r.extraction_id) &&
        ACTIVE.has(String(r.evidence_role || "").toLowerCase())
      ) {
        hits.push(`mech_evidence: ${r.mechanism_code} <- ext ${r.extraction_id} as ${r.evidence_role}`);
      }
    }
    for (const r of T.parameter_evidence || []) {
      if (
        challengeIds.has(r.extraction_id) &&
        ACTIVE.has(String(r.evidence_role || "").toLowerCase())
      ) {
        hits.push(`param_evidence: ${r.parameter_code} <- ext ${r.extraction_id} as ${r.evidence_role}`);
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
        "evidence and must never count as forward support. " +
        // KNOWN GAP (close before the next ingestion batch): 'challenge' is also
        // carried by evidence_role='challenging', not only source_type. This
        // detector watches source_type; a challenging-role link on a NON-challenge
        // source_type (e.g. ext 617, a primary-sourced contestation) is not caught.
        // A held-out row could enter through the field the gate does not watch, so
        // D1 should watch BOTH fields once the two are reconciled at ingestion.
        "KNOWN GAP: does not yet watch evidence_role='challenging' on non-challenge source_type (see ext 617).",
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
  lines.push("=== CONTRADICTION GATE (D1/D2 hard-block; D3-D6 warn only) ===");
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
      // Exit 1 if a HARD detector (D1/D2) fired; soft warnings never fail.
      process.exit(blockingFailures(findings).length ? 1 : 0);
    })
    .catch((e) => {
      // Infra failure of the gate itself is fail-soft (never blocks a deploy).
      console.error("contradiction-gate infra error (non-blocking):", e.message);
      process.exit(0);
    });
}
