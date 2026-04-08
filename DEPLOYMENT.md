# COR + De-Mismatch Deployment Plan

This folder is prepared to publish the full COR site at:

- `https://cor.demismatch.com/`
- `https://cor.demismatch.com/atlas.html`
- `https://cor.demismatch.com/case/ai-companion.html`
- `https://cor.demismatch.com/operationalization/`

The intended final split is:

- `demismatch.com` -> the existing `10Truths` site
- `cor.demismatch.com` -> this full COR site

## Current state observed on 2026-04-08

From a live check run from this machine:

- `https://demismatch.com` is currently serving the Railway-hosted legacy site.
- `https://www.demismatch.com` currently resolves but returns a Railway 404.
- `cor.demismatch.com` does not currently resolve in DNS.
- `https://maartenrischen.github.io/10Truths/` is live and returning 200.

That means the safe migration is:

1. Publish COR to `cor.demismatch.com` first.
2. Leave the existing Railway apex site untouched for now.
3. Later move `demismatch.com` from Railway to the `10Truths` GitHub Pages site.

## Why the COR site needs its own hostname

This site uses domain-root paths such as:

- `/atlas.html`
- `/css/cor.css`
- `/case/...`
- `/operationalization/...`

So it should be served from the root of its own hostname, not from a nested path like `/cor/`.

## What is already prepared in this folder

The repository now includes:

- [GitHub Pages workflow](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/.github/workflows/deploy-pages.yml)
- [filtered public build script](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/scripts/build-public.sh)
- [custom domain marker](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/CNAME)
- [no-Jekyll marker](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/.nojekyll)
- [robots file](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/robots.txt)
- [sitemap](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/sitemap.xml)
- [live check script](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/scripts/check-live-domains.sh)

The public site now uses live Supabase reads with snapshot fallback:

- homepage counts and application cards load from committed JSON snapshots
- atlas, works, and thinkers try live Supabase reads first
- if live Supabase is unavailable, the committed snapshots keep the site working
- only the low-privilege public `anon` key is used in the browser

The GitHub Pages workflow builds a filtered `dist/` so the public artifact includes only the real COR site:

- top-level HTML pages
- `case/`
- `css/`
- `data/`
- `hud_existing/`
- `img/`
- `js/`
- `operationalization/`
- `output/`
- `partials/`
- `CNAME`
- `robots.txt`
- `sitemap.xml`

Draft notes, local tooling folders, and working files are intentionally excluded from the live Pages artifact.

## Phase 1: publish COR at `cor.demismatch.com`

### A. Put this folder in its own GitHub repository

Suggested repository name:

- `demismatch-cor`

Then push this folder to that repository on branch `main`.

### B. Enable GitHub Pages for the COR repo

In the COR repository:

1. Open `Settings`.
2. Open `Pages`.
3. Set the source to `GitHub Actions`.
4. Save.

This repo already contains the workflow that will publish the filtered `dist/` directory.

### C. Set the custom domain in the COR repo

In the COR repository `Settings -> Pages`:

1. Enter `cor.demismatch.com` as the custom domain.
2. Save.
3. Wait for GitHub to accept the binding.

Important:

- For an Actions-based Pages deploy, the live custom domain is controlled in the repository's Pages settings.
- The committed `CNAME` file is still useful as an in-repo marker, but GitHub does not rely on it the same way it does for branch-based Pages publishing.

### D. Verify the domain in GitHub before changing DNS

Recommended order:

1. In your GitHub account or org Pages settings, verify `demismatch.com`.
2. Add the TXT record GitHub asks for in Cloudflare.
3. Wait for verification to pass.

Verifying the apex domain also protects its immediate subdomains, which includes `cor.demismatch.com`.

### E. Add the Cloudflare DNS record for COR

In Cloudflare DNS for `demismatch.com`, create:

- Type: `CNAME`
- Name: `cor`
- Target: `maartenrischen.github.io`

If you publish the COR repo from a different GitHub user or organization, replace the target with that account's default Pages hostname instead.

Do not point `cor` at:

- the Railway app
- `demismatch.com`
- a repository path like `maartenrischen.github.io/10Truths`

It must point at the GitHub Pages account host, not a repo URL path.

### F. Wait for SSL and test

After DNS is in place:

1. Wait for DNS to propagate.
2. Wait for GitHub Pages HTTPS to become available.
3. Test:
   - `https://cor.demismatch.com/`
   - `https://cor.demismatch.com/atlas.html`
   - `https://cor.demismatch.com/case/ai-companion.html`
   - `https://cor.demismatch.com/operationalization/`

At this stage:

- `demismatch.com` should still stay on Railway
- `cor.demismatch.com` should now be on GitHub Pages

## Phase 2: later move `demismatch.com` to `10Truths`

Do this only after `cor.demismatch.com` is working.

### A. Configure the `10Truths` repo on GitHub

In the GitHub repository that currently publishes `https://maartenrischen.github.io/10Truths/`:

1. Open `Settings`.
2. Open `Pages`.
3. Set the custom domain to `demismatch.com`.
4. Save.

If you want `www.demismatch.com` to work too, add the DNS records for both apex and `www`.

### B. Change Cloudflare DNS for the apex

When you are ready to cut over the main domain away from Railway, replace the current Railway-targeting apex records with GitHub Pages records:

- `A` -> `185.199.108.153`
- `A` -> `185.199.109.153`
- `A` -> `185.199.110.153`
- `A` -> `185.199.111.153`

Optional IPv6 support:

- `AAAA` -> `2606:50c0:8000::153`
- `AAAA` -> `2606:50c0:8001::153`
- `AAAA` -> `2606:50c0:8002::153`
- `AAAA` -> `2606:50c0:8003::153`

For `www`, create:

- Type: `CNAME`
- Name: `www`
- Target: `maartenrischen.github.io`

### C. Remove the apex custom domain from Railway

Once GitHub Pages is serving `demismatch.com` correctly, detach `demismatch.com` from the Railway project so Railway is no longer expecting to serve that hostname.

If you want the Railway project to remain reachable, keep it only on a Railway-provided domain or move it to another dedicated subdomain.

## Recommended DNS shape

### Right now

- `demismatch.com` -> keep on Railway
- `www.demismatch.com` -> optional cleanup or redirect later
- `cor.demismatch.com` -> add CNAME to GitHub Pages

### Final state

- `demismatch.com` -> `10Truths` on GitHub Pages
- `www.demismatch.com` -> CNAME to GitHub Pages
- `cor.demismatch.com` -> CNAME to GitHub Pages
- Railway legacy app -> no longer attached to apex domain

## Local commands

Build the publishable artifact:

```bash
bash scripts/build-public.sh
```

Check live DNS and HTTP state:

```bash
bash scripts/check-live-domains.sh
```

Preview the built site locally:

```bash
python3 -m http.server 8765 --directory dist
```

## Smoke test URLs

Once COR is live:

- `https://cor.demismatch.com/`
- `https://cor.demismatch.com/about.html`
- `https://cor.demismatch.com/atlas.html`
- `https://cor.demismatch.com/cases.html`
- `https://cor.demismatch.com/case/ai-companion.html`
- `https://cor.demismatch.com/operationalization/`
- `https://cor.demismatch.com/bridge-paper.html`
- `https://cor.demismatch.com/constitutional.html`

Once the apex later moves:

- `https://demismatch.com/`
- `https://www.demismatch.com/`
