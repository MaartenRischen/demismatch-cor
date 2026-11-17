#!/usr/bin/env python3
"""Render the sequence to an MP4.

The sequence is a pure function of p, so a film is not a screen recording: every frame is
drawn at an exact p and piped straight into ffmpeg. Nothing is captured in real time, so the
motion is deterministic and the pacing is ours, not the scroll's.

    python3 film.py [--out PATH] [--w 1920] [--h 1080] [--fps 30] [--page this-is-why.html]
                    [--host http://127.0.0.1:8766] [--scale 1] [--preview]

--preview renders every 6th frame at half size for a quick look.

TIMING. Chapter time is set here, in seconds, independent of how much scroll each chapter
owns. Raw p is derived from the live sequence at load: the roll owns 0 to rollFrac, and the
old chapter cut maps onto the rest.
"""
import argparse, io, subprocess, sys, time
from playwright.sync_api import sync_playwright

# seconds per chapter, in order. The sum is the film's length before the coda.
BEATS = [
    ("roll",        30.0),   # the 147 works, one line each; 30s puts a title on
                             # screen about 1.4s, which is the shortest that still reads
    ("shelf",        7.0),   # the field of paper, the pillars near
    ("wrangle",     13.0),   # gate, quote peel, stamps, challenges
    ("findings",    20.0),   # the 294 findings graded on evidence
    ("convergence",  7.0),   # 959 evidence threads into 15 mechanisms
    ("landing",      7.0),   # the 20 answers touch down
]
CODA_S = 6.0        # after the track: drift down over the cards
HOLD_S = 1.6        # hold the last frame
EASE_S = 1.2        # ease in at the very start and out at the very end

# the old chapter cut, in the sequence's post-roll clock
OLD = {"shelf": (0.00, 0.15), "wrangle": (0.15, 0.35), "findings": (0.35, 0.80),
       "convergence": (0.80, 0.90), "landing": (0.90, 1.00)}


def ease(t):
    return t * t * (3 - 2 * t)


def build_curve(roll_frac, fps):
    """(kind, value) per frame: ('p', raw p) inside the track, ('y', scrollY) for the coda."""
    def raw(old_p):
        return roll_frac + old_p * (1 - roll_frac)

    segs = []
    for name, secs in BEATS:
        a, b = (0.0, roll_frac) if name == "roll" else (raw(OLD[name][0]), raw(OLD[name][1]))
        segs.append((name, secs, a, b))

    total = sum(s[1] for s in segs)
    frames = []
    t = 0.0
    dt = 1.0 / fps
    while t < total - 1e-9:
        acc = 0.0
        for name, secs, a, b in segs:
            if t < acc + secs:
                u = (t - acc) / secs
                # ease only at the two ends of the whole film, so chapters butt cleanly
                if t < EASE_S:
                    u_all = ease(t / EASE_S)
                    p = a + (b - a) * (u * u_all + u * (1 - u_all) * 0.35)
                elif t > total - EASE_S:
                    k = ease((total - t) / EASE_S)
                    p = a + (b - a) * (1 - (1 - u) * (k + (1 - k) * 0.35))
                else:
                    p = a + (b - a) * u
                frames.append(("p", min(1.0, max(0.0, p))))
                break
            acc += secs
        t += dt
    frames.append(("p", 1.0))
    return frames


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="this-is-why-intro.mp4")
    ap.add_argument("--w", type=int, default=1920)
    ap.add_argument("--h", type=int, default=1080)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--page", default="this-is-why.html")
    ap.add_argument("--host", default="http://127.0.0.1:8766")
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--preview", action="store_true")
    a = ap.parse_args()

    with sync_playwright() as pw:
        br = pw.chromium.launch(args=[
            "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
            "--force-color-profile=srgb", "--disable-lcd-text",
        ])
        pg = br.new_page(viewport={"width": a.w, "height": a.h}, device_scale_factor=a.scale)
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"{a.host}/{a.page}", wait_until="load")
        pg.wait_for_function(
            "() => document.documentElement.classList.contains('tiw-seq-on')"
            " && window.__tiwSeq && window.__tiwSeq.rollFrac > 0"
            " && document.querySelectorAll('.tiw-seq-rolllist > *').length > 100", timeout=90000)
        pg.wait_for_timeout(3500)

        geom = pg.evaluate("""() => { const s = window.__tiwSeq;
            return {rollFrac: s.rollFrac, trackTop: s.trackTop, trackLen: s.trackLen,
                    docH: document.documentElement.scrollHeight}; }""")
        frames = build_curve(geom["rollFrac"], a.fps)
        end_scroll = geom["trackTop"] + geom["trackLen"]
        coda_from, coda_to = end_scroll, min(geom["docH"] - a.h, end_scroll + a.h * 1.45)
        n_coda = int(CODA_S * a.fps)
        for i in range(n_coda):
            frames.append(("y", coda_from + (coda_to - coda_from) * ease((i + 1) / n_coda)))
        frames += [frames[-1]] * int(HOLD_S * a.fps)
        if a.preview:
            frames = frames[::6]

        secs = len(frames) / a.fps
        print(f"rollFrac {geom['rollFrac']:.4f} | {len(frames)} frames | {secs:.1f}s at {a.fps}fps "
              f"| {a.w}x{a.h} scale {a.scale}", flush=True)

        ff = subprocess.Popen([
            "ffmpeg", "-y", "-f", "image2pipe", "-framerate", str(a.fps), "-i", "-",
            "-c:v", "libx264", "-preset", "slow", "-crf", "17",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", a.out,
        ], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        t0 = time.time()
        for i, (kind, v) in enumerate(frames):
            if kind == "p":
                y = geom["trackTop"] + geom["trackLen"] * v
                pg.evaluate("""(args) => { window.scrollTo(0, args.y); const s = window.__tiwSeq;
                    s.p = args.p; s.target = args.p; s.force = true; s.draw(); s.force = false; }""",
                    {"y": y, "p": v})
            else:
                pg.evaluate("(y) => window.scrollTo(0, y)", v)
                pg.wait_for_timeout(8)
            ff.stdin.write(pg.screenshot(type="png"))
            if i % 60 == 0:
                el = time.time() - t0
                print(f"  {i}/{len(frames)}  {el:.0f}s elapsed, "
                      f"{(el / max(1, i)) * (len(frames) - i):.0f}s left", flush=True)
        ff.stdin.close()
        ff.wait()
        br.close()
        print("console errors:", errs[:3] or 0)
        print("wrote", a.out, flush=True)


if __name__ == "__main__":
    main()
