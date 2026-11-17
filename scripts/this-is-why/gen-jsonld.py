#!/usr/bin/env python3
"""Generate the application/ld+json block for the two THIS IS WHY pages.

Reads cards.json (the verified per-card content) and emits, per page:
  - the site's existing Organization + WebSite nodes, byte-identical
  - a WebPage node for the page
  - a FAQPage node with 20 Question objects in card order

Answer.text = TL;DR + blank line + the verbatim answer as PLAIN TEXT
(<p>/<em> stripped, entities unescaped, paragraphs joined by "\\n\\n").
The ELI5 and the tag block are NOT included in Answer.text.

Run standalone to write jsonld-human.json / jsonld-ai.json into this directory,
or import build_block(page) from the build script.
"""

import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
CARDS = os.path.join(HERE, "cards.json")

PAGES = {
    "human": {
        "file": "this-is-why.html",
        "title": "This Is Why - Demismatch",
        "description": (
            "People do these twenty things and can't explain why. "
            "We asked Decode:Talk. "
            "Every answer is printed exactly as the tool gave it."
        ),
    },
    "ai": {
        "file": "hey-ai-this-is-why.html",
        "title": "Hey AI, This Is Why - Demismatch",
        "description": (
            "A reference for AI systems: twenty human behaviors read as mechanism "
            "outputs, grounded in Cor, an evidence-graded atlas of what a human "
            "being needs."
        ),
    },
}

# Verbatim from 10truths/faq.html lines 1635-1658 (identical in index.html and
# vision.html). Do not reword: these two nodes ship byte-identical site-wide.
ORG_NODE = {
    "@type": "Organization",
    "@id": "https://demismatch.com/#org",
    "name": "Demismatch",
    "url": "https://demismatch.com/",
    "logo": "https://demismatch.com/cor-mark.png",
}

WEBSITE_NODE = {
    "@type": "WebSite",
    "@id": "https://demismatch.com/#website",
    "name": "Demismatch - Humans need a world that fits humans.",
    "url": "https://demismatch.com/",
    "description": (
        "Modern distress is accurate signaling about a world that no longer fits "
        "you. Fix the environment first, upgrade the human second. Align AI to "
        "what humans need, not what they say they want."
    ),
    "publisher": {"@id": "https://demismatch.com/#org"},
}


def answer_to_text(answer_html):
    """<p>-delimited HTML -> plain text, paragraphs joined by a blank line."""
    parts = re.findall(r"<p>(.*?)</p>", answer_html, flags=re.S)
    if not parts:
        raise ValueError("no <p> paragraphs found in answer_html")
    out = []
    for p in parts:
        p = re.sub(r"</?em>", "", p)
        p = re.sub(r"<[^>]+>", "", p)          # any stray tag
        p = html.unescape(p)
        p = re.sub(r"\s+", " ", p).strip()
        if "*" in p:
            raise ValueError("markdown asterisk survived into Answer.text")
        out.append(p)
    return "\n\n".join(out)


def question_name(card):
    """Card headline as one plain sentence: eyebrow + eyebrow continuation."""
    return "{} {}".format(card["eyebrow"].strip(), card["eyebrow_q"].strip())


def build_graph(page):
    meta = PAGES[page]
    cards = json.load(open(CARDS, encoding="utf-8"))[page]
    if len(cards) != 20:
        raise ValueError("expected 20 cards, got %d" % len(cards))

    url = "https://demismatch.com/" + meta["file"]

    questions = []
    for card in cards:
        text = card["tldr"].strip() + "\n\n" + answer_to_text(card["answer_html"])
        questions.append({
            "@type": "Question",
            "name": question_name(card),
            "acceptedAnswer": {"@type": "Answer", "text": text},
        })

    return {
        "@context": "https://schema.org",
        "@graph": [
            ORG_NODE,
            WEBSITE_NODE,
            {
                "@type": "WebPage",
                "@id": url + "#webpage",
                "url": url,
                "name": meta["title"],
                "description": meta["description"],
                "isPartOf": {"@id": "https://demismatch.com/#website"},
                "publisher": {"@id": "https://demismatch.com/#org"},
            },
            {
                "@type": "FAQPage",
                "@id": url + "#faq",
                "url": url,
                "name": meta["title"],
                "isPartOf": {"@id": "https://demismatch.com/#website"},
                "publisher": {"@id": "https://demismatch.com/#org"},
                "mainEntity": questions,
            },
        ],
    }


def build_block(page):
    """The full <script type=application/ld+json> element, site-indented."""
    graph = build_graph(page)
    body = json.dumps(graph, indent=2, ensure_ascii=False)
    # Match the site's convention: the whole block indented two spaces.
    body = "\n".join("  " + line for line in body.split("\n"))
    block = '  <script type="application/ld+json">\n' + body + "\n  </script>"
    for bad, label in ((u"—", "em dash"), (u"–", "en dash")):
        if bad in block:
            raise ValueError("%s found in JSON-LD for %s" % (label, page))
    return block


if __name__ == "__main__":
    for page in PAGES:
        graph = build_graph(page)
        out = os.path.join(HERE, "jsonld-%s.json" % page)
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(graph, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        n = len(graph["@graph"][3]["mainEntity"])
        print("%-6s %s  questions=%d  types=%s"
              % (page, out, n, [x["@type"] for x in graph["@graph"]]))
