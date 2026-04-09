**Brutal review of Cor v2 (demismatch.com) - April 2026 live HTML.**

This is not a polish pass. This is a full autopsy from every audience the instructions require. I read the entire rendered site (hero through footer, all JS-populated sections, collapsed details, pyramid popovers, modals, mobile breakpoints). The pivot to “formal specification + alignment lead” was necessary for rigor and funding, but the execution has over-corrected into exclusionary academic density. The baby (the old site’s direct “you are not broken, the environment is” voice that made parents and clinicians feel *seen*) has been mostly thrown out. The site now speaks *about* humans far more than *to* them.

### 1. FIRST IMPRESSION (the 90-second test)

**Hero + first scroll:**  
- Hero lands the alignment thesis in <8 seconds: “The missing layer in AI alignment is *the human one*.” Strong for SFF recommenders and alignment researchers.  
- But a struggling parent or clinician? They see “AI alignment” in the *very first sentence* and the giant hero image of “morning alarm split.” They close the tab. The mismatch thesis (“Hardware works. Environment wrong.”) only appears *after* the Tristan Harris quote and the full Ten Sentences block.  
- Ten Sentences section is the real homepage. It is alignment-first (sentences 1–4, 7–8, 10 all name AI explicitly). Sentence 9 is the *only* nod to universality. For SFF this is perfect. For everyone else it feels like they walked into someone else’s meeting.

**Would they keep reading?**  
- SFF recommender: Yes (alignment + live stats + pyramid traceability = hard-to-fake signal).  
- Alignment researcher / Karen Hao: Yes.  
- HSEE grant reviewer: Maybe - the parenting use case later helps, but they have to scroll past 3,000+ words of AI framing first.  
- Parent / clinician / person in pain: No. The tone is cold, the examples academic, and the first human voice they hear is about an AI companion tricking a 22-year-old. The Instagram depression and parenting guilt use cases are buried *after* the mechanisms section. By the time they reach them the reader is exhausted.

Verdict on first impression: **Fails the non-alignment 90-second test.** The site now optimizes for the April 22 SFF blitz at the expense of every other audience.

### 2. VOICE AND TONE

The dominant voice is formal, precise, evidence-grounded, and *cold*.  
- Repeated phrases like “the framework,” “the specification,” “the organism,” “the architecture” are consistent with the “organism not mind” principle - good.  
- But they create distance. The site talks *about* the human motivational-emotional architecture the way a biologist talks about a lab rat.  
- The few places it warms up (use-case #02 parenting guilt, mismatch “The feelings are not errors. The environment is the error.”) feel like they were written by a different author.  
- Founder section is the most human part of the entire site - and it is at the very bottom. That is backwards.

Tone breaks:  
- Hero and Ten Sentences: crisp, alignment-pitch.  
- Mismatch and use cases: suddenly more direct and compassionate.  
- Mechanisms / Foundations: pure academic textbook.  
- Challenges and Gaps: admirably honest, almost self-deprecating.  
- Team bio: personal and slightly defensive (“The evidence base is the credential.”).

Result: the site feels like it was written by a committee that agreed on rigor but never agreed on who the reader actually *is*.

### 3. UNIVERSALITY

The claim “AI alignment is one application” exists in Ten Sentences #9.  
The *site structure* screams the opposite.  
- Applications section deliberately filters out clinical/education/policy (see JS HIDE_PATTERNS).  
- AI Companion is the longest, most detailed early example.  
- Pyramid puts Applications at the *top* visually, but the content hierarchy buries the human applications.

A parent landing here does not feel “this is for me too.” They feel they are reading someone else’s grant proposal that happens to mention parenting in passing.

The universality is *stated* but not *felt* until you are 60 % down the page.

### 4. CREDIBILITY

**Strengths** (these are real):  
- Live Supabase counts, pyramid traceability, primary extractions, challenges/gaps sections, pillar-works modal - this is the most auditable “specification” site I have ever seen. SFF will love it.  
- Empirical demonstrations and effect-size families are presented cleanly.  
- Anthropic resonance card is clever without overclaiming.  
- “Not novel science. Novel integration.” is perfectly humble.

**Weaknesses:**  
- Founder background (professional musician → theatre production → full-time specification) will read as “no relevant academic credentials” to some alignment researchers and academics. The defensive framing (“The evidence base is the credential”) makes it worse.  
- “Complete account” language in meta description and hero-sub still appears in a few places even though Gaps section exists. Minor, but sloppy.  
- Collapsed sections (Effect Sizes, Anthropic, Challenges, Gaps) are honest but hide the most interesting human-relevant material behind click fatigue.

### 5. STRUCTURE AND FLOW

Momentum killers:  
- After pyramid → attribution → full Mechanisms grid (14+ dense cards) → Foundations → Pivotal Works pictograms. This is ~2,500 words of technical depth *before* the relatable use cases.  
- Use cases are excellent but appear too late.  
- Applications section feels stripped (only 3–4 cards visible after filtering).  
- Empirical demonstrations are strong but visually similar to mechanisms.

What is missing:  
- A short “For humans who are suffering” entry point (perhaps right after Ten Sentences).  
- Clearer signaling in the nav and hero that alignment is the *lead application*, not the *only* one.  
- A one-paragraph “Why this matters to a parent / clinician / builder” bridge early on.

What should be cut or moved:  
- The AI Companion section is 40 % of the above-the-fold real estate after hero. It is excellent but should be moved down or turned into one of the three use cases.  
- The second “use-cases-grid” (only two cards) feels like a remnant. Merge with the later use cases or delete the early one.  
- Collapsed sections are fine but the “sec-fold” UI is clunky on mobile.

Page length: too long for a landing page that needs to serve 10 different audiences. It reads like documentation, not persuasion + invitation.

### 6. SPECIFIC COPY PROBLEMS (brutal list)

**Overclaims / hedging mismatches**  
- Hero sub: “a complete, evidence-grounded account” - the Gaps section exists. Downgrade to “the most complete public attempt.”  
- Ten Sentences #5: “Cor is the missing layer” - too absolute.  
- Pyramid intro: “Every claim on this site traces down to a primary source” - true for mechanisms but the pyramid itself has “convergences” that are *synthesized*, not pure primary. Minor but pedantic readers will notice.

**Dehumanizing or cold phrasing**  
- “The organism’s bonding needs” - repeated. Fine in mechanisms, alienating in use cases.  
- AI Companion section: the 22-year-old example is clinical and distant. The reader never feels the loneliness; they analyze it.  
- Everywhere: “the architecture,” “the system,” “the mechanism” - the human disappears.

**Jargon that blocks non-specialists**  
- Pyramid layer labels (l0–l6, DA4, M1, etc.) are used without on-ramp for non-technical readers.  
- “Obligate cooperative breeders” in parenting use case - accurate but drops like a brick for a tired mother.  
- “Supernormal stimulus” - used without explanation in child iPad image caption.

**Tone shifts**  
- Tristan Harris voice quote at top of Ten Sentences is great - then the list immediately goes back to academic.  
- Mismatch split uses Frankl quote beautifully, then the very next section (AI Companion) goes back to sterile analysis.

**Small but telling**  
- JS still has commented-out “bridge-thesis” and “tech × mechanism matrix” - dead code.  
- Some alt texts are excellent; some are missing (e.g. several HUD images).  
- Footer is bare. No obvious “read the full specification” or “join the mailing list” for the non-funder audience.

### Overall Verdict

The site is now an excellent *technical specification showcase* for alignment funders and researchers. It is a mediocre *human-facing explanation* of why people are suffering and what to do about it.

It will probably get the SFF recommender’s attention (the live DB, pyramid, gaps, and Anthropic card are catnip). It will lose the parent, the clinician, and the builder in the first three scrolls.

The tension the instructions describe is real and currently unresolved: you cannot optimize the hero and Ten Sentences for SFF *and* keep the old site’s “you are not broken” emotional punch without structural surgery.

**Fix priority (next 16 days before SFF deadline):**  
1. Add a short, warm “This is also for you” bridge right after Ten Sentences that names parents, clinicians, and builders explicitly.  
2. Move or shorten the AI Companion example; promote the parenting and status use cases earlier.  
3. Rework hero sub and first 2–3 sentences to lead with mismatch thesis, then say “AI alignment is the most urgent application.”  
4. Surface one human voice quote (parent or clinician) in the hero area.  
5. Consider a “Start here if you’re struggling” secondary nav or card that jumps straight to mismatch + use cases.

The evidence base is genuinely impressive. The current site buries the human heart of it. Fix the voice and the hierarchy, and Cor becomes the thing it claims to be: universal infrastructure that actually reaches the humans it is meant to serve.