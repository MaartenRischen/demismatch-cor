# COR WEBSITE - ROUND 2 SCRUTINY
## Claude (claude-web) · April 6, 2026
## Post-reorder, post-copy-edits review

---

## 1. THE 90-SECOND TEST

**What works:** The structure is massively improved. Hero → Ten Sentences → Mismatch Split → AI Companion case is a genuine thesis-proof-proof flow. A fast reader who makes it through the Ten Sentences has the complete pitch. The Harris epigraph is perfect placement.

**What fails:**

**The hero image is a liability.** It's an AI-generated HUD overlay on a split ancestral/modern scene. To an SFF recommender - many of whom think carefully about AI-generated imagery - this looks like midjourney concept art on what claims to be a rigorous scientific project. The alt text is 50+ words of HUD readout data. The image communicates "speculative design project" not "evidence-grounded specification." For a 90-second scan, the hero image sets the wrong tone before the reader gets to the words.

**The use case numbering starts at 03.** The AI companion case displays "03" as its number. A first-time visitor hasn't seen 01 or 02 yet (they come later). This reads as a bug or missing content. It should either show no number, or show "01" in its standalone position and renumber the later cases.

**"Three possible use cases" lede is stale.** Section 10 (use cases 01+02) still says "Three possible use cases" in its sec-lede, but only shows two. The third (AI companion) was moved up. This lede needs updating.

**The hero stat bar will show small numbers.** v2 has ~65 works, ~291 extractions, ~58 researchers, 14 foundations, 15 mechanisms. A recommender sees "65 academic works" and "58 researchers" in the first 5 seconds. Those numbers are honest but they're not impressive at first glance. The v1 database has 3,643 works. The hero doesn't explain this is a curated pillar subset. Consider either: (a) adding a "of X total" pattern like the pivotal works section already uses, or (b) showing v1 total works count in the stats bar with the v2 curated count as a secondary label.

---

## 2. VOICE AND TONE

**The mismatch split is the best section on the page.** "The architecture that makes you anxious at 3am is the same architecture that kept your ancestors alive for half a billion years." This is the one place the site SPEAKS TO YOU. "Your feelings are accurate readouts." "The mismatch is not inside you." The old site's voice lives here. Then "A fully satisfied human is a terrible customer" lands perfectly. Then "The feelings are not errors. The environment is the error." - three emotional hits in sequence. This section alone would make a parent, a clinician, or a struggling person lean in.

**But that voice vanishes immediately after.** The AI companion case returns to third person ("A 22-year-old who moved to a new city"). The pyramid is pure technical. Mechanisms is formal. Foundations is formal. By section 7 (foundations), a non-alignment reader has left. The site goes from "your feelings are accurate" to "the organism contains evolved domain-sensitive interacting functional adaptations" with no bridge.

**"The instrument is listening for exactly this input"** - line 1274, empirical demos section. "Instrument" survived the firmware cleanup. This is exactly the tech-analogy-for-humans violation.

**The HUD image alt texts still contain HUD language.** "Every mechanism reading nominal" (line 1125), "HUD panels show..." throughout. These alt texts serve screen readers and are technically text content. Minor, but if you're holding the line, hold it everywhere.

---

## 3. UNIVERSALITY

**Sentence 9 of the Ten Sentences does the heavy lifting:** "The specification is universal. AI alignment is one application. Clinical practice, environment design, education, policy, personal decisions - all inherit the same operation." This is the moment a non-alignment reader is told "this is for you too." It works.

**But the rest of the page doesn't follow through.** After the mismatch split, every section header speaks to researchers: "What the organism actually runs on," "What the framework is derived from," "The works the framework depends on," "Applications - alignment first, then everything else." A clinician reading "alignment first, then everything else" hears: "you're second." A parent doesn't know what "alignment" means.

**The use cases are the bridge - but they're buried.** Cases 01 and 02 (Instagram depression, parenting guilt) are the content that speaks to audiences 5-9 (clinicians, parents, educators, people in pain). They're at position 10, after foundations and pivotal works and applications. A parent who made it through the mismatch split and felt understood will not scroll through a pyramid diagram, mechanism cards, foundation cards, and application cards to find the parenting case. The collapsible treatment is correct for page speed, but the POSITION is wrong for universality.

**Possible fix (for consideration):** Move use cases 01+02 UP - either right after the AI companion case (so all three use cases are together, showing: alignment case, then human cases) or right after the mismatch split (so the human-facing content clusters together before the technical depth begins).

---

## 4. CREDIBILITY

**The Anthropic section is correctly caveated** - "not external validation," "structural, not evidentiary." Good. This would survive hostile peer review.

**The team bio has a repeated sentence.** The second paragraph starts "a ground-up formal specification built from primary research across evolutionary biology, affective neuroscience, developmental psychology, behavioral ecology, primatology, and anthropology." The third paragraph says: "it requires integration across evolutionary biology, affective neuroscience, developmental psychology, behavioral ecology, primatology, and anthropology." Same list, two paragraphs apart. Reads like a copy-paste error.

**"Principal Investigator" is an academic title that implies institutional affiliation.** The section label says "principal investigator" but there's no institution. A skeptical academic would flag this. Consider "founder & principal researcher" (which the team-label already says) or just "the team" or "who built this."

**The exploitation formula is strong but unsigned.** "Step 1. Take a real human need..." - this is asserting a deliberate conspiracy ("destroy or block the pathways"). Alignment researchers will accept this. A skeptical academic might not. The word "destroy" implies intentionality. Consider "pathways to genuine satisfaction erode - communities atomize, work abstracts, families scatter" - same content, less conspiratorial.

---

## 5. STRUCTURE AND FLOW

**The page is now the right length** for a deep reader. The collapsible sections (effect sizes, Anthropic, challenges, gaps) are correct. Empirical demos being visible is correct.

**Applications section feels thin.** It's now just the Hao/Russell quotes, the bridge text, and the app cards from the database. After the emotional weight of the mismatch split and AI companion case, arriving at a section that's mostly "loading..." skeletons (until the API responds) feels like a cliff. If the API is slow or fails, this section is empty.

**Nav link "compressed" is insider jargon.** No first-time visitor knows what "compressed" means as a navigation label. Consider "the thesis" or "ten sentences" or "the pitch."

---

## 6. SPECIFIC COPY PROBLEMS

**Line 896 (hero-sub):** "Every AI system aligns to human preferences." - This is not quite true. Many AI systems don't explicitly align to preferences (image classifiers, recommendation systems). The claim is about alignment-focused AI. Consider: "AI alignment promises to align systems to human preferences."

**Line 931 (ten sentences #7):** "Is this output producing an input the underlying system was calibrated for, or a proxy that captures the signal while starving the function?" - This is the best sentence on the entire site. No notes.

**Line 947 (terrible customer):** "it is, for many industries, the product working as intended" - the hedge "for many industries" weakens what should be a punch. The original old-site line had no hedge. Either commit to the claim or cut it.

**Line 1196 (use cases lede):** "Three possible use cases" - now only two are shown here. Fix to "two."

**Line 1274 (empirical demos):** "The instrument is listening for exactly this input" - "instrument" = firmware language. Change to "The system is listening for exactly this input."

**Line 1406 (team bio):** The live data-stat spans will show v2 numbers (14 foundations, ~65 works, ~291 extractions). Combined with "stress-tested through multiple adversarial reviews" and "cross-domain convergences," the paragraph reads like boilerplate strung between live numbers. The sentences don't flow naturally around the spans.

---

## SUMMARY: WHAT THE SITE GETS RIGHT NOW

- The thesis lands. The Ten Sentences are excellent.
- The mismatch split is emotionally powerful and is the one place the old site's voice survives.
- The AI companion case is the best single argument for why alignment needs this.
- The structure is top-down - thesis first, depth second.
- The evidence infrastructure (pyramid, foundations, mechanisms) is real and auditable.
- The challenges and gaps sections signal intellectual honesty.
- The exploitation formula and "terrible customer" line bridge biology to economics.
- The funder CTA and branding clarification are clean.

## WHAT STILL NEEDS FIXING (priority order)

| # | Issue | Effort |
|---|-------|--------|
| 1 | "Three possible use cases" → "Two" in section 10 lede | 30 sec |
| 2 | "The instrument is listening" → "The system is listening" | 10 sec |
| 3 | Use case 03 shows number "03" with no 01/02 before it - confusing | 1 min |
| 4 | Nav link "compressed" → "the thesis" or "ten sentences" | 30 sec |
| 5 | Team bio repeated discipline list - cut one instance | 2 min |
| 6 | Hero stat numbers context - consider "of X total" for works | 10 min |
| 7 | Use cases 01+02 position - consider moving up for universality | 15 min |
| 8 | "Principal Investigator" section label → less institutional | 30 sec |
| 9 | Exploitation formula "destroy" → softer verb for academic audience | 1 min |
| 10 | Hero image - consider whether AI-generated HUD art helps or hurts | Discussion |

---

## THE BABY/BATHWATER VERDICT

The old De-Mismatch site spoke to 10 audiences. The current site speaks to 3 (alignment researchers, SFF recommenders, Karen Hao). The mismatch split section is the one bridge - it's where the parent, the clinician, and the person in pain would feel understood. But after that section, the page becomes a technical document that only researchers would read.

The fix isn't rewriting the technical sections (they need to stay rigorous for SFF). The fix is **positioning the human-facing content earlier and more prominently** - specifically, moving use cases 01+02 up so they cluster with the mismatch split and AI companion case, creating a "human section" before the technical depth begins. A clinician or parent who reads: mismatch split → AI companion → Instagram depression → parenting guilt → "the rest is the evidence base for everything above" would feel served. Right now they read: mismatch split → AI companion → pyramid → mechanism cards → foundation cards → pivotal works → applications → oh here are the parenting and Instagram cases way down here.

The sentence "The specification is universal. AI alignment is one application." needs to be SHOWN, not just stated. Moving the human use cases up shows it.
