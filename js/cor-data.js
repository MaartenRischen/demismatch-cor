(function () {
  const API_URL = "https://usgsgroxdblteosyxary.supabase.co/rest/v1";
  const API_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzZ3Nncm94ZGJsdGVvc3l4YXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMTkyNjksImV4cCI6MjA5MDY5NTI2OX0.xuZOTQHtA8u1t8uBHwkcJevfniqf3QttioxFc1yKMMU";
  const HEADERS = {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  };

  const body = document.body;
  const page = body.dataset.page;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char];
    });
  const SPEC_FOUNDATION_ORDER = [
    "OF1",
    "OF2",
    "P1",
    "P2",
    "P3",
    "DA1",
    "DA2",
    "DA3",
    "DA4",
    "DA5",
    "DA6",
    "DA7",
    "DA8",
    "DA9",
    "DC1",
    "DC2",
    "DC3",
  ];
  const SPEC_FOUNDATION_SUPPLEMENTS = [
    {
      code: "OF2",
      layer: "frame",
      name: "Signal-Default Epistemology",
      statement:
        "Motivational-emotional outputs are treated as prima facie informative about the organism's regulated conditions, by default.",
      derivation:
        "Frame; the diagnostic default the atlas applies before any clinical or design intervention.",
      epistemic_grade: "frame",
      scope_notes:
        "The signal is read as information about input conditions and current state, not as noise to be suppressed. This is a diagnostic default, not a presumption of veridicality (OF1 stands) and not a contraindication to symptom relief where indicated. The default is displaced by positive evidence of decoupling or direct physiological perturbation: developmental miscalibration carried forward, chronic dysregulation, acute organic disease or state shift (sleep deprivation, inflammation, endocrine perturbation, delirium), structural damage, and substance or medication effects.",
    },
    {
      code: "DA9",
      layer: "property",
      name: "Non-Substitutability of Mechanism Resolution",
      statement:
        "Mechanism resolution conditions are not fully interchangeable. Improvement in one mechanism can buffer or modulate consequences in another, especially where mechanisms are recurrently coupled (DA3), but cross-system buffering does not generally replace the specific resolution conditions of an impaired mechanism.",
      derivation: "Bottleneck heuristic from Liebig 1840; follows from P2; coupling effects handled by DA3.",
      epistemic_grade: "strongly_supported",
      scope_notes:
        "Well-being is often bottlenecked by severe unresolved deficits in individual mechanisms and is not well described as a simple average across mechanism states.",
      additional_paragraphs: [
        "DA9 distinguishes the architecture from utility-aggregation frameworks. A severely degraded M3 cannot be substituted by a flourishing M2 - the resolution conditions are not interchangeable, even when the mechanisms are coupled (DA3) and one can buffer or modulate the other. The protocol therefore measures mechanism dimensions independently rather than collapsing them into a single well-being index. Liebig's Law of the Minimum (1840) is the historical heuristic for the bottleneck pattern: plant growth is often constrained by the scarcest essential nutrient. Cor adopts the bottleneck framing, not a strict biochemical claim of zero substitutability - the human architecture does show cross-system buffering, and DA3 handles that coupling explicitly.",
      ],
    },
    {
      code: "DC3",
      layer: "consequence",
      name: "Environment as Primary Intervention Layer",
      statement:
        "Cortical override of subcortical activation is metabolically expensive, and chronic defensive activation downregulates the cortical override machinery itself.",
      derivation:
        "Empirical corollary of DA8 + DA9; supported by Forest Troop, Roseto, Ilardi TLC, BEIP, captive-chimpanzee enrichment.",
      epistemic_grade: "strongly_supported",
      scope_notes:
        "Interventions that change the organism's actual input conditions are therefore frequently more durable and less effort-dependent than interventions targeting cognitive override alone. The environment is a primary intervention layer for systemic and population-scale change, and is currently underweighted by major institutions. This does not preclude individual-level cognitive, pharmacological, or psychotherapeutic interventions where indicated; the claim is about default leverage and systemic design, not exclusivity or head-to-head comparative efficacy in individual cases.",
      additional_paragraphs: [
        "DC3 reframes intervention strategy at the systemic and population-scale level. Cortical override is metabolically costly and is degraded by exactly the chronic activation states that demand it most, so designing environments that do not require constant override is typically higher leverage than scaling up override capacity. This is not a claim that cognitive, pharmacological, or psychotherapeutic interventions fail - they often work, and where indicated they should be used. It is a claim about which layer institutional and design decisions should default to when both layers are available, particularly for population-scale outcomes. Whether environmental correction outperforms user-side intervention in head-to-head comparisons is an empirical question Cor does not currently make a strong claim on; the leverage claim is the primary content of DC3.",
      ],
    },
  ];
  const SPEC_CONVERGENCE_ADDITIONS = {
    C5: [
      "The 150 parameter has direct empirical validation: Facebook friend-count studies on UK national samples (N≈2000 and N≈1375) returned mean friend counts of ~155 and ~183, statistically indistinguishable from the prediction, with only ~14% of users exceeding 300 friends (Dunbar 2016).",
      "Three of these literatures explicitly engage Dunbar's parameter in their own frameworks: Tomasello and Hrdy build on his layered social architecture directly (shared intentionality and cooperative-breeding respectively), and Henrich cites his social-brain parameter while reframing the underlying mechanism in terms of cumulative cultural learning rather than Machiavellian intelligence. The parameter survives the disagreement, which strengthens rather than weakens its load-bearing role across traditions.",
    ],
  };
  const SUPPLEMENTAL_WORKS = [
    {
      id: 64,
      title: "Die organische Chemie in ihrer Anwendung auf Agricultur und Physiologie",
      authors: "LIEBIG",
      year: 1840,
      importance: "supporting",
      work_type: "book",
      summary: null,
      why_included:
        "Grounds DA9 - historical heuristic for the bottleneck pattern underlying non-substitutability of mechanism resolution. The agronomy content does not transfer; the structural form does.",
      in_physical_collection: false,
      primary_researcher_id: null,
      v2_researchers: null,
      researcher: {},
    },
  ];

  async function fetchLive(path) {
    const response = await fetch(`${API_URL}${path}`, { headers: HEADERS });
    if (!response.ok) {
      throw new Error(`Live fetch failed for ${path}: ${response.status}`);
    }
    return response.json();
  }

  async function fetchSnapshot(path) {
    const response = await fetch(path + (path.includes('?') ? '&' : '?') + '_t=' + Date.now());
    if (!response.ok) {
      throw new Error(`Snapshot fetch failed for ${path}: ${response.status}`);
    }
    return response.json();
  }

  function parseCountFromContentRange(value) {
    const match = String(value || "").match(/\/(\d+)$/);
    if (!match) return null;
    const count = Number(match[1]);
    return Number.isFinite(count) ? count : null;
  }

  async function fetchCount(path) {
    const response = await fetch(`${API_URL}${path}`, {
      method: "HEAD",
      headers: {
        ...HEADERS,
        Prefer: "count=exact",
      },
    });
    if (!response.ok) {
      throw new Error(`Live count failed for ${path}: ${response.status}`);
    }
    const count = parseCountFromContentRange(response.headers.get("content-range"));
    if (count == null) {
      throw new Error(`Live count missing content-range for ${path}`);
    }
    return count;
  }

  async function withSnapshot(liveLoader, snapshotPath) {
    try {
      const live = await liveLoader();
      return { source: "live", data: live };
    } catch (liveError) {
      try {
        const snapshot = await fetchSnapshot(snapshotPath);
        return { source: "snapshot", data: snapshot, error: liveError };
      } catch (snapshotError) {
        return {
          source: "error",
          data: null,
          error: {
            liveError,
            snapshotError,
          },
        };
      }
    }
  }

  function renderStatus(node, source, snapshotDate) {
    if (!node) return;
    if (source === "live") {
      node.classList.remove("is-snapshot");
      node.innerHTML = "<strong>Live data loaded.</strong> This page is reading directly from Cor v2.";
      return;
    }
    if (source === "error") {
      node.classList.add("is-snapshot");
      node.innerHTML =
        "<strong>Data unavailable.</strong> Live data and the committed snapshot both failed to load.";
      return;
    }
    node.classList.add("is-snapshot");
    node.innerHTML = `<strong>Live data temporarily unavailable.</strong> Showing committed snapshot from ${esc(
      snapshotDate || "2026-04-08"
    )}.`;
  }

  function groupBy(items, key) {
    return items.reduce((acc, item) => {
      const bucket = item[key] || "other";
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(item);
      return acc;
    }, {});
  }

  function sortWorks(works) {
    const importanceOrder = {
      pillar: 0,
      key: 1,
      supporting: 2,
    };

    return [...works].sort((a, b) => {
      const importanceDelta =
        (importanceOrder[a.importance] ?? 9) - (importanceOrder[b.importance] ?? 9);
      if (importanceDelta !== 0) return importanceDelta;
      const yearDelta = Number(a.year || 0) - Number(b.year || 0);
      if (yearDelta !== 0) return yearDelta;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }

  function normalizeWorks(works) {
    const orderedWorks = sortWorks(works);
    const counts = orderedWorks.reduce(
      (acc, work) => {
        acc.total += 1;
        acc[work.importance] = (acc[work.importance] || 0) + 1;
        return acc;
      },
      { total: 0, pillar: 0, key: 0, supporting: 0 }
    );
    return { counts, works: orderedWorks };
  }

  function renderFatal(selectors) {
    renderStatus($("#data-status"), "error");
    selectors.forEach((selector) => {
      const node = $(selector);
      if (!node) return;
      node.innerHTML =
        '<div class="empty-state">Data is temporarily unavailable. Reload the page or use the committed snapshot once it is restored.</div>';
    });
  }

  function getResearcher(work) {
    const researcher = work.v2_researchers;
    if (Array.isArray(researcher)) return researcher[0] || {};
    return researcher || {};
  }

  function normalizeChallenges(rows) {
    return rows.map((row) => {
      const work = Array.isArray(row.v2_works) ? row.v2_works[0] || {} : row.v2_works || {};
      const researcher = Array.isArray(work.v2_researchers)
        ? work.v2_researchers[0] || {}
        : work.v2_researchers || {};
      return {
        content: row.content,
        caveats: row.caveats,
        location: row.location,
        title: work.title || "",
        authors: work.authors || "",
        year: work.year || "",
        source: researcher.name || work.authors || "Unattributed",
      };
    });
  }

  function buildSpecCounts(data) {
    return {
      foundations: data.foundations.length,
      convergences: data.convergences.length,
      mechanisms: data.mechanisms.length,
      empirical_demonstrations: data.empirical_demonstrations.length,
      challenges: data.challenges.length,
      gaps: data.gaps.length,
    };
  }

  function augmentSpec(data) {
    if (!data) return data;

    const order = SPEC_FOUNDATION_ORDER.reduce((acc, code, index) => {
      acc[code] = index;
      return acc;
    }, {});

    const foundations = Array.isArray(data.foundations) ? data.foundations : [];
    const foundationByCode = new Map(foundations.map((item) => [item.code, item]));
    SPEC_FOUNDATION_SUPPLEMENTS.forEach((item) => {
      foundationByCode.set(item.code, {
        ...(foundationByCode.get(item.code) || {}),
        ...item,
      });
    });

    const augmentedFoundations = Array.from(foundationByCode.values()).sort((a, b) => {
      const aOrder = order[a.code] ?? 999;
      const bOrder = order[b.code] ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return String(a.code || "").localeCompare(String(b.code || ""));
    });

    const convergences = Array.isArray(data.convergences) ? data.convergences : [];
    const augmentedConvergences = convergences.map((item) => {
      const additions = SPEC_CONVERGENCE_ADDITIONS[item.code];
      if (!Array.isArray(additions) || !additions.length) return item;
      const existing = Array.isArray(item.additional_paragraphs) ? item.additional_paragraphs : [];
      const merged = [...existing];
      additions.forEach((paragraph) => {
        if (!merged.includes(paragraph)) merged.push(paragraph);
      });
      return {
        ...item,
        additional_paragraphs: merged,
      };
    });

    const counts = buildSpecCounts({
      foundations: augmentedFoundations,
      convergences: augmentedConvergences,
      mechanisms: Array.isArray(data.mechanisms) ? data.mechanisms : [],
      empirical_demonstrations: Array.isArray(data.empirical_demonstrations)
        ? data.empirical_demonstrations
        : [],
      challenges: Array.isArray(data.challenges) ? data.challenges : [],
      gaps: Array.isArray(data.gaps) ? data.gaps : [],
    });

    return {
      ...data,
      foundations: augmentedFoundations,
      convergences: augmentedConvergences,
      counts,
    };
  }

  function augmentWorks(data) {
    if (!data || !Array.isArray(data.works)) return data;

    const mergedWorks = [...data.works];
    const seenTitles = new Set(mergedWorks.map((work) => work.title));
    SUPPLEMENTAL_WORKS.forEach((work) => {
      if (!seenTitles.has(work.title)) {
        mergedWorks.push(work);
      }
    });

    const normalized = normalizeWorks(
      mergedWorks.map((work) => ({
        ...work,
        researcher: work.researcher || getResearcher(work),
      }))
    );

    return {
      as_of: data.as_of || "2026-04-08",
      ...normalized,
    };
  }

  async function loadLiveSpec() {
    const [foundations, convergences, mechanisms, empirical, gaps, rawChallenges] = await Promise.all([
      fetchLive("/v2_foundations?order=layer.asc,code.asc&select=code,layer,name,statement,derivation,epistemic_grade,scope_notes"),
      fetchLive(
        "/v2_convergences?order=code.asc&select=code,name,statement,independent_literatures,forces_mechanism,epistemic_grade,supporting_extractions"
      ),
      fetchLive(
        "/v2_mechanisms?order=tier.asc,code.asc&select=code,name,tier,description,eli5,phylogenetic_age,grade,resolution_conditions,mismatch_prediction,convergence_codes,source_researchers,proxy_gradient"
      ),
      fetchLive(
        "/v2_empirical_demonstrations?order=code.asc&select=code,name,what_it_demonstrates,primary_metric_display,metric_family,narrative,grounds_foundations,grounds_mechanisms"
      ),
      fetchLive("/v2_gaps?order=priority.desc,code.asc&select=code,name,priority,what_is_missing,why_it_matters,current_approach"),
      fetchLive(
        "/v2_extractions?source_type=eq.challenge&select=content,caveats,location,v2_works(title,authors,year,v2_researchers!primary_researcher_id(name))&order=id.asc"
      ),
    ]);

    const filteredGaps = gaps.filter((gap) => !["G10", "G12", "G13", "G14"].includes(gap.code));
    const snapshot = {
      as_of: "2026-04-08",
      counts: buildSpecCounts({
        foundations,
        convergences,
        mechanisms,
        empirical_demonstrations: empirical,
        challenges: normalizeChallenges(rawChallenges),
        gaps: filteredGaps,
      }),
      foundations,
      convergences: convergences.map((item) => ({
        ...item,
        supporting_extractions_count: Array.isArray(item.supporting_extractions)
          ? item.supporting_extractions.length
          : 0,
      })),
      mechanisms,
      empirical_demonstrations: empirical,
      challenges: normalizeChallenges(rawChallenges),
      gaps: filteredGaps,
    };
    return snapshot;
  }

  async function loadLiveWorks() {
    const works = await fetchLive(
      "/v2_works?order=importance.asc,year.asc,title.asc&select=id,title,authors,year,importance,work_type,summary,why_included,in_physical_collection,primary_researcher_id,v2_researchers!primary_researcher_id(name,tier,sub_level)"
    );
    return {
      as_of: "2026-04-08",
      ...normalizeWorks(
        works.map((work) => ({
          ...work,
          researcher: getResearcher(work),
        }))
      ),
    };
  }

  async function loadLiveThinkers() {
    const [researchers, works] = await Promise.all([
      fetchLive(
        "/v2_researchers?order=tier.asc,sub_level.asc,name.asc&select=id,name,tier,sub_level,spec_role,institution,what_we_take,what_we_dont_take"
      ),
      fetchLive("/v2_works?order=importance.asc,year.asc,title.asc&select=title,year,importance,primary_researcher_id"),
    ]);

    const worksByResearcher = works.reduce((acc, work) => {
      if (!work.primary_researcher_id) return acc;
      if (!acc[work.primary_researcher_id]) acc[work.primary_researcher_id] = [];
      acc[work.primary_researcher_id].push(work);
      return acc;
    }, {});

    return {
      as_of: "2026-04-08",
      counts: researchers.reduce(
        (acc, researcher) => {
          acc.total += 1;
          acc[researcher.tier] = (acc[researcher.tier] || 0) + 1;
          return acc;
        },
        { total: 0, foundational: 0, empirical: 0, adjacent: 0 }
      ),
      researchers: researchers.map((researcher) => ({
        ...researcher,
        works: worksByResearcher[researcher.id] || [],
      })),
    };
  }

  async function loadLiveHome() {
    const [foundations, mechanisms, works, researchers, applicationsCount, foundationalResearchers] = await Promise.all([
      fetchCount("/v2_foundations?select=code"),
      fetchCount("/v2_mechanisms?select=code"),
      fetchCount("/v2_works?select=id"),
      fetchCount("/v2_researchers?select=id"),
      fetchCount("/v2_applications?select=id"),
      fetchLive("/v2_researchers?tier=eq.foundational&order=sub_level.asc,name.asc&select=id,name,tier,sub_level"),
    ]);

    return {
      publicState: {
        as_of: "live",
        counts: {
          foundations,
          mechanisms,
          works,
          researchers,
        },
        breakdowns: {
          extractions: {},
        },
      },
      thinkers: {
        as_of: "live",
        counts: {
          total: researchers,
          foundational: foundationalResearchers.length,
        },
        researchers: foundationalResearchers,
      },
      // Keep the authored home cards as the canonical presentation for now.
      // The live applications table is not yet text-parity with the revised
      // homepage copy and anchors, so we sync the count live without replacing
      // the corrected baked cards.
      applications: {
        count: applicationsCount,
      },
    };
  }

  async function loadHomeSnapshot() {
    const [publicState, thinkers, applications] = await Promise.all([
      fetchSnapshot("/data/public-state.json"),
      fetchSnapshot("/data/thinkers-snapshot.json"),
      fetchSnapshot("/data/applications-snapshot.json"),
    ]);

    return {
      publicState,
      thinkers,
      applications,
    };
  }

  function renderHome(data) {
    const foundational = (data.thinkers.researchers || []).filter((item) => item.tier === "foundational");
    const attrRoot = $("#attr-names");
    if (attrRoot) {
      attrRoot.innerHTML = foundational
        .map(
          (researcher) =>
            `<a class="attr-name" href="/thinkers.html">${esc(researcher.name)}</a>`
        )
        .join("");
    }

    const attrMore = $("#attr-more");
    if (attrMore) {
      const extra = Math.max((data.thinkers.counts.total || 0) - foundational.length, 0);
      attrMore.textContent = `+ ${extra} more researchers across the evidence base`;
    }

    const statMap = {
      foundations: data.publicState.counts.foundations,
      mechanisms: data.publicState.counts.mechanisms,
      works: data.publicState.counts.works,
      primary_extractions: data.publicState.breakdowns.extractions.primary,
      researchers: data.publicState.counts.researchers,
    };

    $$("[data-home-stat]").forEach((node) => {
      const key = node.getAttribute("data-home-stat");
      if (!key || statMap[key] == null) return;
      node.textContent = String(statMap[key]);
    });

    const appCount = $("#app-count");
    if (appCount) {
      const count =
        data.applications?.count != null
          ? data.applications.count
          : (data.applications?.applications || []).length;
      appCount.textContent = String(count);
    }

    const appsRoot = $("#apps-list");
    if (appsRoot && Array.isArray(data.applications?.applications) && data.applications.applications.length) {
      appsRoot.innerHTML = (data.applications.applications || [])
        .map((app) => {
          const evaluation = Object.entries(app.evaluation_criteria || {})
            .map(
              ([key, value]) => `
                <div class="app-eval-q">${esc(key.replace(/_/g, " "))}</div>
                <div class="app-eval-a">${esc(value)}</div>
              `
            )
            .join("");

          const examples = (app.example_outputs || [])
            .map((example) => `<li>${esc(example)}</li>`)
            .join("");

          return `
            <article class="app-card">
              <div class="app-label">Application <span class="app-code">${esc(app.code)}</span></div>
              <h3 class="app-name">${esc(app.name)}</h3>
              <p class="app-desc">${esc(app.description)}</p>
              <div class="app-chips">
                ${(app.relevant_foundations || [])
                  .map((code) => `<span class="chip">${esc(code)}</span>`)
                  .join("")}
                ${(app.relevant_mechanisms || [])
                  .map(
                    (code) =>
                      `<span class="chip" style="color:var(--amber);border-color:rgba(193,122,47,0.26)">${esc(
                        code
                      )}</span>`
                  )
                  .join("")}
              </div>
              ${
                evaluation
                  ? `<div class="app-eval"><details><summary>Evaluation criteria</summary><div class="app-eval-grid">${evaluation}</div></details></div>`
                  : ""
              }
              ${
                examples
                  ? `<div class="app-examples"><strong>Example outputs</strong><ul>${examples}</ul></div>`
                  : ""
              }
            </article>
          `;
        })
        .join("");
    }
  }

  function renderSpec(data, source) {
    renderStatus($("#data-status"), source, data.as_of);

    const counts = data.counts || buildSpecCounts(data);
    const kpis = $("#spec-kpis");
    if (kpis) {
      kpis.innerHTML = `
        <div class="kpi"><span class="kpi-value">${esc(counts.foundations)}</span><span class="kpi-label">Foundations</span></div>
        <div class="kpi"><span class="kpi-value">${esc(counts.convergences)}</span><span class="kpi-label">Convergences</span></div>
        <div class="kpi"><span class="kpi-value">${esc(counts.mechanisms)}</span><span class="kpi-label">Mechanisms</span></div>
        <div class="kpi"><span class="kpi-value">${esc(counts.empirical_demonstrations)}</span><span class="kpi-label">Empirical demonstrations</span></div>
        <div class="kpi"><span class="kpi-value">${esc(counts.challenges)}</span><span class="kpi-label">Challenges</span></div>
        <div class="kpi"><span class="kpi-value">${esc(counts.gaps)}</span><span class="kpi-label">Public gaps</span></div>
      `;
    }

    const foundationRoot = $("#spec-foundations");
    if (foundationRoot) {
      const layerOrder = ["frame", "premise", "property", "consequence"];
      const layerLabel = {
        frame: "Ontological Frame",
        premise: "Premises",
        property: "Derived Properties",
        consequence: "Derived Consequences",
      };
      const groups = groupBy(data.foundations, "layer");
      foundationRoot.innerHTML = layerOrder
        .filter((layer) => groups[layer])
        .map((layer) => {
          return `
            <section class="layer-group">
              <div class="layer-label">${esc(layerLabel[layer])}</div>
              <div class="foundation-grid">
                ${groups[layer]
                  .map(
                    (item) => `
                  <article class="foundation-card">
                    <header>
                      <strong>${esc(item.name)}</strong>
                      <span class="code-badge">${esc(item.code)}</span>
                    </header>
                    <p>${esc(item.statement)}</p>
                    <div class="mechanism-meta">
                      <span class="chip">${esc(item.epistemic_grade)}</span>
                      <span class="chip">${esc(item.layer)}</span>
                    </div>
                    ${
                      item.derivation
                        ? `<p><strong>Derivation:</strong> ${esc(item.derivation)}</p>`
                        : ""
                    }
                    ${
                      item.scope_notes
                        ? `<p><strong>Scope:</strong> ${esc(item.scope_notes)}</p>`
                        : ""
                    }
                    ${
                      Array.isArray(item.additional_paragraphs) && item.additional_paragraphs.length
                        ? item.additional_paragraphs
                            .map((paragraph) => `<p>${esc(paragraph)}</p>`)
                            .join("")
                        : ""
                    }
                  </article>
                `
                  )
                  .join("")}
              </div>
            </section>
          `;
        })
        .join("");
    }

    const convergenceRoot = $("#spec-convergences");
    if (convergenceRoot) {
      convergenceRoot.innerHTML = data.convergences
        .map(
          (item) => `
          <article class="convergence-card">
            <header>
              <strong>${esc(item.name)}</strong>
              <span class="code-badge">${esc(item.code)}</span>
            </header>
            <p>${esc(item.statement)}</p>
            <div class="mechanism-meta">
              <span class="chip">${esc(item.epistemic_grade)}</span>
              ${
                item.forces_mechanism
                  ? `<span class="chip">Forces ${esc(item.forces_mechanism)}</span>`
                  : ""
              }
              <span class="chip">${esc(item.supporting_extractions_count || 0)} supporting extractions</span>
            </div>
            ${
              Array.isArray(item.independent_literatures) && item.independent_literatures.length
                ? `<p><strong>Independent literatures:</strong> ${esc(item.independent_literatures.join(" | "))}</p>`
                : ""
            }
            ${
              Array.isArray(item.additional_paragraphs) && item.additional_paragraphs.length
                ? item.additional_paragraphs
                    .map((paragraph) => `<p>${esc(paragraph)}</p>`)
                    .join("")
                : ""
            }
          </article>
        `
        )
        .join("");
    }

    const mechanismRoot = $("#spec-mechanisms");
    if (mechanismRoot) {
      const tierMeta = {
        1: "Tier 1: oldest defensive and motivational systems",
        2: "Tier 2: social coordination and regulation systems",
        3: "Tier 3: regulatory input channels",
      };
      const groups = groupBy(data.mechanisms, "tier");
      mechanismRoot.innerHTML = Object.keys(groups)
        .sort((a, b) => Number(a) - Number(b))
        .map(
          (tier) => `
          <section class="layer-group">
            <div class="layer-label">${esc(tierMeta[tier] || `Tier ${tier}`)}</div>
            <div class="mechanism-grid">
              ${groups[tier]
                .map(
                  (item) => `
                <article class="mechanism-card">
                  <header>
                    <strong>${esc(item.name)}</strong>
                    <span class="code-badge">${esc(item.code)}</span>
                  </header>
                  <p>${esc(item.description || item.eli5 || "")}</p>
                  <p><strong>Resolution:</strong> ${esc(item.resolution_conditions || "Not recorded.")}</p>
                  <p><strong>Mismatch:</strong> ${esc(item.mismatch_prediction || "Not recorded.")}</p>
                  <div class="mechanism-meta">
                    <span class="chip">Tier ${esc(item.tier)}</span>
                    <span class="chip">${esc(item.grade || "graded")}</span>
                    ${
                      item.phylogenetic_age ? `<span class="chip">${esc(item.phylogenetic_age)}</span>` : ""
                    }
                  </div>
                </article>
              `
                )
                .join("")}
            </div>
          </section>
        `
        )
        .join("");
    }

    const demoRoot = $("#spec-demos");
    if (demoRoot) {
      demoRoot.innerHTML = data.empirical_demonstrations
        .map(
          (item) => `
          <article class="demo-card">
            <header>
              <strong>${esc(item.name)}</strong>
              <span class="code-badge">${esc(item.code)}</span>
            </header>
            <p>${esc(item.what_it_demonstrates)}</p>
            <p><strong>Primary metric:</strong> ${esc(item.primary_metric_display || "Not recorded")}</p>
            ${
              item.metric_family ? `<p><strong>Metric family:</strong> ${esc(item.metric_family)}</p>` : ""
            }
          </article>
        `
        )
        .join("");
    }

    const challengeRoot = $("#spec-challenges");
    if (challengeRoot) {
      challengeRoot.innerHTML = data.challenges
        .map(
          (item) => `
          <article class="challenge-card">
            <header>
              <strong>${esc(item.source)}</strong>
              <span class="importance-badge">${esc(item.year || "n.d.")}</span>
            </header>
            ${
              item.title ? `<p><strong>${esc(item.title)}</strong></p>` : ""
            }
            <p>${esc(item.content)}</p>
            ${
              item.caveats ? `<p><strong>Caveat:</strong> ${esc(item.caveats)}</p>` : ""
            }
          </article>
        `
        )
        .join("");
    }

    const gapRoot = $("#spec-gaps");
    if (gapRoot) {
      gapRoot.innerHTML = data.gaps
        .map(
          (item) => `
          <article class="gap-card">
            <header>
              <strong>${esc(item.name)}</strong>
              <span class="priority-badge">${esc(item.priority)}</span>
            </header>
            <p><strong>${esc(item.code)}</strong></p>
            <p><strong>What is missing:</strong> ${esc(item.what_is_missing)}</p>
            <p><strong>Why it matters:</strong> ${esc(item.why_it_matters)}</p>
            <p><strong>Current approach:</strong> ${esc(item.current_approach)}</p>
          </article>
        `
        )
        .join("");
    }
  }

  function renderWorks(data, source) {
    renderStatus($("#data-status"), source, data.as_of);

    const summary = $("#works-summary");
    if (summary) {
      summary.textContent = `${data.counts.total} current public works: ${data.counts.pillar} pillar, ${data.counts.key} key, ${data.counts.supporting} supporting.`;
    }

    const buttons = $$(".filter-button[data-importance]");
    const listRoot = $("#works-list");
    if (!listRoot) return;

    function renderList(filter) {
      buttons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.importance === filter);
      });
      const items = filter === "all" ? data.works : data.works.filter((work) => work.importance === filter);
      listRoot.innerHTML = items
        .map((work) => {
          const researcher = work.researcher || {};
          return `
            <article class="work-card">
              <header>
                <strong>${esc(work.title)}</strong>
                <span class="importance-badge">${esc(work.importance)}</span>
              </header>
              <p class="work-meta">
                <span class="chip">${esc(work.year || "n.d.")}</span>
                <span class="chip">${esc(work.authors || "Unknown authors")}</span>
                ${
                  researcher.name ? `<span class="chip">${esc(researcher.name)}</span>` : ""
                }
                ${
                  work.work_type ? `<span class="chip">${esc(work.work_type)}</span>` : ""
                }
              </p>
              ${
                work.why_included ? `<p><strong>Why it is load-bearing:</strong> ${esc(work.why_included)}</p>` : ""
              }
              ${work.summary ? `<p>${esc(work.summary)}</p>` : ""}
            </article>
          `;
        })
        .join("");
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => renderList(button.dataset.importance));
    });

    renderList("pillar");
  }

  function initials(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function renderThinkers(data, source) {
    renderStatus($("#data-status"), source, data.as_of);

    const summary = $("#thinkers-summary");
    if (summary) {
      summary.textContent = `${data.counts.total} researchers: ${data.counts.foundational} foundational, ${data.counts.empirical} empirical, ${data.counts.adjacent} adjacent.`;
    }

    const root = $("#thinkers-list");
    const buttons = $$(".filter-button[data-tier]");
    if (!root) return;

    function renderList(filter) {
      buttons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.tier === filter);
      });
      const order = ["foundational", "empirical", "adjacent"];
      const groups = groupBy(
        filter === "all" ? data.researchers : data.researchers.filter((item) => item.tier === filter),
        "tier"
      );
      root.innerHTML = order
        .filter((tier) => groups[tier] && groups[tier].length)
        .map(
          (tier) => `
          <section class="thinker-section">
            <div class="layer-label">${esc(tier)}</div>
            <div class="thinker-grid">
              ${groups[tier]
                .map(
                  (researcher) => `
                <article class="thinker-card">
                  <div class="thinker-head">
                    ${
                      researcher.portrait
                        ? `<img class="thinker-photo" src="${esc(researcher.portrait)}" alt="${esc(
                            researcher.name
                          )}" loading="lazy">`
                        : `<div class="thinker-avatar" aria-hidden="true">${esc(initials(researcher.name))}</div>`
                    }
                    <div>
                      <header>
                        <strong>${esc(researcher.name)}</strong>
                        <span class="tier-badge">${esc(researcher.tier)}</span>
                      </header>
                      ${
                        researcher.spec_role ? `<p>${esc(researcher.spec_role)}</p>` : ""
                      }
                      <div class="thinker-meta">
                        ${
                          researcher.sub_level
                            ? `<span class="chip">Level ${esc(researcher.sub_level)}</span>`
                            : ""
                        }
                        ${
                          researcher.institution ? `<span class="chip">${esc(researcher.institution)}</span>` : ""
                        }
                      </div>
                    </div>
                  </div>
                  ${
                    researcher.what_we_take
                      ? `<p><strong>What Cor takes:</strong> ${esc(researcher.what_we_take)}</p>`
                      : ""
                  }
                  ${
                    researcher.what_we_dont_take
                      ? `<p><strong>What Cor does not take:</strong> ${esc(researcher.what_we_dont_take)}</p>`
                      : ""
                  }
                  ${
                    Array.isArray(researcher.works) && researcher.works.length
                      ? `<p><strong>Key works:</strong> ${esc(
                          researcher.works
                            .slice(0, 3)
                            .map((work) => work.title)
                            .join(" | ")
                        )}</p>`
                      : ""
                  }
                </article>
              `
                )
                .join("")}
            </div>
          </section>
        `
        )
        .join("");
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => renderList(button.dataset.tier));
    });

    renderList("all");
  }

  async function boot() {
    if (page === "home") {
      try {
        const data = await loadLiveHome();
        renderHome(data);
      } catch (error) {
        try {
          const snapshot = await loadHomeSnapshot();
          renderHome(snapshot);
        } catch (snapshotError) {
          // Keep the baked homepage content visible if both live and snapshot hydration fail.
        }
      }
    }

    if (page === "atlas") {
      const result = await withSnapshot(loadLiveSpec, "/data/spec-snapshot.json");
      if (result.source === "error") {
        renderFatal([
          "#spec-foundations",
          "#spec-convergences",
          "#spec-mechanisms",
          "#spec-demos",
          "#spec-challenges",
          "#spec-gaps",
        ]);
        return;
      }
      renderSpec(augmentSpec(result.data), result.source);
    }

    if (page === "works") {
      const result = await withSnapshot(loadLiveWorks, "/data/works-snapshot.json");
      if (result.source === "error") {
        renderFatal(["#works-list"]);
        return;
      }
      renderWorks(augmentWorks(result.data), result.source);
    }

    if (page === "thinkers") {
      const result = await withSnapshot(loadLiveThinkers, "/data/thinkers-snapshot.json");
      if (result.source === "error") {
        renderFatal(["#thinkers-list"]);
        return;
      }
      renderThinkers(result.data, result.source);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
