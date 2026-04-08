#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-demismatch.com}"
GITHUB_HOST="${2:-maartenrischen.github.io}"

echo
echo "DNS"
echo "---"
for host in "$DOMAIN" "www.$DOMAIN" "cor.$DOMAIN"; do
  echo "$host"
  dig +short "$host" || true
  echo
done

echo "HTTP"
echo "----"
for url in \
  "https://$DOMAIN" \
  "https://www.$DOMAIN" \
  "https://cor.$DOMAIN" \
  "https://$GITHUB_HOST/10Truths/"
do
  echo "$url"
  curl -I -L --max-redirs 5 "$url" || true
  echo
done
