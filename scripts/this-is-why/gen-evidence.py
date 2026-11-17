#!/usr/bin/env python3
"""Build the evidence data behind the 20 answers.

Inputs (same directory): works-live.json, extractions-live.json, mechanism-evidence-live.json,
mechanisms-live.json, cards.json.
Output: ../../10truths/tiw/evidence.json  (and a copy here).

Per mechanism: every finding linked to it (via v2_mechanism_evidence), ranked best grade first;
the works ranked by how many graded-on-evidence findings they contribute; counts.
Per card: its mechanism codes, merged counts, the top works.
Ledger: every finding graded replicated, with its work.

Grade order (GRADING-RUBRIC.md): replicated, meta_analysis, longitudinal, clinical,
cross_species, contested, theoretical, thin. "On evidence" = the first five.
Hyphens only in every string this script writes.
"""
import json, os, re, collections

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "10truths", "tiw", "evidence.json"))
GRADE_ORDER = ["replicated", "meta_analysis", "longitudinal", "clinical", "cross_species",
               "contested", "theoretical", "thin"]
ON_EVIDENCE = set(GRADE_ORDER[:5])
ROLE_ORDER = {"primary": 0, "supporting": 1, "challenging": 2}
IMP_ORDER = {"pillar": 0, "key": 1, "supporting": 2}
GRADE_LABEL = {"replicated": "replicated", "meta_analysis": "meta-analysis", "longitudinal": "longitudinal",
               "clinical": "clinical", "cross_species": "cross-species", "contested": "contested",
               "theoretical": "theoretical", "thin": "thin"}

def nodash(t):
    """Site rule: hyphens only, also in DB-sourced prose. Em dash -> spaced hyphen, en dash -> hyphen."""
    if not isinstance(t, str):
        return t
    t = re.sub(r"\s*\u2014\s*", " - ", t)
    t = t.replace("\u2013", "-")
    return re.sub(r"  +", " ", t)

def load(n):
    with open(os.path.join(HERE, n), encoding="utf-8") as fh:
        return json.load(fh)

works = {w["id"]: w for w in load("works-live.json")}
# Core tier only (2026-11-02); mechanism_evidence rows pointing at other ids are skipped below.
ex = {e["id"]: e for e in load("extractions-live.json") if e.get("tier", "core") == "core"}
me = load("mechanism-evidence-live.json")
mechs = {m["code"]: m for m in load("mechanisms-live.json")}
cards = load("cards.json")["human"]

def work_out(w):
    ident = ("doi", w["doi"]) if w.get("doi") else ("pmid", str(w["pmid"])) if w.get("pmid") else (None, None)
    return {"id": w["id"], "title": nodash(w["title"]), "authors": nodash(w["authors"]), "year": w["year"],
            "type": w["work_type"], "importance": w["importance"],
            "doi": w.get("doi"), "pmid": w.get("pmid"),
            "url": ("https://doi.org/" + w["doi"]) if w.get("doi") else
                   ("https://pubmed.ncbi.nlm.nih.gov/%s/" % w["pmid"]) if w.get("pmid") else None}

def finding_out(e, role):
    return {"id": e["id"], "work": e["work_id"], "grade": e["evidence_quality"],
            "grade_label": GRADE_LABEL.get(e["evidence_quality"], e["evidence_quality"]),
            "role": role,
            "quote": nodash(e.get("author_quote") or ""),
            "content": nodash(e.get("content") or ""),
            "where": nodash(e.get("location") or "")}

N_LINKS = {}   # extraction id -> number of mechanisms it is linked to (filled below)

def rank_key(f, w):
    """Best first: graded on evidence before the rest; then specific before generic (a finding
    linked to one mechanism outranks one linked to six, so a card leads with findings about ITS
    mechanism, not framework-wide statements); then grade order; then role; then work importance;
    then a stored quote over a summary; then newer first."""
    return (0 if f["grade"] in ON_EVIDENCE else 1,
            min(N_LINKS.get(f["id"], 1), 4),
            GRADE_ORDER.index(f["grade"]) if f["grade"] in GRADE_ORDER else 99,
            ROLE_ORDER.get(f["role"], 9),
            IMP_ORDER.get(w["importance"], 9),
            0 if f["quote"] else 1,
            -(w["year"] or 0), f["id"])

def diversify(fs, per_work=2, n=8):
    """Top n with at most per_work findings from the same work, keeping rank order."""
    out, seen = [], collections.Counter()
    for f in fs:
        if seen[f["work"]] >= per_work:
            continue
        out.append(f); seen[f["work"]] += 1
        if len(out) >= n:
            break
    return out

by_mech = collections.defaultdict(dict)   # code -> {extraction_id: role}
for row in me:
    code, eid, role = row["mechanism_code"], row["extraction_id"], row["evidence_role"]
    if eid not in ex:
        continue
    cur = by_mech[code].get(eid)
    if cur is None or ROLE_ORDER.get(role, 9) < ROLE_ORDER.get(cur, 9):
        by_mech[code][eid] = role

for code, d in by_mech.items():
    for eid in d:
        N_LINKS[eid] = N_LINKS.get(eid, 0) + 1

mechanisms = {}
for code in sorted(by_mech, key=lambda c: (len(c), c)):
    fs = [finding_out(ex[eid], role) for eid, role in by_mech[code].items()]
    fs.sort(key=lambda f: rank_key(f, works[f["work"]]))
    per_work = collections.defaultdict(lambda: {"n": 0, "on_evidence": 0, "replicated": 0})
    for f in fs:
        if f["role"] == "challenging":
            continue
        pw = per_work[f["work"]]
        pw["n"] += 1
        pw["on_evidence"] += f["grade"] in ON_EVIDENCE
        pw["replicated"] += f["grade"] == "replicated"
    works_ranked = sorted(per_work.items(),
                          key=lambda kv: (-kv[1]["on_evidence"], -kv[1]["replicated"], -kv[1]["n"],
                                          IMP_ORDER.get(works[kv[0]]["importance"], 9), -(works[kv[0]]["year"] or 0)))
    m = mechs.get(code, {})
    mechanisms[code] = {
        "code": code, "name": nodash(m.get("name", code)),
        "counts": {"findings": sum(1 for f in fs if f["role"] != "challenging"),
                   "works": len(per_work),
                   "on_evidence": sum(1 for f in fs if f["role"] != "challenging" and f["grade"] in ON_EVIDENCE),
                   "replicated": sum(1 for f in fs if f["role"] != "challenging" and f["grade"] == "replicated"),
                   "challenges": sum(1 for f in fs if f["role"] == "challenging")},
        "findings": fs,
        "works_ranked": [{"work": wid, **v} for wid, v in works_ranked],
        "atlas_url": "https://cor.demismatch.com/mechanism.html#" + code,
    }

card_out = []
for c in cards:
    codes = c["mechanism_codes"]
    seen, merged, per_work = set(), [], collections.defaultdict(lambda: {"n": 0, "on_evidence": 0, "replicated": 0})
    for code in codes:
        for f in mechanisms[code]["findings"]:
            if f["id"] in seen:
                continue
            seen.add(f["id"]); merged.append(f)
    merged.sort(key=lambda f: rank_key(f, works[f["work"]]))
    for f in merged:
        if f["role"] == "challenging":
            continue
        pw = per_work[f["work"]]; pw["n"] += 1
        pw["on_evidence"] += f["grade"] in ON_EVIDENCE; pw["replicated"] += f["grade"] == "replicated"
    top = sorted(per_work.items(), key=lambda kv: (-kv[1]["on_evidence"], -kv[1]["replicated"], -kv[1]["n"],
                                                   IMP_ORDER.get(works[kv[0]]["importance"], 9), -(works[kv[0]]["year"] or 0)))
    card_out.append({
        "item": c["item"], "id": c["id"], "eyebrow_q": c["eyebrow_q"], "codes": codes,
        "counts": {"findings": sum(1 for f in merged if f["role"] != "challenging"),
                   "works": len(per_work),
                   "on_evidence": sum(1 for f in merged if f["role"] != "challenging" and f["grade"] in ON_EVIDENCE),
                   "replicated": sum(1 for f in merged if f["role"] != "challenging" and f["grade"] == "replicated"),
                   "challenges": sum(1 for f in merged if f["role"] == "challenging")},
        "top_findings": [f["id"] for f in diversify([f for f in merged if f["role"] != "challenging"])],
        "challenge_findings": [f["id"] for f in merged if f["role"] == "challenging"],
        "top_works": [wid for wid, _ in top[:5]],
    })

ledger = [finding_out(e, "primary") for e in ex.values() if e.get("evidence_quality") == "replicated"]
ledger.sort(key=lambda f: (IMP_ORDER.get(works[f["work"]]["importance"], 9), -(works[f["work"]]["year"] or 0), f["id"]))
for f in ledger:
    f["mech"] = ex[f["id"]].get("mechanism_codes") or []

most_replicated = sorted(
    ((wid, sum(1 for e in ex.values() if e["work_id"] == wid and e.get("evidence_quality") == "replicated"),
      sum(1 for e in ex.values() if e["work_id"] == wid)) for wid in works),
    key=lambda t: (-t[1], -t[2], works[t[0]]["title"]))
most_replicated = [{"work": wid, "replicated": r, "findings": n} for wid, r, n in most_replicated if r > 0]

findings_by_id = {f["id"]: finding_out(e, "primary") for f, e in ((None, e) for e in ex.values()) for f in [finding_out(e, "primary")]}

out = {
    "counted": "2026-08-23",
    "grade_order": GRADE_ORDER, "on_evidence": sorted(ON_EVIDENCE, key=GRADE_ORDER.index),
    "grade_label": GRADE_LABEL,
    "totals": {"works": len(works), "findings": len(ex),
               "on_evidence": sum(1 for e in ex.values() if e.get("evidence_quality") in ON_EVIDENCE),
               "replicated": sum(1 for e in ex.values() if e.get("evidence_quality") == "replicated"),
               "works_with_replicated": sum(1 for w in most_replicated),
               "works_with_on_evidence": len({e["work_id"] for e in ex.values() if e.get("evidence_quality") in ON_EVIDENCE}),
               "works_without_findings": sum(1 for wid in works if not any(e["work_id"] == wid for e in ex.values()))},
    "works": {str(k): work_out(v) for k, v in works.items()},
    "findings": {str(k): v for k, v in findings_by_id.items()},
    "mechanisms": mechanisms,
    "cards": card_out,
    "ledger_replicated": ledger,
    "most_replicated": most_replicated,
}
# Full data for static page generation (scripts only) and a slim runtime file for the sequence.
full = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
assert "\u2014" not in full and "\u2013" not in full, "dash found after normalisation"
with open(os.path.join(HERE, "evidence-full.json"), "w", encoding="utf-8") as fh:
    fh.write(full)

def clip(t, n):
    t = t or ""
    return t if len(t) <= n else t[: n - 1].rstrip() + "..."

slim = {
    "counted": out["counted"], "grade_order": GRADE_ORDER, "on_evidence": out["on_evidence"],
    "grade_label": GRADE_LABEL, "totals": out["totals"],
    "works": {k: {"id": v["id"], "title": v["title"], "authors": v["authors"], "year": v["year"],
                  "type": v["type"], "importance": v["importance"], "url": v["url"]} for k, v in out["works"].items()},
    "findings": {k: {"id": v["id"], "work": v["work"], "grade": v["grade"],
                     "quote": clip(v["quote"] or v["content"], 200), "is_quote": bool(v["quote"]),
                     "where": clip(v["where"], 80)} for k, v in out["findings"].items()},
    "mechanisms": {c: {"code": m["code"], "name": m["name"], "counts": m["counts"],
                       "findings": [f["id"] for f in m["findings"]],
                       "roles": {str(f["id"]): f["role"] for f in m["findings"] if f["role"] != "primary"},
                       "works_ranked": m["works_ranked"][:12], "atlas_url": m["atlas_url"]} for c, m in out["mechanisms"].items()},
    "cards": out["cards"],
    "ledger_replicated": [f["id"] for f in out["ledger_replicated"]],
    "most_replicated": out["most_replicated"][:15],
}
s = json.dumps(slim, ensure_ascii=False, separators=(",", ":"))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write(s)
print("evidence-full.json", len(full.encode("utf-8")), "bytes (scripts only)")
print("evidence.json", len(s.encode("utf-8")), "bytes ->", OUT)
print("totals", out["totals"])
