#!/usr/bin/env python3
"""Bake the real evidence into the two This Is Why pages.

Reads evidence-full.json + cards.json (this directory) and writes, into both
10truths/this-is-why.html and 10truths/hey-ai-this-is-why.html:

  1. an evidence block inside every one of the 20 answer cards, between the
     Mechanism / Proxy / Need list and the atlas link that already closes it;
  2. the ledger of every finding graded replicated, between the card grid and
     the provenance block, filterable by mechanism with CSS only;
  3. the CSS both need, inside the page <style>.

Every insertion sits between markers, so a re-run replaces it. Every number and
every string of data comes from evidence-full.json. The only new on-page words
are the ones in COPY-STRINGS-v2.md. Hyphens only.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
PAGES = [
    (os.path.join(ROOT, "10truths", "this-is-why.html"), "light"),
    (os.path.join(ROOT, "10truths", "hey-ai-this-is-why.html"), "dark"),
]
ATLAS = "https://cor.demismatch.com/mechanism.html#"
CORPUS = "https://cor.demismatch.com/corpus.html"
CODE_ORDER = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10",
              "M11", "M12", "M13", "M14", "R1"]

EV_START, EV_END = "<!-- TIW-EV-START -->", "<!-- TIW-EV-END -->"
LG_START, LG_END = "<!-- TIW-LEDGER-START -->", "<!-- TIW-LEDGER-END -->"
CSS_START, CSS_END = "/* TIW-EV-CSS-START */", "/* TIW-EV-CSS-END */"

# Grade colours, verbatim from tiw/sequence.css's palette in sequence.js
# (GRADE_COL). The dark page gets lifted tints of the two darkest ones so the
# chip stays readable on oxblood.
GRADE_COL_LIGHT = {
    "replicated": "#c4962c", "meta-analysis": "#a5801f", "longitudinal": "#2d6b6b",
    "clinical": "#3d8585", "cross-species": "#5a2a32", "contested": "#3a1218",
    "theoretical": "#8a7d5e", "thin": "#c4b894",
}
GRADE_COL_DARK = {
    "replicated": "#c4962c", "meta-analysis": "#d8b45e", "longitudinal": "#3d8585",
    "clinical": "#6fb0b0", "cross-species": "#c98d97", "contested": "#d99aa3",
    "theoretical": "#a89a78", "thin": "#c4b894",
}
THEME = {
    "light": {"hair": "rgba(58, 18, 24, 0.16)", "hair2": "rgba(58, 18, 24, 0.24)",
              "chip": "rgba(58, 18, 24, 0.06)", "col": GRADE_COL_LIGHT},
    "dark": {"hair": "rgba(236, 224, 196, 0.16)", "hair2": "rgba(236, 224, 196, 0.26)",
             "chip": "rgba(236, 224, 196, 0.06)", "col": GRADE_COL_DARK},
}


def esc(t):
    """Entity-escape the way the page already does: &amp; &lt; &gt; &quot; &#x27;."""
    return (str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;").replace("'", "&#x27;"))


def sentence(parts):
    """authors. title. year. where.  - one full stop per part, never two."""
    out = ""
    for p in parts:
        p = (str(p) if p is not None else "").strip()
        if not p:
            continue
        out += p if p.endswith(".") else p + "."
        out += " "
    return out.strip()


def load(n):
    with open(os.path.join(HERE, n), encoding="utf-8") as fh:
        return json.load(fh)


D = load("evidence-full.json")
WORKS, FINDINGS, MECHS = D["works"], D["findings"], D["mechanisms"]
TOTALS = D["totals"]
CARDS = {c["id"]: c for c in D["cards"]}
STAMP_DATE = "23 Aug 2026"


def source_line(f):
    w = WORKS[str(f["work"])]
    return sentence([w["authors"], w["title"], w["year"], f["where"]])


def count_line(c):
    n = c["counts"]
    t = "%d findings from %d works." % (n["findings"], n["works"])
    if n["replicated"]:
        t += " %d graded replicated, the top grade." % n["replicated"]
    if n["challenges"]:
        t += " %d challenges logged." % n["challenges"]
    return t


def finding_rows(ids, cls="tiw-ev"):
    rows = []
    for fid in ids:
        f = FINDINGS[str(fid)]
        quote, kind = f["quote"], "quote"
        if not quote:
            quote, kind = f["content"], "summary"
        rows.append(
            '<li class="%s-item"><span class="%s-kind">%s</span>'
            '<p class="%s-quote%s">%s</p>'
            '<p class="%s-src">%s</p>'
            '<span class="%s-grade" data-grade="%s">%s</span></li>'
            % (cls, cls, kind, cls, "" if kind == "quote" else " is-summary", esc(quote),
               cls, esc(source_line(f)), cls, esc(f["grade_label"]), esc(f["grade_label"])))
    return "".join(rows)


def card_block(card_id):
    c = CARDS[card_id]
    label = "EVIDENCE FOR %s IN THE ATLAS" % " AND ".join(c["codes"])
    return (
        '%s<section class="tiw-ev">'
        '<span class="tiw-ev-label">%s</span>'
        '<p class="tiw-ev-count">%s</p>'
        '<ol class="tiw-ev-list">%s</ol>'
        '</section>%s'
        % (EV_START, esc(label), esc(count_line(c)),
           finding_rows(c["top_findings"][:4]), EV_END))


def ledger_block():
    rep, tot, wks = TOTALS["replicated"], TOTALS["findings"], TOTALS["works_with_replicated"]
    opts = [("all", "All")] + [(code, "%s %s" % (code, MECHS[code]["name"])) for code in CODE_ORDER]
    radios = "".join(
        '<input class="tiw-led-radio" type="radio" name="tiw-ledf" id="tiw-ledf-%s"%s>'
        % (k, " checked" if k == "all" else "") for k, _ in opts)
    labels = "".join(
        '<label class="tiw-led-opt" for="tiw-ledf-%s">%s</label>' % (k, esc(v)) for k, v in opts)
    rows = []
    for f in D["ledger_replicated"]:
        quote, is_q = f["quote"], True
        if not quote:
            quote, is_q = f["content"], False
        codes = "".join('<a href="%s%s">%s</a>' % (ATLAS, code, code) for code in f["mech"])
        rows.append(
            '<li class="tiw-led-row" data-m="%s">'
            '<p class="tiw-led-quote%s">%s</p>'
            '<p class="tiw-led-src">%s</p>'
            '<p class="tiw-led-codes">%s</p></li>'
            % (" ".join(f["mech"]), "" if is_q else " is-summary", esc(quote),
               esc(source_line(f)), codes))
    return (
        '%s\n  <section class="tiw-led" id="ledger">'
        '<h2>The %d findings graded replicated</h2>'
        '<p class="tiw-led-lede">&quot;Replicated&quot; is reserved for findings the field has '
        'already converged on, cited to landmark sources.</p>'
        '<p class="tiw-led-count">%d of the %d findings carry it, from %d works.</p>'
        '%s<div class="tiw-led-filter"><span class="tiw-led-show">Show</span>%s</div>'
        '<ol class="tiw-led-list">%s</ol>'
        '<p class="tiw-led-stamp">%d works, %d findings, counted %s. Live count at '
        '<a href="%s">cor.demismatch.com</a></p>'
        '</section>\n  %s'
        % (LG_START, rep, rep, tot, wks, radios, labels, "".join(rows),
           TOTALS["works"], tot, STAMP_DATE, CORPUS, LG_END))


def css_block(theme):
    t = THEME[theme]
    grades = "\n".join('.tiw [data-grade="%s"] { color: %s; }' % (g, c) for g, c in t["col"].items())
    filters = "\n".join(
        '#tiw-ledf-%s:checked ~ .tiw-led-list > li:not([data-m~="%s"]) { display: none; }\n'
        '#tiw-ledf-%s:checked ~ .tiw-led-filter label[for="tiw-ledf-%s"] { background: var(--gold); '
        'color: var(--oxblood-deep); border-color: var(--gold); }\n'
        '#tiw-ledf-%s:focus-visible ~ .tiw-led-filter label[for="tiw-ledf-%s"] '
        '{ outline: 2px solid var(--gold); outline-offset: 2px; }' % (c, c, c, c, c, c)
        for c in CODE_ORDER)
    return """%(s)s
/* Evidence inside the cards, and the replicated ledger under the grid.
   Generated by scripts/this-is-why/gen-card-evidence.py - edit there. */
.tiw .tiw-ev { margin: 6px 0 16px; padding: 14px 16px 4px; border-left: 3px solid %(hair2)s; background: var(--tag-bg); }
.tiw .tiw-ev-label { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .14em; opacity: .6; margin-bottom: 7px; }
.tiw .tiw-ev-count { margin: 0 0 4px; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; line-height: 1.7; opacity: .85; }
.tiw .tiw-ev-list { list-style: none; margin: 0; padding: 0; }
.tiw .tiw-ev-item { display: grid; grid-template-columns: 64px minmax(0, 1fr); column-gap: 10px; row-gap: 3px; padding: 11px 0 12px; border-top: 1px solid %(hair)s; margin-top: 10px; }
.tiw .tiw-ev-kind { grid-column: 1; grid-row: 1; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .12em; opacity: .5; padding-top: 5px; }
.tiw .tiw-ev-quote { grid-column: 2; grid-row: 1; margin: 0; font-size: 15px; font-style: italic; line-height: 1.55; overflow-wrap: anywhere; }
.tiw .tiw-ev-quote.is-summary { font-style: normal; }
.tiw .tiw-ev-src { grid-column: 2; grid-row: 2; margin: 3px 0 0; font-size: 12.5px; line-height: 1.5; opacity: .68; overflow-wrap: anywhere; }
.tiw .tiw-ev-grade { grid-column: 2; grid-row: 3; justify-self: start; margin-top: 6px; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .1em; padding: 2px 7px; border: 1px solid currentColor; }
%(grades)s

.tiw .tiw-led { margin-top: 70px; padding-top: 30px; border-top: 1px solid %(hair2)s; max-width: 900px; }
.tiw .tiw-led h2 { font-size: 24px; margin: 0 0 14px; }
.tiw .tiw-led-lede { margin: 0 0 6px; font-size: 16.5px; max-width: 72ch; }
.tiw .tiw-led-count { margin: 0 0 20px; font-family: 'JetBrains Mono', monospace; font-size: 12px; opacity: .8; }
.tiw .tiw-led-radio { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%%); white-space: nowrap; }
.tiw .tiw-led-filter { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding-bottom: 18px; border-bottom: 1px solid %(hair)s; }
.tiw .tiw-led-show { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; opacity: .55; margin-right: 4px; }
.tiw .tiw-led-opt { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: .04em; padding: 4px 9px; border: 1px solid %(hair2)s; cursor: pointer; background: %(chip)s; }
.tiw .tiw-led-opt:hover { border-color: var(--gold); }
#tiw-ledf-all:checked ~ .tiw-led-filter label[for="tiw-ledf-all"] { background: var(--gold); color: var(--oxblood-deep); border-color: var(--gold); }
#tiw-ledf-all:focus-visible ~ .tiw-led-filter label[for="tiw-ledf-all"] { outline: 2px solid var(--gold); outline-offset: 2px; }
%(filters)s
.tiw .tiw-led-list { list-style: none; margin: 0; padding: 0; }
.tiw .tiw-led-row { padding: 16px 0 15px; border-bottom: 1px solid %(hair)s; }
.tiw .tiw-led-quote { margin: 0; font-size: 15.5px; font-style: italic; line-height: 1.55; overflow-wrap: anywhere; }
.tiw .tiw-led-quote.is-summary { font-style: normal; }
.tiw .tiw-led-src { margin: 5px 0 0; font-size: 13px; line-height: 1.5; opacity: .68; overflow-wrap: anywhere; }
.tiw .tiw-led-codes { display: flex; flex-wrap: wrap; gap: 6px; margin: 7px 0 0; }
.tiw .tiw-led-codes a { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .1em; padding: 2px 6px; border: 1px solid %(hair2)s; text-decoration: none; color: inherit; }
.tiw .tiw-led-codes a:hover { border-color: var(--gold); }
.tiw .tiw-led-stamp { margin: 22px 0 0; font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .04em; opacity: .6; }
.tiw .tiw-led-stamp a { color: inherit; }
@media (max-width: 560px) {
  .tiw .tiw-ev { padding: 12px 13px 4px; }
  .tiw .tiw-ev-item { grid-template-columns: minmax(0, 1fr); }
  .tiw .tiw-ev-kind { grid-column: 1; grid-row: 1; padding-top: 0; }
  .tiw .tiw-ev-quote { grid-column: 1; grid-row: 2; font-size: 14.5px; }
  .tiw .tiw-ev-src { grid-column: 1; grid-row: 3; }
  .tiw .tiw-ev-grade { grid-column: 1; grid-row: 4; }
  .tiw .tiw-led { margin-top: 50px; }
  .tiw .tiw-led h2 { font-size: 21px; }
  .tiw .tiw-led-filter { gap: 5px; padding-bottom: 14px; }
  .tiw .tiw-led-opt { font-size: 9px; letter-spacing: 0; padding: 3px 6px; }
  .tiw .tiw-led-quote { font-size: 15px; }
}
%(e)s""" % {"s": CSS_START, "e": CSS_END, "hair": t["hair"], "hair2": t["hair2"],
            "chip": t["chip"], "grades": grades, "filters": filters}


def strip_marked(text, start, end):
    return re.sub(re.escape(start) + r".*?" + re.escape(end), "", text, flags=re.S)


def patch(path, theme):
    with open(path, encoding="utf-8") as fh:
        src = fh.read()
    before = len(src.encode("utf-8"))
    out = strip_marked(strip_marked(src, EV_START, EV_END), LG_START, LG_END)
    out = strip_marked(out, CSS_START, CSS_END)

    # 1. the evidence block inside every card
    patched = [0]

    def card_sub(m):
        cid, body = m.group(1), m.group(2)
        if cid not in CARDS:
            return m.group(0)
        block = card_block(cid)
        new, n = re.subn(r"</dl>\s*\n\s*<a class=\"cor-link\"",
                         lambda mm: '</dl>\n        ' + block + '\n        <a class="cor-link"',
                         body, count=1)
        if n:
            patched[0] += 1
        return '<details class="card" id="%s">%s</details>' % (cid, new)

    out = re.sub(r'<details class="card" id="(item-\d\d)">(.*?)</details>', card_sub, out, flags=re.S)

    # 2. the ledger, between the grid and the provenance block
    ledger = ledger_block()
    out, n_lg = re.subn(r"</main>\n\s*<section class=\"provenance\"",
                        lambda m: '</main>\n  ' + ledger + '\n  <section class="provenance"',
                        out, count=1)

    # 3. the CSS it all needs, at the end of the page style block
    css = css_block(theme)
    out, n_css = re.subn(r"\n\s*</style>", lambda m: "\n" + css + "\n</style>", out, count=1)

    rows = out.count('<li class="tiw-led-row"')
    em, en = out.count("—"), out.count("–")
    ok = (patched[0] == 20 and n_lg == 1 and n_css == 1
          and rows == TOTALS["replicated"] and em == 0 and en == 0)
    if not ok:
        print("REFUSED to write %s: cards=%d ledger=%d css=%d rows=%d em=%d en=%d"
              % (path, patched[0], n_lg, n_css, rows, em, en))
        return False
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(out)
    after = len(out.encode("utf-8"))
    print("%s\n  cards patched %d | ledger rows %d | bytes %d -> %d (+%d) | em dash %d, en dash %d"
          % (os.path.basename(path), patched[0], rows, before, after, after - before, em, en))
    return True


if __name__ == "__main__":
    good = all([patch(p, t) for p, t in PAGES])
    print("totals: %d works, %d findings, %d replicated, %d works with replicated"
          % (TOTALS["works"], TOTALS["findings"], TOTALS["replicated"], TOTALS["works_with_replicated"]))
    sys.exit(0 if good else 1)
