#!/usr/bin/env python3
"""
gen-wall.py - build the "paper wall" markup fragment for this-is-why.html and
hey-ai-this-is-why.html.

RE-RUN THIS WHEN THE CORPUS GROWS. It is the only way the wall gets refreshed.
Pull fresh works-live.json (list_works) and extractions-per-work.json
(list_extractions, grouped by work_id), drop them next to this script, run:

    python3 gen-wall.py

It rewrites three files in place:
  wall-human.html / wall-ai.html - the decade wall section that sits between the
    hero and the card grid (the two differ by one approved word in the caption)
  mass.html - the hero right-column contact sheet, the same 148 works packed
    tight, aria-hidden and unlinked; identical on both pages
Paste them back into hero-human.html / hero-ai.html (or into the deployed
pages). Output is deterministic: works are sorted by year, then author, then
title, then id, so a re-run with unchanged data produces byte-identical files.

The script also verifies the numbers baked into the caption stamp (148 works,
635 findings). If the live data no longer matches, it prints a warning on
stderr and rewrites the stamp with the real numbers, so the page can never
carry a count the data does not support.

Stdlib only. No third-party imports. No network.
"""

import json
import os
from urllib.parse import quote
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

# Counted for the stamp copy in HERO-COPY-v1. Change the date only when you
# re-pull the data.
STAMP_DATE = "23 Aug 2026"

IMP_CLASS = {"pillar": "tiw-p", "key": "tiw-k", "supporting": "tiw-u"}

# The only strings on the wall that are not corpus data and not approved copy.
DECADE_SUFFIX = "s"          # 1840 -> "1840s"
PMID_PREFIX = "PMID "        # disambiguates a bare accession number
LEGEND = [("tiw-p", "Pillar"), ("tiw-k", "Key"), ("tiw-u", "Supporting")]


def esc(s):
    """Entity-escape the way the mockups do: &amp; &lt; &gt; &quot; &#x27;."""
    if s is None:
        return ""
    s = str(s)
    s = s.replace("&", "&amp;")
    s = s.replace("<", "&lt;").replace(">", "&gt;")
    s = s.replace('"', "&quot;").replace("'", "&#x27;")
    return s


def check_dashes(works):
    """Copy rule: hyphens only. The corpus should carry no em/en dashes."""
    bad = []
    for w in works:
        for field in ("title", "authors"):
            v = w.get(field) or ""
            if "\u2014" in v or "\u2013" in v:
                bad.append((w["id"], field))
    if bad:
        print("WARNING: em/en dash in corpus data: %r" % (bad,), file=sys.stderr)
    return bad


def href_for(w):
    if w.get("doi"):
        return "https://doi.org/" + quote(str(w["doi"]), safe="/:();.,-_")
    if w.get("pmid"):
        return "https://pubmed.ncbi.nlm.nih.gov/%s/" % w["pmid"]
    return None


def ident_for(w):
    if w.get("doi"):
        return str(w["doi"])
    if w.get("pmid"):
        return PMID_PREFIX + str(w["pmid"])
    return None


def sheet(w):
    """One miniature paper sheet.

    Deliberately lean markup: the importance band is .tiw-s::before and the
    ruled text lines are .tiw-s::after, so each sheet carries only the four
    elements that hold real data.
    """
    cls = "tiw-s " + IMP_CLASS.get(w.get("importance"), "tiw-u")
    title = w.get("title") or ""
    authors = w.get("authors") or ""
    year = w.get("year")
    tip = "%s - %s (%s)" % (title, authors, year)
    href = href_for(w)
    ident = ident_for(w)

    if href:
        open_tag = '<a class="%s" href="%s" title="%s">' % (cls, esc(href), esc(tip))
        close_tag = "</a>"
    else:
        open_tag = '<span class="%s" title="%s">' % (cls, esc(tip))
        close_tag = "</span>"

    parts = [
        "<li>", open_tag,
        "<i>%s</i>" % esc(year),
        "<h4>%s</h4>" % esc(title),
        "<em>%s</em>" % esc(authors),
    ]
    if ident:
        parts.append("<code>%s</code>" % esc(ident))
    parts.append(close_tag)
    parts.append("</li>")
    return "".join(parts)


def group_decades(works):
    """Decade buckets, empty decades collapsed away."""
    buckets = {}
    for w in works:
        y = w.get("year")
        if not y:
            continue
        buckets.setdefault((y // 10) * 10, []).append(w)
    return [(d, buckets[d]) for d in sorted(buckets)]


def build_wall(works):
    """One flat run of cells: a decade marker, then that decade's sheets, then
    the next marker. A single grid packs the whole thing with no holes, and the
    markers read as divider cards in the run of paper. Empty decades collapse."""
    cells = []
    for decade, items in group_decades(works):
        label = "%d%s" % (decade, DECADE_SUFFIX)
        cells.append('<li class="tiw-dl"><span>%s</span></li>' % label)
        cells.extend(sheet(w) for w in items)
    return "".join(cells)


def mass_sheet(w):
    """One sheet in the hero contact sheet: year and title only, no link, no
    identifier. The decade wall below carries the semantics and the links, so
    this block is aria-hidden and purely the mass of paper."""
    cls = "tiw-cs " + IMP_CLASS.get(w.get("importance"), "tiw-u")
    return '<li><span class="%s"><i>%s</i><h4>%s</h4></span></li>' % (
        cls, esc(w.get("year")), esc(w.get("title") or "")
    )


def build_mass(works):
    return (
        '<ul class="tiw-mass" aria-hidden="true">%s</ul>\n'
        % "".join(mass_sheet(w) for w in works)
    )


def build_section(works, n_findings, variant):
    """variant: 'human' or 'ai'. The two differ by one approved word."""
    verb = "Open" if variant == "human" else "Retrieve"
    years = sorted(w["year"] for w in works if w.get("year"))
    caption = (
        "The %d. Every work Cor is built from, %d to %d. Each one is real. "
        "%s any of them." % (len(works), years[0], years[-1], verb)
    )
    stamp = (
        "%d works, %d findings, counted %s. Live count at "
        '<a href="https://cor.demismatch.com/corpus.html">cor.demismatch.com</a>'
        % (len(works), n_findings, STAMP_DATE)
    )
    legend = "".join(
        '<span class="tiw-lg %s">%s</span>' % (cls, esc(word)) for cls, word in LEGEND
    )
    aria = (
        "The %d published works Cor is built from, oldest first"
        % len(works)
    )
    return (
        '<section class="tiw-wallsec" aria-labelledby="tiw-wall-cap">\n'
        '  <p class="tiw-key">%s</p>\n'
        '  <div class="tiw-bleed">\n'
        '    <ol class="tiw-wall" aria-label="%s">%s</ol>\n'
        "  </div>\n"
        '  <p class="tiw-cap" id="tiw-wall-cap">%s</p>\n'
        '  <p class="tiw-stamp">%s</p>\n'
        "</section>\n" % (legend, esc(aria), build_wall(works), esc(caption), stamp)
    )


def main():
    with open(os.path.join(HERE, "works-live.json")) as fh:
        works = json.load(fh)
    with open(os.path.join(HERE, "extractions-per-work.json")) as fh:
        per_work = json.load(fh)

    check_dashes(works)

    works = sorted(
        works,
        key=lambda w: (
            w.get("year") or 0,
            (w.get("authors") or "").lower(),
            (w.get("title") or "").lower(),
            w.get("id") or 0,
        ),
    )

    n_findings = sum(per_work.values())
    missing = [w["id"] for w in works if str(w["id"]) not in per_work]
    if missing:
        print(
            "WARNING: %d works have no extraction count: %r"
            % (len(missing), missing[:10]),
            file=sys.stderr,
        )
    if len(works) != 148 or n_findings != 635:
        print(
            "WARNING: counts moved. works=%d findings=%d. The stamp now says so; "
            "check the hero copy too (it hardcodes 148 and 635)."
            % (len(works), n_findings),
            file=sys.stderr,
        )

    for variant, out in (("human", "wall-human.html"), ("ai", "wall-ai.html")):
        html = build_section(works, n_findings, variant)
        with open(os.path.join(HERE, out), "w") as fh:
            fh.write(html)
        print("%s  %d works  %d bytes" % (out, len(works), len(html.encode("utf-8"))))

    mass = build_mass(works)
    with open(os.path.join(HERE, "mass.html"), "w") as fh:
        fh.write(mass)
    print("mass.html  %d works  %d bytes" % (len(works), len(mass.encode("utf-8"))))


if __name__ == "__main__":
    main()
