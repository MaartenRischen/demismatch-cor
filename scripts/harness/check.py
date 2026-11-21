#!/usr/bin/env python3
"""The Demismatch harness checker. Reads concepts.json (the one list) and flags, in any text, a core idea in its short
mainstream form, a generic change used as evidence, and the other entries of the list. It is a RATCHET: every hit that
exists today is recorded in baseline.json and has to be worked off; any NEW hit stops the work (exit 1).

Usage:  python3 harness/check.py all | pages | cor | briefs | site      (named sets; 'site' runs inside a site repo)
        python3 harness/check.py path <file> [<file> ...] --scope page|cor|brief
        python3 harness/check.py --text "..." --scope page
        add --update-baseline to record the current hits; add --list to print every hit, old and new
An exception in a text is marked in the text itself: write  harness-ok: <reason>  on the same line. It is then listed
in every run, so it stays visible. Import: from check import new_hits_in_text  (used by corfix before a write to Cor)."""
import json, os, re, sys, hashlib, html, glob

HERE = os.path.dirname(os.path.abspath(__file__))
CONCEPTS = json.load(open(os.path.join(HERE, 'concepts.json')))['concepts']
ATTRIB = re.compile(r"\bdiagnos|\blabel|\bcriteria\b|\bthe authors\b|\bso-called\b|\bcalled\b|\bcalls?\b|\bmainstream\b|\bDSM\b|\bICD\b|\bthe (study|review|trial|paper|survey)\b", re.I)
CITE = re.compile(r"\(\d{4}[a-z]?\)|\bdoi\b|\b(19|20)\d{2}\b[^.]{0,120}\b(Journal|Review|Psychiatry|Psychology|Science|Lancet|Proceedings|Bulletin|Medicine|Nature)\b|\bet al\b", re.I)
BAN_CTX = re.compile(r"\b(never|banned?|not|no|wrong|short form|mainstream|instead of|rather than|is not|isn't|prohibit|forbid|do not|don't|flag|shortened)\b", re.I)

def sentences(text):
    out, pos = [], 0
    for m in re.finditer(r"[^.!?\n]+[.!?\n]*", text):
        s = m.group(0)
        if s.strip(): out.append((m.start(), s))
    return out

def hits_in_text(text, scope, path=''):
    """List of dicts: concept, sentence, why, ask."""
    res = []
    text = re.sub(r"[ \t]+", " ", text)
    for c in CONCEPTS:
        if scope not in c['scopes']: continue
        if any(sp in path for sp in c.get('skip_paths', [])): continue
        if 'file_level' in c:
            fl = c['file_level']
            if re.search(fl['if'], text, re.I):
                missing = [r for r in fl['require_all'] if not re.search(r, text, re.I)]
                if missing and 'harness-ok' not in text:
                    m = re.search(fl['if'], text, re.I)
                    res.append({'concept': c['id'], 'sentence': '[whole text] ' + text[max(0, m.start() - 60):m.end() + 90].strip(), 'why': c['why'], 'ask': c['ask'] + ' Missing: ' + ' ; '.join(missing)})
            continue
        for pat in c.get('patterns', []):
            for m in re.finditer(pat, text, re.I):
                a = text.rfind('\n', 0, m.start()) + 1; b = text.find('\n', m.end()); b = len(text) if b < 0 else b
                line = text[a:b]
                s0 = max(a, max(text.rfind('. ', 0, m.start()), text.rfind('? ', 0, m.start())) + 1); s1 = text.find('. ', m.end()); s1 = b if s1 < 0 or s1 > b else s1 + 1
                sent = text[s0:s1].strip()
                if 'harness-ok' in line: continue
                near = text[max(0, m.start() - 320):m.end() + 320]
                if c.get('needs_nearby') and re.search(c['needs_nearby'], near, re.I): continue
                if c.get('attributed_ok'):
                    before = text[s0:m.start()]
                    inquote = (before.count('"') % 2 == 1) or (before.count('\u201c') > before.count('\u201d'))
                    if ATTRIB.search(sent) or inquote or CITE.search(sent): continue   # the source's word, a quotation, or a reference
                q0 = text.rfind('"', a, m.start()); q1 = text.find('"', m.end(), b)
                if q0 >= 0 and q1 >= 0 and BAN_CTX.search(line): continue      # quoted as the thing not to say
                res.append({'concept': c['id'], 'sentence': sent[:300], 'why': c['why'], 'ask': c['ask']})
    seen, out = set(), []
    for h in res:
        k = (h['concept'], h['sentence'])
        if k not in seen: seen.add(k); out.append(h)
    return out

def new_hits_in_text(old, new, scope, path=''):
    """Hits in `new` that are not already in `old` (same concept and sentence). For a write that replaces a text."""
    had = {(h['concept'], re.sub(r'\s+', ' ', h['sentence'])) for h in hits_in_text(old or '', scope, path)}
    return [h for h in hits_in_text(new or '', scope, path) if (h['concept'], re.sub(r'\s+', ' ', h['sentence'])) not in had]

def strip_html(t):
    t = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", t)
    t = re.sub(r"(?i)</(p|div|li|h[1-6]|tr|td|section|article|br)\s*>|<br\s*/?>", "\n", t)
    return html.unescape(re.sub(r"<[^>]+>", " ", t))

def json_strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from json_strings(v)
    elif isinstance(o, list):
        for v in o: yield from json_strings(v)

def read(path):
    raw = open(path, errors='ignore').read()
    if path.endswith(('.html', '.htm')): return strip_html(raw)
    if path.endswith('.json'):
        try: return '\n'.join(s for s in json_strings(json.loads(raw)) if len(s) > 25)
        except Exception: return raw
    return raw

def cor_texts(root):
    p = os.path.join(root, 'Cor Portal v2', 'data', 'snapshot.json')
    if not os.path.exists(p): p = os.path.join(root, 'data', 'snapshot.json')
    if not os.path.exists(p): return []
    T = json.load(open(p))['tables']; out = []
    F = {'foundations': ('statement', 'scope_notes', 'derivation'), 'mechanisms': ('description', 'resolution_conditions', 'mismatch_prediction', 'proxy_gradient', 'eli5'),
         'eea_parameters': ('eea_baseline', 'modern_default', 'gap_statement', 'resolution_unit', 'confidence_note'), 'convergences': ('statement',), 'applications': ('description',)}
    for tab, fields in F.items():
        for r in T.get(tab, []):
            for f in fields:
                if isinstance(r.get(f), str) and r[f].strip(): out.append((f"cor:{tab}:{r.get('code')}:{f}", r[f]))
    return out

def targets(name, root):
    G = lambda *pats: sorted({f for p in pats for f in glob.glob(os.path.join(root, p), recursive=True) if '/dist/' not in f and 'node_modules' not in f and '/_backup' not in f})
    if name == 'site':
        return [('page', f) for f in G('*.html', '10truths/*.html', '*/index.html')]
    if name == 'pages':
        return [('page', f) for f in G('DEMISMATCH COR WEBSITE/*.html', 'DEMISMATCH COR WEBSITE/10truths/*.html', 'whatreally-site/*/index.html', 'whatreally-site/index.html',
                                       'whatreally/pages/*.json', 'whatreally/working-copy/index.html', 'howyoushouldliveyourlife/*.html', 'howyoushouldliveyourlife/**/index.html',
                                       'realalign/index.html', 'manifesto/manifesto-draft.md')]
    if name == 'briefs':
        return [('brief', f) for f in G('CLAUDE.md', '*/CLAUDE.md', 'PROJECT_BIBLE.md', 'GRADING-RUBRIC-v2.md', 'cor-needs/*.md', 'cor-needs/growth/*.md', 'cor-needs/objections/*.md',
                                        'cor-needs/objections/triage/RULES.md', 'cor-needs/objections/triage/BRIEF.md', 'cor-app/tier2/_work/*/BRIEF.md', 'cor-app/tier2/GATE.md',
                                        'cor-app/decode-engine/rules.md', 'cor-app/decode-engine/prompts/*.md', 'wyfsb/library/corcheck/brief.md', 'whatreally/README.md',
                                        'harness/CORE.txt', 'captain/terminal-memory/*.md')]
    raise SystemExit('unknown set ' + name)

def key(rel, h): return hashlib.sha1((rel + '|' + h['concept'] + '|' + re.sub(r'\s+', ' ', h['sentence'])[:200]).encode()).hexdigest()[:16]

def main():
    a = sys.argv[1:]
    root = os.path.abspath(a[a.index('--root') + 1]) if '--root' in a else os.path.dirname(HERE)
    basef = a[a.index('--baseline') + 1] if '--baseline' in a else os.path.join(HERE, 'baseline.json')
    scope = a[a.index('--scope') + 1] if '--scope' in a else 'page'
    items = []                                                   # (scope, label, text)
    if '--text' in a: items.append((scope, '(text)', a[a.index('--text') + 1]))
    elif a and a[0] == 'path':
        for f in [x for x in a[1:] if not x.startswith('--') and x not in (scope, basef, root)]: items.append((scope, os.path.relpath(os.path.abspath(f), root), read(f)))
    else:
        names = ['pages', 'cor', 'briefs'] if (not a or a[0] == 'all') else [a[0]]
        for n in names:
            if n == 'cor': items += [('cor', lab, t) for lab, t in cor_texts(root)]
            else: items += [(sc, os.path.relpath(f, root), read(f)) for sc, f in targets(n, root)]
    base = json.load(open(basef)) if os.path.exists(basef) else {}
    found, new, newk = {}, [], set()
    for sc, rel, text in items:
        for h in hits_in_text(text, sc, rel):
            k = key(rel, h); found[k] = {'file': rel, 'concept': h['concept'], 'sentence': h['sentence'][:200]}
            if k not in base and k not in newk: newk.add(k); new.append((rel, h))
    if '--update-baseline' in a:
        if '--text' not in a and not (a and a[0] == 'path'):
            keep = {k: v for k, v in base.items() if not any(v['file'] == rel for _, rel, _ in items)} if a and a[0] not in ('all',) else {}
            keep.update(found); json.dump(keep, open(basef, 'w'), indent=0, ensure_ascii=False, sort_keys=True)
            print(f"baseline written: {len(keep)} known hits ({len(found)} in this set)")
        return 0
    if '--list' in a:
        for k, v in sorted(found.items(), key=lambda x: (x[1]['file'], x[1]['concept'])): print(('NEW ' if k not in base else 'old '), v['file'], '|', v['concept'], '|', v['sentence'][:150])
    by = {}
    for v in found.values(): by[v['concept']] = by.get(v['concept'], 0) + 1
    print(f"harness check: {len(items)} texts, {len(found)} hits ({len(found) - len(new)} known, {len(new)} NEW)  " + ', '.join(f"{k} {n}" for k, n in sorted(by.items())))
    for rel, h in new:
        print(f"\nNEW  {rel}\n  idea: {h['concept']}\n  text: {h['sentence'][:260]}\n  why:  {h['why']}\n  ask:  {h['ask']}")
    if new:
        print("\nSTOP. Fix the text, or mark a true exception in the text with  harness-ok: <reason>  on the same line.")
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
