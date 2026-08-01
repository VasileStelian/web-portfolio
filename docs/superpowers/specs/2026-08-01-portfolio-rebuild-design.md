# Portfolio Rebuild — Design Spec

**Date:** 2026-08-01
**Owner:** Sofron Vasile-Stelian
**Status:** Awaiting review
**Supersedes:** existing `web-portfolio` scaffold (Astro 4 + Tailwind 3, generic components)

---

## 1. Purpose

A single-page portfolio with three deep case studies, aimed at technical recruiters and
hiring managers evaluating candidates for backend and full-stack roles, remote or Iași.

The site makes one claim: *I build things that run in production and I can tell you why
every decision in them was made.* Every structural decision below serves that claim.

**Success criteria**

1. A recruiter scanning for 90 seconds sees: name, role, three production systems, contact.
2. An engineer reading closely finds a real technical decision and its cost for each
   substantial project.
3. Every project links to something a stranger can open. Four of the five link to a live
   external system. FINFORGE links to an internal case study until its repository is public
   (§9.3).
4. Zero broken links, zero missing decision blocks — enforced mechanically, not by memory.

---

## 2. Non-goals

- No blog. No CMS. No comments.
- No contact form. Email, phone, GitHub and LinkedIn as links.
- No internationalisation. English only.
- No custom domain. Deploys to a `*.vercel.app` subdomain.
- No client-side framework. No React, no Vue, no islands.

---

## 3. Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5, `output: 'static'` |
| Styling | Tailwind 4 via `@tailwindcss/vite`, CSS-first `@theme` |
| Content | Astro Content Layer, glob loader, Zod schemas |
| Fonts | IBM Plex Serif / Sans + JetBrains Mono, self-hosted woff2 |
| Tests | Vitest (schema), Playwright + `@axe-core/playwright` (E2E, a11y) |
| CI | GitHub Actions |
| Host | Vercel, static |

**Decision:** Astro 5 + Tailwind 4 rather than keeping Astro 4 + Tailwind 3.

**Why:** This is a rebuild, not maintenance. Astro 5's Content Layer is the mechanism
section 4 depends on. Starting on current versions avoids a migration six months out.

**Trade-offs:** Tailwind 4 moves configuration into CSS. That is a different mental model
from `diadrive.ro` and `virtualops.ro`, which stay on Tailwind 3. Two models in parallel
until those are migrated or retired.

**When this breaks down:** The moment something genuinely interactive is needed — project
filtering, an embedded playground. At that point add a single Astro island; do not rewrite
the site.

**Alternatives considered**

1. *Next.js + MDX* — rejected. React runtime and SSR machinery for nine static pages.
   Complexity paid for, nothing bought.
2. *Astro 4 + Tailwind 3* — preferable if version consistency across all owned sites
   mattered more than starting clean. It does not, for a from-scratch rebuild.
3. *Plain HTML + CSS, no build step* — genuinely viable at this size and the fastest
   possible site. Rejected because section 4's build-time guarantees disappear with it.

---

## 4. Content model — the central decision

Projects are not hardcoded in `.astro` files. They live in a content collection whose Zod
schema encodes the three rules stated at the outset of this project.

### 4.1 Collection

```
src/content/projects/
  01-apollo-booking.md
  02-finforge.md
  03-sigurantapenet.md
  04-diadrive.md
  05-virtualops.md
  06-homelab.md
```

Frontmatter drives the index card. The markdown body is the case study, present only on
`tier: 'deep'` entries.

### 4.2 Schema

```ts
// src/content.config.ts
const linkSchema = z.object({
  label: z.string().min(1),
  href:  z.string().min(1),
  kind:  z.enum(['live', 'api', 'repo', 'case-study']),
});

const shared = {
  order:   z.number().int().positive(),
  title:   z.string().min(1),
  tagline: z.string().min(1),               // "Appointment platform, in production"
  status:  z.enum(['in production', 'in daily use', 'shipped', 'ongoing']),
  stack:   z.array(z.string()).min(1),
  summary: z.string().min(1),               // the "what it is" paragraph
  links:   z.array(linkSchema).min(1),      // ← at least one verifiable link, always
};

const projectSchema = z.discriminatedUnion('tier', [
  z.object({
    tier: z.literal('deep'),
    ...shared,
    decision: z.object({
      claim:     z.string().min(1),         // what was decided
      reasoning: z.string().min(1),         // why, mechanically
    }),
    tradeoff: z.string().min(1),            // what it costs
  }),
  z.object({
    tier: z.literal('brief'),
    ...shared,
  }),
]);
```

**Decision:** `links` has `.min(1)`. `tier: 'deep'` requires both `decision` and `tradeoff`.
Violations fail `astro build`.

**Why:** The three implementation notes for this project — keep the what → decision →
trade-off structure, style the decision and trade-off distinctly, link every project to
something real — become build errors rather than good intentions. In six months, adding a
seventh project at 11pm, the schema enforces the standard, not memory.

**Trade-offs:** Adding a project requires filling every field. Half-finished drafts cannot
be committed. That is the point, but it is real friction when the impulse is to jot
something down quickly.

**When this breaks down:** A future project that genuinely has no trade-off worth stating —
a small experiment. Then either it is `tier: 'brief'`, or the schema relaxes and the
guarantee is lost. `brief` exists precisely so the schema never has to relax.

**Alternatives considered**

1. *Projects hardcoded in `.astro`* — less setup, no build guarantees. Correct at two
   projects. Wrong at six with more coming.
2. *Uniform schema, decision + trade-off required on all six* — rejected. Three of the six
   have no stated decision. Requiring one means inventing content, which corrupts the exact
   thing the site is claiming credit for.

### 4.3 Tier assignment

| Project | Tier | Case study | Links |
|---|---|---|---|
| Apollo Booking | deep | `/work/apollo-booking` | marketing site, booking platform, case study |
| FINFORGE | deep | `/work/finforge` | case study (repo link added when public) |
| sigurantapenet.ro security work | deep | `/work/sigurantapenet` | live site, case study — **see §9.1** |
| diadrive.ro | brief | — | live site |
| virtualops.ro | brief | — | live site |
| Homelab | *folded into FINFORGE case study* | — | — **see §9.2** |

Five entries: three deep, two brief. Homelab has no public artifact and therefore cannot
satisfy `links.min(1)`; it is deployment context inside the FINFORGE case study rather than
a sixth card. Override this in §9.2 if you want it standalone, but then it needs a link.

The deep/brief split also produces visual rhythm: the page is not a column of identical
heavy blocks.

---

## 5. Routes

| Route | Source |
|---|---|
| `/` | `index.astro` — Hero, About, Projects (6), Contact |
| `/work/[slug]` | `getStaticPaths` over `tier: 'deep'` entries |
| `/Sofron_Vasile_Stelian_CV.pdf` | static, compressed |
| `/404` | `404.astro` |
| `/sitemap-index.xml` | `@astrojs/sitemap` |
| `/robots.txt` | static |
| `/llms.txt` | `llms.txt.ts` endpoint |

The CV is served under its full name, not `cv.pdf`. A recruiter with ten files named
`cv.pdf` in Downloads cannot find yours.

---

## 6. Components

```
src/
  config/site.ts            single source for SITE_URL, email, phone, social
  content.config.ts         collections + schemas
  layouts/
    BaseLayout.astro        html shell, theme init, skip link
    CaseStudyLayout.astro   prose column, back link, TechArticle JSON-LD
  components/
    SiteHead.astro          title, description, canonical, OG, JSON-LD
    SectionHeader.astro     numbered section headings
    ProjectCard.astro       what → decision → trade-off → links
    Annotation.astro        variant: 'decision' | 'tradeoff'
    StackList.astro         mono chips
    ThemeToggle.astro       light/dark, localStorage
    ContactLinks.astro
  styles/global.css         Tailwind 4 @theme tokens
```

### 6.1 `Annotation.astro` — the component that carries the site

Renders the decision and trade-off blocks. Left vertical rule, label in small-caps mono,
faintly separated background.

The two variants read differently on purpose:

- **`decision`** takes the accent rule and slightly higher contrast. It is an assertion.
- **`tradeoff`** takes a muted graphite rule and a warmer, lower-contrast surface. It is an
  admitted cost.

Making them visually distinct is what stops a reader from skimming past the trade-off,
which is the part that demonstrates judgment rather than enthusiasm.

Semantics: `<aside>` with `aria-label`, not a `<blockquote>`. These are annotations on the
surrounding text, not quotations.

`Skills.astro` from the old scaffold is deleted. Competencies are already stated in About,
in prose, where they carry more weight than a badge grid.

---

## 7. Visual design

Direction: **Annotated Engineering Record**. Editorial typographic discipline with
technical metadata in mono. The decision and trade-off annotations are the visual anchor of
the page, not project screenshots.

### 7.1 Tokens

| Token | Light | Dark |
|---|---|---|
| `--color-paper` | `#FAF9F5` | `#131311` |
| `--color-ink` | `#1A1A16` | `#EDEBE4` |
| `--color-ink-muted` | `#5C5C52` | `#9C998E` |
| `--color-rule` | `#DDDACE` | `#2C2C26` |
| `--color-accent` (decision) | `#8C4A3F` | `#C4796A` |
| `--color-muted-accent` (trade-off) | `#6B6B5E` | `#8A8878` |

Oxide red for the decision rule, graphite-olive for the trade-off. Red here reads as an
editor's margin mark, not as an error state — reinforced by the fact that no other element
on the page uses it.

**Roundness:** 4px. Minimal, technical.

### 7.2 Type

| Role | Family |
|---|---|
| Headline | IBM Plex Serif |
| Body | IBM Plex Sans |
| Label / metadata / stack | JetBrains Mono |

**Why IBM Plex:** it was commissioned as an engineering-company typeface and reads as
technical documentation without costume. It is also not Inter and not Space Grotesk, the
two faces that make developer portfolios interchangeable.

**Subsetting:** `latin` + `latin-ext`. `latin-ext` is mandatory — "Iași" and
"Vasile-Stelian" break without it. Two weights per family, preloaded, `font-display: swap`.

### 7.3 Stitch process

1. `create_project` → "Sofron Portfolio"
2. `create_design_system` with the tokens above
3. `generate_screen_from_text` × 3: index desktop, case study desktop, index mobile
4. Review, iterate on the annotation treatment specifically
5. Extract tokens, proportions and spacing; hand-write the components

**Decision:** Stitch is a source of visual direction, not a source of shipped code.

**Why:** Generated markup does not know about the content collection, the performance
budget, or the accessibility requirements. On a site whose entire message is "I can explain
every decision in this," shipping markup you did not write would be self-refuting.

**Trade-offs:** Several hours slower than shipping Stitch output directly.

---

## 8. Testing

TDD applies. Concretely:

### 8.1 Build-time — Zod

The content schema. Runs on every `astro build`, costs nothing, catches the failure modes
that matter most: a project with no link, a deep project with no trade-off.

### 8.2 Unit — Vitest

The schema is the logic worth testing. Cases:

- a project with `links: []` fails validation
- a `tier: 'deep'` entry missing `tradeoff` fails validation
- a `tier: 'deep'` entry missing `decision.reasoning` fails validation
- a `tier: 'brief'` entry with no `decision` passes
- a `kind: 'live'` link with a relative `href` fails
- a `kind: 'case-study'` link with an absolute `href` fails

Testing the rule, not the framework.

### 8.3 E2E — Playwright

**Justification.** On a credibility artifact, a dead link *is* the product defect. No other
layer catches it. These assertions cover the site's actual guarantees:

| Test | Guards |
|---|---|
| Every project card renders both a decision and a trade-off block, or is `brief` | the structure must not be shortened |
| Every project exposes at least one link with a non-empty, resolvable `href` | every project links to something real |
| `/Sofron_Vasile_Stelian_CV.pdf` returns 200 with `application/pdf` | the CV button works |
| `mailto:` and `tel:` are correctly formatted | contact is reachable |
| Every `/work/*` page is reachable from `/` and has a back link | no orphan pages |
| Theme toggle persists across navigation | no flash of wrong theme |
| axe-core: zero critical or serious violations on `/` and one `/work/*` | accessibility |
| 375px viewport: no horizontal overflow | mobile |
| Page renders correctly with JavaScript disabled | zero-JS claim |

Independent, deterministic, self-cleaning, under 30s total.

### 8.4 External link check — separate

A Node script over every external `href`, run by GitHub Actions on a weekly cron, not on
every build.

**Decision:** external link verification is scheduled, not part of CI on push.

**Why:** A rate-limited third party should not turn a commit red. Dead links are urgent in
days, not minutes.

**Implementation note:** LinkedIn returns HTTP 999 to non-browser clients. It is
whitelisted. Treating 999 as failure would produce a false alarm every single week, which
trains you to ignore the alarm — worse than no check.

### 8.5 Performance budget, enforced

- Total JavaScript ≤ 2 KB (theme toggle only)
- Lighthouse 100 across all four categories
- LCP under 1.2s on simulated Fast 3G

---

## 9. Risks and open decisions

### 9.1 The security project is named, with one framing change

**Context, established 2026-08-01.** Production at `sigurantapenet.ro` serves the build from
before the remediation; the fixes live on `dev.sigurantapenet.ro`. Both return 200.

The owner has been informed of every finding — in writing, in a WhatsApp group, and through
commits with written explanations in their GitLab. The remediation was delivered. A request
to deploy it was made again two days before this spec was written. Deployment is the owner's
decision and has not happened.

That is textbook responsible disclosure followed by vendor inaction. Reporting the work
publicly under those conditions is legitimate, and the work is the author's to describe. An
earlier draft of this section recommended anonymising the project; that recommendation is
withdrawn.

**Decision:** the project ships named, with the account of what was found and fixed intact.
Two changes to the draft copy.

**Change 1 — reframe the closing paragraph.** The draft ends by naming remaining IDOR and
mass-assignment risks in a module owned by another engineer. Everything else in the copy
reads as remediated work, past tense; that sentence alone advertises a live, unfixed,
specific vulnerability class against a named host. It is also the weakest sentence
rhetorically — it describes something not done. Replace the vulnerability classes with the
professional behaviour, which is the actual point:

> "Where I found issues in a module owned by another engineer, I documented them with
> reproduction steps and handed them over rather than patching someone else's code unasked."

**Change 2 — add the disclosure trail.** One line, placed at the end of the project:

> "Reported to the owner with commits and written explanations. Remediation is delivered and
> awaiting deployment on their side."

**Why change 2 matters more than it looks:** it proves the work exists and is documented,
it signals to a security-literate reader that disclosure discipline was followed, and it
places responsibility for non-deployment where it belongs. A bare list of findings invites a
reader to wonder about the author's judgment. The same list plus a disclosure trail reads as
someone who did the job correctly and was ignored — which is what happened.

**Trade-offs:** naming a live host alongside a findings list still gives a hostile reader a
target and a category, even in past tense. Accepted, on the grounds that disclosure was made
through documented channels and the vendor declined to act. The cost is not zero and is
recorded here rather than argued away.

**When this breaks down:** if the owner deploys the fixes, change 1 can be reverted and the
full account restored — the constraint disappears with the exposure. If the platform is
breached, the documented disclosure trail in their GitLab and WhatsApp is what separates the
author from the incident.

**Alternatives considered**

1. *Anonymise the client entirely* — removes the residual exposure. Rejected: it also erases
   authorship of unpaid work, which is the author's principal objection and a fair one.
2. *Publish verbatim, including the remaining-risks sentence* — maximum completeness.
   Available on request; the only reason it is not the default is that the sentence adds
   live specificity while describing work that was not done.
3. *Wait for deployment before publishing* — cleanest, but gated on a decision outside the
   author's control with no date attached.

### 9.2 Homelab has no public link

Per the rule that every project links to something real, Homelab currently fails. Options:
publish the infrastructure-as-code repository (with secrets scrubbed and history rewritten,
which is work), fold Homelab into the FINFORGE case study as deployment context, or drop it.

**Recommendation:** fold it into the FINFORGE case study. It is already the more interesting
claim there — "my deployment target is hardware I own and can break" — and it stops being a
seventh unlinked entry.

### 9.3 FINFORGE repository is private

Confirmed 404. `/work/finforge` with real screenshots is the primary link until the repo is
public. A GitHub issue tracks making it public.

**Trade-off:** a case study you wrote is weaker evidence than code a stranger can read. An
asterisk remains until the repo ships.

### 9.4 diadrive.ro tier

Currently `brief`. It has genuine decision material — excluding the Display network on
purpose, because it inflates impressions and buys traffic that does not convert. It has no
stated trade-off.

Promote it to `deep` only if you write the trade-off sentence yourself. It will not be
invented here.

### 9.5 CV is 1.8 MB

Compressed to under 500 KB before shipping, without visible quality loss. A verification
step confirms the compressed file is still readable and text-selectable.

### 9.6 Vercel URL is unknown until first deploy

`SITE_URL` lives in `src/config/site.ts` and nowhere else. Changing it after the first
deploy is a one-line edit; canonical tags, sitemap and OG URLs all derive from it.

---

## 10. Copy handling

The `humanizer` skill runs over all copy as a **detector**, not an auto-formatter.

**Why:** the draft is already strong and sounds like a person. Humanizer flags em dashes,
parallelism and rule-of-three constructions, which this draft uses deliberately as voice.
Applying its suggestions automatically would sand the writing down to neutral — losing
exactly the quality that makes the page worth reading.

Process: run it, present what it found, you decide each change.

---

## 11. Implementation phases

| Phase | Content | Gate |
|---|---|---|
| 0 | Clean repo, Astro 5 + Tailwind 4, tokens, fonts | `astro build` passes |
| 1 | `content.config.ts`, six content files, Vitest schema tests | schema tests green |
| 2 | Stitch design system + three screens, review | you approve the direction |
| 3 | Index page: Hero, About, Projects, Contact | renders, matches direction |
| 4 | Three case study pages, screenshots | all `/work/*` reachable |
| 5 | SEO, JSON-LD, sitemap, `llms.txt`, OG images | validators clean |
| 6 | Playwright E2E + axe, CI workflow, link cron | all green |
| 7 | Vercel deploy, `SITE_URL`, Lighthouse | 100/100/100/100 |

Phase 2 is a hard review gate. No implementation of the index page before the visual
direction is approved.

---

## 12. Lead-level questions

**What assumption are we making?** That the audience is a technical recruiter or hiring
manager who scans for 90 seconds, then reads closely if something catches. If the real
target is freelance clients, the page hierarchy is wrong — clients want outcomes and
availability first, not database constraint reasoning.

**What would be challenged in review?** Content collections plus Zod for six projects is
fair to call over-engineering. The counter-argument is the explicit requirement that the
what → decision → trade-off structure must never be shortened for convenience. Encoding
that in a schema is the only version of that requirement that survives being tired.

**What future change makes this painful?** A second language. There is no i18n layer here,
by choice. Adding Romanian later is a real refactor — routing, content collection shape,
hreflang — not a flag.

**What would I warn the team about?** Two things. `SITE_URL` is a single constant and must
stay that way; the moment it is copy-pasted into a second file, the canonical tags and the
sitemap will silently disagree.

And the harder one: a portfolio rewards naming things, and that incentive runs directly
against disclosure discipline. Section 9.1 is the case in point — the hostname was the most
tempting detail on the page and the only one that could hurt someone. Whenever a project
here gains a link, the question is not "does this prove more" but "who is exposed by it."
That check has to be part of adding a project, not a thing remembered once.
