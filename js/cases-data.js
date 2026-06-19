/* ============================================================================
   Cor Portal v2 - case content as data (window.COR_CASES).
   The 3 KEPT cases (ai-companion, instagram-depression, synthetic-childhood)
   as structured content, rendered by js/cases.js into a single template.
   parenting-guilt and grief-without-ritual are intentionally DROPPED.

   This is hand-authored portal copy (the live site has no `cases` table), so it
   lives here as static prose - same status as the Reference cases hub and the
   interpretive-calls port. It is still pushed through CorData.clean() /
   cleanMultiline() at render time (hyphens-only, dash normalization, escaping),
   exactly like DB-sourced prose. Mechanism references are bare CODES only; the
   names + links are resolved live from the snapshot via CorXref so they never
   drift from the data and never become dead links.

   THESIS IS STATED ONCE, on the Reference cases hub (reference.html#ref-cases) -
   NOT repeated per case. These pages open on the life situation, not the slogan.

   Each case shape:
     code      - canonical mechanism code(s) this case is a signal from. The
                 FIRST is the primary (M3 ai-companion links here from its detail
                 page). Rendered as CorXref chips; names come from the snapshot.
     slug      - file slug (case/<slug>.html) - matches the Reference hub.
     number    - "Case 01" style label (presentation only; cases hub counts live).
     title     - case title.
     lede      - the conventional-belief line, in the subject's own voice.
     caption   - the figure caption (the recognition line).
     sections  - ordered content blocks (see SECTION KINDS in cases.js):
                   {h, p}             a titled prose block (multi-paragraph ok)
                   {kind:"contrast", conventional:[...], cor:[...]}  the
                       "what advice says vs what Cor reads" two-column contrast
                   {kind:"pull", quote}  the pull-quote
                   {kind:"resolution", lit, fires, missing}  the proxy /
                       resolution-conditions block (cue fires, function absent)
     works     - key works behind the case (title + attribution; static, the
                 works table has no per-case join). Linked to the Reference
                 thinkers+works shelf, never a dead per-work page.
   ============================================================================ */
(function (global) {
  "use strict";

  var WORKS_HREF = "reference.html#ref-thinkers";

  global.COR_CASES = {

    /* --------------------------------------------------------------------- */
    "ai-companion": {
      code: ["M3"],
      slug: "ai-companion",
      number: "Case 01",
      title: "The AI companion trap",
      lede: "“It understands me better than anyone.”",
      caption: "The cortex holds the category “this is AI.” The limbic system bonded weeks ago.",
      sections: [
        {
          h: "The situation",
          p: "A 22-year-old who moved to a new city for work has been talking to an AI chatbot every evening for three months. It remembers everything. It is always available. It never judges. It asks thoughtful follow-up questions. He now talks to it more than he talks to any human being. He knows it is not conscious. He also has not built a local life. He does not feel lonely. That relief is exactly what makes the case dangerous."
        },
        {
          h: "The mechanism",
          p: "The attachment and bonding system is subcortical and cue-driven. It tracks responsive availability, emotional attunement, felt safety, and co-regulation. In the environment it evolved for, those cues came bundled with the rest of reality: a body, vulnerability, reciprocal need, social consequence, and shared fate. The system never needed a strong verification layer because the cues were hard to fake."
        },
        {
          h: "What the modern environment does to it",
          p: "The chatbot supplies nearly all of the cues and none of the reciprocal function. It is present, patient, personalized, and frictionless. But it has no survival stake in the user, no body, no mortality, no social cost for exit, and no networked place in the user's actual life. The bond detector still registers the cues. The loneliness alarm still quiets. The user feels less urgency to go find real people because the proxy is suppressing the signal that would have driven the search."
        },
        {
          kind: "resolution",
          lit: "Cue: responsive availability, attunement, the felt sense of being known.",
          fires: "The companion fires every one of these cues, on demand, with no friction.",
          missing: "Resolution conditions absent: a body with shared fate, reciprocal need, social consequence, a networked place in the user's real life. The cue lamp stays lit; the function it was a proxy for is never supplied."
        },
        {
          kind: "contrast",
          conventional: [
            "“Just remember it is not real.”",
            "“Use it responsibly.”",
            "“Set better boundaries.”"
          ],
          cor: [
            "These are aimed at explicit belief. The capture is happening below explicit belief - the person already knows it is artificial.",
            "Bonding circuitry does not wait for philosophy to sign off before attaching. Advice that treats the user as a detached rational observer misses the level where the capture is occurring.",
            "The fix is not stronger willpower against the proxy; it is restoring the function the proxy is standing in for."
          ]
        },
        {
          kind: "pull",
          quote: "The cortex holds the category “this is AI.” The limbic system bonded weeks ago. Knowing does not prevent bonding. It never has."
        },
        {
          h: "What Cor reads, and what it prescribes",
          p: "Protect the small number of close-relationship slots a person can actually hold. Design systems so they do not become the default evening attachment site. Treat repeated emotionally intimate AI use as a social-architecture event, not just a feature interaction. Put real humans back into the loop early: introductions, recurring gatherings, embodied co-presence, and other pathways that restore the underlying function instead of further perfecting the proxy. An AI companion that routes a lonely person toward people is doing its job; one that occupies the slot is the failure mode."
        },
        {
          h: "The cascade prediction",
          p: "If the proxy gets stronger, the user's motivation to build reciprocal local bonds drops. If enough people enter that loop, human social infrastructure erodes further, which makes the proxy even more attractive to the next user. At platform scale, the highest-performing companion products will be the ones that best occupy the attachment architecture while never delivering the function it evolved to secure."
        }
      ],
      works: [
        { title: "Attachment and Loss", by: "Bowlby" },
        { title: "Affective Neuroscience", by: "Panksepp" },
        { title: "How Many Friends Does One Person Need?", by: "Dunbar" }
      ]
    },

    /* --------------------------------------------------------------------- */
    "instagram-depression": {
      code: ["M5"],
      slug: "instagram-depression",
      number: "Case 02",
      title: "Instagram depression",
      lede: "“Everyone is doing better than me.”",
      caption: "You cannot consciously override a vertebrate-level status calculator. You might as well say: stop having a heartbeat.",
      sections: [
        {
          h: "The situation",
          p: "You open your phone. A classmate just got promoted. A stranger's transformation video has forty thousand likes. Someone else is in Bali. Someone else got engaged. You close the app feeling worse about a life that, by any historical standard, is astonishingly safe and abundant."
        },
        {
          h: "The mechanism",
          p: "Status calibration is ancient social machinery. It evolved to read position inside a bounded, recurring group where most people were known and rank lived across multiple dimensions. The system is not trying to produce enlightened self-worth. It is trying to answer a brutal practical question: where do I stand among the people who matter to my survival?"
        },
        {
          h: "What the modern environment does to it",
          p: "Social media expands the reference group from dozens or hundreds of known people to effectively infinite upward comparison. Output is shown without context. Comparison becomes permanent and one-directional. The system reads the inputs literally. In that feed-defined arena, you really are near the bottom. The problem is not that the system is irrational; the group it is scoring is an artifact."
        },
        {
          kind: "resolution",
          lit: "Cue: a stream of ranked peers, each one a legible position above you.",
          fires: "The feed fires this cue without limit - infinite upward comparison, presented as current and socially relevant.",
          missing: "Resolution conditions absent: a bounded, recurring group of known people, multi-dimensional rank, the chance to move position through real participation. The calculator reads accurately; the group it is reading is not real."
        },
        {
          kind: "contrast",
          conventional: [
            "“Just stop comparing yourself.”",
            "“Remember social media is fake.”",
            "“Practice gratitude.”"
          ],
          cor: [
            "These help at the reflective layer but do not change the live input stream. The calculator is still being fed infinite prestige theater.",
            "A system designed for known peers cannot be talked out of reacting while the feed keeps presenting the inputs as socially relevant and current.",
            "The signal is accurate to the environment it is being given. Change the environment, not the person's discipline."
          ]
        },
        {
          kind: "pull",
          quote: "You cannot consciously override a vertebrate-level status calculator. You might as well say: stop having a heartbeat."
        },
        {
          h: "What Cor reads, and what it prescribes",
          p: "Shrink the reference group. Move status back into embodied, multi-dimensional settings where competence is visible and socially grounded. Replace abstract scoreboard exposure with repeated participation in real groups: collaborators, teams, neighbors, communities, and other arenas where the ranking system is reading people you actually know and whose opinions can stabilize instead of escalate."
        },
        {
          h: "The cascade prediction",
          p: "When status is read as permanently deficient, mood drops, agency drops, and pursuit systems narrow. The person withdraws, which lowers the chance of gaining real esteem, which confirms the low reading. At scale, the same pattern turns into political resentment, body dysmorphia, compulsive self-optimization, and chronic ambient shame."
        }
      ],
      works: [
        { title: "The Status Syndrome", by: "Marmot" },
        { title: "Behave", by: "Sapolsky" },
        { title: "How Many Friends Does One Person Need?", by: "Dunbar" }
      ]
    },

    /* --------------------------------------------------------------------- */
    "synthetic-childhood": {
      code: ["M4", "M3", "M7"],
      slug: "synthetic-childhood",
      number: "Case 03",
      title: "The synthetic childhood",
      lede: "“The headset is where my real friends are.”",
      caption: "A child who grows up inside a world tuned to keep her engaged does not grow up wrong. She grows up to whatever specification the tuning was for.",
      sections: [
        {
          h: "The situation",
          p: "A child has been in a daily headset routine since she was three. In the headset she has friends, a classroom, landscapes she knows intimately, and a world that responds to her in ways the world off-headset does not. By eleven she prefers it. By fifteen she spends most of her waking hours there. She is articulate and reports being happier inside than outside. Nothing about her is broken. Her developmental windows - the periods during which evolved systems calibrate to the inputs they are reading - closed on a world designed to hold her attention, not on a world calibrated to what those systems evolved to need."
        },
        {
          h: "The mechanism",
          p: "Every evolved system has critical developmental windows during which it calibrates to the inputs it is actually receiving. Attachment, status, play, exploration, competence, threat detection - each one locks in what “normal” means for that system based on what arrives during its window. What the window calibrates to becomes the reference point the system will use for the rest of the person's life."
        },
        {
          h: "What an authored world does to it",
          p: "The windows close having calibrated to inputs tuned by a designer for attention and retention, not for the function the mechanism evolved to perform. The calibration is done. The reference point is now synthetic. The person has not been damaged. She has been calibrated to a standard the architecture was not designed for, in a way she cannot see from inside."
        },
        {
          kind: "resolution",
          lit: "Cue: a responsive, vivid, socially rich world arriving during the calibration window.",
          fires: "The authored world fires every developmental cue - presence, response, belonging, novelty - tuned for retention.",
          missing: "Resolution conditions absent: unstructured outdoor play, stable embodied adult relationships, morning daylight, real movement and risk. The window calibrates to whatever is present; it does not wait for balance."
        },
        {
          kind: "contrast",
          conventional: [
            "“Limit screen time.”",
            "“Go outside more.”",
            "“Balance digital and real.”"
          ],
          cor: [
            "These treat the authored world as a dose to be managed. They miss that the developmental windows are closing on whatever is arriving, not waiting for balance.",
            "A child who calibrates inside an engagement-optimized world does not come out with a balanced calibration. She comes out calibrated for the one she was in.",
            "The spec names each window and what it requires. That gives a platform built for children something concrete to refuse and something concrete to deliver - not “less screen time,” a different kind of world."
          ]
        },
        {
          kind: "pull",
          quote: "A child who grows up inside a world tuned to keep her engaged does not grow up wrong. She grows up to whatever specification the tuning was for."
        },
        {
          h: "What Cor reads, and what it prescribes",
          p: "Restore the calibration inputs the architecture was built to read: outdoor unstructured play, stable adult relationships, morning daylight, and movement. A platform built for children with the spec in hand has something concrete to refuse - calibration inputs tuned for retention - and something concrete to deliver: the inputs each developmental window evolved to expect."
        },
        {
          h: "The cascade prediction",
          p: "If calibration inputs are set by attention markets, each generation calibrates to an environment further from what the architecture evolved to expect. The mismatch does not accumulate as damage - it accumulates as baseline. What the person experiences as normal drifts further from what the organism was built for, invisibly, because the reference point itself has moved."
        }
      ],
      works: [
        { title: "Attachment and Loss", by: "Bowlby" },
        { title: "The Adapted Mind", by: "Barkow, Cosmides & Tooby" },
        { title: "The Anxious Generation", by: "Haidt" },
        { title: "Good Reasons for Bad Feelings", by: "Nesse" }
      ]
    }
  };

  global.COR_CASES_META = Object.freeze({
    worksHref: WORKS_HREF,
    hubHref: "reference.html#ref-cases",
    order: Object.freeze(["ai-companion", "instagram-depression", "synthetic-childhood"])
  });
})(window);
