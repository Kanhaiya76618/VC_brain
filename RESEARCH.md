# VC Brain — research foundation

Every citation below was independently verified against the primary source on 19 July 2026. This document records which findings shaped the system's design, which popular features we deliberately rejected, and why. Confidence labels: **High** = peer-reviewed or primary source with robust method; **Medium** = credible but observational, single-sample, or funding-proxy outcomes; **Low** = hypothesis worth testing.

## Verified evidence base → design decisions

| Finding | Source | Confidence | How it shaped VC Brain |
|---|---|---|---|
| Entrepreneurs with a prior successful venture are more likely to succeed than first-timers or previously failed founders; persistence is partly skill (market/timing selection). | Gompers, Kovner, Lerner & Scharfstein, *Performance Persistence in Entrepreneurship*, JFE 96 (2010); [NBER w12592](https://www.nber.org/papers/w12592) | High | `prior_outcomes` is a Founder Score component — but weighted only 7/100, and **missing is neutral, never negative** (the association is population-level, structurally unavailable to first-timers, and not a causal rule). |
| Look-ahead bias is the dominant methodological failure in startup-success ML; only features known at time T may predict outcomes at T+n. 213,171-company Crunchbase study. | Żbikowski & Antosiuk, *A machine learning, bias-free approach for predicting business success using Crunchbase data*, [Information Processing & Management 58(4), 2021](https://www.sciencedirect.com/science/article/pii/S0306457321000595) | High | Every claim carries **four timestamps** (event / published / fetched / validated); recency scoring uses event time, so a 2023 commit fetched today cannot masquerade as fresh momentum; trend rules compare two dated windows of source-verified events only. |
| Founder-success base rates are tiny (market index precision ~1.9%); false positives are costlier than false negatives (F0.5 evaluation); anonymized profiles resist identity leakage with >90% re-identification reduction. | Chen, Ternasky et al., *VCBench: Benchmarking LLMs in Venture Capital*, [arXiv:2509.14448](https://arxiv.org/abs/2509.14448) | High (benchmark design) | The decision matrix is precision-biased: no route advances on thin coverage, any hard contradiction forces HOLD, and axis scores below 0.50 coverage render "not enough evidence" instead of a number. The blind Capability Sprint mirrors VCBench's anonymization ethos: evaluate the work, not the identity. |
| Of 67k+ Product Hunt launches (2019–25), only ~0.78% reached Series A within 18 months — launch attention is a weak, rare-event signal. | *PHBench: A Benchmark for Predicting Startup Series A Funding from Product Hunt Launch Signals*, [arXiv:2605.02974](https://arxiv.org/html/2605.02974v1) | Medium (funding proxy, not company success) | The formation detector never fires on a single attention signal: it requires **2+ independent artifact types**, identity-linked builders, accelerating velocity, thesis fit AND no confirmed funding — attention is corroboration, never traction. |
| Twitter-based "online legitimacy" predicted 5-year venture survival in up to 76% of 253 ventures — but engagement/content features carried the signal, not follower counts. | Antretter, Blohm, Grichnik & Wincent, *Predicting new venture survival*, [J. of Business Venturing Insights 11 (2019)](https://www.sciencedirect.com/science/article/pii/S2352673418301197) | Medium (small n, survivorship risk) | Public footprints are **discovery cues and evidence carriers, never score features**. Follower/network size is on the banned-predicate list; what enters the graph is the dated artifact (a Show HN, a release), not its popularity. |
| Across 4,323 YC companies (2005–24), visible credentials (FAANG experience, top-tier education) explain <4% of funding variation; the FAANG coefficient is fragile and sign-flips in robustness checks; team size is the more consistent predictor. | Adl, *Founder Backgrounds and Startup Funding: Evidence from Y Combinator*, [arXiv:2512.13755](https://arxiv.org/abs/2512.13755) | Medium (funding outcome, YC-selected sample) | Empirical backing for the ban on **school prestige and employer brand** as score features, and for scoring collaboration/role complementarity rather than headcount or pedigree. |

## Features the popular playbooks recommend — that we rejected

Several widely-circulated AI-VC blueprints (including LLM-generated research briefs for this exact challenge) recommend features we deliberately refused, because they would rebuild the network-gated system this challenge exists to replace:

| Recommended elsewhere | Our decision | Grounds |
|---|---|---|
| "Network centrality / talent gravity" (10–15% of founder score) | **Banned predicate** — stripped before any scorer sees input | Access proxy: measures who you know. Directly contradicts the challenge's cold-start warning. |
| "Market resonance": follower growth, upvote velocity, GitHub star velocity (up to 25%) | **Banned as score feature**; artifacts kept as dated evidence only | Antretter 2019 shows follower counts are not the signal; PHBench shows launch attention rarely converts; stars are attention, not execution. |
| "Education prestige × field relevance" tiers | **Banned** (school prestige under any name) | Adl 2025: credentials explain <4% of variation and effects are fragile; prestige tiering re-encodes access. |
| "Prestige sacrifice index" (left a Director role → conviction) | **Not implemented** | Unverifiable at scale, penalizes founders who never had access to prestige roles — the same gate in disguise. |
| A single blended company score for ranking | **Structurally impossible** — no schema field can hold it | Averaging hides exactly the disagreement an investor needs to see (challenge FAQ 5). |
| LinkedIn scraping / Proxycurl workarounds | **Never touched** | License/consent risk; footprint completeness bias; the brief forbids it. |

## Cold start — the design, stated precisely

A first-time founder with no funding, no GitHub, no network starts at a **neutral prior of 50 with low coverage** — never zero, never penalized for missing data. Coverage below 0.50 renders "not enough evidence" rather than a number. The opt-in **blind Capability Sprint** creates comparable current-capability evidence under a random ID, with no school/employer/network data visible to the evaluator:

| Component | Weight | What it evidences |
|---|---:|---|
| Problem investigation packet | 30 | ICP, costly workflow, 3 testable assumptions, strongest disconfirming evidence → `domain` |
| Work sample (founder picks technical / product / operator track) | 35 | Role-relevant craft against a public rubric → `craft` |
| Evidence calibration (label 10 mixed claims fact/inference/unknown) | 20 | Honesty about uncertainty → `integrity` |
| Collaboration simulation (async handoff, response to constraint) | 15 | Working with others → `collaboration` |

Sprint results enter the evidence graph as dated artifacts and append Founder Score events — the same mechanism as public evidence, so a sprint-evidenced founder is comparable with a GitHub-evidenced one. Known limitations (time, language, disability, domain familiarity) argue for accommodations and human review; the sprint is decision support, not a gate.

## Open research area: public footprints → founder success

Our position: the honest reading of the literature is that footprints measure **visibility and communication as well as capability**, with severe survivorship and access confounds. We therefore use them for discovery and evidence, not prediction. A falsifiable test we would run with more time, designed to avoid the leakage that invalidates most published attempts:

1. Cohort: public YC directory companies, features frozen at batch date (temporal split, never random).
2. Features: 30/90-day artifact cadence, cross-source corroboration, author–company linkage — explicitly excluding follower counts.
3. Outcome: Series A within 18 months (a transparent funding proxy — stated as such), per PHBench.
4. Report precision@top-5%, PR-AUC and calibration against a sector/stage baseline — on a ~1% positive class, accuracy is meaningless.
5. Publish the negative result if features add nothing: that, too, justifies the design.

## Citation integrity note

The LLM-generated research briefs circulating for this challenge contain a mix of real and unverifiable references. Every source cited in this document was resolved to its primary URL and its core claims checked on 19 July 2026. Claims we could not verify (e.g., specific vendor platform capabilities, several "similar project" links) were excluded rather than repeated.
