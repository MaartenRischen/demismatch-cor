# COR Site

This folder contains the full COR static website prepared for GitHub Pages deployment at `cor.demismatch.com`.

The public deploy reads atlas data live from Supabase using the low-privilege public key and falls back to committed snapshots if the live API is unavailable.

## Local preview

Build the filtered publishable site:

```bash
bash scripts/build-public.sh
```

Serve the built artifact locally:

```bash
python3 -m http.server 8765 --directory dist
```

Then open:

- `http://127.0.0.1:8765/`
- `http://127.0.0.1:8765/atlas.html`
- `http://127.0.0.1:8765/case/ai-companion.html`

## Deployment

Follow the hand-held migration guide in [DEPLOYMENT.md](/Users/maartenrischen/code/DEMISMATCH%20COR%20WEBSITE/DEPLOYMENT.md).

## Quick checks

Run:

```bash
bash scripts/check-live-domains.sh
```

That reports the current DNS and HTTP status for:

- `demismatch.com`
- `www.demismatch.com`
- `cor.demismatch.com`
- `maartenrischen.github.io/10Truths/`
