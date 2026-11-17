#!/usr/bin/env python3
"""Merge the designer's hero + wall fragments into the built pages.

Usage: python3 merge.py            (writes in place in the repo, idempotent)

For each page:
  1. Replace everything between <!-- TIW-HERO-SLOT-START --> and
     <!-- TIW-HERO-SLOT-END --> with hero-<variant>.html (banner comment stripped).
  2. Insert hero-<variant>.css at /* TIW-HERO-CSS-SLOT */ (slot marker kept, so a
     re-run replaces rather than appends).
  3. Remove the page's own hero rules that the fragment supersedes
     (.tiw header, .tiw .site, .tiw .site a, .tiw h1, .tiw .notice, .tiw .notice a,
     .tiw .standfirst, .tiw .standfirst p). They only ever targeted the hero.
  4. Human page only: card eyebrow text colour gold -> teal (contrast 1.77:1 -> 4.0:1).
  5. Add <link rel="canonical"> if missing.
Then re-run the greps and print counts.
"""
import re, sys, pathlib

WD = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path("/Users/maartenrischen/code/DEMISMATCH/DEMISMATCH COR WEBSITE/10truths")
PAGES = {
    "human": ("this-is-why.html", "https://demismatch.com/this-is-why.html"),
    "ai": ("hey-ai-this-is-why.html", "https://demismatch.com/hey-ai-this-is-why.html"),
}
SUPERSEDED = [
    r"^\.tiw header \{[^\n]*\}\n",
    r"^\.tiw \.site \{[^\n]*\}\n",
    r"^\.tiw \.site a \{[^\n]*\}\n",
    r"^\.tiw h1 \{[^\n]*\}\n",
    r"^\.tiw \.notice \{[^\n]*\}\n",
    r"^\.tiw \.notice a \{[^\n]*\}\n",
    r"^\.tiw \.standfirst \{[^\n]*\}\n",
    r"^\.tiw \.standfirst p \{[^\n]*\}\n",
]
START, END = "<!-- TIW-HERO-SLOT-START -->", "<!-- TIW-HERO-SLOT-END -->"
CSS_SLOT = "/* TIW-HERO-CSS-SLOT */"
CSS_BEGIN, CSS_FIN = "/* TIW-HERO-CSS-BEGIN */", "/* TIW-HERO-CSS-END */"

def strip_banner(frag: str) -> str:
    return re.sub(r"\A\s*<!--.*?-->\s*", "", frag, count=1, flags=re.S)

for variant, (fname, canonical) in PAGES.items():
    path = REPO / fname
    html = path.read_text(encoding="utf-8")
    frag = strip_banner((WD / f"hero-{variant}.html").read_text(encoding="utf-8")).strip("\n")
    css = (WD / f"hero-{variant}.css").read_text(encoding="utf-8").strip("\n")

    # 1. hero slot
    a, b = html.index(START), html.index(END)
    html = html[: a + len(START)] + "\n" + frag + "\n  " + html[b:]

    # 2. css slot (idempotent: drop a previous insert first)
    html = re.sub(re.escape(CSS_BEGIN) + r".*?" + re.escape(CSS_FIN) + r"\n?", "", html, flags=re.S)
    html = html.replace(CSS_SLOT, CSS_SLOT + "\n" + CSS_BEGIN + "\n" + css + "\n" + CSS_FIN, 1)

    # 3. superseded hero rules
    removed = 0
    for pat in SUPERSEDED:
        html, n = re.subn(pat, "", html, flags=re.M)
        removed += n

    # 4. eyebrow contrast (human only)
    if variant == "human":
        html, n_eye = re.subn(
            r"(^\.tiw \.eyebrow \{[^\n]*?)color: var\(--accent\);",
            r"\1color: var(--teal);",
            html, flags=re.M)
    else:
        n_eye = 0

    # 5. canonical
    if 'rel="canonical"' not in html:
        html = html.replace("</title>", f'</title>\n  <link rel="canonical" href="{canonical}">', 1)

    path.write_text(html, encoding="utf-8")

    # report
    s = html
    print(f"{fname}: {len(s.encode('utf-8'))} bytes | superseded rules removed {removed} | eyebrow fix {n_eye} | "
          f"U+2014 {s.count(chr(0x2014))} U+2013 {s.count(chr(0x2013))} | 'Real input' {s.count('Real input')} | "
          f"real input (ci) {len(re.findall('real input', s, re.I))} | <script> {len(re.findall(r'<script', s))} | "
          f"details.card {s.count('<details class=\"card\"')} | tiw-s sheets {len(re.findall(r'class=\"tiw-s( |\")', s))} | "
          f"canonical {'yes' if 'rel=\"canonical\"' in s else 'no'}")
