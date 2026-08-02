---
tier: deep
order: 4
title: ScoliDeSofer.ro
tagline: Public directory of 3,000+ driving schools, and the acquisition engine for a B2B SaaS
status: in production
stack:
  - Astro 5
  - TypeScript
  - Tailwind 4
  - Vercel edge + serverless
  - Cloudflare R2
  - cheerio
  - xlsx
summary: >-
  A marketing site with a public directory of every driving school in Romania behind it,
  built on a data pipeline of my own over government records. The directory is the
  acquisition channel for the SaaS the site sells: learners search, find the directory,
  find schools — and the schools are the customers.
highlights:
  - label: Data nobody had
    text: >-
      Turned seven years of regulator pass-rate records into something searchable. The
      DRPCIV publishes them as PDFs and spreadsheets whose format changes year to year, so
      the pipeline carries a parser per year plus county-name normalisation across all 41
      counties and their diacritic spellings. Result: 2,920 schools with verifiable rates
      and 389,699 aggregated examinations. The 2023 file is a scanned image rather than
      text, and that is documented as a gap rather than quietly dropped.
  - label: 470 more schools
    text: >-
      Raised data coverage from 78.6% to 94.6% — roughly 470 additional schools with full
      contact details — by matching entities in three tiers instead of one. Legal names in
      the regulator data do not match the enrichment source, so matching runs exact on the
      normalised name, then stripped of legal-entity markers, then on prefix, because
      regulator names are frequently truncated mid-word. Whatever still fails is written
      to a review file rather than lost silently.
  - label: Ranking that is fair
    text: >-
      A school with 3 examinations and a 100% pass rate no longer outranks one with 400 and
      55%. Rates are shrunk toward the national weighted average, and each school shows one
      of four confidence levels so a reader can see how much the number is worth. The naive
      sort is one line of code and produces a leaderboard that misleads the people it is
      meant to help.
  - label: 401 schools removed
    text: >-
      Reconciled the directory against the official ARR licensing registry, which surfaced
      401 schools that had lost their licence. They are filtered from every query on the
      site, so the directory never sends a learner toward a school that cannot legally
      teach them.
  - label: 3,008 pages, no server
    text: >-
      A statically generated page for every school and every county, built once and served
      from a CDN. That buys long-tail coverage for "driving school in [town]" across the
      country with nothing to run and nothing to pay per request — which is what makes a
      directory viable as an acquisition channel rather than a cost centre.
  - label: Static by default
    text: >-
      Three dynamic problems solved without giving up static generation. Reviews are
      fetched client-side from a CDN and injected into the page's structured data at
      runtime, so a new review does not rebuild 3,008 pages. County detection runs in an
      edge function. The contact form is serverless, with a honeypot that answers bots
      normally rather than telling them they were caught, length validation on the server
      and HTML escaping on anything that reaches an inbox.
  - label: Rating markup pulled
    text: >-
      Removed an aggregateRating from the structured data. Pass rates are not user reviews,
      and publishing them as if they were is the kind of markup Google penalises by hand.
      The cost was the star rating in search results; the alternative was a manual action
      against the whole domain.
links:
  - label: Live site
    href: https://scolidesofer.ro
    kind: live
  - label: Directory
    href: https://scolidesofer.ro/scoli
    kind: live
  - label: Case study
    href: /work/scolidesofer
    kind: case-study
shots:
  - label: County directory
    desktop: /screens/scolidesofer-judet-desktop.webp
    mobile: /screens/scolidesofer-judet-mobile.webp
    alt: >-
      A county page listing schools ordered by statistically adjusted pass rate, each
      showing its examination volume so the number can be weighed
  - label: National directory
    desktop: /screens/scolidesofer-director-desktop.webp
    mobile: /screens/scolidesofer-director-mobile.webp
    alt: The national directory, the entry point into every county and school page
  - label: Marketing site
    desktop: /screens/scolidesofer-desktop.webp
    mobile: /screens/scolidesofer-mobile.webp
    alt: The landing page for the SaaS product the directory feeds
---

## The pipeline

Four stages, all in TypeScript, in the same repository as the site.

**Extract.** Seven source files spanning 2018 to 2024, no two laid out the same way. Each
year gets its own parser. County names arrive spelled several ways, so matching is done
against a pattern per county rather than a literal — `BISTRI[ȚT]A[- ]N[ĂA]S[ĂA]UD` catches
the four spellings that actually appear in the files.

**Enrich.** Addresses, phone numbers and coordinates come from a separate source, scraped
with a 500ms delay between requests and cached to disk, so re-running the pipeline reads
2,792 pages locally instead of hitting the source again.

**Match.** The join between the two is the hard part, and it is where the three-tier
matcher lives.

**Reconcile.** The ARR licensing registry is merged last, adding schools the pass-rate
data missed and flagging the ones no longer licensed.

## Why Bayesian shrinkage

Sorting by raw pass rate rewards small sample sizes. A school that put three candidates
through and passed all of them sits above one that put through four hundred and passed
fifty-five percent — and the first is noise, not excellence.

Each rate is pulled toward the national average in proportion to how little data supports
it:

```
adjusted = (C × nationalAverage + n × rate) / (C + n)
```

`C` is the median examination count per school, so a school with a typical volume moves
halfway and a school with three candidates moves almost all the way. `nationalAverage` is
the weighted average — total passed over total examined — not the average of the averages,
which would give a three-candidate school the same weight as a four-hundred-candidate one
in setting the baseline.

The four confidence bands shown on each school exist because the adjustment alone is not
honest enough. A reader deserves to know that a rate rests on nine examinations.

## What I would fix first

The pipeline runs by hand. There is no schedule and no drift detection, so the day the
regulator publishes 2025 nothing happens until I notice. The statistical logic and the
entity matcher are also the two pieces most deserving of unit tests and the two that do
not have them. Those are the first things I would pay down.
