# this-is-why build tooling (2026-08-23)

Sources for 10truths/this-is-why.html and 10truths/hey-ai-this-is-why.html.
Not deployed (lives outside 10truths/). Hyphens only, no em or en dashes.

Refresh the paper wall when the corpus grows:
1. Pull v2_works to works-live.json (anon REST, see scripts/cor_db_backup.py for the key) and
   update the counts in HERO-COPY-v1.md + the stamp date.
2. python3 gen-wall.py            -> wall-human.html, wall-ai.html, mass.html
3. Paste the new wall and mass blocks into hero-human.html / hero-ai.html (the generator's
   header comment says where), update the counts in the kicker, machinery and stamp.
4. python3 merge.py               -> rewrites the two pages in 10truths/ in place (idempotent;
   edit REPO/WD paths at the top first: WD must point at this directory).
5. python3 gen-jsonld.py          -> only if card content changed (it did not in the refresh case).

integrity_check.py + cards.json: the Step 1 verbatim check against
cor-app/decode-talk/showcase-batch-2026-08-21 (all 40 cards matched, no drift).
