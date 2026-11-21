#!/usr/bin/env bash
set -euo pipefail

# Builds the publishable cor.demismatch.com site into dist/.
# As of the v2 portal swap (2026-06), this deploys the v2 portal surface
# (baked, dependency-free static site). The v2 source-of-truth/dev folder is
# "../Cor Portal v2" (re-bakes happen there, then the surface is copied here).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"

# --- Harness (21 Nov 2026): no page ships with a NEW core idea in its short mainstream form, or a generic change
# used as evidence. The one list is scripts/harness/concepts.json (copied from the main repo's harness/ by
# harness/install.sh). Known hits are in scripts/harness/baseline.json and get worked off; a new one stops the build
# and the deploy. A true exception is marked in the page text itself with  harness-ok: <reason>.
if command -v python3 >/dev/null 2>&1 && [ -f "$ROOT/scripts/harness/check.py" ]; then
  python3 "$ROOT/scripts/harness/check.py" site --root "$ROOT" --baseline "$ROOT/scripts/harness/baseline.json"
fi

# --- v2 live surfaces + redirect stubs for cut pages + infra ---
ROOT_FILES=(
  # v2 pages
  "index.html"
  "about.html"
  "mechanisms.html"
  "mechanism.html"
  "corpus.html"
  "derivation.html"
  "reference.html"
  "downloads.html"
  "eli5.html"
  "bridge-paper.html"
  "constitutional.html"
  "programme.html"
  "mindmap.html"
  "the-gap.html"
  "faq.html"
  "objections.html"
  # redirect stubs for cut/legacy URLs (see CUTS.md in Cor Portal v2)
  "how-to-read.html"
  "methodology.html"
  "selection-criteria.html"
  "spec.html"
  "cor.html"
  "atlas.html"
  "applications.html"
  "cases.html"
  "thinkers.html"
  "works.html"
  "m3-worked-example.html"
  "contact.html"
  "plan.html"
  # infra
  "404.html"
  "CNAME"
  "robots.txt"
  "sitemap.xml"
)

PUBLIC_DIRS=(
  "case"
  "css"
  "data"
  "js"
  "vendor"
  "assets"
  "operationalization"   # holds the M3 redirect stub
  "preview"              # unlinked noindex previews for Maarten (not in sitemap)
)

rm -rf "$DIST"
mkdir -p "$DIST"

for file in "${ROOT_FILES[@]}"; do
  cp "$ROOT/$file" "$DIST/$file"
done

for dir in "${PUBLIC_DIRS[@]}"; do
  rsync -a --delete --exclude=".DS_Store" "$ROOT/$dir/" "$DIST/$dir/"
done

cp "$ROOT/.nojekyll" "$DIST/.nojekyll"

echo "Built publishable site in $DIST"
