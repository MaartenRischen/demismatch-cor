#!/usr/bin/env python3
"""Build the manifest roll's data: 10truths/tiw/roll.json

One row per work, chronological, English only. The roll prints the title big and centred with
the author, the year and the publication under it.

Publication: the journal from publications.json (Crossref by DOI, PubMed by PMID). The 36 books
and 1 chapter carry no journal in any registry, so they print their kind instead. Nothing is
invented; a work with no known publication prints its kind and nothing more.

NON_ENGLISH holds the work ids whose title is not in English. Maarten's call, 2026-08-24: they
are omitted from the roll. They stay in the corpus, on the shelf and in every count, so the
roll shows one fewer row than the 148 the headline names.

Hyphens only in every string written.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "10truths", "tiw", "roll.json"))

NON_ENGLISH = {74}          # Liebig 1840, "Die organische Chemie ...", German
KIND = {"book": "Book", "chapter": "Chapter", "paper": "Paper",
        "review": "Review", "meta_analysis": "Meta-analysis"}

def nodash(t):
    if not isinstance(t, str):
        return t
    t = re.sub(r"\s*—\s*", " - ", t).replace("–", "-")
    return re.sub(r"  +", " ", t).strip()

works = json.load(open(os.path.join(HERE, "works-live.json"), encoding="utf-8"))
pubs = json.load(open(os.path.join(HERE, "publications.json"), encoding="utf-8"))

rows = []
for w in sorted(works, key=lambda x: (x["year"] or 0, x["title"])):
    if w["id"] in NON_ENGLISH:
        continue
    pub = nodash((pubs.get(str(w["id"])) or {}).get("publication") or "")
    rows.append({
        "id": w["id"],
        "t": nodash(w["title"]),
        "a": nodash(w["authors"]),
        "y": w["year"],
        "p": pub or KIND.get(w["work_type"], ""),
        "j": bool(pub),                       # true when p is a real publication name
        "i": w["importance"],                 # pillar / key / supporting
        "u": ("https://doi.org/" + w["doi"]) if w.get("doi")
             else ("https://pubmed.ncbi.nlm.nih.gov/%s/" % w["pmid"]) if w.get("pmid") else "",
    })

out = {
    "counted": "2026-08-25",
    "shown": len(rows),
    "corpus": len(works),
    "omitted_non_english": sorted(NON_ENGLISH),
    "with_publication": sum(1 for r in rows if r["j"]),
    "rows": rows,
}
s = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
assert "—" not in s and "–" not in s, "dash in roll data"
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(s)
print("roll.json", len(s.encode("utf-8")), "bytes ->", OUT)
print("rows", out["shown"], "of", out["corpus"], "| with a real publication:", out["with_publication"],
      "| printing their kind:", out["shown"] - out["with_publication"])
longest = max(rows, key=lambda r: len(r["t"]))
print("longest title", len(longest["t"]), "chars:", longest["t"][:80])
