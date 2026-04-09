#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"

ROOT_FILES=(
  "index.html"
  "about.html"
  "atlas.html"
  "bridge-paper.html"
  "cases.html"
  "constitutional.html"
  "contact.html"
  "eli5.html"
  "how-to-read.html"
  "spec.html"
  "thinkers.html"
  "works.html"
  "CNAME"
  "robots.txt"
  "sitemap.xml"
)

PUBLIC_DIRS=(
  "case"
  "css"
  "data"
  "hud_existing"
  "img"
  "js"
  "operationalization"
  "output"
  "partials"
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
