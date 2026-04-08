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
      snapshotDate || "2026-04-07"
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
      as_of: "2026-04-07",
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
      as_of: "2026-04-07",
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
      as_of: "2026-04-07",
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
      appCount.textContent = String((data.applications.applications || []).length);
    }

    const appsRoot = $("#apps-list");
    if (appsRoot) {
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
        const data = await loadHomeSnapshot();
        renderHome(data);
      } catch (error) {
        // Keep the baked homepage content visible if local snapshot hydration fails.
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
      renderSpec(result.data, result.source);
    }

    if (page === "works") {
      const result = await withSnapshot(loadLiveWorks, "/data/works-snapshot.json");
      if (result.source === "error") {
        renderFatal(["#works-list"]);
        return;
      }
      renderWorks(result.data, result.source);
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
