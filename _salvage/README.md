# _salvage

Pages pulled out of a live deploy but kept on disk on purpose. Nothing in here
serves: `_salvage/` is not in `scripts/build-public.sh`'s allowlist (so it never
reaches cor.demismatch.com) and it is not under `10truths/` (so the
`mirror-10truths.yml` rsync never carries it to demismatch.com).

- **how-humans-work.html** - moved out of `10truths/` on 2026-07-19. It was an
  orphan (serving on demismatch.com, linked from nothing). Removed from the
  deploy, kept here because the prose is a salvage candidate for the front door.
  Framing is clean (plain-language "How humans work / What humans need"
  explainer). Decide: wire it into the front door, or let it go.
