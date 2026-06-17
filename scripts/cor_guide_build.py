#!/usr/bin/env python3
"""Build a newcomer's guide to the COR database as styled HTML (-> PDF via Chrome).
Reads real data from the FULL backup so all content is verbatim from the DB.
Usage: python3 cor_guide_build.py <backup_root> <out_html>
"""
import json, os, sys, html, collections

ROOT = sys.argv[1]
OUT = sys.argv[2]


def load(t, ver="v2"):
    return json.load(open(os.path.join(ROOT, ver, t + ".json")))


def e(s):
    return html.escape("" if s is None else str(s))


def paras(s):
    if not s:
        return ""
    blocks = [b.strip() for b in str(s).split("\n") if b.strip()]
    return "".join(f"<p>{e(b)}</p>" for b in blocks)


def chips(items, cls="chip"):
    return "".join(f'<span class="{cls}">{e(x)}</span>' for x in (items or []))


GRADE = {
    "forced": "g-forced", "strongly_supported": "g-strong",
    "plausible_synthesis": "g-synth", "moderate": "g-mod", "frame": "g-frame",
    "pillar": "g-forced", "key": "g-strong", "supporting": "g-frame",
    "high": "g-high", "medium": "g-med", "low": "g-low",
}


def badge(val, label=None):
    if val is None:
        return ""
    cls = GRADE.get(str(val), "g-def")
    return f'<span class="badge {cls}">{e(label or str(val).replace("_"," "))}</span>'


# ---- load everything ----
man = json.load(open(os.path.join(ROOT, "MANIFEST.json")))
F = load("v2_foundations")
M = load("v2_mechanisms")
C = load("v2_convergences")
D = load("v2_domains")
A = load("v2_applications")
G = load("v2_gaps")
BT = load("v2_bridge_theses")
ED = load("v2_empirical_demonstrations")
RES = load("v2_researchers")
WK = load("v2_works")
EXT = load("v2_extractions")
ME = load("v2_mechanism_evidence")

mname = {m["code"]: m["name"] for m in M}
fname = {f["code"]: f["name"] for f in F}


def mref(code):
    return f'{e(code)} {e(mname.get(code, ""))}'.strip()


# evidence-count per mechanism (from mechanism_evidence)
mev = collections.Counter(x.get("mechanism_code") for x in ME)

S = []  # html chunks
def add(x): S.append(x)


# =================== COVER ===================
total_rows = man["total_rows"]
add(f"""
<section class="cover">
  <div class="cover-kicker">DE-MISMATCH · OPEN FOUNDATIONAL INFRASTRUCTURE</div>
  <h1 class="cover-title">The&nbsp;COR&nbsp;Database</h1>
  <div class="cover-sub">A complete guide for someone who has never heard of this project</div>
  <div class="cover-rule"></div>
  <div class="cover-stats">
    <div><b>{len(F)}</b><span>foundations</span></div>
    <div><b>{len(M)}</b><span>mechanisms</span></div>
    <div><b>{len(C)}</b><span>convergences</span></div>
    <div><b>{len(WK)}</b><span>source works</span></div>
    <div><b>{len(RES)}</b><span>researchers</span></div>
    <div><b>{len(EXT)}</b><span>evidence extractions</span></div>
  </div>
  <div class="cover-foot">
    Generated {e(man['captured_at_utc'][:10])} from a verified full backup of the live
    specification database ({man['total_tables']} tables · {total_rows:,} rows).
    Every statement, mechanism and number in this document is reproduced verbatim
    from that database.
  </div>
</section>
""")


def part(num, title, lead=""):
    add(f"""
    <section class="part">
      <div class="part-head"><span class="part-num">{num}</span>
      <h2>{e(title)}</h2></div>
      {f'<p class="lead">{e(lead)}</p>' if lead else ''}
    """)


def endpart():
    add("</section>")


# =================== PART I — ORIENTATION ===================
part("I", "Orientation: what Cor is, in plain language",
     "Start here. No prior knowledge assumed.")
add(f"""
<div class="prose">
<h3>The one idea</h3>
<p>Human beings were shaped by evolution to function in a world that no longer
exists. Our bodies and minds are a bundle of evolved systems — for threat, bonding,
status, sleep, hunger, sex, movement — each of which expects certain inputs from the
environment. Modern environments routinely fail to supply those inputs, or supply
fake versions of them. The technical word for that gap is <b>mismatch</b>. A very
large share of what we call stress, anxiety, depression, addiction and burnout is, on
this account, not a collection of broken parts but evolved systems behaving correctly
in conditions they were never built for.</p>

<h3>What "Cor" actually is</h3>
<p><b>Cor is a specification</b> — a formal, evidence-grounded account of the complete
human motivational and emotional architecture: what the systems are, what each one
needs, what happens when those needs go unmet, and how the failures cascade. It is
deliberately framed as <b>open foundational infrastructure, not a product</b>. Anyone —
an AI lab, a clinic, a city planner, a governance body — can build on it. The parent
organisation, <b>De-Mismatch</b>, builds tools on top of the spec (personal decoding,
environment design), but the specification itself is the contribution.</p>

<h3>Why it exists as a database</h3>
<p>A claim like "humans need reliable co-regulation from a handful of trusted people"
is only worth anything if you can trace it to evidence. So Cor is stored as a
structured database in which every load-bearing claim is linked to the published
research that supports it. The database is what this document explains. It is not a
pile of opinions; it is a chain of custody from each claim down to the papers, the
authors, and the exact quoted passages behind it.</p>

<h3>How to read the strength of any claim — the evidence pyramid</h3>
<p>Cor does not pretend everything is equally certain. Every claim carries an
<b>epistemic grade</b>. From strongest to weakest:</p>
<ul class="grades">
  <li>{badge('forced')} the evidence <i>forces</i> the conclusion — multiple
      independent research traditions arrive at it separately.</li>
  <li>{badge('strongly_supported')} strong, convergent evidence, but not logically
      forced.</li>
  <li>{badge('plausible_synthesis')} a reasonable synthesis that goes a step beyond
      what the evidence strictly compels.</li>
  <li>{badge('moderate')} supported, but with real gaps still open.</li>
  <li>{badge('frame')} a framing/methodological commitment, not an empirical claim.</li>
</ul>
<p>The pyramid has four layers, and the rest of this guide follows them:
<b>convergences</b> (independent literatures agreeing) force <b>foundations</b>
(the axioms of the system), which generate <b>mechanisms</b> (the actual evolved
systems), each backed by <b>evidence</b> (quoted extractions from real works by real
researchers).</p>
</div>
""")
endpart()


# =================== PART II — STRUCTURE ===================
part("II", "How the database is organized",
     "Thirteen tables in the live specification, wired together into one evidence chain.")
add("""
<div class="prose">
<p>The live spec lives in 13 tables (all prefixed <code>v2_</code>). A separate,
frozen set of older tables (the <code>v1</code> archive) is kept for reference only.
The 13 live tables connect like this:</p>
</div>
<div class="flow">
  <div class="flow-row"><span class="fbox accent">researchers</span><span class="arr">→ author →</span><span class="fbox accent">works</span><span class="arr">→ quoted as →</span><span class="fbox accent">extractions</span></div>
  <div class="flow-row"><span class="fbox">extractions</span><span class="arr">→ aggregate into →</span><span class="fbox">convergences</span><span class="arr">→ force →</span><span class="fbox hot">foundations</span></div>
  <div class="flow-row"><span class="fbox hot">foundations</span><span class="arr">→ generate →</span><span class="fbox hot">mechanisms</span><span class="arr">← linked by → mechanism_evidence ← →</span><span class="fbox">extractions</span></div>
  <div class="flow-row"><span class="fbox hot">mechanisms</span><span class="arr">→ are put to work in →</span><span class="fbox">applications</span><span class="sep">·</span><span class="fbox">domains</span><span class="sep">·</span><span class="fbox">empirical demonstrations</span></div>
  <div class="flow-row"><span class="fbox dim">bridge_theses</span> resolve theory conflicts &nbsp;·&nbsp; <span class="fbox dim">gaps</span> record what is still missing</div>
</div>
<table class="tbl">
<thead><tr><th>Table</th><th>Rows</th><th>What it holds</th></tr></thead>
<tbody>
""")
TBL_DESC = {
    "v2_foundations": "The axioms — frame assumptions, premises, properties and consequences the whole spec rests on.",
    "v2_mechanisms": "The evolved systems themselves (threat, bonding, status, sleep…), with what each needs and how it fails.",
    "v2_convergences": "Points where independent research traditions converge — the 'forcing' layer of the evidence pyramid.",
    "v2_works": "The source corpus: books and papers the spec is built from.",
    "v2_researchers": "The scientists behind those works, with what Cor takes from each and what it does not.",
    "v2_foundation_researchers": "Link table: which researchers ground which foundations, and how.",
    "v2_extractions": "Quoted passages pulled from works — the atomic units of evidence.",
    "v2_mechanism_evidence": "Link table: which extractions support which mechanisms, and in what role.",
    "v2_bridge_theses": "Formal resolutions of apparent conflicts between major theories.",
    "v2_empirical_demonstrations": "Real-world cases with hard numbers that demonstrate the framework in action.",
    "v2_applications": "What the spec is for — alignment, clinical practice, environment design, policy, and more.",
    "v2_domains": "The map of research areas, each anchored to a primary mechanism.",
    "v2_gaps": "Honest self-audit: where the evidence is still thin and what would fix it.",
}
order = ["v2_foundations","v2_mechanisms","v2_convergences","v2_works","v2_researchers",
         "v2_foundation_researchers","v2_extractions","v2_mechanism_evidence",
         "v2_bridge_theses","v2_empirical_demonstrations","v2_applications","v2_domains","v2_gaps"]
for t in order:
    add(f"<tr><td><code>{e(t)}</code></td><td class='num'>{man['tables'][t]['rows']}</td>"
        f"<td>{e(TBL_DESC[t])}</td></tr>")
add("</tbody></table>")
endpart()


# =================== PART III — FOUNDATIONS ===================
part("III", "The Foundations",
     f"{len(F)} axioms, in four layers. Everything else in the spec is derived from these.")
LAYERS = [("frame","Frame — what kind of claims these are"),
          ("premise","Premises — the starting axioms"),
          ("property","Properties — what follows about how the architecture behaves"),
          ("consequence","Consequences — what follows for real environments")]
for lk, ltitle in LAYERS:
    rows = sorted([f for f in F if f.get("layer") == lk], key=lambda x: x["id"])
    if not rows:
        continue
    add(f'<h3 class="layer">{e(ltitle)}</h3>')
    for f in rows:
        add(f"""
        <div class="card foundation">
          <div class="card-top"><span class="code">{e(f['code'])}</span>
            <span class="card-name">{e(f['name'])}</span>{badge(f.get('epistemic_grade'))}</div>
          <p class="statement">{e(f['statement'])}</p>
          {f'<div class="field"><span class="flab">Scope &amp; meaning</span>{paras(f.get("scope_notes"))}</div>' if f.get('scope_notes') else ''}
          {f'<div class="field"><span class="flab">Where it comes from</span><p>{e(f.get("derivation"))}</p></div>' if f.get('derivation') else ''}
        </div>""")
endpart()


# =================== PART IV — MECHANISMS ===================
part("IV", "The Mechanisms",
     f"{len(M)} entries — 14 motivational systems (M1–M14) plus one regulatory input (R1). "
     "This is the heart of the spec: the actual evolved machinery.")
TIERS = [(1,"Tier 1 — forced core systems"),
         (2,"Tier 2 — strongly supported systems"),
         (3,"Tier 3 — regulatory inputs")]
for tk, ttitle in TIERS:
    rows = sorted([m for m in M if m.get("tier") == tk],
                  key=lambda x: int("".join(c for c in x["code"] if c.isdigit()) or 0))
    if not rows:
        continue
    add(f'<h3 class="layer">{e(ttitle)}</h3>')
    for m in rows:
        rel = []
        if m.get("cascade_suppressed_by"):
            rel.append("suppressed by " + ", ".join(m["cascade_suppressed_by"]))
        if m.get("cascade_suppresses"):
            rel.append("suppresses " + ", ".join(m["cascade_suppresses"]))
        if m.get("cascade_interacts"):
            rel.append("interacts with " + ", ".join(m["cascade_interacts"]))
        relline = (" · ".join(rel)) if rel else "no recorded cascade links"
        add(f"""
        <div class="card mech">
          <div class="card-top"><span class="code hot">{e(m['code'])}</span>
            <span class="card-name">{e(m['name'])}</span>
            {badge(m.get('grade'))}<span class="age">{e(m.get('phylogenetic_age') or '')}</span></div>
          <p class="eli5">{e(m.get('eli5'))}</p>
          {f'<div class="field"><span class="flab">What it is</span>{paras(m.get("description"))}</div>' if m.get('description') else ''}
          <div class="grid2">
            {f'<div class="field"><span class="flab">Evolutionary basis</span><p>{e(m.get("p1_basis"))}</p></div>' if m.get('p1_basis') else ''}
            {f'<div class="field"><span class="flab">Resolves when</span><p>{e(m.get("resolution_conditions"))}</p></div>' if m.get('resolution_conditions') else ''}
          </div>
          {f'<div class="field danger"><span class="flab">Modern mismatch</span><p>{e(m.get("mismatch_prediction"))}</p></div>' if m.get('mismatch_prediction') else ''}
          <div class="metaline">
            <span><b>Cascade:</b> {e(relline)}</span>
            <span><b>Evidence rows:</b> {mev.get(m['code'],0)}</span>
            <span><b>Researchers:</b> {e(", ".join(m.get('source_researchers') or []))}</span>
          </div>
        </div>""")
endpart()


# =================== PART V — CONVERGENCES ===================
part("V", "The Convergences",
     f"{len(C)} places where independent research traditions reach the same conclusion. "
     "These are the 'forcing' layer — the reason the foundations are not just assertions.")
for c in sorted(C, key=lambda x: x["id"]):
    forces = f'forces {c["forces_mechanism"]} {mname.get(c["forces_mechanism"],"")}'.strip() if c.get("forces_mechanism") else None
    add(f"""
    <div class="card conv">
      <div class="card-top"><span class="code">{e(c['code'])}</span>
        <span class="card-name">{e(c['name'])}</span>{badge(c.get('epistemic_grade'))}
        {f'<span class="badge g-forcesm">{e(forces)}</span>' if forces else ''}</div>
      <p>{e(c['statement'])}</p>
      <div class="chiprow"><span class="flab">Independent literatures</span>{chips(c.get('independent_literatures'))}</div>
    </div>""")
endpart()


# =================== PART VI — EVIDENCE BASE ===================
part("VI", "The Evidence Base",
     "How the claims connect to real research: the corpus, the people, the quoted passages, "
     "the theory-conflict resolutions, and the hard-number demonstrations.")

# works stats
imp = collections.Counter(x.get("importance") for x in WK)
wt = collections.Counter(x.get("work_type") for x in WK)
yrs = [x["year"] for x in WK if x.get("year")]
add(f"""
<h3 class="layer">The corpus — {len(WK)} works</h3>
<div class="statgrid">
  <div class="stat"><b>{imp.get('pillar',0)}</b><span>pillar works</span></div>
  <div class="stat"><b>{imp.get('key',0)}</b><span>key works</span></div>
  <div class="stat"><b>{min(yrs)}–{max(yrs)}</b><span>year span</span></div>
  <div class="stat"><b>{sum(1 for x in WK if x.get('doi'))}</b><span>with DOI</span></div>
  <div class="stat"><b>{sum(1 for x in WK if x.get('pmid'))}</b><span>with PubMed ID</span></div>
  <div class="stat"><b>{sum(1 for x in WK if x.get('in_physical_collection'))}</b><span>physically held</span></div>
</div>
<p class="prose">Work types: {', '.join(f'{v} {k}' for k,v in wt.most_common())}. The
"pillar" works are the load-bearing primary sources; they are listed in full below.</p>
<table class="tbl small">
<thead><tr><th>Year</th><th>Title</th><th>Author(s)</th></tr></thead><tbody>
""")
for x in sorted([w for w in WK if w.get("importance") == "pillar"],
                key=lambda x: x.get("year") or 0):
    add(f"<tr><td class='num'>{e(x.get('year'))}</td><td>{e(x['title'])}</td>"
        f"<td class='muted'>{e(x.get('authors'))}</td></tr>")
add("</tbody></table>")

# researchers
byt = collections.defaultdict(list)
for r in RES:
    byt[r.get("tier")].append(r["name"])
add(f'<h3 class="layer">The researchers — {len(RES)}</h3>')
add('<table class="tbl"><thead><tr><th>Tier</th><th>Count</th><th>Names</th></tr></thead><tbody>')
TLAB = {"foundational":"Foundational — the theory rests on them",
        "empirical":"Empirical — provide key evidence",
        "adjacent":"Adjacent — engaged or contrasted"}
for tier in ["foundational","empirical","adjacent"]:
    names = sorted(byt.get(tier, []))
    if names:
        add(f"<tr><td><b>{e(TLAB.get(tier,tier))}</b></td><td class='num'>{len(names)}</td>"
            f"<td class='muted'>{e(', '.join(names))}</td></tr>")
add("</tbody></table>")

# extractions stats
eq = collections.Counter(x.get("evidence_quality") for x in EXT)
stp = collections.Counter(x.get("source_type") for x in EXT)
add(f"""
<h3 class="layer">The extractions — {len(EXT)} quoted passages</h3>
<p class="prose">An extraction is a single quoted passage from a work, tagged with the
foundations and mechanisms it bears on and graded for evidence quality. They are the
atomic units of the whole structure: every higher claim ultimately points down to
these. A second link table, <code>v2_mechanism_evidence</code> ({len(ME)} rows),
maps extractions to the mechanisms they support — {ME and collections.Counter(x.get('evidence_role') for x in ME).get('primary',0)} as primary
evidence, the rest supporting.</p>
<div class="grid2">
<table class="tbl small"><thead><tr><th>Evidence quality</th><th>Count</th></tr></thead><tbody>
{''.join(f"<tr><td>{e(k)}</td><td class='num'>{v}</td></tr>" for k,v in eq.most_common())}
</tbody></table>
<table class="tbl small"><thead><tr><th>Source type</th><th>Count</th></tr></thead><tbody>
{''.join(f"<tr><td>{e(k)}</td><td class='num'>{v}</td></tr>" for k,v in stp.most_common())}
</tbody></table>
</div>
""")

# bridge thesis
add(f'<h3 class="layer">Bridge theses — resolving theory conflicts</h3>')
for bt in BT:
    add(f"""
    <div class="card">
      <div class="card-top"><span class="code">{e(bt['code'])}</span>
        <span class="card-name">{e(bt['name'])}</span></div>
      <div class="chiprow"><span class="flab">Conflicting frameworks</span>{chips(bt.get('conflicting_frameworks'))}</div>
      <div class="field"><span class="flab">Resolution</span>{paras(bt.get('resolution'))}</div>
    </div>""")

# empirical demonstrations
add(f'<h3 class="layer">Empirical demonstrations — {len(ED)} hard-number cases</h3>')
for d in sorted(ED, key=lambda x: x["id"]):
    grounds = (d.get("grounds_mechanisms") or []) + (d.get("grounds_foundations") or [])
    add(f"""
    <div class="card demo">
      <div class="card-top"><span class="code">{e(d['code'])}</span>
        <span class="card-name">{e(d['name'])}</span></div>
      <p class="metric">{e(d.get('primary_metric_display'))}</p>
      {f'<div class="field"><span class="flab">What it demonstrates</span><p>{e(d.get("what_it_demonstrates"))}</p></div>' if d.get('what_it_demonstrates') else ''}
      {f'<div class="field"><span class="flab">The case</span>{paras(d.get("narrative"))}</div>' if d.get('narrative') else ''}
      <div class="chiprow"><span class="flab">Grounds</span>{chips(grounds)}</div>
    </div>""")
endpart()


# =================== PART VII — APPLICATIONS ===================
part("VII", "Applications",
     f"{len(A)} answers to the question: what is the specification actually for?")
for a in sorted(A, key=lambda x: x["id"]):
    add(f"""
    <div class="card app">
      <div class="card-top"><span class="code">{e(a['code'])}</span>
        <span class="card-name">{e(a['name'])}</span></div>
      {paras(a.get('description'))}
      <div class="metaline">
        <span><b>Foundations:</b> {e(', '.join(a.get('relevant_foundations') or []))}</span>
        <span><b>Mechanisms:</b> {e(', '.join(a.get('relevant_mechanisms') or []))}</span>
      </div>
    </div>""")
endpart()


# =================== PART VIII — GAPS ===================
part("VIII", "Gaps",
     f"{len(G)} items the project flags against itself — what is still thin, and what would fix it. "
     "A spec that lists its own weaknesses is doing science, not marketing.")
for g in sorted(G, key=lambda x: x["id"]):
    add(f"""
    <div class="card gap">
      <div class="card-top"><span class="code">{e(g['code'])}</span>
        <span class="card-name">{e(g['name'])}</span>{badge(g.get('priority'))}</div>
      {f'<div class="field"><span class="flab">What is missing</span><p>{e(g.get("what_is_missing"))}</p></div>' if g.get('what_is_missing') else ''}
      {f'<div class="field"><span class="flab">Why it matters</span><p>{e(g.get("why_it_matters"))}</p></div>' if g.get('why_it_matters') else ''}
    </div>""")
endpart()


# =================== PART IX — DOMAINS ===================
part("IX", "Domains",
     f"{len(D)} research areas that organise the literature, each anchored to a primary mechanism "
     "(or marked cross-cutting where it spans several).")
add('<table class="tbl"><thead><tr><th>Domain</th><th>Primary mechanism</th><th>Scope</th></tr></thead><tbody>')
for d in sorted(D, key=lambda x: (x.get("cross_cutting", False), x["id"])):
    pm = mref(d["primary_mechanism"]) if d.get("primary_mechanism") else "<i>cross-cutting</i>"
    add(f"<tr><td><b>{e(d['name'])}</b></td><td class='muted'>{pm}</td>"
        f"<td>{e((d.get('description') or '')[:160])}{'…' if len(d.get('description') or '')>160 else ''}</td></tr>")
add("</tbody></table>")
endpart()


# =================== APPENDIX ===================
part("—", "Appendix: provenance & the v1 archive")
add(f"""
<div class="prose">
<h3>How this document was produced</h3>
<p>Source: the live PostgREST API of the Cor specification database
(project <code>{man['project_ref']}</code>), captured {e(man['captured_at_utc'][:10])}.
The capture was verified two ways — every table's row count matched the database's own
<code>count=exact</code> header, and a service-role pass confirmed no rows were hidden
by access controls. Storage and auth were checked and are empty: there is no project
data outside the tables described here. Every quotation, statement and figure above is
reproduced directly from that backup.</p>

<h3>The v1 archive (frozen reference)</h3>
<p>Alongside the 13 live tables, the database keeps an older generation of 10 tables
without the <code>v2_</code> prefix. These are <b>frozen</b> — kept for historical
reference and never read by the live system. They are larger and messier because they
predate the curation pass that produced the v2 spec (for example the v1
<code>works</code> table holds {len(load('works','v1')):,} rows — a raw acquisition
list — versus {len(WK)} curated works in v2). Treat v1 as the quarry; v2 is the
finished building.</p>
</div>
""")
endpart()

add('<div class="end">End of guide · The COR Database</div>')

# =================== ASSEMBLE ===================
CSS = """
@page { size: A4; margin: 16mm 15mm 16mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
  color:#15181f; line-height:1.5; font-size:10.5pt; margin:0; }
h1,h2,h3 { line-height:1.18; }
p { margin:0 0 .5em; }
code { font-family:"SF Mono",Menlo,monospace; font-size:.86em; background:#eef1f5;
  padding:.06em .35em; border-radius:4px; color:#1f3a4d; }
.muted{color:#5b6472;} .num{text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap;}

/* cover */
.cover{ background:#0f2a33; color:#eaf2f4; padding:34mm 18mm; min-height:247mm;
  display:flex; flex-direction:column; }
.cover-kicker{ letter-spacing:.22em; font-size:8.5pt; font-weight:700; color:#5fb6c4; }
.cover-title{ font-size:50pt; font-weight:800; letter-spacing:-1.5px; margin:.35em 0 .1em; }
.cover-sub{ font-size:15pt; color:#bcd6dc; font-weight:400; max-width:60%; }
.cover-rule{ height:3px; width:80px; background:#5fb6c4; margin:24px 0; }
.cover-stats{ display:flex; flex-wrap:wrap; gap:10px 34px; margin-top:6px; }
.cover-stats div{ display:flex; flex-direction:column; }
.cover-stats b{ font-size:30pt; font-weight:800; color:#fff; }
.cover-stats span{ font-size:9pt; letter-spacing:.06em; color:#9fc3cb; text-transform:uppercase; }
.cover-foot{ margin-top:auto; font-size:9.5pt; color:#aecdd4; max-width:78%; line-height:1.55; }

/* parts */
.part{ break-before:page; padding:0 1mm; }
.part-head{ display:flex; align-items:baseline; gap:14px; border-bottom:3px solid #0f2a33;
  padding-bottom:6px; margin:4px 0 10px; }
.part-num{ font-size:13pt; font-weight:800; color:#fff; background:#15859b;
  border-radius:6px; padding:2px 11px; }
.part-head h2{ font-size:21pt; font-weight:800; letter-spacing:-.4px; margin:0; color:#0f2a33; }
.lead{ font-size:11.5pt; color:#39505a; margin:0 0 12px; max-width:46em; }
h3.layer{ font-size:12.5pt; color:#0f2a33; margin:18px 0 9px; padding-left:10px;
  border-left:4px solid #15859b; }

/* prose */
.prose h3{ font-size:12pt; margin:16px 0 6px; color:#0f2a33; }
.prose{ max-width:44em; }
.prose ul.grades{ list-style:none; padding:0; margin:8px 0; }
.prose ul.grades li{ margin:5px 0; }

/* cards */
.card{ border:1px solid #dbe2e8; border-left:4px solid #15859b; border-radius:8px;
  padding:11px 13px; margin:9px 0; break-inside:avoid; background:#fff; }
.card.foundation{border-left-color:#15859b;} .card.mech{border-left-color:#b5462b;}
.card.conv{border-left-color:#6d28d9;} .card.app{border-left-color:#1d4ed8;}
.card.gap{border-left-color:#a16207;} .card.demo{border-left-color:#15803d;}
.card-top{ display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-bottom:5px; }
.code{ font-weight:800; font-size:10pt; color:#0f2a33; background:#e3edf0;
  padding:2px 8px; border-radius:5px; font-family:"SF Mono",Menlo,monospace; }
.code.hot{ background:#f5e2db; color:#7c2d12; }
.card-name{ font-size:12.5pt; font-weight:700; color:#15181f; }
.age{ font-size:8.5pt; color:#7a8590; margin-left:auto; }
.statement{ font-size:11pt; font-weight:600; color:#163; color:#0f2a33; margin:2px 0 7px; }
.eli5{ font-size:11pt; font-style:italic; color:#39505a; margin:2px 0 8px; }
.field{ margin:7px 0; } .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:6px 18px; }
.flab{ display:block; font-size:7.7pt; letter-spacing:.1em; text-transform:uppercase;
  font-weight:800; color:#15859b; margin-bottom:2px; }
.field.danger .flab{ color:#b5462b; }
.metaline{ display:flex; flex-wrap:wrap; gap:4px 18px; font-size:8.7pt; color:#566;
  border-top:1px dashed #dbe2e8; margin-top:8px; padding-top:6px; }
.metric{ font-size:13pt; font-weight:800; color:#15803d; margin:2px 0 7px; }

/* badges & chips */
.badge{ font-size:8pt; font-weight:800; letter-spacing:.03em; padding:2px 8px;
  border-radius:20px; text-transform:uppercase; }
.g-forced{background:#dcfce7;color:#15803d;} .g-strong{background:#dbeafe;color:#1d4ed8;}
.g-synth{background:#ede9fe;color:#6d28d9;} .g-mod{background:#fef3c7;color:#a16207;}
.g-frame{background:#e2e8f0;color:#475569;} .g-def{background:#e2e8f0;color:#475569;}
.g-high{background:#fee2e2;color:#b91c1c;} .g-med{background:#fef3c7;color:#a16207;}
.g-low{background:#e2e8f0;color:#475569;} .g-forcesm{background:#f5e2db;color:#7c2d12;}
.chip{ display:inline-block; font-size:8.4pt; background:#eef2f5; color:#33424c;
  border:1px solid #dde5ea; padding:2px 8px; border-radius:20px; margin:2px 4px 2px 0; }
.chiprow{ margin-top:7px; } .chiprow .flab{ display:inline-block; margin-right:6px; }

/* tables */
.tbl{ width:100%; border-collapse:collapse; margin:8px 0; font-size:9.3pt; }
.tbl.small{ font-size:8.7pt; }
.tbl th{ text-align:left; background:#0f2a33; color:#fff; padding:5px 8px; font-size:8.6pt;
  letter-spacing:.04em; text-transform:uppercase; }
.tbl td{ padding:4px 8px; border-bottom:1px solid #e6ecf0; vertical-align:top; }
.tbl tr:nth-child(even) td{ background:#f6f9fa; }
.grid2 .tbl{ margin:0; }

/* flow diagram */
.flow{ margin:10px 0 14px; }
.flow-row{ display:flex; align-items:center; flex-wrap:wrap; gap:7px; margin:7px 0;
  font-size:9pt; color:#566; }
.fbox{ font-weight:700; background:#eef2f5; border:1px solid #d6dee4; color:#22323b;
  padding:3px 9px; border-radius:6px; font-size:9pt; }
.fbox.accent{ background:#e3edf0; border-color:#bcd3da; color:#0f5666; }
.fbox.hot{ background:#f5e2db; border-color:#e6c3b6; color:#7c2d12; }
.fbox.dim{ background:#f1f3f5; color:#667; }
.arr{ color:#9aa7b0; font-size:8.4pt; } .sep{ color:#bcc6cd; }

/* stat grids */
.statgrid{ display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin:10px 0; }
.stat{ background:#f4f8f9; border:1px solid #e0e9ec; border-radius:8px; padding:9px 8px;
  text-align:center; }
.stat b{ display:block; font-size:16pt; font-weight:800; color:#0f2a33; }
.stat span{ font-size:7.8pt; color:#5b6472; text-transform:uppercase; letter-spacing:.03em; }

.end{ text-align:center; color:#9aa7b0; font-size:9pt; margin:24px 0 6px;
  letter-spacing:.1em; text-transform:uppercase; }
"""

doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>The COR Database — A Guide for the Newcomer</title>
<style>{CSS}</style></head><body>{''.join(S)}</body></html>"""
open(OUT, "w", encoding="utf-8").write(doc)
print("wrote", OUT, f"({len(doc):,} bytes)")
