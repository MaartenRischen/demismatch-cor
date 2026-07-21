#!/usr/bin/env bash
set -euo pipefail

# Builds the publishable cor.demismatch.com site into dist/.
# As of the v2 portal swap (2026-06), this deploys the v2 portal surface
# (baked, dependency-free static site). The v2 source-of-truth/dev folder is
# "../Cor Portal v2" (re-bakes happen there, then the surface is copied here).

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"

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
