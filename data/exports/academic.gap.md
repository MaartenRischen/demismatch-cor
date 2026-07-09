## The Gap - the matched environment vs the modern default

Cor is a mismatch framework; this is its quantitative edge. For each mechanism we record what the ancestral environment delivered (the EEA baseline), what the modern environment delivers (the modern default), and the delta (the gap). These are *contested measured numbers*, not derived spec - read them with the grade and contested flag in view.

> This section holds EEA numbers NEXT TO the spec, not inside it: each parameter is a mechanism's resolution baseline + the modern default + the gap between them. Grades are inherited from the evidence and reuse Cor's own vocabulary. 'replicated' appears only twice. Mismatch interpretations are capped at 'theoretical' (the honesty floor); the original-affluent-society work-hours debate is 'contested' with no number asserted; most of information_environment is held out. Exact figures from single forager populations are ILLUSTRATIVE, NOT CONSTANTS.

**32 parameters across 8 domains** (grades: theoretical 16, thin 5, contested 4, clinical 3, replicated 2, longitudinal 2; 8 carry a contested flag).
**Grade legend.**

- **replicated** (2): multiple independent full-text studies converge
- **longitudinal** (2): anchored in a longitudinal / large-N study
- **clinical** (3): controlled human / clinical evidence
- **thin** (5): sparse / single-source evidence
- **theoretical** (16): mechanism-derived; the EEA-mismatch interpretation is capped here (the honesty floor)
- **contested** (4): actively disputed evidence

### Social structure

#### Social network layers (~5/15/50/150)
`EEA-SOC-01 · Social structure` — **grade: replicated**

**EEA baseline.** The ancestral social world was structured as a series of hierarchically inclusive, nested relationship layers, each roughly three times the size of the one inside it: an innermost support clique of ~5 close confidants who provided emotional and physical support, a sympathy group of ~15 (people whose loss would be deeply felt, contacted at least monthly), an affinity/band layer of ~50 (the typical overnight foraging camp of casual-but-close associates), and an active personal network of ~150 (the clan/tribal layer, the outer ceiling of stable, individually-known relationships). Each layer carried a qualitatively different grade of intimacy, obligation, and contact frequency, with the heaviest investment concentrated in the inner ~5-15. The ~150 ceiling tracks human neocortical information-processing capacity: extrapolating the primate neocortex-ratio-to-group-size relationship predicts a human group size of ~148, matching the mean of ~153 found across the tribal/clan census societies for which data exist. This was the full architecture within which status was monitored and alliances tracked: a personally-known reference group bounded at ~150, not an anonymous mass.

**EEA value** (illustrative, not constants):

  - unit: individuals
  - layer_sizes: {"affinity_band": 50, "active_network": 150, "support_clique": 5, "sympathy_group": 15}
  - ceiling_range: [148, 153]
  - outer_ceiling: 150
  - scaling_factor: 3
  - tribal_clan_mean_observed: 153
  - neocortex_predicted_group_size: 148

**Modern default.** The modern environment delivers a radically inverted network shape: nominal friend/follower counts in the hundreds or thousands that vastly exceed the ~150 cognitive ceiling, while the layers that actually carry support and intimacy stay capacity-bounded. Online networks reproduce the same ~5/15 inner structure when genuine ties are measured (support clique ~4, sympathy group ~14, statistically indistinguishable from offline values), and mean platform friend counts hover near ~150-180, but the bulk of nominal connections are inactive labels rather than relationships (only ~27.6% of online 'friends' are reported as genuine). Inner-layer bonds decay back toward mere acquaintance without the face-to-face contact the architecture was built to expect; mediated contact slows but does not substitute for it. The result is a wide, shallow periphery of weak or fictive ties layered on top of a core that the larger network does not, and cannot, enlarge.

**The gap.** The mismatch is not in the inner-layer capacities themselves (still ~5/15/50/150, not technologically expandable) but between the number of ties the modern environment presents (hundreds to thousands of nominal contacts) and the number the brain can actually monitor and invest in (~150, with real support concentrated in the inner ~5-15). People with unusually large networks do not gain more close friends; they accumulate weakly-defined acquaintances. Status monitoring (M5) and alliance/reputation tracking (M11), evolved for a ~150 personally-known reference group, are now flooded by reference groups orders of magnitude larger and largely composed of strangers, while the trust-bearing inner layers remain capped and are under-fed when face-to-face contact is displaced.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding, M5 - Status Monitoring

**Evidence (10 links):**

- ext#404 · replicated · primary: "The innermost group consists of about three to five people."
- ext#490 · replicated · primary: "the various human groups that can be identified in any society seem to cluster rather tightly around a series of values (5, 12, 35, 150, 500, and 2,000) with virtually no overlap in the variance around these characteristic values."
- ext#25 · replicated · primary: "for the twenty-odd tribal societies where census data are available, these clan groups turn out to have a mean size of 153"
- ext#483 · cross_species · supporting: "Group size is found to be a function of relative neocortical volume, but the ecological variables are not. This is interpreted as evidence in favour of the social intellect theory and against the ecological theories."
- ext#485 · cross_species · supporting: "the number of neocortical neurons limits the organism's information-processing capacity and that this then limits the number of relationships that an individual can monitor simultaneously."
- (+5 more linked extraction(s))

*Confidence note: This is the one social_structure parameter genuinely full-text-grounded in Cor (Dunbar tradition). The nested ~5/15/50/150 layers, ~3x scaling, and ~150 ceiling are backed by multiple full-text extractions: 404 (Dunbar book, in_physical_collection) and 490 (Social Brain Hypothesis, verbatim Fig.7 quote) for layer structure; 25 (Dunbar book) for the ~150 ceiling and ethnographic mean clan 153; 483/484/485 (Neocortex 1992, cross-species regression, predicted ~148, r2=0.764) for the cognitive basis; 26 (org-theory 150 threshold). Modern replication of the same architecture and its decay is grounded in genuinely open-access full text (506/507/508/509, Dunbar et al. 2016 R. Soc. Open Sci., DOI 10.1098/rsos.150292, PMC4736918). DELIBERATELY DROPPED as evidence: extractions 502 and 505 (work 72), both flagged 'Abstract-limited' (502: 'extraction from abstract and citing sources'); they are not full-text reads and must not back a replicated grade - 502 is redundant with full-text 404/490, and the 505-only 'trust = time invested' clause was softened in the prose. eea_value.ceiling_range [148,153] is an honest min/max of two reported central tendencies (148 neocortex-predicted; 153 ethnographic mean), not a hard interval or constant; exact integers vary by source (12/35 vs 15/50) and are central tendencies. M5 link is fixed by the locked architecture (the ~150 personally-known reference group is the substrate for status monitoring); cited extractions are tagged M3/M11, with M5 not separately evidenced.*

#### Lifetime known-individual ceiling (~1,000)
`EEA-SOC-02 · Social structure` — **grade: theoretical** · **CONTESTED**

**EEA baseline.** Across a foraging lifetime an individual accumulated a bounded pool of personally known others - people met face-to-face, named, placed in a kin/alliance/reputation map, and remembered. Estimates put this cumulative lifetime roster at roughly 1,000+ distinct individuals (Hill et al. 2014, Hadza/Ache), an order of magnitude above the ~150 actively-maintained network the social brain tracks concurrently. This pool was not a single contemporaneous group: it accreted over decades through camp reshuffling, regional fission-fusion, and durable cross-camp partnerships (e.g. Ju/'hoansi hxaro). Crucially it was finite, slowly-growing, and fully reputation-indexed: nearly everyone one would ever encounter was either already known or one or two reciprocal links away, and almost no one was a true anonymous stranger. The cognitive machinery for naming, tracking reputation, and gauging trust was calibrated to a lifetime ceiling on this order, with the ~150 active-network limit (Dunbar) operating as the concurrent sub-ceiling within it.

**EEA value** (illustrative, not constants):

  - note: The ~1000+ lifetime figure is now FULL-TEXT-VERIFIED against its primary, Hill et al. 2014 PLoS ONE (added to Cor 2026-06-09): a forager 'social universe of about a thousand individuals'; lifetime pool of individually-known interactants 'clearly more than 1,000'. It remains a SINGLE-study, model-based estimate on two forager populations (Ache, Hadza) plus a cited San corroboration — illustrative, not a constant. The ~150 concurrent ceiling and nested 5/15/50/150 layers are separately full-text-grounded/replicated (SOC-01).
  - active_network_layers: [5, 15, 50, 150]
  - concurrent_active_network_ceiling: 150
  - lifetime_distinct_known_individuals: ~1000+

**Modern default.** A networked individual is exposed to vastly more than 1,000 distinct identities - thousands of nominal "friends"/followers plus a near-unbounded daily stream of strangers (crowds, feeds, comment sections, customer interactions). Nominal contact counts routinely run into the thousands while the genuinely-tracked inner network stays pinned near the same ~150, and only ~27.6% of those nominal ties register as genuine close friends. The result is a permanent flood of identities the reputation-tracking and trust-calibration system was never built to index: most are anonymous, non-reciprocal, never re-encountered, and carry no durable reputation, so they neither enter the lifetime roster nor decay out of it normally - they simply accumulate as un-indexable noise. The pool of actually-known, reputation-bearing people is no larger than ancestrally, but it is now embedded in an environment of effectively infinite strangers.

**The gap.** EEA delivered a finite, slowly-accreting lifetime roster (~1,000+) in which virtually every encountered person was known or one reciprocal link away and carried trackable reputation; modernity delivers an unbounded firehose of identities, the overwhelming majority anonymous, non-reciprocal, and reputation-less. The mismatch is not in the size of the maintainable network (still ~150) but in the ratio of known-to-unknown: a system tuned to "almost everyone you meet is someone you can place" now operates where almost everyone you meet is someone you cannot. This chronically engages strangers as ambient novelty/threat (threat-management framing) and starves the cooperation/reputation system (M11) of the direct, repeated, reciprocal observability it evolved to run on, while the cumulative roster of genuinely-known people fails to grow despite massive nominal connection.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding

**Evidence (9 links):**

- ext#502 · replicated · supporting: "Each layer increases relationship numbers by an approximate multiple of 3 (5-15-50-150) but decreasing levels of intimacy (strong, medium, and weak ties) and frequency of interaction."
- ext#404 · replicated · supporting: "The innermost group consists of about three to five people."
- ext#25 · replicated · supporting: "for the twenty-odd tribal societies where census data are available, these clan groups turn out to have a mean size of 153"
- ext#490 · replicated · supporting: "the various human groups that can be identified in any society seem to cluster rather tightly around a series of values (5, 12, 35, 150, 500, and 2,000) with virtually no overlap in the variance around these characteristic values."
- ext#508 · theoretical · challenging: "On average, respondents in Sample 1 considered that only 27.6% of their Facebook friends could be considered 'genuine' (i.e. close) friends, with a strong modal value between 0 and 10%."
- (+4 more linked extraction(s))

*Confidence note: GROUNDED 2026-06-09: the defining ~1,000 lifetime-known-individual figure is now full-text-verified against its actual primary, Hill et al. 2014 PLoS ONE (work added this pass; ext H1-H3) - 'social universe of about a thousand individuals' and a lifetime pool 'clearly more than 1,000', which Hill explicitly contrasts with the ~150 'Dunbar number' (attributed to primate brain/group-size regressions). This replaces the prior web/recall, full-text-pending sourcing. Grade set to 'theoretical' (the EEA-mismatch floor): it is a SINGLE study with model-based estimates (yearly interaction rates x life tables, Table S16) on two forager populations, not a multi-study replicated convergence, and the 'lifetime roster conserved while modern stranger-exposure explodes' framing is a mismatch interpretation (capped at theoretical per the hard rule). contested=true retained: EEA-representativeness of Ache/Hadza is genuinely debated and the figure is a single-population model estimate - treat ~1,000 as illustrative. The adjacent ~150 concurrent ceiling / 5-15-50-150 layers remain separately replicated under SOC-01.*

#### Band / camp size (a few dozen adults; ~25-50)
`EEA-SOC-03 · Social structure` — **grade: thin** · **CONTESTED**

**EEA baseline.** Ancestral humans lived in small, residentially co-present foraging bands (camps): a single overnight camp typically held on the order of a few dozen adults - roughly 25 to 50, with central estimates clustering near ~28-35 - a scale that sits within the Dunbar 'band' layer (~35) and 'overnight camp' layer (~50) of the nested social network. At this scale every co-resident is a personally known, named individual whose behaviour can be directly observed and tracked over time. Band size was thus bounded well below the ~150 active-network ceiling, keeping the day-to-day social field small enough that cooperation, status, and bonding all operated face-to-face among mutually familiar people rather than among anonymous strangers.

**EEA value** (illustrative, not constants):

  - units: co-resident adults in a single band / overnight camp
  - source_status: Full-text-grounded values are the Dunbar layer magnitudes: band ~35 (ext 490, Dunbar 1998) and overnight camp ~50 (ext 404, Dunbar 2010). The 'reported_mean_adults_unverified' 28.2 and the 25-50 spread come from Hill et al. 2011 but are abstract/web-sourced and full-text-PENDING (R2 not satisfied); they carry NO extraction link and must not be treated as established.
  - adult_range_low: 25
  - adult_range_high: 50
  - dunbar_band_layer: 35
  - dunbar_overnight_camp_layer: 50
  - reported_mean_adults_unverified: 28.2

**Modern default.** Modern humans do not live in a single bounded, personally-known residential band. Daily life is partitioned across many large, partly anonymous groupings - workplaces, apartment buildings, transit systems, schools, and online networks - most of which exceed the ~25-50 face-to-face band scale and many of which exceed the ~150 ceiling entirely. A person routinely shares physical or digital space with hundreds or thousands of unfamiliar individuals while their actual co-regulating relationships shrink. The small, stable, fully-known co-resident group of a few dozen adults has no direct modern equivalent; its functions are split across institutions where most co-present others are strangers.

**The gap.** The ancestral social field was a small set of a few dozen (~25-50) personally-known adults sharing a camp, sitting within the band/overnight-camp Dunbar layer. The modern default replaces this with chronic immersion in groupings far larger than the band scale, dominated by unfamiliar people, while genuinely co-regulating relationships number far fewer than the band once held. The delta is a mismatch between the scale at which our cooperation, status-monitoring, and bonding machinery was calibrated (a bounded, fully-known band/camp of a few dozen adults) and the scale we actually inhabit (large, partly anonymous aggregations plus a thin set of disposable ties), so the band-sized layer that once carried daily social life is no longer delivered by any single modern structure.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding

**Evidence (3 links):**

- ext#490 · replicated · supporting: "the various human groups that can be identified in any society seem to cluster rather tightly around a series of values (5, 12, 35, 150, 500, and 2,000) with virtually no overlap in the variance around these characteristic values."
- ext#404 · replicated · supporting: "The innermost group consists of about three to five people."
- ext#603 · thin · primary: "The Hadza live in temporary camps that average about 30 individuals."

*Confidence note: Camp ~30 (range 25-50) now grounded in Smith et al. 2018 full text ("average about 30 individuals"); single Hadza population, cross-society range (Hill 2011 mean 28.2) still contested. contested=true.*

#### Within-camp kin fraction (low; campmates mostly unrelated)
`EEA-SOC-04 · Social structure` — **grade: thin**

**EEA baseline.** A person's residential camp/band was NOT a clan of close relatives. Across forager societies the typical residential group (~25-50 people, ~28 adults) was composed mostly of individuals to whom the focal person was not closely related: primary/first-order kin (parents, siblings, offspring) made up only a small minority of co-residents (illustratively under ~10%), and most campmates were unrelated or only distantly related. Because residence was bilocal/sex-egalitarian (couples lived with both the husband's and the wife's kin over time) and camps reshuffled frequently, genetic relatedness within a camp was low. The practical consequence: the durable social glue holding a camp together was NOT shared genes. The bonds that mattered, and that were conserved across the constant churn, were reciprocal, trust-based, reputation-tracked relationships between individuals who chose each other, not kin ties imposed by birth.

**EEA value** (illustrative, not constants):

  - source_caveat: figures are Hadza/forager web- and abstract-sourced (Hill et al. 2011 PMID 21393537; Dyble et al. 2015 PMID 25977553); both are real (DOI+PMID) but NOT in Cor and NOT full-text-verified in Cor (retrieval returned is_fulltext=false for each)
  - camp_size_total_range: [25, 50]
  - camp_size_adults_approx: 28
  - relatedness_qualitative: low; most campmates unrelated or distantly related
  - primary_kin_fraction_of_camp: <~0.10

**Modern default.** Modern social environments invert the ancestral pattern in two opposite directions at once. (1) The family one is biologically related to is now small, geographically dispersed, and often the ONLY kin one regularly co-resides with, so the kin one has are concentrated in a tiny stable household rather than diffused through a larger chosen group. (2) The larger groups one spends daily life inside (workplace, neighborhood, online networks, institutions) are composed of effectively unrelated strangers, but unlike the ancestral camp these groupings are NOT self-assembled through mutual choice, reciprocity, and reputation tracking; membership is assigned by employment, address, or platform. The result is that 'who you live and work among' is no longer the output of a relationship-selection process; it is administratively or commercially determined, and the unrelated people around you are frequently strangers you did not choose and do not reciprocally track.

**The gap.** The ancestral signal was: 'the group around me is mostly unrelated people I (or my band) actively chose and continuously vetted through reciprocity and reputation; kinship is not what holds us together, the relationships are.' The modern signal is degraded on the selection axis: the unrelated people around us are still mostly unrelated (that part matches), but they are assigned rather than chosen, and the reciprocity/reputation machinery that turned unrelated campmates into durable trusted allies is largely absent or shallow. Mechanisms M3 (bonding) and M11 (cooperation/alliance) evolved expecting that low kin-relatedness would be compensated by self-selected, reciprocal, reputation-anchored dyads. Modernity delivers the low relatedness WITHOUT the compensating chosen-and-vetted dyadic structure, so the mechanisms fire in a world of unrelated-but-also-unbonded co-residents, which is a key part of why being surrounded by people can still register as social isolation.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding

**Evidence (2 links):**

- ext#601 · thin · supporting: "first-order relatives make up less than 10% of residential camps"
- ext#605 · thin · primary: "Relatedness within camps is low with primary kin comprising, on average, 1.43 and 1.93 of men and women's campmates respectively."

*Confidence note: Low within-camp relatedness now grounded in two full-text primaries (Apicella 2012: "first-order relatives make up less than 10% of residential camps"; Smith 2018: primary kin 1.43/1.93 per camp). Both single-population / partly restating Hill 2011; kept thin.*

#### Membership turnover (camp dissolves and reconstitutes; ~12% repeated campmates year-over-year, ~88% annual turnover)
`EEA-SOC-05 · Social structure` — **grade: thin**

**EEA baseline.** The residential group (camp/band) was a fission-fusion structure that continuously dissolved and reconstituted rather than a fixed-membership unit. Among the best-studied foragers (Hadza), entire camps relocated roughly every 4-8 weeks and individuals reshuffled across camps such that only a minority of campmates carried over from one year to the next. The one full-text-verified figure is from a multi-year Hadza study (Smith et al. 2018, bioRxiv 313064): a mean proportion of repeated campmates of ~12.1%, implying ~88% annual turnover. Crucially, despite this high residential churn, assortment on cooperation persisted (cooperators clustered together across reshuffles), and what was conserved across the turnover was not the group but the durable, individually-tracked reciprocal relationships between specific people. Group composition was fluid; the dyadic ties were the stable substrate.

**EEA value** (illustrative, not constants):

  - source: Smith et al. 2018 (bioRxiv 313064), Hadza, full-text-read in Retrieve phase
  - not_yet_in_cor: True
  - unverified_secondary_note: A higher figure of ~21.9% repeated / ~78% turnover circulates in secondary references and the task brief, but the Smith 2018 full text does NOT report it (it states 12.1%). That number is mis-attributable to this source and is plausibly from Smith et al. 2016 (R. Soc. Open Sci. 3:160131); it is NOT used as a value here and must be separately verified before any use.
  - annual_turnover_proportion: 0.879
  - camp_relocation_interval_weeks: [4, 8]
  - repeated_campmates_proportion_per_year: 0.121

**Modern default.** Modern social environments invert the structure: the GROUP labels are stable and durable (a workplace, a school cohort, a neighborhood, a social-media platform or feed) while the actual dyadic relationships within them are shallow, interchangeable, and disposable. People remain nominal members of named, persistent groups for years, yet cycle through co-members with little individual reciprocal investment, and there is no institution analogous to a delayed-reciprocity partnership (e.g. hxaro) that conserves a specific bond once physical proximity ends. Relationships routinely lapse the moment shared context (job, class, proximity) is removed.

**The gap.** The ancestral and modern environments are inverted on which layer is stable. Ancestrally the GROUP churned (~88% of campmates turned over yearly) while the durable reciprocal DYAD was conserved across the churn; the relationship, not the group, was the unit that persisted. Modernity delivers the opposite: stable, durable group labels (workplace, cohort, feed) paired with shallow, disposable dyads and no mechanism (no hxaro-equivalent) for conserving a specific bond once proximity ends. The mismatch is not 'too much turnover' versus 'too little' - it is that turnover now lands on the relationships (which evolved to persist) instead of on group membership (which evolved to be fluid), leaving the co-regulating, reputation-tracking reciprocal dyad chronically unmet.

**Resolution unit.** The durable reciprocal dyad - a specific, individually-known partner with whom reciprocity, co-regulation, and reputation are tracked over years. What needs conserving across membership turnover is not the group or the amount of contact but the persistence of particular bonded relationships; the bond, not the band, is the conserved unit.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding

**Evidence (2 links):**

- ext#602 · longitudinal · primary: "Across the three intervals, the mean proportion of repeated campmates was 12.1%."
- ext#604 · thin · supporting: "Every 4-8 weeks entire camps shift location usually in response to resource availability."

*Confidence note: Turnover now grounded in Smith et al. 2018 full text: mean repeated campmates 12.1% (=> ~88% annual churn), camps shift every 4-8 weeks. CORRECTED from the brief's 21.9%/78% (that figure traces to Smith et al. 2016, a different paper). Single Hadza population; kept thin.*

#### Selection rule / "shuffle algorithm" (choice-driven; homophily + cooperation + reciprocity; kinship not main glue)
`EEA-SOC-06 · Social structure` — **grade: thin**

**EEA baseline.** Who you lived alongside was not assigned by birth or fixed institution but produced by an ongoing, choice-driven assortment process operating across frequent residential reshuffling. In Hadza camps this "algorithm" had recurring structure: (1) homophily - co-residence was more likely between people similar in age, height, weight, body fat, and handgrip strength; (2) strong reciprocity - naming was near-symmetric, with an ego roughly 37-51x (point ~44x) more likely to name an alter who named them; (3) cooperator assortment - cooperators clustered with cooperators, an association extending out to two degrees of separation in gift networks; plus transitivity and geographic decay. Crucially, kinship was NOT the main glue: people actively sorted on disposition and reciprocity, not primarily on relatedness. The output was a camp continually re-composed of preferred, reciprocating, similarly-cooperative partners.

**EEA value** (illustrative, not constants):

  - homophily_traits: ["age", "height", "weight", "body_fat", "handgrip_strength"]
  - kinship_is_primary_glue: False
  - reciprocity_naming_odds_multiplier: {"ci_95": [37.6, 51.4], "source": "Apicella et al 2012", "population": "Hadza", "illustrative": true, "point_estimate": 44.2}
  - cooperator_assortment_degrees_of_separation: 2

**Modern default.** Group membership is overwhelmingly assigned rather than self-assorted: workplaces, school classes, residential buildings, and algorithmically-curated feeds place you among people you did not choose and who did not choose you. Where modern matching exists (dating apps, professional networks, recommender feeds), the optimization target is engagement, novelty, or proximity-of-the-moment - not durable mutual reciprocity, demonstrated cooperativeness, or transitive trust within a personally-known group. The ancestral feedback loop (you preferentially co-reside with people who reciprocate your investment and who others vouch for, observed directly over time) is largely absent; assortment on cooperation is replaced by assortment on platform metrics or institutional convenience.

**The gap.** The EEA delivered a continuous, agency-rich sorting process that filtered one's immediate social world toward reciprocating, cooperative, vouched-for partners - kinship was secondary. The modern environment inverts this: membership in one's daily groups is mostly imposed (employer, building, algorithm), and the explicit matching systems that do exist optimize for engagement/novelty rather than reciprocity and demonstrated cooperation. The result is reduced control over WHO populates one's social field, weaker assortment on actual cooperativeness, and loss of the transitive-reputation signal that let ancestral humans cluster with trustworthy reciprocators out to two degrees. The mismatch is not "fewer people" but a broken selection rule: the inputs the ancestral algorithm ran on (mutual choice, observed reciprocity, cooperator reputation) are no longer the primary determinants of who one lives and works among.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding

**Evidence (3 links):**

- ext#598 · thin · primary: "An "ego" (the naming person) is 44.2 times (95% C.I. 37.6 to 51.4) more likely to name an "alter" (the named person) in the campmate network, and 14.3 times (95% C.I. 12.2 to 16.4) more likely to name an alter in the gift network, if the alter reciprocated the social tie by also naming the ego as a friend"
- ext#599 · thin · primary: "in both the campmate and gift networks, social ties are significantly more likely when two people are similar in age, height, weight, body fat, and handgrip strength."
- ext#600 · thin · supporting: "social distance appears to be as important as genetic relatedness and physical proximity in explaining assortativity in cooperation"

*Confidence note: Shuffle algorithm now grounded in Apicella 2012 full text: trait homophily, strong reciprocity (44.2x campmate / 14.3x gift), and social distance as important as genetic relatedness (kinship not the sole glue). Single Hadza population; kept thin.*

#### Relationship longevity & maintenance (decades-long durable dyads; ~27-yr co-survival ceiling; maintenance institutions like hxaro conserve bonds across distance)
`EEA-SOC-07 · Social structure` — **grade: thin**

**EEA baseline.** In ancestral foraging life the load-bearing social unit was the durable, reciprocal DYAD, not the group. Because groups continuously reshuffled (camps fissioned/fused on the order of every ~4-8 weeks, with the large majority of campmates turning over year-to-year), what was conserved across the churn was the relationship itself, sustained for decades by both face-to-face co-presence when proximity allowed AND by explicit maintenance institutions when it did not. Among the Ju/'hoansi, hxaro was a formal delayed-reciprocity gift-partnership system reported to begin in childhood, be kept for life, be inherited at death, and span dispersed bands up to ~200 km apart, with only a minority of a person's partners co-resident in the current camp, so a bond could persist even when the two partners were rarely or never in the same camp. Two adults who reached adulthood together could expect on the order of ~27 years of overlapping co-survival, and reciprocal alliances ran over that whole horizon. Trivers's conditions for the evolution of reciprocal altruism describe exactly this regime: a long lifetime, low dispersal, and repeated interaction with the same small set of individuals, so that an investment in a specific partner reliably paid back over time.

**EEA value** (illustrative, not constants):

  - _note: All numeric values are ILLUSTRATIVE and full-text-PENDING in Cor; NO extraction id is cited for any of them. The ~27-yr co-survival ceiling and the hxaro figures (childhood-onset, lifelong, inherited, <=200 km, ~18% co-resident) are attributed to Wiessner 2002 EHB 23:407-436, which is NOT in Cor and whose full text could NOT be obtained (retrieval is_fulltext=false, zero verbatim quotes; snippet figures rejected per R2). For turnover: the only retrieval-grounded figure is from Smith et al. bioRxiv 313064 (mean repeated campmates 12.1% => ~88% annual turnover; camps shift every ~4-8 weeks), which is itself NOT yet a Cor extraction; the ~78% lower bound of the range is web/recall-sourced and full-text-UNVERIFIED and must NOT be attributed to bioRxiv 313064. Treat the range edges as soft.
  - camp_reshuffle_interval_weeks: [4, 8]
  - hxaro_partner_max_distance_km: 200
  - co_survival_ceiling_years_approx: 27
  - annual_campmate_turnover_pct_approx: [78, 88]
  - hxaro_partners_in_own_camp_pct_approx: 18

**Modern default.** The modern environment inverts the ancestral pattern: it supplies stable GROUP labels (a workplace, a school cohort, a social-media feed, a city) while the dyads inside them are shallow and disposable, and there is no institutional equivalent of hxaro that conserves a specific bond once physical proximity ends. When two people stop sharing a context, the relationship is simply allowed to decay; nothing structurally obligates either party to keep servicing it. Empirically, friendships require recurring face-to-face contact to avoid sliding down through the network layers and eventually dropping out of the personal network entirely, and online media at best slows that decay rather than preventing it. Trust and bond depth track time invested in a relationship, and the maintenance cost (mainly time) scales roughly linearly with the number of relationships, so modern people spread thin investment across large, low-trust networks and let most ties lapse rather than maintaining a small set of partners across decades.

**The gap.** The ancestral environment conserved the relationship across changing groups; the modern environment conserves the group label and lets the relationships churn. The specific missing piece is a maintenance institution: the EEA had hxaro-type structures (formalized, inheritable, distance-spanning, lifelong delayed reciprocity) that actively preserved a named dyad even with little or no co-presence, whereas modernity has no hxaro-equivalent and instead relies on shared proximity/context as the only glue. When that proximity ends (job change, move, leaving school), the bond is not migrated to an institution that keeps it alive; it decays. The result is many stable-looking memberships sitting on top of disposable, shallow ties, with the durable decades-long reciprocal partnership that M3/M11 are calibrated to expect largely absent.

**Resolution unit.** The durable, spatially-dispersed reciprocal DYAD plus the maintenance institutions that conserve it across distance and time - i.e., a specific named partner whose bond is actively serviced (face-to-face when possible, and via hxaro-type delayed-reciprocity exchange when apart) so the relationship persists for decades and survives the reshuffling of any particular group. Conserved across the churn is the relationship, not the group; the resolution requires migrating a bond to an institution that keeps it alive once proximity ends, not merely accumulating more low-investment ties.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding

**Evidence (5 links):**

- ext#509 · theoretical · primary: "it may be that face-to-face meetings are required from time to time to prevent friendships, in particular, sliding down through the network layers and eventually slipping over the edge of the 150 layer into the category of acquaintances."
- ext#510 · theoretical · supporting: "social media may function mainly to prevent friendships decaying over time in the absence of opportunities for face-to-face contact."
- ext#503 · theoretical · supporting: "At each layer, the benefits are asymptotic but the costs of maintaining a relationship at that level (most obviously, the time that has to be invested in servicing it) are roughly linear with the number of relationships."
- ext#505 · theoretical · supporting: "psychologically, these trade-offs are related to the level of trust in a relationship, and that this is itself a function of the time invested in the relationship."
- ext#479 · theoretical · supporting: Trivers identifies conditions maximizing the chance reciprocal altruism will be selected for: (1) many altruistic situations in the lifetime of the altruists, (2) a given altruist repeatedly interacts with the same small set of individuals, and (3) pairs of altruists are exposed

*Confidence note: Mixed and honestly LOW. The headline EEA numbers for this parameter (~27-yr co-survival ceiling; hxaro childhood-onset, lifelong, inherited, <=200 km, ~18% co-resident) come from Wiessner 2002 (Evolution and Human Behavior 23:407-436, DOI 10.1016/S1090-5138(02)00096-X), which is NOT in Cor and whose full text could not be legitimately obtained (paywalled Elsevier; retrieval returned is_fulltext=false with zero verbatim quotes; snippet figures were rejected per R2). The turnover/reshuffle figures trace to Smith et al. (bioRxiv 313064: 12.1% repeated => ~88% turnover; camps shift every ~4-8 weeks), which is likewise not yet a Cor extraction; the ~78% lower bound is web/recall-sourced and full-text-unverified. So NO extraction id is cited for any specific ancestral number here; those values are flagged ILLUSTRATIVE / full-text-pending. The evidence that IS cited grounds only the general durability-and-maintenance logic and the modern-side decay, from genuine full-text-backed Cor extractions: 509 and 510 (Dunbar 2016, rsos.150292 - face-to-face contact required to prevent friendship decay; media only slows decay), 503 and 505 (Sutcliffe, Dunbar, Binder & Arrow 2012 - maintenance cost is time-linear; trust is a function of time invested), and 479 (Trivers 1971 - reciprocal altruism requires long lifetime, low dispersal, repeated interaction with the same small set; author_quote intentionally absent/None per its remediation, so no verbatim quote is attributed). Grade held at 'thin' because the parameter-defining ancestral figures are unverified and the cited extractions address the why/modern-half rather than the EEA co-survival/hxaro specifics. Not 'replicated' despite some cited extractions being individually replicated, because they do not converge on this parameter's ancestral claims.*

#### Novel-stranger frequency (rare, salient, often a threat)
`EEA-SOC-08 · Social structure` — **grade: theoretical**

**EEA baseline.** Social cognition operated over a bounded pool: a personally-known reference network capped near the ~150 Dunbar ceiling, nested in ~5/15/50/150 layers of decreasing intimacy, the outermost being the people one recognizes and interacts with across a year. Within that architecture almost every face encountered was already known, placed, and reputationally tracked. A genuinely novel stranger - an individual who could not be located anywhere in one's known network or in the known networks of one's allies - was therefore a comparatively rare event. Because the bounded pool had no slot for such a person, novelty itself was diagnostic: a never-before-seen individual could not be vouched for, had no shared reputational history, and could not be assumed to be bound by the local web of reciprocity and norm enforcement. Encounters with unplaceable strangers were thus both infrequent and highly salient, and the threat-management system (M1) treated unfamiliarity as a plausible danger cue to be resolved (placed, vouched-for, or avoided) rather than as a routine background condition. This is an inference from the bounded-pool architecture plus M1, not a directly measured ancestral rate.

**Modern default.** The contemporary environment delivers a near-continuous stream of novel, unplaceable faces: dense urban crowds, transit, commerce, and especially the feeds and follower graphs of online platforms expose a person to more unfamiliar individuals in a single day than an ancestral forager might meet in a lifetime. Unfamiliarity is the modal condition rather than the rare exception, so the diagnostic value of novelty collapses - a stranger is no longer informative about anything. Yet the same M1 machinery still treats unplaceable others as potential threats, now firing against a constant baseline it was never calibrated for, while the reputational and vouching scaffolding that once resolved a stranger encounter is largely absent.

**The gap.** The delta is one of base rate and resolvability. Ancestrally, novel strangers were rare, salient, and resolvable (place them in the known web, or treat unfamiliarity as an actionable threat signal); modernity inverts this to constant, non-diagnostic, unresolvable novelty. The threat-management system inherited from the rare-stranger regime cannot down-regulate to the new base rate: it either over-fires (chronic low-grade vigilance, stranger-directed wariness in crowds and online) or, where it habituates, leaves people transacting with a stream of others who carry none of the reputational accountability the system implicitly assumes. The conserved unit being eroded is not the count of strangers but the durable, reputationally-tracked dyad against which any new face used to be evaluated; once almost everyone is a stranger, the bounded-pool premise that made novelty meaningful no longer holds.

**Resolution unit.** The durable, reputationally-tracked reciprocal dyad: ancestrally every new face was evaluated against a finite web of known, vouched-for relationships, and it was that web of bonds - not the count of strangers per se - that gave novelty its diagnostic and protective meaning. The mismatch resolves only insofar as new encounters can be anchored back into durable, accountable relationships rather than left as anonymous one-off contacts.

**Serves mechanisms:** M1 - Threat Management, M3 - Social Bonding

**Evidence (2 links):**

- ext#490 · replicated · supporting: "the various human groups that can be identified in any society seem to cluster rather tightly around a series of values (5, 12, 35, 150, 500, and 2,000) with virtually no overlap in the variance around these characteristic values."
- ext#485 · cross_species · supporting: "the number of neocortical neurons limits the organism's information-processing capacity and that this then limits the number of relationships that an individual can monitor simultaneously."

*Confidence note: Pure inference: no Cor extraction and no full-text retrieval quote directly measures or states an ancestral novel-stranger frequency, so eea_value is null and the grade is theoretical. The premise the inference rests on - a bounded, personally-known reference pool capped near ~150 and nested in ~5/15/50/150 layers - IS full-text-grounded via Dunbar's social-brain work: extraction 490 (work 69, DOI 10.1002/(SICI)1520-6505(1998)6:5<178::AID-EVAN5>3.0.CO;2-8; R1 satisfied) on familiarity-based layer clustering, and extraction 485 (work 68, DOI 10.1016/0047-2484(92)90081-J; R1 satisfied) on the neocortical limit to simultaneously-monitorable relationships. Both are cited as SUPPORTING (premise), not primary, because they bound the known pool but do not themselves count strangers. The complementary M1 claim that unfamiliarity functions as an innate danger cue is most directly stated by Bowlby (Attachment and Loss Vol. 2), but that work (id 98) has no DOI/PMID, is not in the physical collection, and its extraction (574) records the book was not directly accessed and carries no verbatim quote (author_quote=None) - it fails R1 and R2 and is deliberately NOT cited; the stranger-as-threat link is full-text-pending. Tomasello extractions 238/250 on cooperation with 'in-group strangers' were considered and rejected as cutting against, not supporting, the rare-stranger-as-threat framing. Not contested as an inference within the framework; it is simply unmeasured.*

#### Behavioral observability / reputation visibility
`EEA-SOC-09 · Social structure` — **grade: theoretical**

**EEA baseline.** In a band/camp embedded in a personally-known reference group of roughly 150 individuals, virtually all of a person's relevant behavior was directly observable by, or rapidly transmitted through gossip to, people who knew them by name, knew their history, and would interact with them again for decades. Reputation was a shared, continuously-updated, distributed record: as Boehm puts it, "the band keeps a dossier on every individual, noting positive and negative points." Observability had teeth: those who deviated (theft, deception, stinginess, free-riding) were subject to gossip, ridicule, ostracism, and ultimately exclusion, and everyone knew this monitoring was constant, so it functioned as a deterrent and people exercised self-control accordingly. Because foraging was obligately collaborative, individuals had to continuously evaluate partners and track how they themselves were being evaluated. The net result: visibility was near-total, embodied, hard to fake over time, attached to a single durable identity, and backed by real consequences enforced by people one could not escape.

**EEA value** (illustrative, not constants):

  - identity: single durable identity, behavior history attached for life
  - observability: near-total within band/camp; rapid gossip diffusion across the ~150 layer
  - accountability: high: gossip, ridicule, ostracism, exclusion; non-exitable repeat interaction
  - reference_group_basis: personally-known, named, repeat-interaction reference group (Dunbar ceiling)
  - reputational_reference_group_persons: 150

**Modern default.** Most behavior now occurs among strangers or weak ties who do not know one's history and will never interact with one again, while the visibility that does exist is mediated, curated, and quantitatively inflated. On social platforms only ~27.6% of nominal "friends" are considered genuine close ties (with a strong modal value between 0 and 10%), so networks are padded with weakly-accountable acquaintances rather than people tracking one's actual conduct. Mediated contact cannot substitute for the embodied, face-to-face observation the bonding/reputation system evolved for: without periodic in-person contact, ties decay through the network layers into mere acquaintance regardless of online activity. Visibility is now selectively self-presented (gameable), fragmented across multiple personas and contexts, frequently pseudonymous or low-stakes, and policed (if at all) by distant institutions or algorithms rather than by named peers with whom one shares a future. Reputation is either absent (anonymity), sortable away (exit/blocking, fresh accounts), or captured by platform metrics that reward performance over honesty.

**The gap.** The ancestral environment delivered near-total, embodied, hard-to-fake, single-identity behavioral observability inside a ~150-person reference group whose members knew one's history and held real, inescapable enforcement power. The modern environment delivers visibility that is mediated, curated, gameable, fragmented across exitable contexts, padded with non-accountable weak ties, and largely stripped of peer-enforced consequences. The reputation-tracking machinery (M11) and status-position monitoring (M5) evolved to run on dense, durable, accountable observation now operate on thin, performative, low-accountability signals, producing both reputational impunity for defection among strangers and chronic exposure of curated personas to vast unfamiliar audiences with no reciprocal knowledge of the person behind them.

**Serves mechanisms:** M11 - Cooperation / Alliance, M5 - Status Monitoring

**Evidence (5 links):**

- ext#373 · replicated · primary: "In effect, the band keeps a dossier on every individual, noting positive and negative points. Group members exercise the right to take action if a deviant begins to intimidate other group members individually - or threatens the social equilibrium of the group or its very ability to function."
- ext#375 · replicated · primary: "those who have things of value but do not give are subject to social control through gossip, ridicule or ostracism."
- ext#239 · theoretical · supporting: "In the hypothesis of Tomasello et al. (2012), obligate collaborative foraging became an evolutionarily stable strategy for early humans because of two interrelated processes: interdependence and social selection. The first and most basic point is that humans began a lifestyle in which individuals could not procure their daily sustenance alone but instead were interdependent with others in their foraging activities - which meant that individuals needed to develop the skills and motivations to forage collaboratively or else starve. There was thus direct and immediate selective pressure for skills and motivations for joint collaborative activity (joint intentionality). The second point is that as a natural outcome of this interdependence, individuals began to make evaluative judgments about others as potential collaborative partners: they began to be socially selective, since choosing a poor partner meant less food. Cheaters and laggards were thus selected against, and bullies lost their power to bully."
- ext#508 · theoretical · challenging: "On average, respondents in Sample 1 considered that only 27.6% of their Facebook friends could be considered 'genuine' (i.e. close) friends, with a strong modal value between 0 and 10%."
- ext#509 · theoretical · challenging: "it may be that face-to-face meetings are required from time to time to prevent friendships, in particular, sliding down through the network layers and eventually slipping over the edge of the 150 layer into the category of acquaintances."

*Confidence note: EEA-baseline side is full-text-grounded and convergent across two works in Cor's physical collection: Boehm 1999 'Hierarchy in the Forest' (ext 373 'the band keeps a dossier on every individual, noting positive and negative points'; ext 375 gossip/ridicule/ostracism as enforcement; both graded 'replicated' in Cor) and Tomasello 2014 (ext 239, bidirectional evaluation of collaborative partners; verbatim full-text quote, M11/M5). The ~150 reputational reference-group ceiling is full-text-grounded in Cor via the Dunbar works. Modern-decay side is grounded in Dunbar 2016 (Royal Society Open Science 3:150292): ext 508 (only 27.6% of Facebook friends genuine, modal 0-10%) and ext 509 (face-to-face required to prevent friendship decay through the layers), both 'replicated'. Despite the individual extractions being 'replicated'-graded, the PARAMETER is graded 'theoretical' because the specific EEA-SOC-09 claim (ancestral observability near-total/embodied/high-accountability vs modern visibility mediated/gameable/low-accountability) is an interpretive mismatch synthesis, not a single replicated measured quantity, and the 'near-total observability' baseline is qualitative. Deliberately EXCLUDED: ext 506/507 (about layer SIZES and concurrent-interaction limits, not observability) and ext 480 (QUARANTINED, snippet-sourced). The camp-shuffle/hxaro specifics and the Apicella reciprocity figures failed full-text retrieval (R2) or belong to other parameters and are NOT linked here. contested=false: reputational monitoring in small-scale societies is ethnographically well-established and uncontested; only the modern-mismatch framing is interpretive, which the 'theoretical' grade already encodes.*


### Care & development

#### Alloparental care supply (a village, not a dyad)
`EEA-CARE-01 · Care & development` — **grade: theoretical**

**EEA baseline.** Ancestral human infants were not raised by a mother alone but by a network of allomothers - fathers, grandmothers, aunts, older siblings, and trusted non-kin - who shared both direct care (holding, carrying, soothing) and provisioning (food). Humans are a cooperatively breeding ape: unlike other African apes, whose mothers nurture infants essentially on their own, hominin mothers relied on groupmates to protect, care for, and provision their unusually slow-maturing, costly young. This was not a cultural add-on but species architecture: a human child requires on the order of 13 million calories from birth to independence, and humans breed faster (every 3-4 years) than other apes (every 6-8 years) while producing larger, slower-maturing babies - a life-history paradox solvable only by shared provisioning. Across foraging ethnography, infants were routinely handled by people other than the mother from shortly after birth: among the Hadza, infants under four are held by the mother roughly 69% of the time and by allomothers the rest; !Kung infants have the mother's entire social world available with intense face-to-face engagement; Trobriand infants are suckled by lactating allomothers. The infant's evolved expectation is a reliable surround of multiple invested caregivers, not a single isolated dyad.

**EEA value** (illustrative, not constants):

  - note: Specific aggregate 'alloparent count ~4+' and a generic '40-50% of care delivered by allomothers' figure are widely cited in the literature but are NOT verbatim-grounded in Cor's extractions; only the Hadza ~69/31 mother/allomother holding split and the qualitative multi-caregiver pattern are. Numbers given are the extraction-supported anchors, not an asserted universal mean.
  - unit: qualitative_plus_anchors
  - hadza_mother_hold_pct: 69
  - hadza_allomother_hold_pct: 31
  - calories_to_rear_child_millions: 13
  - human_interbirth_interval_years: [3, 4]
  - other_ape_interbirth_interval_years: [6, 8]

**Modern default.** The modern default is the isolated nuclear (often single-caregiver) household: one or two adults, frequently without resident grandmothers, aunts, older cousins, or trusted neighbours sharing the daily load. The idealized breadwinner-father / homemaker-mother / biological-children unit is a historical aberration roughly a century old (Victorian at most; the 1950s template in the US), departing from the extended-kin allomaternal norm that held for the vast majority of human history. Care that was distributed across many hands is now concentrated on one or two, often supplemented by paid, rotating, or institutional caregivers rather than a stable invested kin network.

**The gap.** The mismatch is between the reliable, present, multi-caregiver surround the infant's attachment and the mother's reproductive psychology evolved to expect, and the thin one- or two-adult household the modern environment supplies. The load that was carried by a village now falls on isolated parents; maternal investment is calibrated to assess available allomaternal support (M9), so its evolved absence produces overload, depleted caregivers, and infants with fewer attachment figures than the cooperative-breeding design assumes. This is a supply mismatch, not a parental-competence failure.

**Resolution unit.** Reliable, present alloparental supply - care plus provisioning actually delivered by invested caregivers - NOT bare kin count or genealogical presence. Four relatives who live far away and do not share the daily load do not satisfy the parameter; what the infant and mother expect is dependable, hands-on, repeated care from a stable surround.

**Serves mechanisms:** M3 - Social Bonding, M9 - Care / Alloparenting

**Evidence (7 links):**

- ext#382 · replicated · primary: "A quick survey of available ethnography indicates how widespread shared care is among foraging peoples."
- ext#401 · theoretical · primary: "One widely accepted tenet of life history theory is that, across species, those with bigger babies relative to the mother's body size will also tend to exhibit longer intervals between births because the more babies cost the mother to produce, the longer she will need to recoup before reproducing again. Yet humans - like marmosets - provide a paradoxical exception to this rule."
- ext#22 · theoretical · primary: "these early hominin mothers relied on groupmates to help protect, care for, and provision their unusually slow-maturing children"
- ext#271 · theoretical · supporting: "Among humans living in foraging societies, a helpful mate and/or alloparents were usually essential for a mother to rear any infant at all. In a surprisingly broad range of creatures, indispensable alloparents provide many of the same forms of care a mother might, protecting and provisioning, even suckling another female's infant in cases where the alloparent is"
- ext#380 · theoretical · supporting: "'Cooperative breeding' refers to any species with alloparental assistance in both the care and provisioning of young."
- (+2 more linked extraction(s))

*Confidence note: GRADE DOWNGRADED replicated -> theoretical on adversarial review. Cor grades the ethnographic shared-care survey (382) 'replicated' because the underlying foraging fieldwork is cross-cultural (!Kung, Trobriand, Hadza), but that item is a single-author Hrdy compilation within one work (the Hadza 69% figure is itself Marlowe's fieldwork per 382's own caveat), and ~all other CARE-01 evidence is interpretive synthesis from just two Hrdy books (works 10 and 60). The HARD RULES reserve 'replicated' for genuine multi-study full-text convergence and keep mismatch interpretations theoretical; 'when unsure DOWNGRADE.' The cooperative-breeding architecture (13M-calorie cost, faster-than-ape breeding, alloparental provisioning) is Hrdy's interpretive synthesis. The measured Hadza ~69/31 holding split is retained as the replicated-in-Cor ethnographic anchor (382, kept as primary) but does not lift the whole mismatch row to replicated. I did NOT find extraction support for a specific 'alloparents deliver ~40-50% of infant care' figure or a universal 'alloparent count ~4+'; those are held qualitative.*

#### Caregiver continuity and reliability (present, not merely countable)
`EEA-CARE-02 · Care & development` — **grade: theoretical**

**EEA baseline.** The ancestral infant developed within a web of stable, repeatedly-present attachment figures whose availability could be counted on. Attachment is not a single dyadic bond but secure attachment to one or more trusted caretakers - Bowlby's design refined by Hrdy to plural, reliably-present figures - and human infants are equipped with traits (cuteness, prolonged eye contact, social smiling, differentiated cries) for recruiting and holding the attention of multiple potential caretakers. Crucially, maternal commitment itself is contingent and reliability-sensitive: for a cooperatively breeding mammal, the capacity to conceive is only part of the equation; the mother must be able to carry through to rearing independence, which she assesses against the dependable support actually available. Touch is part of this continuity - the infant evolved to expect near-continuous skin contact (carried, held, co-sleeping), a sense developed first in utero and serving as a primary regulatory channel. The expectation is not a list of relatives but caregivers who are reliably, physically present across time.

**Modern default.** Modern caregiving is frequently discontinuous and rotating: paid daycare with staff turnover, sequential and inconsistent caregivers, geographically dispersed or intermittently-available kin, and reduced continuous body contact (separate sleeping, stroller and crib time, scheduled rather than on-demand holding). Caregivers may be nominally present (counted on paper) yet not reliably, responsively available in the moment-to-moment way the regulatory system expects.

**The gap.** The mismatch is between caregiver reliability/continuity as an experienced, present regulatory input and a modern environment that often supplies caregivers who are countable but not dependably present. Because maternal investment and infant attachment are both calibrated to perceived caregiver reliability (M9, R1), low continuity is not neutral: it degrades the secure-base scaffolding and the touch-mediated regulation the infant evolved to expect, even when the number of caregivers on paper looks adequate.

**Resolution unit.** Reliable, present caregiver supply - responsive caregivers actually and repeatedly available across time, including continuity of body contact - NOT a count of designated or genealogically-related caregivers. The naive reading (enough named caregivers exist) misleads; what regulates the infant is dependable presence.

**Serves mechanisms:** M9 - Care / Alloparenting, R1 - Touch

**Evidence (5 links):**

- ext#281 · theoretical · primary: "Clearly, for cooperatively breeding mammals, a female's physical capacity to conceive and bear viable young is only a small part of the equation. She must also be able to carry through with the enterprise - rearing offspring to independence."
- ext#402 · theoretical · primary: "for their pronounced ambivalence toward newborns and their extremely contingent maternal commitment. Infants have adapted, as we will see later, with special traits for attracting the attention of potential caretakers."
- ext#276 · theoretical · primary: "Bowlby demonstrated that babies are genetically programmed to seek and form an attachment to a trusted figure. Secure attachment to one or more trusted caretakers is an essential aspect of emotional development in humans, just as it is in all other primates."
- ext#296 · theoretical · supporting: "The skin is the first and the largest sense organ to develop prenatally. The fetus is suspended in amniotic fluid and receives active stimulation from the fluid and the mother and others as they touch her abdomen. The fetus becomes increasingly active as this happens. The fetus also touches itself by thumb sucking and grasping the umbilical cord. The fetus gets a continuous massage for the entire nine months from both the amniotic fluid and the mother's insides. In addition, a pregnant woman naturally massages her baby in the womb. Touch alters oxytocin (an estrogen-dependent chemical), which relaxes the individual, promotes touch, encourages bonding, triggers milk letdown during breastfeeding, and sets off the uterine contractions that accompany childbirth."
- ext#294 · cross_species · supporting: "Several decades ago, Harry Harlow, at the University of Wisconsin, performed a classic experiment on touching monkeys. He built one surrogate mother out of terry cloth and a second surrogate mother out of wire mesh. For some of the monkey infants, the terry-cloth mother provided milk, and the wire mother did not. For others, the condition was reversed. The monkey infants preferred the cloth mother without the milk over the wire mother with milk, suggesting that they needed the touch stimulation as much as, if not more than, the nourishment."

*Confidence note: All supporting extractions for the continuity/reliability claim are graded theoretical (Hrdy/Bowlby interpretive synthesis); the touch items are 296 (theoretical) and 294 (cross_species, Harlow/Suomi). Per the HARD RULES, mismatch interpretations stay theoretical, so this row is theoretical. The claim that maternal commitment is contingent on perceived reliable support (281, 402) and that attachment is to plural trusted figures (276) is well-grounded; the specific operationalization of 'continuity' as a measured construct is not pinned to a number, hence eea_value is null and the parameter is qualitative.*

#### Mixed-age child playgroups as developmental input
`EEA-CARE-03 · Care & development` — **grade: theoretical**

**EEA baseline.** Ancestral children developed social competence largely through self-organized, free, physically-active play with a mixed-age band of other children - younger and older mixed together - rather than under continuous adult supervision or in age-segregated peer cohorts. Rough-and-tumble and pretend play during the juvenile period is a dedicated developmental input: in the mammalian design, play is a distinct emotional system (Panksepp's PLAY) and play experience physically tunes the maturing prefrontal cortex, refining the circuits that later dampen the amygdala and support social reciprocity, partner discrimination, and emotional regulation. Critically, the AMOUNT and quality of play partners matters: animals raised with more play partners show progressively greater play experience and corresponding PFC development, and even the untreated playmates of more-playful partners develop greater cortical thickness - play is a partnered input, so a richer multi-partner (and, in the human case, multi-age) play environment is the expected calibrating stimulus.

**Modern default.** Modern childhood compresses or eliminates free mixed-age play: age-segregated grade cohorts and daycare, adult-structured and supervised activities, indoor screen-based leisure, reduced unsupervised outdoor roaming, and safety norms that discourage rough-and-tumble. Children spend far less time in self-directed, physically-active, mixed-age peer play than the developmental window evolved to expect.

**The gap.** The mismatch is between mixed-age, self-organized, physically-active play as the evolved calibrating input for the juvenile prefrontal cortex (M4, embedded in the alloparental child-minding network, M9) and a modern environment that supplies age-segregated, adult-structured, often sedentary substitutes. Because play partners causally shape PFC development and social-reciprocity circuits, reduced free play is plausibly a genuine developmental-input deficit, not merely a lifestyle change.

**Resolution unit.** Self-directed, mixed-age, physically-active free play actually engaged in - partnered play experience - NOT adult-structured activities, screen time, or scheduled lessons that occupy time without delivering the rough-and-tumble, role-reversal, peer-negotiated input the circuits expect.

**Serves mechanisms:** M4 - Social Calibration / Play, M9 - Care / Alloparenting

**Evidence (5 links):**

- ext#212 · clinical · primary: "We found that play fighting in juvenile rats alters the dendritic branching of the neurons of the prefrontal cortex, with the arborization of the basilar dendrites of the OFC cells increasing and that of the apical dendrites of the mPFC cells decreasing."
- ext#220 · clinical · supporting: "Measures of cortical thickness reveal that these more masculine rats have a greater volume of cortex and that the sex-typical asymmetry of their right hemisphere versus their left one is exaggerated relative to control males that were injected with an equal volume of oil. There is nothing particularly unexpected in this finding. However, when the untreated playmates of the testosterone-treated and oil-treated animals were compared, it was found that the partners of the more playful rats also tended to have greater cortical thickness. Just growing up with a more playful partner influences the development of the cortex!"
- ext#216 · theoretical · supporting: "emotional responses are dependent on the activation of the amygdala, and, as we discussed in chapter 3, the amygdala is likely crucial to ensuring playful reciprocity. The prefrontal cortex dampens the activity of the amygdala, which thus prevents emotional overreaction. Here is a potential mechanism by which experience with play fighting in the juvenile period refines the prefrontal circuits, and, in doing so, produces animals that are better able to regulate their subcortically generated emotions."
- ext#256 · theoretical · supporting: "In addition to the preceding primitive systems that are evident in all mammals soon after birth, we also have more sophisticated special-purpose socioemotional systems that are engaged at appropriate times in the lives of all mammals-for instance, those that mediate sexual LUST (see Chapter 12), maternal CARE (see Chapter 13), and roughhousing PLAY (see Chapter 15). Each of these is built around neural complexities that are only provisionally understood. Sexual urges are mediated by specific brain circuits and chemistries that are quite distinct for males and females but appear to share some components such as the physiological and psychological effects of oxytocin, which also promotes maternal motivation."
- ext#274 · theoretical · supporting: "alloparenting is particularly well developed and played a special role in the evolution of our own large-brained, slow-growing, and extraordinarily inventive species."

*Confidence note: DOWNGRADED honestly and left theoretical on review. The CAUSAL play-shapes-the-brain evidence is strong but is rat-lab (Pellis) graded clinical in Cor (212, 220) and is cross-species, not human; I am NOT claiming human PFC outcomes at clinical grade. The SPECIFIC human parameter - mixed-age playgroups (ages ~3-12) in foragers - is NOT verbatim-grounded in Cor's extractions; the ethnographic age-band detail is absent. The row meets the 3-part inclusion rule (M4/M9, real modern_default, real gap) and is retained, but graded theoretical because the human mixed-age specifics rest on the general play-development mechanism plus the alloparental-childminding context rather than a direct human-forager extraction. The numeric age band (~3-12) is therefore NOT placed in eea_value (null). Note: 274 supports the M9 link via 'unusually extended juvenile period'; it does not literally say 'play window,' so that phrasing is a fair synthesis, not a quote.*

#### Multigenerational presence (grandmothers as provisioning kin)
`EEA-CARE-04 · Care & development` — **grade: theoretical**

**EEA baseline.** Ancestral children typically developed in the presence of grandparents - especially post-reproductive grandmothers - who were active, provisioning members of the group. Human longevity itself is bound up with this role: the grandmother hypothesis (and Lieberman's active-grandparent corollary) holds that uniquely long human lifespans were selected for and made possible by older adults remaining physically active to help rear children, grandchildren, and other young kin, increasing inclusive fitness through kin-selected provisioning. Grandmothers are thus part of the alloparental supply: a multigenerational band in which a vigorous older generation contributed food, care, and accumulated knowledge to the rearing of the slow-maturing young, rather than being a dependent or absent generation.

**Modern default.** Modern households are frequently bi-generational or single-generation: grandparents commonly live separately, often at a geographic distance, and may be framed as recipients of care rather than contributors to childrearing. Where grandparents are present they are often less physically active and less integrated into the daily provisioning of grandchildren than the multigenerational design assumes.

**The gap.** The mismatch is between the present, active, provisioning grandparental generation the cooperative-breeding system expects as part of allomaternal supply (M9, M3) and the modern default of geographically separated or non-provisioning grandparents. The grandmother's evolved contribution to inclusive fitness and to the caloric and knowledge subsidy of grandchildren is structurally absent for many modern families, thinning the alloparental network exactly where it was most reliably staffed.

**Resolution unit.** Present, active, provisioning grandparental kin - older relatives actually contributing care, food, and knowledge - NOT mere grandparental existence or living-relative count. A surviving grandmother several time zones away does not fill the role the multigenerational band provided.

**Serves mechanisms:** M3 - Social Bonding, M9 - Care / Alloparenting

**Evidence (4 links):**

- ext#203 · theoretical · primary: "In order to elucidate the links between exercise and aging, I propose a corollary to the grandmother hypothesis, which I call the active grandparent hypothesis. According to this idea, human longevity was not only selected for but also made possible by having to work moderately during old age to help as many children, grandchildren, and other younger relatives as possible to survive and thrive. That is, while there might have been selection for genes (as yet unidentified) that help humans live past the age of fifty, there was also selection for genes that repair and maintain our bodies when we are physically active. As a result, many of the mechanisms that slow aging and extend life are turned on by physical activity, especially as we get older. Human health and longevity are thus extended both by and for physical activity."
- ext#401 · theoretical · supporting: "One widely accepted tenet of life history theory is that, across species, those with bigger babies relative to the mother's body size will also tend to exhibit longer intervals between births because the more babies cost the mother to produce, the longer she will need to recoup before reproducing again. Yet humans - like marmosets - provide a paradoxical exception to this rule."
- ext#274 · theoretical · supporting: "alloparenting is particularly well developed and played a special role in the evolution of our own large-brained, slow-growing, and extraordinarily inventive species."
- ext#403 · theoretical · supporting: "When politicians lament the 'decline of the family,' they have in mind departures from the nuclear family: a man, his wife, and their biological children. However, the template for this kind of family dates back only a century or so, at most to Victorian times."

*Confidence note: Graded theoretical. The grandmother hypothesis / active-grandparent corollary is Lieberman's interpretive evolutionary argument (203, eq=theoretical, explicitly a corollary to Hawkes et al.'s grandmother hypothesis); it is well-known but interpretive, not a replicated empirical demonstration in Cor's corpus, and mismatch framing stays theoretical per the HARD RULES. eea_value is null because no specific quantitative grandmother-presence parameter is extraction-grounded. The row meets the 3-part inclusion rule and connects directly to the M9 alloparental-supply backbone. Note: 203's mechanism_codes in Cor are M10/M9; the M3 row tag is an architectural mapping carried by the M9/M3 supporting items (401, 274, 403), not by 203.*


### Touch & contact

#### Affective (C-tactile) contact frequency and skin-to-skin time
`EEA-TOUCH-01 · Touch & contact` — **grade: clinical**

**EEA baseline.** Ancestral infants and children lived in near-continuous bodily contact: carried on the body, fed at short intervals, and held skin-to-skin for much of the day and night, with frequent affectionate, moderate-pressure touch from the mother and a wider circle of caregivers. Adults likewise lived in high-touch social fields where casual physical contact was a routine, primary channel of social interaction. Touch is the phylogenetically first and largest sense organ; the fetus is already continuously stimulated in utero. Skin-to-skin/carried contact was the species-typical default, not an intervention.

**EEA value** (illustrative, not constants):

  - note: No defensible single ancestral 'touches-per-hour' number; cross-cultural touch frequency ranges enormously (0-180+ contacts/hour across modern societies per Jourard), so the EEA value is a high-contact regime with a floor, not a point estimate
  - qualitative: True
  - infant_contact: near-continuous (carried, co-sleeping, fed at frequent short intervals)
  - touch_modality: moderate-pressure affective (C-tactile) touch
  - caregiver_scope: mother plus alloparents; high-touch social field for adults

**Modern default.** WEIRD/industrialized environments are historically unusual in touch avoidance: infants spend much time in cribs, strollers, and carriers that minimize skin contact; personal-space norms and screen-mediated interaction strip casual affective touch from daily adult life. Many people experience chronic 'touch hunger' below the developmental and regulatory floor.

**The gap.** Modern environments routinely fall below the ancestral affective-touch floor. Touch deprivation in extreme cases (institutional rearing) produces growth-hormone suppression, immune dysfunction, and developmental arrest; even in non-extreme modern life the loss of moderate-pressure affective touch removes a direct oxytocin/vagal/cortisol-regulating input. Critically, affective touch is the one ancestral channel that remote, volumetric, or screen-based technology cannot deliver: it requires physical skin contact.

**Resolution unit.** Reliable supply of moderate-pressure, skin-to-skin/affective (C-tactile) contact, especially in infancy and under stress; NOT incidental or light/ticklish touch (light touch does not produce the physiological response) and NOT a raw count of any contact.

**Serves mechanisms:** M3 - Social Bonding, R1 - Touch

**Evidence (9 links):**

- ext#296 · theoretical · primary: "The skin is the first and the largest sense organ to develop prenatally. The fetus is suspended in amniotic fluid and receives active stimulation from the fluid and the mother and others as they touch her abdomen. The fetus becomes increasingly active as this happens. The fetus also touches itself by thumb sucking and grasping the umbilical cord. The fetus gets a continuous massage for the entire nine months from both the amniotic fluid and the mother's insides. In addition, a pregnant woman naturally massages her baby in the womb. Touch alters oxytocin (an estrogen-dependent chemical), which relaxes the individual, promotes touch, encourages bonding, triggers milk letdown during breastfeeding, and sets off the uterine contractions that accompany childbirth."
- ext#293 · clinical · primary: "We have since found that moderate pressure is key to the massage therapy effects. We massage babies from head to foot (all but their chests and stomachs; they do not want to be touched there, most likely because that is where all the tubes have been inserted). The babies who were massaged gained 47 percent more weight than those not massaged, a significant weight gain."
- ext#89 · replicated · primary: In a study of 112 parents and their 4-6 month olds, active parental touch triggered measurable OT responses. Mothers providing high levels of affectionate touch (>66% of interaction time) showed increased salivary OT from pre- to post-interaction, while mothers providing minimal
- ext#100 · longitudinal · supporting: 10-year longitudinal RCT (N=146): Kangaroo Care (14 days skin-to-skin) vs incubator care in preterm infants. KC increased autonomic functioning (RSA), maternal attachment, reduced maternal anxiety. Enhanced child cognitive development and executive functions from 6 months to 10 y
- ext#294 · cross_species · supporting: "Several decades ago, Harry Harlow, at the University of Wisconsin, performed a classic experiment on touching monkeys. He built one surrogate mother out of terry cloth and a second surrogate mother out of wire mesh. For some of the monkey infants, the terry-cloth mother provided milk, and the wire mother did not. For others, the condition was reversed. The monkey infants preferred the cloth mother without the milk over the wire mother with milk, suggesting that they needed the touch stimulation as much as, if not more than, the nourishment."
- (+4 more linked extraction(s))

*Confidence note: Solid and convergent across modality: replicated parent-infant oxytocin/touch studies (Feldman, ext 89), clinical preterm massage and stress-buffering work (Field, ext 293), cross-species touch-deprivation primate work (Harlow/Suomi, ext 294/537), and a 10-year kangaroo-care RCT (ext 100) all point the same way. Verified: the often-cited '~40% preterm mortality reduction' for kangaroo care is NOT present in the cited corpus; ext 100 reports developmental/autonomic advantage, not a mortality figure, so no mortality number is asserted here. The EEA-as-high-contact-regime claim is strong; the precise frequency is deliberately left qualitative. All 9 cited extraction_ids verified to exist and support their 'why'.*

#### Co-sleeping / nighttime body contact
`EEA-TOUCH-02 · Touch & contact` — **grade: contested** · **CONTESTED**

**EEA baseline.** Ancestral infants and young children slept in body contact with the mother and others rather than alone, extending the daytime carried-contact regime through the night. Nighttime proximity meant the touch, warmth, and physiological co-regulation channels (and likely circadian entrainment cues from the caregiver) operated continuously across the 24-hour cycle, not just during waking.

**Modern default.** WEIRD norms favor solitary infant sleep in a separate crib or room, removing nighttime body contact for most of the sleep period; adult sleep is also frequently solitary or contact-minimized.

**The gap.** Solitary infant and child sleep removes the nighttime half of the ancestral continuous-contact regime, eliminating touch-based physiological co-regulation during sleep. This is a plausible but, in the present corpus, evidentially thin extension of the daytime affective-touch and attachment findings; it should not be over-stated.

**Resolution unit.** Reliable presence of nighttime body contact / proximity that preserves the touch and co-regulation channel through the sleep period; the relevant variable is continuity of contact across the 24-hour cycle, not sleep duration.

**Serves mechanisms:** M3 - Social Bonding, M7 - Circadian Regulation, R1 - Touch

**Evidence (3 links):**

- ext#615 · contested · supporting: "Moreover, infants and mothers are induced to awaken by an arousal exhibited by the other (within seconds) therein creating interconnected, mutually dependent, synchronous arousals [1, 2]."
- ext#616 · contested · supporting: "the behavior can be seen to be intimately linked to underlying EEGs, breathing patterns, changes in sleep architecture, body temperature and linked simultaneously to maternal physiological and behavioral events [5]."
- ext#617 · contested · challenging: "as bedsharing safety is determined specifically by how it is practiced and by whom and what adverse factors could be associated"

*Confidence note: GROUNDED 2026-06-09; grade 'thin' -> 'contested' (contested=true retained). The row's previously ZERO-evidence status is resolved with the best verifiable full text after the canonical McKenna reviews (2005 Paediatr Respir Rev; 2007 AJPA) proved paywalled / not in PMC: McKenna JJ 2014, Evolution Medicine & Public Health (doi:10.1093/emph/eou006, CC-BY open access; work added this pass). Supporting evidence for the nighttime co-regulation channel: ext M1 (cosleeping mother-infant 'interconnected, mutually dependent, synchronous arousals') and M2 (cosleeping infant physiology 'intimately linked to underlying EEGs, breathing patterns, ... body temperature ... maternal physiological and behavioral events'). CHALLENGING evidence: ext M3 (McKenna himself: bedsharing 'safety is determined specifically by how it is practiced ... adverse factors' - the live SIDS/safety contestation). Grade 'contested' is the honest, non-inflationary label: the evidence is a single-author commentary reviewing one research program (McKenna's own lab) in an active scientific debate, and the claim is genuinely contested on SIDS grounds. M1/M2 evidence the proximate co-regulation mechanism (not a literal touch measurement); McKenna in this same text explicitly distances from a naive 'return to the Pleistocene'/Bowlby-EEA reading. If TOUCH-02 is read as an EEA-mismatch claim rather than a co-regulation-channel claim, that interpretation would itself be capped at 'theoretical' per the hard rule.*

#### Affective grooming/touch from trusted others (adult social touch)
`EEA-TOUCH-03 · Touch & contact` — **grade: clinical**

**EEA baseline.** Beyond infancy, ancestral adults maintained social bonds through frequent affiliative body contact: the human homolog of primate grooming. Primate grooming is fundamentally about the intimacy of massage, where skin stimulation triggers endorphin release and underwrites social bonding. Ancestral adults lived in high-touch social fields where reassuring, stress-buffering touch from trusted others (partners, kin, allies) was a routine, ever-present channel of social and physiological regulation.

**EEA value** (illustrative, not constants):

  - mechanism: skin stimulation -> endorphin release (bonding) and vagal/cortisol regulation (stress buffering)
  - qualitative: True
  - reciprocity: bidirectional: giver and receiver both benefit physiologically
  - adult_social_touch: frequent affiliative body contact / grooming-homolog from trusted others

**Modern default.** Adult-to-adult affiliative touch is sharply curtailed in WEIRD societies by personal-space norms, professionalization of touch, and screen-mediated relationships; trusted-other touch is increasingly confined to a single partner or absent entirely, and remote communication carries none of it.

**The gap.** Loss of routine affiliative touch from trusted others removes a direct endorphin-bonding and cortisol/cardiovascular stress-buffering input that operated continuously in ancestral social life. Partner/trusted-other touch buffers acute stress more effectively than verbal support alone, and the benefit is bidirectional. This channel is physical-contact-only and cannot be delivered by remote or volumetric technology.

**Resolution unit.** Reliable supply of affiliative touch from trusted others (the grooming homolog), present as an ongoing relational channel; not one-off or transactional touch, and not mere co-presence without contact.

**Serves mechanisms:** M3 - Social Bonding, R1 - Touch

**Evidence (5 links):**

- ext#386 · replicated · primary: "Monkey grooming is not about removing fleas. Rather, it is about the intimacy of massage. The physical stimulation of the skin triggers the release of endorphins in the brain."
- ext#429 · clinical · primary: "Women with physical contact before stress exhibited significantly lower cortisol and heart rate responses to stress but no different plasma oxytocin levels."
- ext#430 · clinical · supporting: "We compared 'grandparent' volunteers massaging infants (figure 2.2), with 'grandparent' volunteers being massaged themselves. Both experiences had positive effects, including such lifestyle changes as participants having more social contacts, drinking less coffee, and making fewer trips to the doctor's office."
- ext#295 · clinical · supporting: "Sidney Jourard, a University of Florida psychologist, visited cafés in different parts of the world and recorded the number of times two people who were sharing coffee touched each other. In London, the tally was 0; in Gainesville, Florida, 2; in Paris 110; and in San Juan, Puerto Rico, more than 180. Most sociologists would agree that societies like those in the Mediterranean countries (e.g., Spain, France, Italy, Greece, Turkey, Egypt) are contact societies, whereas the more northern societies in countries such as Holland, Great Britain, and the United States are not."
- ext#418 · theoretical · supporting: "Many human cultures know the primary value of touch. In some primitive cultures, for example, people live skin-to-skin with virtually everyone."

*Confidence note: Solid: Dunbar's grooming-endorphin link (ext 386) is replicated primate neuroscience extended to human touch bonding, and Field's partner-touch finding (ext 429) is clinical (pre-stress partner contact significantly lowers cortisol and heart-rate responses, outperforming verbal support). Verified: ext 429's author_quote notes cortisol/HR drop with 'no different plasma oxytocin levels', and the 'why' correctly claims cortisol/HR not oxytocin. The mismatch interpretation (modern adult touch deficit) leans on the cross-cultural touch-variance data and is somewhat more inferential than the core physiology, but the underlying mechanism is well-grounded. All 5 cited extraction_ids verified to exist and support their 'why'.*


### Circadian & sensory

#### Dawn/dusk light gradient with genuine nocturnal darkness as circadian entrainment signal
`EEA-CIRC-01 · Circadian & sensory` — **grade: theoretical**

**EEA baseline.** Across evolutionary history the human circadian pacemaker (suprachiasmatic nucleus) was entrained by a high-amplitude natural light-dark cycle: bright full-spectrum daytime illumination (often >10,000 lux outdoors), a gradual dusk dimming and reddening, and then real darkness for the duration of the biological night, with only firelight (low, long-wavelength) as evening illumination. Contemporary hunter-gatherer reference populations (Hadza, San) show sleep onset clustering around 8-10 p.m., aligned with dusk-driven melatonin release. The operative signal is the timing and spectral content of light at the day-night transition reaching melanopsin-containing retinal ganglion cells, not light intensity per se.

**EEA value** (illustrative, not constants):

  - biological_night: genuine darkness
  - typical_sleep_onset: ~20:00-22:00 (dusk-aligned)
  - evening_illumination: firelight (low lux, long-wavelength ~600nm+)
  - reference_populations: ["Hadza", "San"]
  - daytime_light_lux_outdoor: >10000

**Modern default.** Indoor electric and screen light keeps evening illumination bright and short-wavelength (blue-enriched, ~450nm) well past dusk, suppressing melatonin and delaying its onset by 1.5-3 hours; daytime indoor light is far dimmer than outdoor light, flattening the day-night amplitude. The dusk dimming/reddening gradient and true nocturnal darkness are largely abolished.

**The gap.** The modern light environment inverts the ancestral pattern on both ends: too little bright light by day, too much blue-enriched light at night, with no real darkness. This delays circadian phase, compresses and fragments the biological night, and decouples internal time from external solar time.

**Resolution unit.** Spectral timing of light exposure at the day-night transition (dusk dimming + nocturnal darkness), not total daily light dose or generic 'brightness'.

**Serves mechanisms:** M7 - Circadian Regulation

**Evidence (9 links):**

- ext#77 · clinical · primary: Electric light, caffeine, and alarm clocks systematically disrupt the ancestral dark-cycle sleep pattern that governed human circadian biology for millennia. Walker describes how Edison's incandescent light "put an end to this natural order of things," delaying melatonin release
- ext#436 · replicated · supporting: "Central to many of the questions in the opening paragraph is the powerful sculpting force of your twenty-four-hour rhythm, also known as your circadian rhythm."
- ext#82 · clinical · supporting: In a randomized crossover study (N=12), reading a light-emitting eReader (LE-eBook) for 4 hours before bedtime for 5 consecutive evenings produced multiple measurable disruptions compared to reading a printed book in identical dim light conditions. Melatonin was suppressed by 55.
- ext#83 · clinical · supporting: The circadian disruption from evening LE-eReader use persisted beyond the reading session. Next-morning sleepiness was significantly greater after LE-eBook reading (P<0.001) and participants took hours longer to fully wake up. The circadian phase shift (dim light melatonin onset
- ext#609 · thin · primary: "Here we show that electrical lighting and the constructed environment is associated with reduced exposure to sunlight during the day, increased light exposure after sunset, and a delayed timing of the circadian clock as compared to a summer natural 14h40min:9h20min light-dark cycle camping. Furthermore, we find that after exposure to only natural light, the internal circadian clock synchronizes to solar time such that the beginning of the internal biological night occurs at sunset and the end of the internal biological night occurs before wake time just after sunrise."
- (+4 more linked extraction(s))

*Confidence note: EVIDENCE BASE STRENGTHENED 2026-06-09 but grade HELD at 'theoretical' (a correct outcome, not a failure). The natural-light entrainment MECHANISM is now genuine multi-study full-text convergence: added Wright et al. 2013 (Current Biology; within-subject natural-light field study, n=8; ext W1/W3) and Stothard et al. 2017 (winter + weekend camping, n=5/n=14; ext S1/S3), which directly show natural light entrains the human clock to solar time (biological night begins near sunset) and that modern electrical lighting delays circadian phase, with measured natural-light intensities ~4,500-10,300 lux and a cited Toba/Qom hunter-gatherer + Brazilian rubber-tapper corroboration. This resolves the prior 'single secondary synthesis (Walker) + single 12-person RCT (Chang)' basis for the downgrade. The grade nonetheless STAYS 'theoretical' because the row's eea_value asserts SPECIFIC FORAGER ANCESTRAL BASELINE VALUES (sleep onset ~20:00-22:00, >10,000 lux daytime, firelight ~600nm) - an EEA-baseline reconstruction. The camping studies substitute modern subjects under natural light as a PROXY for the ancestral condition (Wright's own caveat); they validate the mechanism, not the specific ancestral numbers, so the hard mismatch-interpretation cap binds. Not contested: the entrainment finding is robust and convergent, not in dispute - it is capped, not disputed.*

#### Sleep timing/phase alignment to the biological night (not a fixed duration target)
`EEA-CIRC-02 · Circadian & sensory` — **grade: longitudinal**

**EEA baseline.** Ancestrally, sleep occurred within a stable phase relationship to the solar/circadian night: onset shortly after dusk, offset near or before dawn, with the sleep episode anchored to internal circadian time. Field data from preindustrial-style foraging/horticultural societies place habitual sleep within a window in the rough range of ~6-7 hours of nocturnal sleep, but the load-bearing ancestral feature is the alignment of the sleep episode to circadian phase, not hitting a particular hour count. Total nightly sleep duration in such groups is modest and overlaps the lower end of modern recommendations; there is no evidence of a hard-wired 8-9 hour requirement.

**Modern default.** Industrial schedules set wake (and increasingly sleep) times by clock and alarm rather than by internal time, producing chronic 'social jetlag' - a standing offset between the endogenous circadian phase and the socially imposed sleep window. In a large Central-European dataset ~69% experience >=1 hour of social jetlag and about one-third >=2 hours; ~80% of workers wake by alarm; population chronotype has drifted later while workday sleep has shortened.

**The gap.** The mismatch is primarily one of phase, not amount. Even when total sleep is adequate, misalignment between biological and social clocks is associated with metabolic harm (e.g. social jetlag raises overweight odds and predicts BMI in the overweight, with an effect more than half that of sleep duration, after controlling for duration itself). Chasing a duration number while ignoring phase misses the operative variable.

**Resolution unit.** Sleep timing/phase - the alignment of the sleep episode to internal circadian night - NOT sleep duration. Do not encode a must-hit-8-9h rule.

**Serves mechanisms:** M7 - Circadian Regulation

**Evidence (10 links):**

- ext#92 · longitudinal · primary: In a large epidemiological database (n>65,000, primarily Central European), social jetlag - the discrepancy between biological circadian clock and socially imposed sleep timing - is associated with increased BMI independently of sleep duration. 69% of the population experiences a
- ext#93 · longitudinal · primary: Social jetlag - the discrepancy between biological and social clocks - is chronic throughout working careers. 69% of the population (N>65,000, central European) experiences at least 1 hour of social jetlag; one-third suffers 2+ hours. Social jetlag peaks in late adolescence due t
- ext#94 · longitudinal · supporting: Hierarchical multiple regression revealed social jetlag positively predicts BMI specifically in the overweight group (BMI>=25, n=20,731), with an effect size more than half that of sleep duration, but does NOT predict BMI in the normal weight group (BMI<25, n=43,308). Logistic re
- ext#81 · theoretical · supporting: Roenneberg identifies "social jet lag" - the chronic discrepancy between an individual's biological clock and socially imposed schedules - as a pervasive mismatch condition in industrialized societies. Over 40% of the Central European population suffers from social jet lag of two
- ext#79 · theoretical · supporting: During puberty, the suprachiasmatic nucleus shifts the adolescent circadian rhythm progressively forward, pushing sleep onset several hours later than both younger children and adult parents. Walker describes how a nine-year-old's melatonin-driven sleep onset around 9 p.m. shifts
- (+5 more linked extraction(s))

*Confidence note: RE-GRADED 2026-06-09 'theoretical' -> 'longitudinal'. The single-dataset basis for the prior downgrade is resolved: the load-bearing 'phase/timing-not-duration' claim is now supported by a convergence of independent designs - the Roenneberg social-jetlag epidemiology (work 40, n>65,000; the row's existing 'longitudinal'-graded primary) PLUS two controlled natural-light field experiments added this pass: Wright et al. 2013 (ext W2: all circadian markers ~2h earlier while weekly sleep duration 6.7h vs 6.8h, p=0.268, and efficiency were statistically unchanged) and Stothard et al. 2017 (ext S2: weekend natural light advanced melatonin onset/midpoint ~1.4h/~1.0h 'despite no change in sleep timing'). Graded 'longitudinal' (matching its Roenneberg anchor's evidence type), deliberately NOT 'replicated': the two camping experiments share a laboratory and senior author, so they are not fully independent, and top-tier 'replicated' is reserved for stronger independent convergence. The mismatch-interpretation cap does NOT bind here because eea_value is NULL - the row asserts no contested ancestral sleep number; its claim is the present-tense, directly-measured dissociation of circadian PHASE from sleep DURATION in living humans. NOTE: this is the only genuine grade promotion in this pass; flagged for review.*

#### Falling evening ambient temperature as a co-primary sleep-onset cue
`EEA-CIRC-03 · Circadian & sensory` — **grade: theoretical**

**EEA baseline.** Outside thermally buffered shelter, ancestral evenings carried a reliable nocturnal drop in ambient temperature that paralleled dusk. This descending thermal ramp coincides with the endogenous evening fall in core body temperature that gates sleep onset, plausibly acting as a second zeitgeber-like onset cue alongside light. The baseline environment thus paired a dimming light gradient with a falling temperature gradient at the day-night transition.

**Modern default.** Climate-controlled indoor environments hold ambient temperature roughly constant across the 24-hour cycle, removing the evening cooling ramp; evening heat (and sometimes overheated bedrooms) can also oppose the core-temperature fall required for sleep onset.

**The gap.** By flattening the daily thermal cycle, modern housing removes a candidate onset cue that historically co-occurred with dusk and reinforced circadian timing, potentially leaving light as the sole (and now corrupted) entrainment channel.

**Resolution unit.** Direction and timing of the evening ambient-temperature change (a falling ramp at dusk), not absolute thermostat setpoint or daytime comfort.

**Serves mechanisms:** M7 - Circadian Regulation

**Evidence:** none in the corpus yet (rendered on prose + mechanism link; no citation fabricated).

*Confidence note: Kept on inclusion-rule grounds (clear M7 link, real modern_default, real gap) but at the lowest applicable grade and with NO evidence links - verified that Cor's existing M7 temperature extractions (IDs 85, 86) concern the ENDOGENOUS body-temperature rhythm used to estimate intrinsic circadian period via forced desynchrony, NOT ambient falling-temperature as an external onset cue, so none genuinely supports this claim. A full keyword scan of all M7 extractions for temperature/thermal/cooling/ambient returned no supporting source. The ambient-thermal-cue hypothesis is biologically plausible but ungrounded in the current extraction base; treat as theoretical pending a dedicated source.*


### Subsistence & time-use

#### Daily incidental movement load
`EEA-SUBS-01 · Subsistence & time-use` — **grade: theoretical**

**EEA baseline.** Across a foraging day, adults covered substantial ground on foot as a structural side-effect of acquiring food, water, and firewood and of moving between patches and camp - roughly 9-15 km/day (Hadza men ~7-10 mi, women ~5 mi plus hours of digging), with movement woven through the whole waking day rather than concentrated into a bout. Activity was modest in intensity but near-continuous and embedded: light chores, child-carrying, frequent sit-to-stand transitions, and active resting postures (squatting, kneeling, ground-sitting) that sustain low-level lower-limb muscle activity. Hunter-gatherer PAL is only modestly above a Western desk worker's (~1.8-1.9 vs ~1.6), so the EEA baseline is not 'extreme exertion' but 'movement is the unavoidable medium of subsistence.'

**EEA value** (illustrative, not constants):

  - PAL: {"men": 1.9, "women": 1.8, "western_desk": 1.6}
  - MVPA_min_per_day: {"approx": 134, "source_note": "~2h14m moderate-vigorous + ~3h40m light (Hadza HR-monitor)"}
  - daily_distance_km: {"low": 9, "high": 15, "qualifier": "approximate, Hadza-anchored, single-population; foraging-day side-effect"}
  - rest_hours_per_day: {"note": "comparable to industrialized adults; difference is posture not amount", "approx": 9.9}

**Modern default.** Movement has been extracted from subsistence and re-inserted, if at all, as discretionary 'exercise': set-aside, planned, dose-prescribed (e.g. 150 min/week guidelines), and separated from the rest of a chair-bound, motor-transported, indoor day. Most waking hours are spent in continuous chair-sitting that holds the lower limbs near-inactive, and total daily distance on foot collapses far below the ancestral range.

**The gap.** The gap is not a calorie or PAL gap (these are surprisingly close) but a distributional one: ancestral movement was low-intensity, continuous, and obligatory; modern movement is optional, bunched, and easily skipped, leaving long uninterrupted muscular-inactivity bouts that the body never encountered. The mismatch is in HOW the day's muscle activity is spread, not in gross energy turnover.

**Resolution unit.** Incidental all-day movement woven into the fabric of living (errands, carrying, standing, walking between activities, active rest postures) - NOT a set-aside 'exercise' session. The functional target is the continuous distribution of low-level activity across waking hours, not weekly minutes of vigorous training.

**Serves mechanisms:** M10 - Movement / Regulatory

**Evidence (7 links):**

- ext#196 · clinical · primary: "Among the many studies of the Hadza, one asked forty-six Hadza adults to wear lightweight heart rate monitors for several days. According to these sensors, the average adult Hadza spends a grand total of three hours and forty minutes a day doing light activities and two hours and fourteen minutes a day doing moderate or vigorous activities. Although these few hours of hustling and bustling per day make them about twelve times more active than the average American or European, by no stretch of the imagination could one characterize their workloads as backbreaking. On average, the women walk five miles a day and dig for several hours, whereas the men walk between seven and ten miles a day. And when they aren't being very active, they typically rest or do light work."
- ext#427 · theoretical · primary: "Walk or run 10 kilometers (6.2 miles) a day (barefoot, of course), climb a few trees, chase squirrels in the park, throw rocks, eschew chairs, and sleep on a board instead of a mattress."
- ext#197 · replicated · supporting: "Although there is much variation, PALs of hunter-gatherers average 1.9 for men and 1.8 for women, slightly below PAL scores for subsistence farmers, which average 2.1 for men and 1.9 for women. To put these values into context, hunter-gatherer PALs are about the same as those of factory workers and farmers in the developed world (1.8), and about 15 percent higher than PALs of people with desk jobs in developed countries (1.6). In other words, typical hunter-gatherers are about as physically active as Americans or Europeans who include about an hour of exercise in their daily routine. In case you are wondering, most mammals in the wild have PALs of 3.3 or more, nearly twice as high as hunter-gatherers. Thus, comparatively speaking, humans who must hunt and gather all the food they eat and make everything they own by hand are substantially less active than average free-ranging mammals."
- ext#288 · clinical · supporting: "Here, we test the hypothesis that the ways in which urban populations rest, rather than the amount of time spent resting, represents an inactivity mismatch with an evolutionarily relevant hunting and gathering lifestyle, and propose that this mismatch may contribute to the negative health impacts of sedentary behavior today."
- ext#289 · clinical · supporting: "In addition to ground-sitting postures, Hadza individuals also spend a large percentage of their nonambulatory time in squatting (∼18%) and kneeling postures (∼12.5%) that differ from ground sitting by individuals maintaining an elevated buttocks. [...] For soleus, the assisted squat posture (squatting with heels in ground contact and with the buttocks resting on a small rock) elicited significantly higher muscle activity compared with chair sitting."
- (+2 more linked extraction(s))

*Confidence note: Grade DOWNGRADED from 'replicated' to 'theoretical' on adversarial review. Two reasons: (a) this is a mismatch interpretation (embedded/continuous vs modern bunched movement), which the grade rules require to stay theoretical; (b) the headline quantitative claim - the 9-15 km/day band and the PAL/MVPA/rest figures - is anchored to a narrow source base (Lieberman/work 57 supplies 196,197,198,195; the single Raichlen/Pontzer 2020 paper/work 63 supplies 288,289; one author/work 64 supplies 427), i.e. essentially Hadza-population data filtered through two source-works, not broad multi-study full-text convergence. What IS robust and converges across these full-text sources is the QUALITATIVE picture: movement is embedded not bout-shaped, active-rest posture matters, and forager PAL is only ~15% above a sedentary Westerner's. Cor must not hide the genuine tension: the same data show hunter-gatherers rest ~9.9h/day and are only modestly more active, so 'we evolved to move constantly and hard' is itself partly myth - the defensible claim is continuity-of-movement and active-rest posture, not heroic exertion. The specific km band is approximate and population-variable.*

#### Effort-to-outcome contingency (closed-loop, self-attributable)
`EEA-SUBS-02 · Subsistence & time-use` — **grade: longitudinal**

**EEA baseline.** Subsistence effort sat in a short, visible, self-attributable causal loop: the same individual who tracked, dug, gathered, knapped, or built directly observed the outcome of that effort, on a timescale of minutes to days. Effort-outcome links were embodied and legible - you could see whether your action produced the result. The evolved controllability circuitry (vmPFC detects response-outcome contingency and, when contingency is present, inhibits the dorsal-raphe passivity default) was calibrated to environments where such contingency was routinely present and detectable, and where experiences of control immunized against later helplessness.

**Modern default.** Much modern productive effort is decoupled from any visible, self-attributable outcome: work is mediated by long opaque chains, algorithmic management, and electronic monitoring that reduce decision latitude; rewards are detached in time and attribution from the effort that earned them; and many roles offer high demand with low control. The closed loop between one's own action and an observable result is frequently broken.

**The gap.** Because passivity is the unlearned default that only switches OFF when controllability is detected, environments that obscure the effort-outcome link don't feel neutral - they default the organism toward helplessness-type physiology. The gap is the loss of routinely detectable, self-attributable contingency, which population health data link to elevated disease risk (low job control predicts coronary disease independent of grade).

**Resolution unit.** Reliably PRESENT and DETECTABLE response-outcome contingency that the actor can attribute to their own effort - not mere busyness, throughput, or nominal 'autonomy.' What must be restored is the closed, legible loop between action and observed result, not the quantity of work.

**Serves mechanisms:** M2 - Pursuit / Exploration, M6 - Controllability / Agency

**Evidence (7 links):**

- ext#68 · replicated · primary: Control is detected via vmPFC-DMS circuit, then vmPFC inhibits dorsal raphe. Two separable prelimbic cortex functions identified: (1) DETECT - a prelimbic-dorsomedial striatum (DMS) circuit detects contingency between response and outcome (the presence of control); (2) ACT - sepa
- ext#66 · replicated · primary: Passivity is the default, not learned. The original learned helplessness theory got it backward. Passivity in response to prolonged aversive events is the unlearned default response, not a learned expectation of uncontrollability. The neural evidence shows that aversive shock per
- ext#583 · theoretical · supporting: Ancestral work was characteristically small-group, embodied, skill-based, and autonomy-rich. Psychological adaptations for work - cognitive mechanisms for toolmaking, resource acquisition, learning, and cooperative production - evolved in the context of small networks of hunter-g
- ext#69 · replicated · supporting: Experience of control produces lasting immunization via plasticity in vmPFC-DRN pathway. Prior escapable shock prevents passivity/anxiety from later inescapable shock even in completely different situations (trans-situational). This 'immunization' requires new protein synthesis i
- ext#159 · longitudinal · supporting: "A large body of evidence now exists that supports the demand/control model: people whose jobs are characterised by high demands and low control have a higher risk of developing coronary heart disease than others in jobs with more control. Our own Whitehall II study in the British civil service showed stronger support for the effects of low control on heart disease than for the adverse effects of high demand. Other studies in the US and Sweden, however, do show that a combination of high demand and low control is harmful to health. We also found a strong relation between low control at work and depressive symptoms."
- (+2 more linked extraction(s))

*Confidence note: Grade DOWNGRADED from 'replicated' to 'longitudinal' on adversarial review. The Maier-Seligman CONTROLLABILITY MECHANISM (extractions 66/68/69, all work 32) is genuinely replicated full-text - contingency detection, the passivity-default inversion, and trans-situational immunization - and Whitehall II (159, longitudinal) provides independent population confirmation that low control causes coronary disease. However, those replicated items are all one synthesizing source-work (32); the PARAMETER's ancestral-subsistence framing ('effort-outcome links visible and physical in forager work') rests solely on the van Vugt mismatch synthesis (583/587, work 102, quality=theoretical). So the EEA-baseline claim itself is not replicated - the softer link is the bridge from lab/epidemiology to the ancestral baseline. 'longitudinal' honestly reflects that the strongest PARAMETER-LEVEL outcome evidence is the Whitehall II longitudinal finding, while the mechanism beneath it is replicated and the EEA mapping is theoretical. eea_value is null because contingency is qualitative, not a number.*

#### Task diversity within the subsistence day
`EEA-SUBS-03 · Subsistence & time-use` — **grade: theoretical**

**EEA baseline.** A forager's day cycled through a wide and shifting portfolio of tasks - tracking, gathering, digging, processing, toolmaking/repair, child-tending, food sharing, travel - recruiting varied skills and continually engaging the appetitive SEEKING/exploration system across novel and changing problems. The evolved exploratory-pursuit substrate (mesolimbic-dopamine SEEKING) is built for persistent inquisitive engagement with a varied environment, not for indefinitely repeating one narrow operation.

**Modern default.** Industrial and much digital work narrows the day to repetitive, specialized, often single-task operation - high repetition, low task variety, minimal novel problem-solving - with the SEEKING system left chronically under-stimulated by the work itself and frequently redirected onto engineered supernormal substitutes (feeds, games, variable-ratio rewards) off the clock.

**The gap.** The gap is the collapse from a high-variety, skill-diverse subsistence portfolio to narrow repetitive specialization, under-engaging the exploratory-pursuit system whose canonical evolved function is varied engagement with a changing world. This row is included because it meets the 3-part rule, but the EEA quantification of 'task diversity' is not pinned down in Cor's evidence.

**Resolution unit.** Genuine variety of self-directed, skill-recruiting tasks across the day that engage exploration and problem-solving - not nominal 'multitasking' (rapid switching among equally shallow operations) and not enrichment proxies bolted on outside the core work.

**Serves mechanisms:** M2 - Pursuit / Exploration

**Evidence (3 links):**

- ext#583 · theoretical · primary: Ancestral work was characteristically small-group, embodied, skill-based, and autonomy-rich. Psychological adaptations for work - cognitive mechanisms for toolmaking, resource acquisition, learning, and cooperative production - evolved in the context of small networks of hunter-g
- ext#251 · theoretical · supporting: "The SEEKING system (see Chapter 8): This emotional system is a coherently operating neuronal network that promotes a certain class of survival abilities. This system makes animals intensely interested in exploring their world and leads them to become excited when they are about to get what they desire. It eventually allows animals to find and eagerly anticipate the things they need for survival, including, of course, food, water, warmth, and their ultimate evolutionary survival need, sex. In other words, when fully aroused, it helps fill the mind with interest and motivates organisms to"
- ext#397 · replicated · supporting: "The SEEKING, or expectancy, system is characterized by a persistent exploratory inquisitiveness. This system engenders energetic forward locomotion - approach and engagement with the world - as an animal probes into the nooks and crannies of interesting places, objects, and events in ways that are characteristic of its species."

*Confidence note: Grade UNCHANGED at 'theoretical' - correctly the lowest substantive grade and honest. Adversarial note: the primary extraction 583 says ancestral work was 'small-group, embodied, skill-based, and autonomy-rich' but does NOT itself use or measure 'task diversity' - the diversity reading is the draft's inference from 'skill-based.' The SEEKING substrate (251 Panksepp, 397) is well-grounded as the evolved appetitive system, but Cor holds NO extraction linking task variety PER SE to a health/affect outcome. This is the softest included row, assembled by inference; it remains a candidate for removal if direct task-diversity evidence is demanded. Confidence wording tightened to flag that 583 does not state 'diversity' explicitly.*

#### Daily subsistence work-hours (contested)
`EEA-SUBS-04 · Subsistence & time-use` — **grade: contested** · **CONTESTED**

**EEA baseline.** QUALITATIVE ONLY. The duration of daily subsistence effort in the EEA is genuinely unresolved and must not be stated as a number. The 'original affluent society' position (Sahlins/Lee) reads the data as short food-quest hours and ample leisure; the opposing reading (Kaplan/Hawkes/Pontzer, and Lieberman's own qualifications) emphasizes that total productive effort includes processing, childcare, toolwork, and travel, and that activity is modest-intensity but spread across the day. What the full-text evidence DOES support qualitatively is that forager workloads are not 'backbreaking' and that overall energetic activity is only modestly above a sedentary Westerner's - but this does not license any specific daily work-hour figure.

**Modern default.** Modern work is organized around fixed, externally scheduled, often long and boundary-less hours (clock-time labor, always-on digital availability) - a structurally different time-architecture from intermittent, self-paced, weather- and resource-contingent subsistence effort, regardless of what the ancestral hour-count actually was.

**The gap.** The defensible mismatch is in the STRUCTURE of work-time (externally clocked, continuous, boundary-less vs. intermittent, self-paced, contingent), not in any claimed reduction or increase in daily hours. Asserting a specific ancestral work-hour number - in either direction - would import a contested anthropological position as if it were settled, which it is not.

**Resolution unit.** Self-paced, resource-contingent, intermittently-bounded work time - the time ARCHITECTURE (when and how effort is scheduled and bounded), not a target number of daily hours.

**Serves mechanisms:** M10 - Movement / Regulatory, M2 - Pursuit / Exploration, M6 - Controllability / Agency

**Evidence (3 links):**

- ext#196 · clinical · challenging: "Among the many studies of the Hadza, one asked forty-six Hadza adults to wear lightweight heart rate monitors for several days. According to these sensors, the average adult Hadza spends a grand total of three hours and forty minutes a day doing light activities and two hours and fourteen minutes a day doing moderate or vigorous activities. Although these few hours of hustling and bustling per day make them about twelve times more active than the average American or European, by no stretch of the imagination could one characterize their workloads as backbreaking. On average, the women walk five miles a day and dig for several hours, whereas the men walk between seven and ten miles a day. And when they aren't being very active, they typically rest or do light work."
- ext#197 · replicated · challenging: "Although there is much variation, PALs of hunter-gatherers average 1.9 for men and 1.8 for women, slightly below PAL scores for subsistence farmers, which average 2.1 for men and 1.9 for women. To put these values into context, hunter-gatherer PALs are about the same as those of factory workers and farmers in the developed world (1.8), and about 15 percent higher than PALs of people with desk jobs in developed countries (1.6). In other words, typical hunter-gatherers are about as physically active as Americans or Europeans who include about an hour of exercise in their daily routine. In case you are wondering, most mammals in the wild have PALs of 3.3 or more, nearly twice as high as hunter-gatherers. Thus, comparatively speaking, humans who must hunt and gather all the food they eat and make everything they own by hand are substantially less active than average free-ranging mammals."
- ext#200 · contested · challenging: "When Herman Pontzer and his colleagues measured daily energy expenditures in the Hadza, they were surprised to find that the highly active Hadza spend about the same total number of calories per day as sedentary industrialized people with the same lean body weight. In addition, when Pontzer and colleagues collected energetic data from adults in many countries including the United States, Ghana, Jamaica, and South Africa, they observed that more active people spent only slightly more calories per day than more sedentary people who weighed the same. In addition, individuals who were more physically active didn't have total energy budgets as high as their exertions would predict. How could someone who spent five hundred extra calories a day exercising not have a total energy budget that is five hundred calories higher? The proposed explanation is that people's total energy budgets are constrained: if I use five hundred extra calories walking, I'll spend less energy on my resting metabolism to help pay for my exertions."

*Confidence note: HARD-RULE row, fully compliant and UNCHANGED. The original-affluent-society debate is live: Sahlins/Lee vs Kaplan/Hawkes/Pontzer. eea_value is NULL and NO daily work-hour number is asserted anywhere. All three cited extractions are correctly tagged 'challenging' and support only the qualitative bounded claims (workloads modest/not backbreaking per 196; PAL only ~15% above desk per 197; constrained energetics itself contested per 200) - offered as context for why a clean hour-count cannot be stated, not as a measurement of work duration. Grade is the lowest applicable ('contested').*


### Diet & metabolic

#### Food diversity and seasonality (whole-food, micronutrient-dense, omnivorous variety)
`EEA-DIET-01 · Diet & metabolic` — **grade: theoretical** · **CONTESTED**

**EEA baseline.** Ancestral intake came from a wide, seasonally rotating array of wild plant and animal foods eaten in their whole, minimally altered form. Diet composition shifted with paleontological period, geography, and season, sustaining the broad versatility typical of an omnivore. Macronutrient and micronutrient profiles diverged sharply from the modern Western diet in nearly every measurable dimension at once: higher protein share, dramatically less refined carbohydrate and added sugar, lower sodium, higher potassium, higher micronutrient density, and near-zero processed food.

**EEA value** (illustrative, not constants):

  - note: Specific paleo-diet macronutrient figures are reconstructions and the exact numbers are contested; direction of divergence is robust, magnitude is not.
  - sodium: low
  - potassium: high
  - added_sugar: minimal
  - seasonality: high (composition tracked season/geography)
  - processed_food: near-zero
  - micronutrient_density: high
  - protein_pct_calories_approx: 34
  - modern_protein_pct_calories_approx: 12

**Modern default.** A narrow, year-round-uniform diet built largely from a handful of refined commodity crops (wheat, corn, soy, sugar, refined oils) recombined into processed and ultra-processed products. Seasonality is erased by global supply chains; micronutrient density falls while energy density rises; near-total replacement of whole foods with industrially formulated ones.

**The gap.** The modern food environment collapses a seasonally varied, micronutrient-dense, whole-food omnivory into a year-round monotony of refined, energy-dense, nutrient-diluted products, removing both the variety and the whole-food matrix the metabolic and digestive systems were calibrated to.

**Resolution unit.** Whole-food matrix and dietary variety, not any single 'good' or 'bad' nutrient: the mismatch is in the wholesale shift to refined, processed forms across the whole diet, not in one macronutrient ratio.

**Serves mechanisms:** M13 - Energy Regulation

**Evidence (3 links):**

- ext#39 · clinical · primary: Ancestral human diet was characterized by: higher protein (34% vs 12% of calories), dramatically lower refined carbohydrate and sugar, higher fiber (100-150g/day vs 20g), lower sodium, higher potassium, higher micronutrient density, and near-zero processed food. Modern Western di
- ext#38 · theoretical · supporting: The discordance hypothesis: the human genome was shaped under Paleolithic nutritional conditions and has changed negligibly since the advent of agriculture (~10,000 years ago). Modern diseases of civilization - atherosclerosis, hypertension, obesity, diabetes - result from the mi
- ext#471 · theoretical · supporting: Eaton & Konner analyzed nutritional properties of wild game and uncultivated vegetable foods and evaluated archaeological remains to reconstruct Paleolithic diet composition. Their model was derived from 69 game and wild vegetable items. Humanity has existed as a genus for about

*Confidence note: VERIFIED. The DIRECTION of divergence (less processed, more micronutrient-dense, more varied ancestrally) is well-supported; ext 39 (corpus-clinical, primary) carries the clean nutrient-profile claim including the 34% vs 12% protein figures verbatim. The SPECIFIC reconstructed numbers and the seasonality claim rest on Paleolithic-nutrition reconstructions: ext 471 (quarantined, snippet-sourced) is the only seasonality anchor and is cited supporting-only, never load-bearing. Held theoretical + contested because the row's distinctive seasonality/variety claim rests on a quarantined source even though the core nutrient-profile claim is clinical. Confirmed all 3 cited ids exist and support their roles.*

#### Satiety-honest fiber and whole-food matrix (food that signals fullness truthfully)
`EEA-DIET-02 · Diet & metabolic` — **grade: theoretical** · **CONTESTED**

**EEA baseline.** Ancestral foods were fibrous, water- and bulk-rich, and slow to eat and digest, so the volume and macronutrient signals reaching satiety circuits tracked the actual caloric load. Reconstructions place ancestral fiber intake far above modern levels (on the order of 100-150 g/day vs ~20 g today). Sweetness, fat, and salt arrived bundled inside a whole-food matrix and at concentrations that were ancestrally rare, so the reward-system's responses to those cues were honest proxies for nutritional value.

**EEA value** (illustrative, not constants):

  - note: Fiber figures are reconstructions; treat magnitude as approximate.
  - sweet_fat_salt_availability: ancestrally rare, bundled in whole-food matrix
  - fiber_g_per_day_modern_approx: 20
  - fiber_g_per_day_ancestral_estimate: 100-150

**Modern default.** Ultra-processed, hyperpalatable products engineered to the 'bliss point' - the mathematically optimized concentration of sugar, fat, and salt that maximizes craving - stripped of fiber and whole-food bulk. These foods decouple palatability from nutritional value and deliver calories faster than satiety signaling can register them, so the evolved fullness/reward proxies no longer track intake. Ultra-processed hyperpalatability is the modern proxy that defeats satiety.

**The gap.** Industrial formulation deliberately separates the reward cues (sweet/fat/salt) from the satiety cues (fiber, bulk, slow digestion) the two were ancestrally bundled together, so modern hyperpalatable food drives consumption past the point the body would otherwise stop, defeating the honest-signal logic of appetite regulation.

**Resolution unit.** Satiety-honesty of food (does palatability track nutritional/caloric load?), not calorie count alone: the failure is the engineered decoupling of reward from fullness, not merely high energy density.

**Serves mechanisms:** M13 - Energy Regulation

**Evidence (5 links):**

- ext#39 · clinical · primary: Ancestral human diet was characterized by: higher protein (34% vs 12% of calories), dramatically lower refined carbohydrate and sugar, higher fiber (100-150g/day vs 20g), lower sodium, higher potassium, higher micronutrient density, and near-zero processed food. Modern Western di
- ext#75 · clinical · supporting: Moss documents how the food industry systematically optimizes products for the "bliss point" - the precise concentration of sugar, fat, and salt that maximizes sensory pleasure and craving. Howard Moskowitz, a mathematician and experimental psychologist, built a consulting empire
- ext#439 · clinical · supporting: "To plot what industry insiders call the 'bliss point,' or the precise amount of sugar or fat or salt that will send consumers over the moon. At a laboratory in White Plains, New York, industry scientists who perform this alchemy walked me, step by step, through the process of engineering a new soda so that I could see the creation of bliss firsthand."
- ext#76 · clinical · supporting: Moss reveals through internal industry sources that food companies knowingly engineer products to exploit evolved taste preferences and are aware of the overconsumption consequences. At a secret 1999 meeting of eleven food industry CEOs, Pillsbury executive James Behnke confronte
- ext#440 · clinical · supporting: "These were the three pillars of processed food, the creators of crave, and each of the CEOs needed them in huge quantities to turn their products into hits."

*Confidence note: VERIFIED with one role correction. The modern half (bliss-point engineering that defeats satiety) is strongly evidenced by full-text industry-sourced extractions 75, 439, 76, 440 (all corpus-clinical, content confirmed). The ancestral fiber NUMBER is a reconstruction (ext 39, which states 100-150 vs 20 g/day verbatim) and the precise figure is contested, so the parameter is graded theoretical + contested. CORRECTION: ext 75 was mislabeled 'challenging' in the draft - it documents the modern mismatch mechanism (bliss-point optimization), which SUPPORTS the parameter's modern-default claim rather than challenging the parameter. Re-roled to supporting. All 5 ids confirmed to exist and match their content.*

#### Acquisition effort (calories are physically worked for)
`EEA-DIET-03 · Diet & metabolic` — **grade: clinical**

**EEA baseline.** Food had to be physically acquired: walked to, foraged, dug, hunted, and processed. Among the Hadza, men walk roughly 7-10 miles/day and women ~5 miles/day plus several hours of digging; broader hunter-gatherer daily travel is on the order of ~10 km. This embeds substantial obligate movement and a real energetic and time cost between hunger and calories. Note: the absolute activity premium over sedentary moderns is modest (hunter-gatherer PAL ~1.8-1.9 vs ~1.6 for desk workers, ~15% higher), so the baseline is 'embedded all-day effort,' not extreme athleticism.

**EEA value** (illustrative, not constants):

  - note: Daily-movement/km figure is solid-ish; do NOT read this as a daily WORK-HOURS figure — total subsistence work-hours are contested (see gap and held_out).
  - desk_worker_PAL: ~1.6
  - hunter_gatherer_PAL: 1.8-1.9
  - hadza_men_miles_per_day: 7-10
  - hadza_women_miles_per_day: ~5 plus hours digging
  - hunter_gatherer_daily_travel_km_approx: ~10

**Modern default.** Calories require essentially zero acquisition effort: hyperpalatable, energy-dense food is available on demand, pre-processed, often delivered, with no movement, foraging, or processing cost between impulse and ingestion. The effort gate that historically bounded intake is gone.

**The gap.** Removing the work between hunger and food eliminates a natural brake on consumption and decouples eating from the obligate daily movement it was bundled with - calories are now frictionless to obtain and detached from the physical activity that ancestrally accompanied acquisition.

**Resolution unit.** Incidental, embedded, all-day acquisition movement (walking, foraging, carrying, digging) - NOT 'exercise' as a discrete bout. The mismatch is the loss of effort woven through daily food-getting, not a missing gym session. Daily distance/movement is solid; a specific subsistence work-HOURS number is contested and is not asserted here.

**Serves mechanisms:** M10 - Movement / Regulatory, M13 - Energy Regulation

**Evidence (3 links):**

- ext#196 · clinical · primary: "Among the many studies of the Hadza, one asked forty-six Hadza adults to wear lightweight heart rate monitors for several days. According to these sensors, the average adult Hadza spends a grand total of three hours and forty minutes a day doing light activities and two hours and fourteen minutes a day doing moderate or vigorous activities. Although these few hours of hustling and bustling per day make them about twelve times more active than the average American or European, by no stretch of the imagination could one characterize their workloads as backbreaking. On average, the women walk five miles a day and dig for several hours, whereas the men walk between seven and ten miles a day. And when they aren't being very active, they typically rest or do light work."
- ext#197 · replicated · supporting: "Although there is much variation, PALs of hunter-gatherers average 1.9 for men and 1.8 for women, slightly below PAL scores for subsistence farmers, which average 2.1 for men and 1.9 for women. To put these values into context, hunter-gatherer PALs are about the same as those of factory workers and farmers in the developed world (1.8), and about 15 percent higher than PALs of people with desk jobs in developed countries (1.6). In other words, typical hunter-gatherers are about as physically active as Americans or Europeans who include about an hour of exercise in their daily routine. In case you are wondering, most mammals in the wild have PALs of 3.3 or more, nearly twice as high as hunter-gatherers. Thus, comparatively speaking, humans who must hunt and gather all the food they eat and make everything they own by hand are substantially less active than average free-ranging mammals."
- ext#427 · theoretical · supporting: "Walk or run 10 kilometers (6.2 miles) a day (barefoot, of course), climb a few trees, chase squirrels in the park, throw rocks, eschew chairs, and sleep on a board instead of a mattress."

*Confidence note: VERIFIED. Grounded in full-text Hadza energetics (ext 196, corpus-clinical, confirms men 7-10 mi/day, women ~5 mi + hours digging) and cross-population PAL/distance data (ext 197 corpus-replicated; ext 427 theoretical, 10 km/day). Per hard rule, only the daily-movement/distance side (solid-ish) is asserted; NO daily subsistence work-hours number, which remains contested (Sahlins/Lee vs Kaplan/Hawkes/Pontzer). The absolute premium is deliberately stated as modest to avoid the 'noble-savage athlete' overclaim - consistent with ext 196/197 which both explicitly downgrade the magnitude. Clinical grade rests on ext 196 (clinical movement data). NOTE: ext 196 and 427 are M10-tagged only; the M13 'effort-as-brake-on-intake' is interpretive framing (not directly stated in any cited extraction) - M10 is the solidly-grounded mechanism here. All 3 ids confirmed.*

#### Energy regulation is intake-bounded (total expenditure is homeostatically buffered, not behavior-throttled)
`EEA-DIET-04 · Diet & metabolic` — **grade: replicated**

**EEA baseline.** Total daily energy expenditure (TEE) is an evolved, species-typical trait that the body holds within a narrow range, compensating metabolically rather than expending proportionally more as physical activity rises. Hunter-gatherers and subsistence populations expend about the same total daily energy as industrialized adults of the same body size despite far greater physical activity; the same wild-vs-captive constancy appears across mammals. Ancestrally, the binding constraint on energy balance was therefore food INTAKE (how much could be acquired and its composition), not how many calories activity could burn off.

**EEA value** (illustrative, not constants):

  - finding: TEE constant across activity levels after controlling for body size
  - implication: Obesity difference between Hadza and Westerners lies in intake/composition, not in expenditure.
  - populations: ["Ghana", "Jamaica", "Seychelles", "South Africa", "US"]
  - doubly_labeled_water_n: 332
  - kcal_per_100CPM_above_moderate: <50
  - constrained_TEE_change_point_CPM_per_day: 230

**Modern default.** The dominant lay (and much policy) model treats body weight as 'calories in minus calories out' with exercise as the lever for the 'out' side. Because expenditure is homeostatically buffered, this model fails: cranking up activity yields little net caloric deficit, while the intake side - driven by hyperpalatable, energy-dense, effortless food - is what has changed and what dysregulates energy balance.

**The gap.** Modern environments leave intake unbounded (cheap, hyperpalatable, effortless calories) while the body's expenditure stays homeostatically capped - so the one variable the system relied on as the binding constraint (limited, worked-for food) is exactly the one industrialization removed, and the popular 'just exercise it off' remedy targets the wrong, buffered side.

**Resolution unit.** The binding constraint on energy balance: ancestrally INTAKE (food availability/composition), not expenditure. The mismatch is unbounded intake, not insufficient calorie-burning; exercise is a weak proxy for the metabolic problem.

**Serves mechanisms:** M13 - Energy Regulation

**Evidence (4 links):**

- ext#286 · clinical · primary: "As expected, physical activity level, PAL, was greater among Hadza foragers than among Westerners. Nonetheless, average daily energy expenditure of traditional Hadza foragers was no different than that of Westerners after controlling for body size. The metabolic cost of walking and resting were also similar among Hadza and Western groups. The similarity in metabolic rates across a broad range of cultures challenges current models of obesity suggesting that Western lifestyles lead to decreased energy expenditure."
- ext#283 · theoretical · supporting: "Here we tested a Constrained total energy expenditure model, in which total energy expenditure increases with physical activity at low activity levels but plateaus at higher activity levels as the body adapts to maintain total energy expenditure within a narrow range. We compared total energy expenditure, measured using doubly labeled water, against physical activity, measured using accelerometry, for a large (n = 332) sample of adults living in five populations. After adjusting for body size and composition, total energy expenditure was positively correlated with physical activity, but the relationship was markedly stronger over the lower range of physical activity. For subjects in the upper range of physical activity, total energy expenditure plateaued, supporting a Constrained total energy expenditure model."
- ext#284 · theoretical · supporting: "People in less socioeconomically developed populations, including subsistence farmers and traditional hunter-gatherers, have total energy expenditures similar to those in more developed populations despite substantial differences in physical activity. Mammals living in the wild, including non-human primate species, have total energy expenditures similar to captive populations. These population-level comparisons suggest that total energy expenditure is an evolved, species-specific trait that is homeostatically buffered against variation in habitual physical activity."
- ext#287 · theoretical · supporting: "We hypothesize that human daily energy expenditure may be an evolved physiological trait largely independent of cultural differences."

*Confidence note: VERIFIED - 'replicated' is HONEST here, one of the few rows that genuinely earns it. The constrained-TEE / expenditure-buffering finding is multi-population doubly-labeled-water replicated (ext 283 n=332 five populations, ext 284 cross-population + cross-species wild-vs-captive, both corpus-replicated, primary, full-text) and originated in the Hadza study (ext 286, clinical). The downstream inference - obesity difference lies in intake/composition - is EXPLICITLY stated in ext 286 content ('the obesity difference must lie primarily in energy intake and food composition') and ext 287 content, not extrapolated. Draft correctly leaned on primary Pontzer extractions and did NOT cite ext 200 (corpus-contested Lieberman propagation), avoiding over-grading. Fasting/feast-famine cycles correctly held out (no supporting extraction). All 4 ids confirmed.*


### Threat & safety

#### Threat temporality (acute, episodic, escapable-by-action)
`EEA-THREAT-01 · Threat & safety` — **grade: theoretical**

**EEA baseline.** Ancestral threats were overwhelmingly acute and episodic: predators, conspecific aggression, falls, rapid environmental dangers. Each was a short, life-or-death encounter resolved within seconds-to-minutes by a discrete motor response (flee, fight, freeze, hide), after which the threat-detection system stood down and physiology returned to baseline. The fight-or-flight architecture was selected to spike hard and briefly, then terminate. Threat exposure was thus pulsatile, not continuous.

**EEA value** (illustrative, not constants):

  - duty_cycle: low_intermittent
  - quantified: False
  - resolution_mode: discrete_motor_action_then_standdown
  - temporal_profile: acute_episodic_pulsatile
  - typical_episode_duration: seconds_to_minutes

**Modern default.** Modern stressors are chronic and non-terminating: the overbearing boss, the long commute, financial precarity, abstract status anxiety, always-on connectivity. The same stressor persists hour after hour, year after year, over a lifespan far longer than the ancestral norm, while the sympathetic/parasympathetic architecture is unchanged. The threat system is engaged at a low chronic duty cycle it was never built to sustain, and the beneficial acute response becomes damaging on the chronic timescale.

**The gap.** The mismatch is in the time-course, not the threat machinery itself. The system is calibrated for brief, resolvable spikes; modern life supplies sustained, unresolved activation. Acute stress is adaptive (even enhances immunity); the identical response sustained chronically suppresses immunity and accumulates wear-and-tear. The gap is the absence of an episode boundary that lets the response shut down.

**Resolution unit.** Calibrate to threat TEMPORALITY (episode duration and duty cycle with a terminating standdown), not threat magnitude or count. A single intense-but-resolved spike is ancestral-normal; a mild-but-unending engagement is the mismatch. The unit is 'does the activation episode end and the system return to baseline,' not 'how scary was it.'

**Serves mechanisms:** M1 - Threat Management, M8 - Immune Regulation

**Evidence (4 links):**

- ext#150 · theoretical · primary: "In contemporary society, as we've noted, most of our stressors do not come and go in the kind of short, life-or-death confrontations that drove the evolution of 'fight or flight.' We can have the same overbearing boss, the same long commute, the same worries about health care and retirement, and the same feelings of social isolation, hour after hour, year after year. Moreover, we now experience these persistent stressors over a life span that, on average, extends well beyond what was the norm during all but the last few centuries of our species' existence. The environment is entirely different now than it was in our environment of evolutionary adaptation"
- ext#331 · replicated · primary: "while the acute stress response involves enhanced immunity, chronic stress suppresses immunity, increasing vulnerability to some infectious diseases."
- ext#130 · replicated · supporting: "Acute and chronic stress cause an imbalance of neural circuitry subserving cognition, decision making, anxiety and mood that can increase or decrease expression of those behaviors and behavioral states. In the short term, such as for increased fearful vigilance and anxiety in a threatening environment, these changes may be adaptive; but, if the danger passes and the behavioral state persists along with the changes in neural circuitry, such maladaptation may need intervention"
- ext#345 · theoretical · supporting: "the Smoke Detector Principle. Most of the responses that cause human suffering are unnecessary in the individual instance but still perfectly normal because they have low costs but protect against huge possible losses. They are like false alarms from smoke detectors. The occasional wail when you burn the toast is worth it to ensure that you are warned"

*Confidence note: The acute-vs-chronic physiology is replicated in the corpus (Sapolsky id 331; McEwen id 130, both graded replicated): acute stress enhances and chronic stress suppresses immunity, and short-term vigilance changes that persist after the danger passes become maladaptive. The mismatch FRAMING (ancestral pulsatile vs modern continuous) is interpretive and rests on Cacioppo's prose (id 150, theoretical), so the row is graded theoretical per the rule that mismatch interpretations stay theoretical, even though the underlying stress biology is well-replicated. No daily threat-frequency number is asserted.*

#### Threat controllability and predictability (resolvable by own action)
`EEA-THREAT-02 · Threat & safety` — **grade: theoretical**

**EEA baseline.** Ancestral threats were typically controllable and predictable in the relevant sense: the animal's own behavior (run, climb, hide, defend, call allies) reliably altered the outcome, and the threat's presence/absence was perceptually verifiable. Uncontrollable, action-proof stressors were the rare and pathological case. The threat system evolved on the expectation that vigilance would be followed by an effective response that resolves the danger.

**EEA value** (illustrative, not constants):

  - quantified: False
  - predictability: perceptually_verifiable
  - controllability: high_action_contingent
  - uncontrollable_stress: rare_exceptional

**Modern default.** Many modern stressors are structurally uncontrollable and unpredictable: algorithmic management and electronic monitoring strip decision latitude, outcomes hinge on systems no single action can move, and dread is open-ended (an unknown deadline, an unbounded threat). No behavior reliably terminates the stressor, producing the conditions for learned helplessness and chronic anticipatory dread.

**The gap.** What is pathogenic is not threat per se but uncontrollability/unpredictability: the absence of an action that resolves the danger. Lab work shows lack of predictability and control is so aversive that subjects choose a stronger immediate shock over waiting, and chronic uncontrollable stress reproduces eight of nine DSM depression symptoms. Modern environments systematically supply unresolvable, action-proof stressors - the mismatch.

**Resolution unit.** Calibrate to CONTROLLABILITY = whether a behavioral response reliably terminates or averts the threat, not to mere familiarity or low intensity. A predictable-but-uncontrollable stressor (you see it coming, nothing you do helps) is the toxic case; an unfamiliar-but-action-resolvable one is ancestral-normal.

**Serves mechanisms:** M1 - Threat Management, M6 - Controllability / Agency

**Evidence (3 links):**

- ext#333 · replicated · primary: "In another study subjects waited an unknown length of time to receive a shock. This lack of predictability and control was so aversive that many chose to receive a stronger shock immediately. And in the others the period of anticipatory dread increasingly activated the amygdala."
- ext#442 · replicated · primary: "Learned helplessness in the laboratory - combining the animal and human experimental results - produced eight of the nine symptoms [of depression], with the only exception being suicide and suicidal thoughts."
- ext#587 · theoretical · supporting: Electronic monitoring and algorithmic management in digital work environments reduce worker decision latitude, triggering M6 controllability failure (learned helplessness default). Combined with status-threat from visible performance metrics and always-on availability expectation

*Confidence note: The controllability/predictability physiology is replicated (Sapolsky id 333; learned-helplessness id 442, both graded replicated). The EEA-baseline claim that ancestral threats were predominantly controllable is interpretive (no extraction quantifies ancestral controllability), so graded theoretical per the mismatch-interpretation rule, with the underlying control science noted as replicated. Mechanism set includes M6 because the controllability evidence (ids 333, 442) is jointly tagged M1/M6 in the corpus (verified); threat_safety borrows M6 here for the control dimension rather than re-deriving it.*

#### Real-vs-perceived threat ratio and all-clear resolution
`EEA-THREAT-03 · Threat & safety` — **grade: theoretical**

**EEA baseline.** Ancestral threat activations were predominantly responses to real, present, perceptually-verifiable dangers, and crucially each activation was terminated by an all-clear: the predator left, the danger passed, safety was confirmed. The smoke-detector logic produced many false alarms (a 1000:1 cost asymmetry makes ~999 false alarms per real escape optimal), but each alarm - true or false - was followed by behavioral resolution and a return to baseline, often reinforced by a SOCIAL all-clear (proximity, touch, return to the group), which returns the threat-responsive brain to relative calm.

**EEA value** (illustrative, not constants):

  - quantified: False
  - resolution: behavioral_all_clear_plus_social_all_clear
  - termination: reliable
  - alarm_validity: mostly_real_present_verifiable
  - false_alarm_rate: high_but_each_resolved

**Modern default.** Modern threats are disproportionately abstract, displaced, or symbolic (news cycles, notifications, status comparison, anticipated catastrophes) with no present referent to verify as gone and no terminating action that delivers an all-clear. The smoke-detector system keeps firing on cues it cannot resolve; social all-clear is attenuated by isolation. Activation that should be transient becomes chronic, shifting the body budget toward sustained inflammation and allostatic load.

**The gap.** The pathogenic feature is the broken resolution loop: ancestrally, alarms (real or false) closed with an all-clear; modern abstract threats supply alarms that never close. Chronically unbalanced body budgeting and unbridled inflammation are implicated in chronic stress, anxiety, depression and physical disease (Barrett; McEwen allostatic load). The mismatch is the missing terminating action and missing social all-clear, not the false-alarm rate itself - false alarms were always common and were tolerated precisely because they resolved.

**Resolution unit.** Calibrate to RESOLVABILITY: a present threat that a behavioral all-clear (and a social all-clear via proximity/touch/reunion) can terminate - NOT bare threat count or alarm frequency. The ancestral system tolerated abundant false alarms; what it did not tolerate, and what modernity supplies, is alarms with no all-clear. The unit is 'can this activation be closed,' not 'how many alarms occur.'

**Serves mechanisms:** M1 - Threat Management, M8 - Immune Regulation

**Evidence (6 links):**

- ext#331 · replicated · primary: "while the acute stress response involves enhanced immunity, chronic stress suppresses immunity, increasing vulnerability to some infectious diseases."
- ext#469 · meta_analysis · primary: "The price of this accommodation to stress can be allostatic load, which is the wear and tear that results from chronic overactivity or underactivity of allostatic systems."
- ext#308 · theoretical · supporting: "My view is that some major illnesses considered distinct and "mental" are all rooted in a chronically unbalanced body budget and unbridled inflammation. We categorize and name them as different disorders, based on context, much like we categorize and name the same bodily changes as different emotions."
- ext#565 · theoretical · supporting: "Out of 1000 episodes of flight at this response threshold, on the average, 999 will be false alarms and only 1 will be flight from an actual predator."
- ext#125 · replicated · supporting: Although the brain is highly responsive to perceived threat, even simple handholding can substantially attenuate threat responses. These effects are potentiated by higher relationship quality, intimacy, and higher perceived mutuality. Critically, the likeliest mechanisms linking
- (+1 more linked extraction(s))

*Confidence note: Strong supporting physiology: the M8 allostatic-load chain is meta_analysis (McEwen id 469) and replicated (Sapolsky id 331), and the social all-clear is replicated (Coan/SBT handholding id 125). The integrative 'real-vs-perceived ratio with missing all-clear' framing is itself an interpretive mismatch synthesis, so graded theoretical, but it is the best-evidenced of the three threat rows on the downstream-immune side. No frequency number is asserted; the high false-alarm rate is presented as ancestral-normal (id 565, theoretical signal-detection formalization), not as a defect. Note: prose previously referenced ids 339/444 in passing; only ids actually in the evidence array (331, 469, 308, 565, 125, 461) are load-bearing and all are verified.*


### Information environment

#### Signal provenance and accountability (information from known, reputation-bearing, face-to-face sources)
`EEA-INFO-01 · Information environment` — **grade: contested** · **CONTESTED**

**EEA baseline.** Ancestrally, virtually all socially consequential information reached an individual through known, identifiable, reputation-bearing senders within a face-to-face band. A claim about who did what, where the game was, who could be trusted, or what was dangerous arrived attached to a specific person whose track record was known and who was themselves accountable to the same dense web of relationships. There was no anonymous, unaccountable, or de-contextualized information channel: the source of a signal and the receiver's ability to weigh that source by its history were inseparable. Boehm's ethnography of forager gossip describes a band that effectively keeps a running 'dossier' on every individual - provenance was the substrate of trust.

**Modern default.** Most information now arrives through anonymous, algorithmically-mediated, or institutionally-impersonal channels in which the sender's identity, track record, and accountability to the receiver are absent or unverifiable. The shift Tomasello describes - from face-to-face 'I-you' exchange to impersonal 'we-as-group' broadcast - is taken to an extreme by mass and digital media, where signals are detached from any reputation-bearing source the receiver can sanction or even locate.

**The gap.** The evolved machinery for weighing information by source reputation and face-to-face accountability is deprived of the provenance cues it was calibrated to use. Receivers must evaluate high-stakes claims from sources they cannot place in any reputational web, and senders bear little reputational cost for deception - removing the gossip/ostracism feedback loop that ancestrally policed signal honesty.

**Resolution unit.** Proportion of consequential information arriving from a known, reputation-bearing, accountable source the receiver can locate and sanction - NOT raw access to information or number of contacts. A person can be flooded with information yet have almost none of it carry verifiable provenance.

**Serves mechanisms:** M11 - Cooperation / Alliance, M3 - Social Bonding, M5 - Status Monitoring

**Evidence (3 links):**

- ext#373 · replicated · primary: "In effect, the band keeps a dossier on every individual, noting positive and negative points. Group members exercise the right to take action if a deviant begins to intimidate other group members individually - or threatens the social equilibrium of the group or its very ability to function."
- ext#509 · theoretical · supporting: "it may be that face-to-face meetings are required from time to time to prevent friendships, in particular, sliding down through the network layers and eventually slipping over the edge of the 150 layer into the category of acquaintances."
- ext#250 · theoretical · supporting: "The second step, reflecting the focus of culture theorists such as Vygotsky and Bakhtin, came as human populations began growing in size and competing with one another. This competition meant that group life as a whole became one big collaborative activity, creating a much larger and more permanent shared world, that is to say, a culture. The resulting group-mindedness among all members of the cultural group (including in-group strangers) was based on a new ability to construct common cultural ground via collectively known cultural conventions, norms, and institutions."

*Confidence note: Speculative as a stand-alone EEA parameter. The underlying ethnography (forager information flow is gossip-borne and provenance-bound, Boehm/373) and the bonding requirement for face-to-face co-presence (Dunbar/509) are well-attested, but framing the modern anonymous-information channel as a distinct 'information_environment' mismatch is a theoretical extrapolation that overlaps heavily with social-structure (SOC-09 reputation) and M3 bonding parameters. Held at the lowest grade and eea_value=NULL because there is no clean ancestral metric for signal provenance. Mechanism codes retained: M11 (grounded by 373/250), M3 (grounded by 509, face-to-face co-presence), M5 (grounded by 373, reputational monitoring).*

#### Gossip and narrative flow as reputation and norm transmission
`EEA-INFO-02 · Information environment` — **grade: contested** · **CONTESTED**

**EEA baseline.** The dominant high-bandwidth information process in ancestral groups was gossip and narrative: talk about who behaved how, who is reliable or stingy, what happened, and what one ought to do. This stream did double duty - it transmitted norms, calibrated each person's reputation in the eyes of the group, and deterred free-riding because everyone knew gossip was constantly underway and anyone could become its subject. Boehm documents gossip, ridicule, and ostracism as the primary, low-cost enforcement mechanism against free-riders (bullies, the lazy, feigners, secret meat-eaters); Henrich notes that norm violations meant 'reputational damage, gossip, and a consequent loss of marriage opportunities and allies.' Information about people and norms was the central content of the ancestral information environment.

**Modern default.** Reputation- and norm-bearing narrative now flows largely through impersonal mass and digital media to audiences who cannot reciprocally gossip about, sanction, or verify the subjects - and much of the daily information stream is impersonal content (commercial, abstract, broadcast) rather than locally-actionable talk about known persons and norms. The tight loop in which gossip simultaneously informed, judged, and deterred within a single accountable group is broken: reputational narrative is broadcast without the reciprocal accountability that made it self-policing.

**The gap.** The gossip/narrative channel that ancestrally fused information transmission with reputation tracking and norm enforcement is decoupled. People consume reputational narrative about strangers they cannot sanction, and the norm-deterrence function (knowing the group is watching and will talk) is weakened in anonymous or one-to-many settings - leaving the evolved appetite for reputational narrative engaged but its enforcement payload disabled.

**Resolution unit.** Reputation/norm narrative circulating within a bounded group where subjects and audience are mutually known and can reciprocally sanction - NOT raw volume of social content consumed. Doomscrolling celebrity gossip is high-volume but supplies almost no actionable, reciprocal reputational signal.

**Serves mechanisms:** M11 - Cooperation / Alliance, M5 - Status Monitoring

**Evidence (3 links):**

- ext#373 · replicated · primary: "In effect, the band keeps a dossier on every individual, noting positive and negative points. Group members exercise the right to take action if a deviant begins to intimidate other group members individually - or threatens the social equilibrium of the group or its very ability to function."
- ext#375 · replicated · primary: "those who have things of value but do not give are subject to social control through gossip, ridicule or ostracism."
- ext#121 · theoretical · supporting: "cultural evolution initiated a process of self-domestication, driving genetic evolution to make us prosocial, docile, rule followers who expect a world governed by social norms monitored and enforced by communities."

*Confidence note: Speculative as an information_environment parameter and heavily overlapping with social-structure reputation (SOC-09) and M5 status. The forager gossip-as-norm-enforcement finding is robustly attested ethnographically (Boehm 373/375, both 'replicated' in-source; Henrich 121), but the claim that the MODERN information channel degrades this specific function is a mismatch interpretation, so the row is held at the lowest grade with eea_value=NULL. Distinct from EEA-INFO-01 in foregrounding the content (reputational/normative narrative) rather than the provenance of arbitrary signals. M3 was REMOVED from the draft mechanism set: none of the three cited extractions (373=M4/M5/M11, 375=M11/M4, 121=M11/M5) carry M3, and the row's content is about gossip/reputation/norm enforcement, not face-to-face bonding - M3 was unsupported here.*
