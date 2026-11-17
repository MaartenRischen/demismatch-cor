#!/usr/bin/env python3
"""Fetch a publication name for every work that has a DOI or a PMID.

Cor stores no journal field. This asks Crossref (by DOI) and PubMed (by PMID) for one,
caches the answer in publications.json, and never overwrites a cached hit. Read-only public
metadata; no identifying information is sent. Re-run after new works are added.

Output row: {work_id: {"publication": str, "source": "crossref"|"pubmed", "kind": str}}
"""
import html, json, os, re, time, urllib.request, urllib.error, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "demismatch-cor-site/1.0 (research atlas; static site build)"
CACHE = os.path.join(HERE, "publications.json")

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r)

def clean(t):
    if not t:
        return ""
    t = html.unescape(t)
    t = re.sub(r"\s*—\s*", " - ", t).replace("–", "-")
    t = re.sub(r"\s+", " ", t).strip()
    return t

def crossref(doi):
    d = get("https://api.crossref.org/works/" + urllib.parse.quote(doi, safe=""))["message"]
    ct = d.get("container-title") or []
    name = ct[0] if ct else (d.get("publisher") or "")
    return clean(name), d.get("type", "")

def pubmed(pmid):
    d = get("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=" + str(pmid))
    rec = d.get("result", {}).get(str(pmid), {})
    return clean(rec.get("fulljournalname") or rec.get("source") or ""), "journal-article"

import urllib.parse
works = json.load(open(os.path.join(HERE, "works-live.json")))
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

def one(w):
    key = str(w["id"])
    if key in cache and cache[key].get("publication"):
        return key, cache[key]
    for fn, arg, src in ((crossref, w.get("doi"), "crossref"), (pubmed, w.get("pmid"), "pubmed")):
        if not arg:
            continue
        for attempt in range(3):
            try:
                name, kind = fn(arg)
                if name:
                    return key, {"publication": name, "source": src, "kind": kind}
                break
            except urllib.error.HTTPError as e:
                if e.code in (404, 400):
                    break
                time.sleep(1.5 * (attempt + 1))
            except Exception:
                time.sleep(1.5 * (attempt + 1))
    return key, {"publication": "", "source": "", "kind": ""}

todo = [w for w in works if (w.get("doi") or w.get("pmid"))]
print("looking up", len(todo), "of", len(works), "works")
with cf.ThreadPoolExecutor(4) as ex:
    for key, row in ex.map(one, todo):
        cache[key] = row
json.dump(cache, open(CACHE, "w"), ensure_ascii=False, indent=0, sort_keys=True)
hit = sum(1 for v in cache.values() if v.get("publication"))
print("publications found:", hit, "of", len(todo), "| cached ->", CACHE)
by = {}
for v in cache.values():
    by[v.get("source", "none")] = by.get(v.get("source", "none"), 0) + 1
print("by source:", by)
