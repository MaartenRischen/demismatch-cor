#!/usr/bin/env python3
"""Character-level verbatim integrity check.

Compares the two static mockups against the VERBATIM batch source files.
Reads only; writes integrity-report.md and cards.json into WORKDIR.
Stdlib only.
"""
import difflib
import html
import json
import os
import re
import sys

WORKDIR = "/private/tmp/claude-501/-Users-maartenrischen-code-DEMISMATCH/cd290c1c-43c2-4ecd-b823-e6cad804d7fc/scratchpad/thisiswhy"
BATCH = "/Users/maartenrischen/code/DEMISMATCH/cor-app/decode-talk/showcase-batch-2026-08-21"
PAGES = {
    "human": os.path.join(WORKDIR, "this-is-why-mockup.html"),
    "ai": os.path.join(WORKDIR, "hey-ai-this-is-why-mockup.html"),
}
ITEMS = ["%02d" % n for n in range(1, 21)]
TIERS = ["light", "advisor"]

# ---------------------------------------------------------------- batch side

def parse_batch(path):
    raw = open(path, encoding="utf-8").read()
    lines = raw.split("\n")
    hdr = {}
    rule = None
    for i, ln in enumerate(lines):
        if ln.startswith("# "):
            k, _, v = ln[2:].partition(":")
            hdr[k.strip()] = v.strip()
        elif set(ln.strip()) == {"-"} and len(ln.strip()) > 3:
            rule = i
            break
    if rule is None:
        raise ValueError("no ---- rule line in %s" % path)
    body = "\n".join(lines[rule + 1:])
    # trailing fenced block
    m = re.search(r"\n```\n(.*?)\n```\s*$", body, re.S)
    fence_ok = True
    if m:
        prose = body[:m.start()].strip()
        fence = m.group(1)
    else:
        fence_ok = False
        prose = body.strip()
        fence = ""
    tag = {}
    for ln in fence.split("\n"):
        if ":" in ln:
            k, _, v = ln.partition(":")
            tag[k.strip()] = v.strip()
    return {
        "path": path,
        "header": hdr,
        "question": hdr.get("question", ""),
        "prose": prose,
        "tag": tag,
        "fence_ok": fence_ok,
        "raw": raw,
    }


def load_batch():
    out = {}
    for nn in ITEMS:
        out[nn] = {}
        for tier in TIERS:
            out[nn][tier] = parse_batch(os.path.join(BATCH, "%s-%s.txt" % (nn, tier)))
    return out

# ---------------------------------------------------------------- mockup side

CARD_RE = re.compile(
    r'<details class="card" id="(item-\d\d)">(.*?)</details>', re.S)


def strip_tags(s):
    return re.sub(r"<[^>]+>", "", s)


def txt(s):
    return html.unescape(strip_tags(s)).strip()


def html_to_batch_text(paras):
    """Normalize mockup answer <p> html back to the batch's plain-text form."""
    out = []
    leftover_tags = set()
    for p in paras:
        t = p
        t = re.sub(r"<strong>(.*?)</strong>", r"**\1**", t, flags=re.S)
        t = re.sub(r"<em>(.*?)</em>", r"*\1*", t, flags=re.S)
        for m in re.finditer(r"<[^>]+>", t):
            leftover_tags.add(m.group(0))
        t = re.sub(r"<[^>]+>", "", t)
        t = html.unescape(t)
        out.append(t.strip())
    return "\n\n".join(out).strip(), leftover_tags


def esc(s):
    """Match the mockup escaping style: &amp; &lt; &gt; &quot; &#x27;."""
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;").replace("'", "&#x27;"))


def batch_text_to_html(prose):
    """Render batch prose to mockup-convention HTML: one <p> per paragraph."""
    paras = [p.strip() for p in re.split(r"\n\s*\n", prose) if p.strip()]
    outs = []
    for p in paras:
        e = esc(p)
        e = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", e, flags=re.S)
        e = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", e, flags=re.S)
        outs.append("<p>%s</p>" % e)
    return "".join(outs)


def parse_page(path):
    src = open(path, encoding="utf-8").read()
    cards = []
    for cid, inner in CARD_RE.findall(src):
        c = {"id": cid, "item": int(cid.split("-")[1])}
        m = re.search(r'<span class="eyebrow">(.*?)</span>', inner, re.S)
        c["eyebrow"] = txt(m.group(1)) if m else None
        m = re.search(r'<span class="eyebrow-q">(.*?)</span>', inner, re.S)
        c["eyebrow_q"] = txt(m.group(1)) if m else None
        m = re.search(r'<p class="tldr">(.*?)</p>', inner, re.S)
        c["tldr"] = txt(m.group(1)) if m else None
        m = re.search(r'<span class="q">(.*?)</span>', inner, re.S)
        c["question"] = txt(m.group(1)) if m else None

        full = re.search(r'<div class="full">(.*?)$', inner, re.S).group(1)
        asked_end = full.find("</div>")
        eli5_start = full.find('<div class="eli5"')
        c["_eli5_present"] = eli5_start != -1
        ans_block = full[asked_end + len("</div>"):eli5_start if eli5_start != -1 else len(full)]
        paras = re.findall(r"<p>(.*?)</p>", ans_block, re.S)
        c["answer_paras_html"] = paras
        c["answer_html"] = "".join("<p>%s</p>" % p for p in paras)
        c["answer_text"], c["_leftover_tags"] = html_to_batch_text(paras)
        # anything in ans_block that is not a <p>...</p> or whitespace?
        residue = re.sub(r"<p>.*?</p>", "", ans_block, flags=re.S).strip()
        c["_ans_residue"] = residue

        if eli5_start != -1:
            eli5_end = full.find('<dl class="tag"', eli5_start)
            eli5_raw = full[eli5_start:eli5_end]
            m = re.search(r'<div class="eli5">(.*?)</div>\s*$', eli5_raw.strip(), re.S)
            c["eli5_html"] = m.group(1).strip() if m else eli5_raw.strip()
            c["eli5_text"] = txt(eli5_raw)
        else:
            c["eli5_html"] = None
            c["eli5_text"] = None

        dl = re.search(r'<dl class="tag">(.*?)</dl>', full, re.S).group(1)
        rows = re.findall(r'<div class="tag-row"><dt>(.*?)</dt><dd(.*?)>(.*?)</dd></div>', dl, re.S)
        tagvals = {}
        for dt, ddattr, dd in rows:
            tagvals[txt(dt)] = txt(dd)
        c["tag"] = tagvals
        c["proxy"] = tagvals.get("Proxy")
        c["need"] = tagvals.get("Need")
        c["mechanism_label"] = tagvals.get("Mechanism")
        m = re.search(r'<dt>Mechanism</dt><dd[^>]*><a href="([^"]+)"', dl)
        c["mechanism_href"] = m.group(1) if m else None
        m = re.search(r'<a class="cor-link" href="([^"]+)">(.*?)</a>', full, re.S)
        c["cor_link_href"] = m.group(1) if m else None
        c["cor_link_text"] = txt(m.group(2)) if m else None
        cards.append(c)
    return src, cards

# ---------------------------------------------------------------- diff helpers

def first_diffs(a, b, n=5, ctx=30):
    """First n differing character positions with context windows."""
    out = []
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        out.append({
            "op": op,
            "pos_mockup": i1,
            "pos_batch": j1,
            "mockup": a[max(0, i1 - ctx):i2 + ctx],
            "batch": b[max(0, j1 - ctx):j2 + ctx],
            "mockup_seg": a[i1:i2],
            "batch_seg": b[j1:j2],
        })
        if len(out) >= n:
            break
    return out


def udiff(a, b, an, bn):
    return "\n".join(difflib.unified_diff(
        a.split("\n"), b.split("\n"), fromfile=an, tofile=bn, lineterm=""))

# ---------------------------------------------------------------- greps

def card_spans(src):
    """Character spans of the tool-sourced regions: answer <p>s and the tag dl."""
    spans = []
    for m in CARD_RE.finditer(src):
        inner, base = m.group(2), m.start(2)
        f = re.search(r'<div class="full">(.*?)$', inner, re.S)
        full, fbase = f.group(1), base + f.start(1)
        a_end = full.find("</div>") + len("</div>")
        e_start = full.find('<div class="eli5"')
        spans.append((fbase + a_end,
                      fbase + (e_start if e_start != -1 else len(full)),
                      m.group(1) + " answer"))
        d = re.search(r'<dl class="tag">.*?</dl>', full, re.S)
        if d:
            spans.append((fbase + d.start(), fbase + d.end(), m.group(1) + " tag"))
    return spans


def region_of(src, spans, line_offsets, line_no, col):
    off = line_offsets[line_no - 1] + col
    for a, b, label in spans:
        if a <= off < b:
            return "TOOL PROSE (%s)" % label
    return "non-tool copy"


def grep_chars(src, path):
    lines = src.split("\n")
    line_offsets = []
    acc = 0
    for ln in lines:
        line_offsets.append(acc)
        acc += len(ln) + 1
    spans = card_spans(src)
    res = {"em_dash": [], "en_dash": [], "real_input": []}
    for i, ln in enumerate(lines, 1):
        for ch, key in ((u"—", "em_dash"), (u"–", "en_dash")):
            for m in re.finditer(re.escape(ch), ln):
                res[key].append((i, ln[max(0, m.start() - 40):m.start() + 40],
                                 region_of(src, spans, line_offsets, i, m.start())))
        for m in re.finditer(r"real input", ln, re.I):
            res["real_input"].append((i, ln[max(0, m.start() - 40):m.start() + 40],
                                      region_of(src, spans, line_offsets, i, m.start())))
    return res


NOT_BUT_RE = re.compile(r"\bnot [^.;<>]{1,80}?, but\b", re.I)


def grep_not_but(src):
    hits = []
    for i, ln in enumerate(src.split("\n"), 1):
        for m in NOT_BUT_RE.finditer(ln):
            hits.append((i, m.group(0)))
    return hits

# ---------------------------------------------------------------- main

def main():
    batch = load_batch()
    pages = {}
    for name, path in PAGES.items():
        src, cards = parse_page(path)
        pages[name] = {"src": src, "cards": cards, "path": path}

    report = []
    rows = []
    drift_cards = 0
    oddities = []
    results = {}

    # emphasis-convention check on batch prose
    underscore_hits = []
    for nn in ITEMS:
        for tier in TIERS:
            pr = batch[nn][tier]["prose"]
            if re.search(r"(?<![A-Za-z0-9_])_[^_\n]+_(?![A-Za-z0-9_])", pr):
                underscore_hits.append("%s-%s" % (nn, tier))
            if not batch[nn][tier]["fence_ok"]:
                oddities.append("Batch file %s-%s.txt: no trailing ``` fenced tag block found." % (nn, tier))
            missing = [k for k in ("Mechanism", "Proxy", "Need") if k not in batch[nn][tier]["tag"]]
            if missing:
                oddities.append("Batch file %s-%s.txt: fence missing %s." % (nn, tier, ", ".join(missing)))

    for name in ("human", "ai"):
        results[name] = []
        seen = set()
        for c in pages[name]["cards"]:
            nn = "%02d" % c["item"]
            seen.add(nn)
            notes = []
            per_tier = {}
            for tier in TIERS:
                b = batch[nn][tier]
                per_tier[tier] = {
                    "prose_exact": c["answer_text"] == b["prose"],
                    "ratio": difflib.SequenceMatcher(None, c["answer_text"], b["prose"], autojunk=False).ratio(),
                    "tag_exact": (c["mechanism_label"] == b["tag"].get("Mechanism")
                                  and c["proxy"] == b["tag"].get("Proxy")
                                  and c["need"] == b["tag"].get("Need")),
                    "q_exact": c["question"] == b["question"],
                }
            exact = [t for t in TIERS if per_tier[t]["prose_exact"]]
            if len(exact) == 1:
                pick = exact[0]
                pick_exact = True
            elif len(exact) == 2:
                pick = "light"
                pick_exact = True
                notes.append("BOTH tiers match prose exactly (identical files?)")
            else:
                pick = max(TIERS, key=lambda t: per_tier[t]["ratio"])
                pick_exact = False
                drift_cards += 1
                notes.append("NO EXACT MATCH; closest=%s ratio=%.6f" % (pick, per_tier[pick]["ratio"]))

            b = batch[nn][pick]
            tag_ok = per_tier[pick]["tag_exact"]
            q_ok = per_tier[pick]["q_exact"]
            if not tag_ok:
                if c["mechanism_label"] != b["tag"].get("Mechanism"):
                    notes.append("Mechanism mockup=%r batch=%r" % (c["mechanism_label"], b["tag"].get("Mechanism")))
                if c["proxy"] != b["tag"].get("Proxy"):
                    notes.append("Proxy mockup=%r batch=%r" % (c["proxy"], b["tag"].get("Proxy")))
                if c["need"] != b["tag"].get("Need"):
                    notes.append("Need mockup=%r batch=%r" % (c["need"], b["tag"].get("Need")))
            if not q_ok:
                notes.append("Question mockup=%r batch=%r" % (c["question"], b["question"]))
            if c["_leftover_tags"]:
                notes.append("unexpected inline tags in answer: %s" % sorted(c["_leftover_tags"]))
            if c["_ans_residue"]:
                notes.append("non-<p> residue in answer block: %r" % c["_ans_residue"][:120])
            if not c["_eli5_present"]:
                notes.append("no .eli5 box")

            results[name].append({
                "card": c, "nn": nn, "pick": pick, "pick_exact": pick_exact,
                "per_tier": per_tier, "batch": b, "tag_ok": tag_ok, "q_ok": q_ok,
                "notes": notes,
            })
            rows.append((name, nn, pick, "YES" if pick_exact else "NO",
                         "YES" if q_ok else "NO", "YES" if tag_ok else "NO",
                         "; ".join(notes) if notes else ""))
        missing = [nn for nn in ITEMS if nn not in seen]
        if missing:
            oddities.append("Page %s: missing cards %s" % (name, missing))
        if len(pages[name]["cards"]) != 20:
            oddities.append("Page %s: %d cards found, expected 20" % (name, len(pages[name]["cards"])))

    # ---- report
    first = ("NO DRIFT: all 40 cards match their batch file exactly"
             if drift_cards == 0 else "DRIFT FOUND: %d cards" % drift_cards)
    report.append(first)
    report.append("")
    report.append("Generated by integrity_check.py. Mockups and batch files were not modified.")
    report.append("")
    report.append("## Per-card results")
    report.append("")
    report.append("| page | item | pick tier | prose exact? | question match? | tag match? | notes |")
    report.append("|---|---|---|---|---|---|---|")
    for r in rows:
        report.append("| %s | %s | %s | %s | %s | %s | %s |" % r)
    report.append("")

    # detail blocks for drift
    detail = []
    for name in ("human", "ai"):
        for r in results[name]:
            if r["pick_exact"] and r["tag_ok"] and r["q_ok"] and not r["notes"]:
                continue
            if not r["notes"]:
                continue
            detail.append("### %s / %s" % (name, r["card"]["id"]))
            detail.append("")
            for n in r["notes"]:
                detail.append("- %s" % n)
            if not r["pick_exact"]:
                a, b = r["card"]["answer_text"], r["batch"]["prose"]
                detail.append("")
                detail.append("Ratios: light=%.6f advisor=%.6f" % (
                    r["per_tier"]["light"]["ratio"], r["per_tier"]["advisor"]["ratio"]))
                detail.append("")
                detail.append("```diff")
                detail.append(udiff(a, b, "mockup", "batch/%s-%s.txt" % (r["nn"], r["pick"])))
                detail.append("```")
                detail.append("")
                detail.append("First differing positions:")
                detail.append("")
                for d in first_diffs(a, b):
                    detail.append("- %s at mockup char %d / batch char %d" % (d["op"], d["pos_mockup"], d["pos_batch"]))
                    detail.append("  - mockup: ...%s..." % d["mockup"].replace("\n", "\\n"))
                    detail.append("  - batch:  ...%s..." % d["batch"].replace("\n", "\\n"))
            detail.append("")
    if detail:
        report.append("## Drift detail")
        report.append("")
        report.extend(detail)
    else:
        report.append("## Drift detail")
        report.append("")
        report.append("None. Every card's prose, question, and tag values are byte-identical to its batch file.")
        report.append("")

    # ---- greps
    report.append("## Character and phrase greps (whole file, both mockups)")
    report.append("")
    report.append("| file | U+2014 em dash | U+2013 en dash | \"real input\" (case-insensitive) |")
    report.append("|---|---|---|---|")
    grep_results = {}
    for name, path in PAGES.items():
        g = grep_chars(pages[name]["src"], path)
        grep_results[name] = g
        report.append("| %s | %d | %d | %d |" % (os.path.basename(path),
                      len(g["em_dash"]), len(g["en_dash"]), len(g["real_input"])))
    report.append("")
    for name in ("human", "ai"):
        g = grep_results[name]
        for key, label in (("em_dash", "U+2014 em dash"), ("en_dash", "U+2013 en dash"), ("real_input", '"real input"')):
            for ln, ctx, region in g[key]:
                report.append("- %s %s line %d, in %s: `%s`" % (
                    os.path.basename(PAGES[name]), label, ln, region, ctx.strip()))
    if not any(grep_results[n][k] for n in grep_results for k in ("em_dash", "en_dash", "real_input")):
        report.append("No hits for any of the three.")
    report.append("")

    report.append('### Note only: "not X, but Y" comma constructions (approved non-tool copy is exempt)')
    report.append("")
    nb_any = False
    for name, path in PAGES.items():
        for ln, frag in grep_not_but(pages[name]["src"]):
            nb_any = True
            report.append("- %s line %d: `%s`" % (os.path.basename(path), ln, frag))
    if not nb_any:
        report.append("None found anywhere in either file.")
    report.append("")

    # ---- cross-page
    report.append("## Cross-page check (human vs AI, per item)")
    report.append("")
    hm = {r["nn"]: r for r in results["human"]}
    am = {r["nn"]: r for r in results["ai"]}
    xp = []
    for nn in ITEMS:
        h, a = hm.get(nn), am.get(nn)
        if not h or not a:
            xp.append("- item %s: missing on one page" % nn)
            continue
        d = []
        if h["card"]["answer_text"] != a["card"]["answer_text"]:
            d.append("answer prose differs")
        if h["card"]["question"] != a["card"]["question"]:
            d.append("question differs (human=%r ai=%r)" % (h["card"]["question"], a["card"]["question"]))
        for k in ("mechanism_label", "proxy", "need"):
            if h["card"][k] != a["card"][k]:
                d.append("%s differs (human=%r ai=%r)" % (k, h["card"][k], a["card"][k]))
        if h["pick"] != a["pick"]:
            d.append("PICK TIER differs (human=%s ai=%s)" % (h["pick"], a["pick"]))
        if d:
            xp.append("- item %s: %s" % (nn, "; ".join(d)))
    if xp:
        report.extend(xp)
    else:
        report.append("All 20 items: answer prose, question, and all three tag values are byte-identical across the two pages.")
    report.append("")
    # eyebrow/tldr differences are expected; report them as info
    report.append("Expected page-level differences (informational):")
    eb_h = sorted({r["card"]["eyebrow"] for r in results["human"]})
    eb_a = sorted({r["card"]["eyebrow"] for r in results["ai"]})
    report.append("- human eyebrow values: %s" % eb_h)
    report.append("- ai eyebrow values: %s" % eb_a)
    n_eq = sum(1 for nn in ITEMS if hm[nn]["card"]["eyebrow_q"] == am[nn]["card"]["eyebrow_q"])
    n_tl = sum(1 for nn in ITEMS if hm[nn]["card"]["tldr"] == am[nn]["card"]["tldr"])
    n_e5 = sum(1 for nn in ITEMS if hm[nn]["card"]["eli5_html"] == am[nn]["card"]["eli5_html"])
    report.append("- eyebrow_q identical on %d/20 items; tldr identical on %d/20; eli5 identical on %d/20" % (n_eq, n_tl, n_e5))
    report.append("")

    # ---- mechanism codes
    report.append("## Mechanism codes and cor-link hrefs")
    report.append("")
    codes = set()
    hrefs = set()
    per_item_codes = {}
    for name in ("human", "ai"):
        for r in results[name]:
            c = r["card"]
            found = set(re.findall(r"\b(M\d+|R1)\b", (c["mechanism_label"] or "")))
            found |= set(re.findall(r"\b(M\d+|R1)\b", (c["mechanism_href"] or "")))
            found |= set(re.findall(r"\b(M\d+|R1)\b", (c["cor_link_href"] or "")))
            codes |= found
            hrefs.add(c["cor_link_href"])
            hrefs.add(c["mechanism_href"])
            per_item_codes.setdefault(r["nn"], set()).update(found)

    def keyf(x):
        return (0, int(x[1:])) if x.startswith("M") else (1, 0)
    report.append("- Codes across both pages (tag Mechanism values + cor-link hrefs): %s" % sorted(codes, key=keyf))
    report.append("- Distinct hrefs used: %s" % sorted(h for h in hrefs if h))
    report.append("")
    report.append("| item | codes | mechanism label (human) | cor-link href (human) |")
    report.append("|---|---|---|---|")
    for nn in ITEMS:
        c = hm[nn]["card"]
        report.append("| %s | %s | %s | %s |" % (nn, " ".join(sorted(per_item_codes.get(nn, set()), key=keyf)),
                                                 c["mechanism_label"], c["cor_link_href"]))
    report.append("")

    # ---- verification of the comparison method itself
    report.append("## Verification of the comparison method")
    report.append("")
    bad_join = ["%s-%s" % (nn, t) for nn in ITEMS for t in TIERS
                if "\n\n".join(x.strip() for x in re.split(r"\n\s*\n", batch[nn][t]["prose"]))
                != batch[nn][t]["prose"]]
    bad_rt = []
    for nn in ITEMS:
        for t in TIERS:
            h = batch_text_to_html(batch[nn][t]["prose"])
            back, _ = html_to_batch_text(re.findall(r"<p>(.*?)</p>", h, re.S))
            if back != batch[nn][t]["prose"]:
                bad_rt.append("%s-%s" % (nn, t))
    bad_html = []
    for name in ("human", "ai"):
        for r in results[name]:
            if r["pick_exact"] and r["card"]["answer_html"] != batch_text_to_html(r["batch"]["prose"]):
                bad_html.append("%s/%s" % (name, r["card"]["id"]))
    ver = [
        "Paragraph split and rejoin is lossless on all 40 batch files, so the normalizer hides no whitespace slack: %s"
        % ("PASS" if not bad_join else "FAIL on %s" % bad_join),
        "Renderer round-trip (batch text to HTML to batch text) is the identity on all 40 batch files: %s"
        % ("PASS" if not bad_rt else "FAIL on %s" % bad_rt),
        "Every matching card's answer HTML is BYTE-IDENTICAL to a fresh render of its batch prose under the mockup conventions (&#x27; &quot; &amp; escaping, *x* to <em>, one <p> per paragraph): %s"
        % ("PASS" if not bad_html else "FAIL on %s" % bad_html),
        "That last check is stronger than text equality: it proves the escaping style and the emphasis convention match, not only the visible characters.",
    ]
    for v in ver:
        report.append("- %s" % v)
    report.append("")

    # ---- oddities
    report.append("## Oddities")
    report.append("")
    odd = list(oddities)
    for nn in ITEMS:
        if hm[nn]["pick"] != am[nn]["pick"]:
            odd.append("Item %s: pick tier differs across pages (human=%s, ai=%s)." % (nn, hm[nn]["pick"], am[nn]["pick"]))
    for name in ("human", "ai"):
        r = [x for x in results[name] if x["nn"] == "14"][0]
        if r["pick"] != "advisor":
            odd.append("Item 14 on the %s page picks %s, not advisor. Item 14 MUST use advisor (light's Proxy line contains the banned phrase \"real input\")." % (name, r["pick"]))
        else:
            odd.append("Item 14 on the %s page correctly uses advisor (confirmed against the known decision)." % name)
    if underscore_hits:
        odd.append("Batch files using _underscore_ emphasis instead of *asterisk*: %s. Reported, NOT adapted." % underscore_hits)
    else:
        odd.append("Emphasis convention: every batch file uses *asterisk* emphasis (no _underscore_ emphasis found). The mockup <em> to *x* mapping is correct.")
    for name in ("human", "ai"):
        for ln, ctx, region in grep_results[name]["real_input"]:
            odd.append('Page %s line %d contains the phrase "real input" in %s: `%s`. It is NOT in any tool answer or tag block, so no batch pick is affected, but the phrase is the one banned in item 14.'
                       % (name, ln, region, ctx.strip()))
    odd.append("cards.json `cor_link_text` holds the unescaped arrow character U+2192 (the mockup writes it as `&rarr;`). Re-encode it as `&rarr;` when writing HTML back out.")
    # light-vs-advisor identical files
    same = [nn for nn in ITEMS if batch[nn]["light"]["prose"] == batch[nn]["advisor"]["prose"]]
    if same:
        odd.append("Batch items where light and advisor prose are identical (pick is ambiguous): %s" % same)
    # header question consistency between tiers
    qmis = [nn for nn in ITEMS if batch[nn]["light"]["question"] != batch[nn]["advisor"]["question"]]
    if qmis:
        odd.append("Batch items where the light and advisor '# question:' headers differ: %s" % qmis)
    # errors in headers
    errs = ["%s-%s=%s" % (nn, t, batch[nn][t]["header"].get("error"))
            for nn in ITEMS for t in TIERS if batch[nn][t]["header"].get("error", "none") != "none"]
    if errs:
        odd.append("Batch files with a non-none '# error:' header: %s" % errs)
    for o in odd:
        report.append("- %s" % o)
    report.append("")

    with open(os.path.join(WORKDIR, "integrity-report.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(report) + "\n")

    # ---- cards.json
    out = {}
    for name in ("human", "ai"):
        arr = []
        for r in results[name]:
            c = r["card"]
            b = r["batch"]
            drift = None
            if r["pick_exact"]:
                answer_html = c["answer_html"]
            else:
                answer_html = batch_text_to_html(b["prose"])
                drift = "answer prose did not match %s-%s.txt; regenerated from batch (ratio %.6f)" % (r["nn"], r["pick"], r["per_tier"][r["pick"]]["ratio"])
            extra = []
            if not r["tag_ok"]:
                extra.append("tag values corrected from batch")
            if not r["q_ok"]:
                extra.append("question corrected from batch")
            if extra:
                drift = ((drift + "; ") if drift else "") + "; ".join(extra)
            mech_label = b["tag"].get("Mechanism", c["mechanism_label"])
            arr.append({
                "id": c["id"],
                "item": c["item"],
                "eyebrow": c["eyebrow"],
                "eyebrow_q": c["eyebrow_q"],
                "tldr": c["tldr"],
                "question": b["question"],
                "pick_tier": r["pick"],
                "answer_html": answer_html,
                "eli5_html": c["eli5_html"],
                "mechanism_label": mech_label,
                "mechanism_href": c["mechanism_href"],
                "mechanism_codes": sorted(set(re.findall(r"\b(M\d+|R1)\b", mech_label or "")) |
                                          set(re.findall(r"\b(M\d+|R1)\b", c["mechanism_href"] or "")), key=keyf),
                "proxy": b["tag"].get("Proxy", c["proxy"]),
                "need": b["tag"].get("Need", c["need"]),
                "cor_link_href": c["cor_link_href"],
                "cor_link_text": c["cor_link_text"],
                "drift": drift,
            })
        arr.sort(key=lambda x: x["item"])
        out[name] = arr
    with open(os.path.join(WORKDIR, "cards.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # console summary
    print(first)
    print("picks human: " + ", ".join("%s %s" % (r["nn"], r["pick"]) for r in results["human"]))
    print("picks ai:    " + ", ".join("%s %s" % (r["nn"], r["pick"]) for r in results["ai"]))
    for name in ("human", "ai"):
        g = grep_results[name]
        print("%s: em=%d en=%d real_input=%d" % (name, len(g["em_dash"]), len(g["en_dash"]), len(g["real_input"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
