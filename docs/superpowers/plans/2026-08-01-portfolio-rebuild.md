# Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `web-portfolio` from scratch as a static Astro site where the what → decision → trade-off structure and the "every project has a real link" rule are enforced by the content schema at build time.

**Architecture:** Astro 7 static output. Projects live in a content collection whose Zod schema is a discriminated union on `tier`: `deep` entries must carry a decision and a trade-off, every entry must carry at least one link. `deep` entries additionally generate a `/work/[slug]` case study page from their markdown body. No client-side framework; the only JavaScript is an inline theme toggle.

**Tech Stack:** Astro 7.1.6 · Tailwind 4.3.3 (`@tailwindcss/vite`) · Zod 4 (via `astro/zod`) · Vitest 4 · Playwright 1.62 + `@axe-core/playwright` · Fontsource (IBM Plex Serif/Sans, JetBrains Mono) · Vercel static.

**Spec:** `docs/superpowers/specs/2026-08-01-portfolio-rebuild-design.md`

## Global Constraints

- **Node `>=22.12.0`**, npm `>=9.6.5`. Verified locally: Node v24.11.1, npm 11.6.2.
- **Astro config imports:** `defineCollection` from `astro:content`, `glob` from `astro/loaders`, `z` from `astro/zod` (NOT from `astro:content`, NOT from a directly-installed `zod`).
- **Content config path is `src/content.config.ts`** — not `src/content/config.ts`.
- **`@astrojs/tailwind` is deprecated.** Use `@tailwindcss/vite`. Never add `@astrojs/tailwind`.
- **Total shipped JavaScript ≤ 2 KB.** No UI framework, no Astro islands, no client directives.
- **`SITE_URL` is defined once**, in `src/config/site.ts`. Never hardcode the origin anywhere else.
- **Font subsets must include `latin-ext`.** "Iași" and "Vasile-Stelian" render incorrectly without it.
- **The security project (`03-sigurantapenet.md`) copy is settled in spec §9.1.** It names the host, describes findings in past tense, replaces the remaining-unfixed-risks sentence with the professional-behaviour sentence, and ends with the disclosure-trail line. Do not restore the original closing paragraph.
- **Copy is transcribed verbatim** from the spec and the source draft. Do not paraphrase, "improve", or expand project prose. The humanizer pass in Task 13 is a detector whose output the owner adjudicates.
- **Five projects, not six.** Homelab is deployment context inside the FINFORGE case study, not its own entry.
- **Commit after every task.** Conventional commits: `<type>(<scope>): <description>`. Never mention AI assistance in commit messages.

---

## File Structure

```
src/
  config/site.ts                    SITE_URL, person, contact, social — single source
  schemas/project.ts                linkSchema, projectSchema, exported TS types
  content.config.ts                 collection definition, imports schemas/project
  content/projects/
    01-apollo-booking.md            tier: deep
    02-finforge.md                  tier: deep
    03-sigurantapenet.md            tier: deep
    04-diadrive.md                  tier: brief
    05-virtualops.md                tier: brief
  layouts/
    BaseLayout.astro                html shell, theme init, skip link, header/footer
    CaseStudyLayout.astro           prose column, back link, TechArticle JSON-LD
  components/
    SiteHead.astro                  title, description, canonical, OG, Person JSON-LD
    SectionHeader.astro             numbered section heading
    ProjectCard.astro               what → decision → trade-off → links
    Annotation.astro                variant: 'decision' | 'tradeoff'
    StackList.astro                 mono chips
    LinkList.astro                  project links with external/internal affordance
    ThemeToggle.astro               light/dark button
    ContactLinks.astro
  pages/
    index.astro
    work/[slug].astro
    404.astro
    llms.txt.ts
  styles/global.css                 Tailwind import, tokens, dark variant, annotation CSS
tests/
  unit/schema.test.ts               Vitest — the schema rules
  e2e/portfolio.spec.ts             Playwright — site guarantees
  e2e/a11y.spec.ts                  axe-core
scripts/
  check-links.mjs                   external link checker, weekly cron
public/
  Sofron_Vasile_Stelian_CV.pdf
  robots.txt
  screens/{apollo,finforge}/*.webp
.github/workflows/
  ci.yml                            build + unit + e2e on push
  links.yml                         weekly external link check
```

---

### Task 1: Repo reset and Astro 7 + Tailwind 4 scaffold

**Files:**
- Delete: `src/components/`, `src/layouts/`, `src/pages/`, `src/env.d.ts`, `tailwind.config.mjs`, `astro.config.mjs`, `package.json`, `package-lock.json`, `node_modules/`, `.astro/`, `.DS_Store`
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/styles/global.css`, `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a building Astro 7 project with Tailwind 4 available; `npm run build` exits 0

- [ ] **Step 1: Remove the old scaffold**

```bash
cd /Users/vasilesofron/dev/web-portfolio
rm -rf src node_modules .astro package.json package-lock.json \
       astro.config.mjs tailwind.config.mjs tsconfig.json .DS_Store public/favicon.svg
```

`docs/`, `README.md`, `.git/`, `.claude/` and `.gitignore` are retained.

- [ ] **Step 2: Scaffold Astro 7 in place**

```bash
npm create astro@latest . -- --template minimal --install --no-git --typescript strict --skip-houston
```

If the CLI refuses to run in a non-empty directory, scaffold into a temporary directory and copy in:

```bash
npm create astro@latest /tmp/astro-scaffold -- --template minimal --install --no-git --typescript strict --skip-houston
cp -R /tmp/astro-scaffold/{src,astro.config.mjs,tsconfig.json,package.json,package-lock.json} .
rm -rf /tmp/astro-scaffold
npm install
```

- [ ] **Step 3: Verify the Astro version is 7.x**

Run: `npx astro --version`
Expected: `astro  7.1.6` or a later 7.x. If it reports 5.x or 6.x, stop — the plan's APIs assume 7.

- [ ] **Step 4: Add Tailwind 4**

```bash
npx astro add tailwind --yes
```

This installs `tailwindcss` and `@tailwindcss/vite`, adds the Vite plugin to `astro.config.mjs`, and creates `src/styles/global.css` containing `@import "tailwindcss";`.

- [ ] **Step 5: Verify `@astrojs/tailwind` was NOT installed**

Run: `npm ls @astrojs/tailwind`
Expected: `(empty)` or "not found". If present, `npm uninstall @astrojs/tailwind` and remove it from `astro.config.mjs`.

- [ ] **Step 6: Install remaining runtime dependencies**

```bash
npm install @astrojs/sitemap
npm install @fontsource/ibm-plex-serif @fontsource/ibm-plex-sans @fontsource/jetbrains-mono
npm install -D vitest @playwright/test @axe-core/playwright
npx playwright install chromium
```

- [ ] **Step 7: Write `astro.config.mjs`**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { SITE_URL } from './src/config/site.ts';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 8: Create `src/config/site.ts`**

```ts
// src/config/site.ts
// The only place the origin is written. Canonical URLs, OG tags, the sitemap
// and llms.txt all derive from it. Update here after the first Vercel deploy.
export const SITE_URL = 'https://sofron-portfolio.vercel.app';

export const PERSON = {
  name: 'Sofron Vasile-Stelian',
  role: 'Full-stack developer, mostly backend',
  jobTitle: 'IT Systems & Security Engineer',
  location: 'Iași, Romania',
} as const;

export const CONTACT = {
  email: 'sofron_vasile123@yahoo.ro',
  phone: '+40722566100',
  phoneDisplay: '0722 566 100',
} as const;

export const SOCIAL = {
  github: 'https://github.com/VasileStelian',
  linkedin: 'https://www.linkedin.com/in/vasilestelian/',
} as const;

export const CV_PATH = '/Sofron_Vasile_Stelian_CV.pdf';
```

- [ ] **Step 9: Replace `src/pages/index.astro` with a placeholder that proves the build**

```astro
---
import '../styles/global.css';
import { PERSON } from '../config/site';
---
<html lang="en">
  <head><meta charset="utf-8" /><title>{PERSON.name}</title></head>
  <body class="bg-white text-black"><h1 class="text-3xl font-bold">{PERSON.name}</h1></body>
</html>
```

- [ ] **Step 10: Verify the build passes**

Run: `npm run build`
Expected: exit 0, `dist/index.html` produced. Confirm Tailwind emitted CSS:

```bash
grep -rl "font-bold" dist/_astro/*.css
```

Expected: at least one matching file.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore(portfolio): reset to Astro 7 + Tailwind 4 scaffold

Removes the previous Astro 4 scaffold and its generic components.
Adds site config as the single source for the origin and contact data."
```

---

### Task 2: Project schema and its unit tests

**Files:**
- Create: `src/schemas/project.ts`, `tests/unit/schema.test.ts`, `vitest.config.ts`
- Modify: `package.json` (test scripts)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `linkSchema` — Zod object `{ label: string, href: string, kind: 'live'|'api'|'repo'|'case-study' }`
  - `projectSchema` — Zod discriminated union on `tier`
  - `type Project = z.infer<typeof projectSchema>`
  - `type ProjectLink = z.infer<typeof linkSchema>`
  - Task 3 imports `projectSchema` into `src/content.config.ts`; Tasks 7–9 rely on `Project` narrowing by `tier`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/schema.test.ts
import { describe, it, expect } from 'vitest';
import { projectSchema } from '../../src/schemas/project';

const baseLinks = [{ label: 'Live', href: 'https://example.com', kind: 'live' as const }];

const deep = {
  tier: 'deep' as const,
  order: 1,
  title: 'Apollo Booking',
  tagline: 'Appointment platform',
  status: 'in production' as const,
  stack: ['PHP 8.3', 'Laravel'],
  summary: 'A complete booking product built from scratch.',
  links: baseLinks,
  decision: { claim: 'Enforced in the database.', reasoning: 'An application check races.' },
  tradeoff: 'The error surfaces as a constraint violation.',
};

const brief = {
  tier: 'brief' as const,
  order: 4,
  title: 'diadrive.ro',
  tagline: 'Website, SEO and paid acquisition',
  status: 'shipped' as const,
  stack: ['Astro', 'Tailwind'],
  summary: 'Built the site, then took responsibility for whether anyone found it.',
  links: baseLinks,
};

describe('projectSchema', () => {
  it('accepts a complete deep project', () => {
    expect(projectSchema.safeParse(deep).success).toBe(true);
  });

  it('accepts a brief project with no decision or tradeoff', () => {
    expect(projectSchema.safeParse(brief).success).toBe(true);
  });

  it('rejects any project with no links', () => {
    const result = projectSchema.safeParse({ ...deep, links: [] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('links');
  });

  it('rejects a deep project missing tradeoff', () => {
    const { tradeoff, ...withoutTradeoff } = deep;
    const result = projectSchema.safeParse(withoutTradeoff);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('tradeoff');
  });

  it('rejects a deep project whose decision has empty reasoning', () => {
    const result = projectSchema.safeParse({
      ...deep,
      decision: { claim: 'Enforced in the database.', reasoning: '' },
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('reasoning');
  });

  it('rejects a live link with a relative href', () => {
    const result = projectSchema.safeParse({
      ...deep,
      links: [{ label: 'Live', href: '/somewhere', kind: 'live' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a case-study link with an absolute href', () => {
    const result = projectSchema.safeParse({
      ...deep,
      links: [{ label: 'Case study', href: 'https://example.com/work/x', kind: 'case-study' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a case-study link with a root-relative href', () => {
    const result = projectSchema.safeParse({
      ...deep,
      links: [{ label: 'Case study', href: '/work/apollo-booking', kind: 'case-study' }],
    });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Add the Vitest config and test scripts**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

In `package.json`, add to `scripts`:

```json
"test:unit": "vitest run",
"test:e2e": "playwright test",
"test": "npm run test:unit && npm run build && npm run test:e2e"
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `Failed to resolve import "../../src/schemas/project"`.

If instead it fails with an error resolving `astro/zod` after Step 4, that is the signal that `astro/zod` is not resolvable under plain Vitest. Fix by adding to `vitest.config.ts`:

```ts
resolve: { alias: { 'astro/zod': 'zod' } },
```

and `npm install -D zod@4`. The schema source keeps importing `astro/zod`; only the test runner aliases it.

- [ ] **Step 4: Write the schema**

```ts
// src/schemas/project.ts
import { z } from 'astro/zod';

const ABSOLUTE = /^https:\/\/\S+$/;
const ROOT_RELATIVE = /^\/\S*$/;

export const linkSchema = z
  .object({
    label: z.string().min(1),
    href: z.string().min(1),
    kind: z.enum(['live', 'api', 'repo', 'case-study']),
  })
  .refine(
    (link) => (link.kind === 'case-study' ? ROOT_RELATIVE.test(link.href) : ABSOLUTE.test(link.href)),
    {
      message:
        'case-study links must be root-relative (/work/slug); live, api and repo links must be absolute https URLs',
      path: ['href'],
    },
  );

const shared = {
  order: z.number().int().positive(),
  title: z.string().min(1),
  tagline: z.string().min(1),
  status: z.enum(['in production', 'in daily use', 'shipped', 'ongoing']),
  stack: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  // Every project links to something a reader can open. Enforced here so that
  // adding a project without evidence fails the build rather than shipping.
  links: z.array(linkSchema).min(1),
};

export const projectSchema = z.discriminatedUnion('tier', [
  z.object({
    tier: z.literal('deep'),
    ...shared,
    decision: z.object({
      claim: z.string().min(1),
      reasoning: z.string().min(1),
    }),
    tradeoff: z.string().min(1),
  }),
  z.object({
    tier: z.literal('brief'),
    ...shared,
  }),
]);

export type Project = z.infer<typeof projectSchema>;
export type ProjectLink = z.infer<typeof linkSchema>;
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: 8 passed.

- [ ] **Step 6: Commit**

```bash
git add src/schemas/project.ts tests/unit/schema.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat(portfolio): add project schema enforcing decision, tradeoff and links

Deep projects must carry a decision and a trade-off; every project must
carry at least one link. Violations fail the build rather than shipping."
```

---

### Task 3: Content collection and the five project files

**Files:**
- Create: `src/content.config.ts`, `src/content/projects/01-apollo-booking.md` … `05-virtualops.md`
- Test: extends `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: `projectSchema` from `src/schemas/project`
- Produces: collection `projects`, queryable via `getCollection('projects')`. Entry shape: `{ id, data: Project, body }`. Ordering is by `data.order` ascending. `deep` entries have a non-empty `body`; `brief` entries have an empty body.

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectSchema } from './schemas/project';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: projectSchema,
});

export const collections = { projects };
```

- [ ] **Step 2: Write `src/content/projects/01-apollo-booking.md`**

```markdown
---
tier: deep
order: 1
title: Apollo Booking
tagline: Appointment platform
status: in production
stack:
  - PHP 8.3
  - Laravel
  - Filament
  - PostgreSQL
  - Pest
  - Docker/FrankenPHP
  - Coolify
  - Cloudflare
summary: >-
  A complete booking product built from scratch: backend, admin panel, REST API,
  email and SMS confirmations, deployed and running on a VPS. Two-stack design, a
  client-agnostic Laravel product plus a per-client marketing site, so the same
  product can be reskinned rather than rebuilt.
decision:
  claim: >-
    Double-booking is prevented by a partial unique index in PostgreSQL, not by a
    check in application code.
  reasoning: >-
    An application check has a race condition — two requests can both read "slot is
    free" before either writes. A database constraint is atomic and cannot be
    bypassed, whatever the application does.
tradeoff: >-
  Pushing the rule into the database means the error surfaces as a constraint
  violation that the application has to translate into something a user
  understands. Worth it. Correctness first, ergonomics second.
links:
  - label: Marketing site
    href: https://apollobarbershopacademy.ro/
    kind: live
  - label: Booking platform
    href: https://booking.apollobarbershopacademy.ro/
    kind: live
  - label: Case study
    href: /work/apollo-booking
    kind: case-study
---

## Two stacks, one product

The marketing site and the booking platform are deployed separately and on purpose.
`apollobarbershopacademy.ro` is a static marketing site that reads services,
specialists and gallery content from a public REST API and posts its contact form
back. `booking.apollobarbershopacademy.ro` is the Laravel product: booking flow,
Filament admin, confirmations, and the API the marketing site consumes.

The split means a second client gets a new marketing site against the same product,
rather than a fork of the product with different colours.

## Preventing double-booking

The constraint lives in PostgreSQL:

```sql
CREATE UNIQUE INDEX bookings_slot_unique
  ON bookings (specialist_id, starts_at)
  WHERE cancelled_at IS NULL;
```

It is partial: cancelled bookings free the slot again without deleting the row, so
the history survives.

The application still checks availability before writing, because a user should see
"that slot just went" rather than a 500. The check is there for the message; the index
is there for the guarantee. When the two disagree, the index wins.
```

- [ ] **Step 3: Write `src/content/projects/02-finforge.md`**

```markdown
---
tier: deep
order: 2
title: FINFORGE
tagline: Self-hosted household budgeting app
status: in daily use
stack:
  - React 19
  - TypeScript
  - Vite
  - Fastify
  - SQLite
  - Drizzle
  - Docker
summary: >-
  A budgeting app my wife and I use every day, running on a Raspberry Pi at home.
  Self-hosted because financial data should not have to live on someone else's
  server.
decision:
  claim: >-
    The financial logic — surplus, recurring projection, goal allocation — lives in
    plain modules with no framework or storage access, and persistence sits behind a
    single storage interface.
  reasoning: >-
    The app shipped on localStorage and later moved to a real backend. That change
    touched the adapter and one hook, not the pages.
tradeoff: >-
  Version-per-save is coarse. It rejects edits that would not actually have
  conflicted. For two users that is invisible; at scale it would need finer
  granularity.
links:
  - label: Case study
    href: /work/finforge
    kind: case-study
---

## Two people, two phones

The decision that matters most in practice is concurrent editing. Every save carries
a version and is applied in one transaction; a stale version is rejected before
anything is written, so nobody silently overwrites anybody. Other sessions are
notified over SSE and re-fetch.

The failure mode this avoids is the quiet one: two people editing the same budget,
last write wins, and neither of them ever learns that an edit disappeared.

## Where it runs

FINFORGE runs on the Raspberry Pi 5 homelab: Docker, Cloudflare Tunnel for public
access with no inbound ports open, Tailscale for the mesh VPN, and every service
defined as code in a version-controlled repository so the environment rebuilds from
scratch.

That makes the deployment target hardware I own and can break, which changes how you
write deployment code.

## Repository

The source is public at `VasileStelian/registru` — the repository kept the working name it
was started under. Everything described above is in there: the storage interface, the
version-per-save transaction, and the SSE notification path.
```

- [ ] **Step 4: Write `src/content/projects/03-sigurantapenet.md`**

Copy transcribed per spec §9.1: findings in past tense, closing paragraph replaced, disclosure trail appended.

```markdown
---
tier: deep
order: 3
title: Security work on a Laravel training platform
tagline: sigurantapenet.ro, inherited codebase
status: shipped
stack:
  - Laravel
  - MySQL
  - Blade
  - Tailwind
summary: >-
  I joined an existing application and reviewed it before adding to it. That review
  turned into most of the work.
decision:
  claim: >-
    The password migration rehashes transparently on login instead of forcing a reset
    for every user.
  reasoning: >-
    A forced reset for every user costs an email campaign, a support spike, and every
    dormant account you never hear from again. Instead the login path checks the hash
    format and rehashes to bcrypt transparently when someone signs in. Zero downtime,
    zero forced resets.
tradeoff: >-
  Dormant accounts stay on the legacy hash indefinitely, which means the old
  verification path has to stay alive. That needs a planned cutoff, and I documented
  it as such rather than pretending it was finished.
links:
  - label: Live site
    href: https://sigurantapenet.ro
    kind: live
  - label: Case study
    href: /work/sigurantapenet
    kind: case-study
---

## What the review found

Passwords stored as unsalted MD5 across the whole user base. Three password-change
endpoints reachable by any authenticated user, including one that upgraded an account
to a paid plan. Fourteen-plus API routes with no authentication at all, exposing user
enumeration and company data export. A SQL injection in a listing query. Reset tokens
generated with `mt_rand()`.

## The password migration

Rehashing on login was the decision worth defending. The verification path checks
whether the stored hash is legacy format, verifies against it, and on success writes a
bcrypt hash in its place. A user signs in normally and never learns anything happened.

The honest cost is that dormant accounts never sign in, so they never migrate. The
legacy verification path has to stay alive for them, which is a second code path in
the most security-sensitive function in the application. That is a planned cutoff, not
a finished job, and it was documented that way.

## Working in someone else's module

Where I found issues in a module owned by another engineer, I documented them with
reproduction steps and handed them over rather than patching someone else's code
unasked.

## Status

Reported to the owner with commits and written explanations. Remediation is delivered
and awaiting deployment on their side.
```

- [ ] **Step 5: Write `src/content/projects/04-diadrive.md`**

```markdown
---
tier: brief
order: 4
title: diadrive.ro
tagline: Website, SEO and paid acquisition for a driving school
status: shipped
stack:
  - Astro
  - Tailwind
  - Vercel
  - Google Ads
  - Remotion
summary: >-
  Built the site, then took responsibility for whether anyone found it. First-page
  Google ranking for the target local keyword through on-site and local SEO. A
  search-only Google Ads campaign returned 280 clicks from 2,200 impressions, a CTR of
  roughly 12.7% against a 3 to 5% benchmark, at 0.93 RON average CPC on a 300 RON
  budget. Display network excluded on purpose: it inflates impressions and buys
  traffic that does not convert. Also built a chat widget that captures leads from
  high-intent visitors, and a scheduled pipeline that pulls live Google review data
  into the site with no manual step.
links:
  - label: Live site
    href: https://diadrive.ro
    kind: live
---
```

- [ ] **Step 6: Write `src/content/projects/05-virtualops.md`**

```markdown
---
tier: brief
order: 5
title: virtualops.ro
tagline: Website for an IT outsourcing brand
status: shipped
stack:
  - Astro
  - Tailwind
  - Schema.org
  - Vercel
summary: >-
  Static, fast, and built to be found. Semantic markup, structured data, clean sitemap
  and metadata, so the site is legible to search engines and to LLM-based answer
  engines, which increasingly answer directly instead of returning a list of links.
links:
  - label: Live site
    href: https://virtualops.ro
    kind: live
---
```

- [ ] **Step 7: Verify the collection type-checks and builds**

Run: `npx astro sync && npm run build`
Expected: exit 0. Astro reports 5 entries in `projects`.

Deliberately break one to confirm enforcement:

```bash
sed -i '' 's|^  - label: Live site$|  - label: ""|' src/content/projects/05-virtualops.md
npm run build   # expected: FAIL, label too small
git checkout src/content/projects/05-virtualops.md
```

- [ ] **Step 8: Add a collection-level ordering test**

Append to `tests/unit/schema.test.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs';

describe('content files', () => {
  const dir = 'src/content/projects';

  it('has exactly five project files', () => {
    expect(readdirSync(dir).filter((f) => f.endsWith('.md'))).toHaveLength(5);
  });

  it('gives every project a unique order', () => {
    const orders = readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => Number(readFileSync(`${dir}/${f}`, 'utf8').match(/^order:\s*(\d+)$/m)![1]));
    expect(new Set(orders).size).toBe(orders.length);
  });
});
```

- [ ] **Step 9: Run the tests**

Run: `npm run test:unit`
Expected: 10 passed.

- [ ] **Step 10: Commit**

```bash
git add src/content.config.ts src/content/projects tests/unit/schema.test.ts
git commit -m "feat(portfolio): add projects collection with five entries

Apollo, FINFORGE and the Laravel security work are deep entries with case
studies; diadrive and virtualops are brief. Homelab is folded into the
FINFORGE case study as deployment context."
```

---

### Task 4: Stitch design system and screens — REVIEW GATE

**Files:**
- Create: `docs/design/stitch-notes.md`

**Interfaces:**
- Consumes: token values from spec §7.1, type roles from §7.2
- Produces: confirmed hex values and spacing scale for Task 5. Nothing downstream is written until the owner approves the direction.

- [ ] **Step 1: Create the Stitch project**

Call `mcp__stitch__create_project` with `title: "Sofron Portfolio — Annotated Engineering Record"`. Record the returned project ID in `docs/design/stitch-notes.md`.

- [ ] **Step 2: Create the design system**

Call `mcp__stitch__create_design_system` with:

```json
{
  "projectId": "<from step 1>",
  "designSystem": {
    "displayName": "Annotated Engineering Record",
    "theme": {
      "colorMode": "LIGHT",
      "headlineFont": "IBM_PLEX_SERIF",
      "bodyFont": "IBM_PLEX_SANS",
      "labelFont": "JETBRAINS_MONO",
      "roundness": "ROUND_FOUR",
      "customColor": "#8C4A3F",
      "overridePrimaryColor": "#8C4A3F",
      "overrideSecondaryColor": "#6B6B5E",
      "overrideNeutralColor": "#FAF9F5",
      "colorVariant": "NEUTRAL",
      "designMd": "Editorial typographic discipline with technical metadata in monospace. The visual anchor of every project is a pair of annotation blocks — DECISION and TRADE-OFF — rendered as margin notes on a technical document: a vertical rule on the left, a small-caps monospace label, and a faintly separated surface. DECISION takes the oxide-red accent rule and higher contrast; it is an assertion. TRADE-OFF takes a muted graphite-olive rule, lower contrast and a slightly warmer surface; it is an admitted cost. The two must be immediately distinguishable at a glance so a reader cannot skim past the trade-off. No cards with drop shadows, no gradients, no glassmorphism, no hero imagery, no icon sets. Generous whitespace, a single measured text column of roughly 68 characters, hairline rules for separation. Restraint over decoration: this page is read, not looked at."
    }
  }
}
```

Then call `mcp__stitch__update_design_system` to apply it, per that tool's documented requirement.

- [ ] **Step 3: Generate three screens**

Call `mcp__stitch__generate_screen_from_text` three times, passing the design system ID from Step 2 each time. These calls take minutes; do not retry on timeout — poll `mcp__stitch__get_screen` every 30 seconds, up to 10 times.

1. `deviceType: DESKTOP` — "Portfolio home page for a backend developer. Sections in order: a hero with the name Sofron Vasile-Stelian, the line 'Full-stack developer, mostly backend', two short paragraphs, and four text links (Projects, GitHub, LinkedIn, CV); an About section of three prose paragraphs; a Projects section of five entries. Each project entry shows a title, a one-line tagline, a row of monospace stack chips, a summary paragraph, then two annotation blocks labelled DECISION and TRADE-OFF, then its links. The annotation blocks are the visual anchor of the page. A contact section closes it."
2. `deviceType: DESKTOP` — "A case study page for a single project. A back link to the home page, the project title, a monospace metadata row of stack items, then long-form technical prose with h2 subheadings, one syntax-highlighted SQL code block, and two annotation blocks labelled DECISION and TRADE-OFF set apart from the prose. Single measured column, generous margins."
3. `deviceType: MOBILE` — same content as screen 1 at 375px width. The annotation blocks must keep their left rule and remain legible; the stack chips wrap.

- [ ] **Step 4: Record the outcome**

Write `docs/design/stitch-notes.md` with: project ID, design system ID, the three screen IDs, the final hex values, the spacing scale and the type scale as generated. Note explicitly any place where the generated output diverges from spec §7.1, and which of the two wins.

- [ ] **Step 5: STOP — owner review**

Present the three screens to the owner. Do not begin Task 5 until the direction is approved. If revisions are needed, call `mcp__stitch__edit_screens` or regenerate, and update `docs/design/stitch-notes.md`.

Per spec §7.3, generated markup is reference only. No Stitch HTML is copied into `src/`.

- [ ] **Step 6: Commit**

```bash
git add docs/design/stitch-notes.md
git commit -m "docs(portfolio): record Stitch design system and screen output"
```

---

### Task 5: Design tokens, fonts and BaseLayout

**Files:**
- Modify: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`, `src/components/SiteHead.astro`, `src/components/ThemeToggle.astro`

**Interfaces:**
- Consumes: approved hex and scale values from `docs/design/stitch-notes.md`
- Produces:
  - CSS custom properties `--paper --ink --ink-muted --rule --accent --accent-muted`, flipped by `[data-theme="dark"]`
  - Tailwind utilities `bg-paper text-ink text-ink-muted border-rule text-accent`, plus `font-display font-sans font-mono`
  - `BaseLayout.astro` props: `{ title: string; description: string; ogType?: 'website' | 'article' }`
  - `SiteHead.astro` props: identical, plus `canonical: string`

- [ ] **Step 1: Write `src/styles/global.css`**

Substitute any hex values the owner changed during Task 4 review.

```css
@import "tailwindcss";

@import "@fontsource/ibm-plex-serif/latin-ext-600.css";
@import "@fontsource/ibm-plex-serif/latin-600.css";
@import "@fontsource/ibm-plex-sans/latin-ext-400.css";
@import "@fontsource/ibm-plex-sans/latin-400.css";
@import "@fontsource/ibm-plex-sans/latin-ext-600.css";
@import "@fontsource/ibm-plex-sans/latin-600.css";
@import "@fontsource/jetbrains-mono/latin-ext-400.css";
@import "@fontsource/jetbrains-mono/latin-400.css";

/* Theme is set on <html data-theme="..."> by the inline script in BaseLayout. */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  --paper: #faf9f5;
  --ink: #1a1a16;
  --ink-muted: #5c5c52;
  --rule: #dddace;
  --accent: #8c4a3f;
  --accent-muted: #6b6b5e;
  --surface-decision: #f5efe9;
  --surface-tradeoff: #f2f2ec;
}

[data-theme="dark"] {
  --paper: #131311;
  --ink: #edebe4;
  --ink-muted: #9c998e;
  --rule: #2c2c26;
  --accent: #c4796a;
  --accent-muted: #8a8878;
  --surface-decision: #1c1815;
  --surface-tradeoff: #191917;
}

/* `inline` emits var() into the generated utilities, so the custom properties
   above can flip at runtime without rebuilding the stylesheet. */
@theme inline {
  --color-paper: var(--paper);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-rule: var(--rule);
  --color-accent: var(--accent);
  --color-accent-muted: var(--accent-muted);
  --color-surface-decision: var(--surface-decision);
  --color-surface-tradeoff: var(--surface-tradeoff);

  --font-display: "IBM Plex Serif", Georgia, "Times New Roman", serif;
  --font-sans: "IBM Plex Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  html {
    background-color: var(--paper);
    color: var(--ink);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    scroll-behavior: smooth;
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
}
```

- [ ] **Step 2: Write `src/components/SiteHead.astro`**

```astro
---
import { SITE_URL, PERSON, CONTACT, SOCIAL } from '../config/site';

interface Props {
  title: string;
  description: string;
  canonical: string;
  ogType?: 'website' | 'article';
}

const { title, description, canonical, ogType = 'website' } = Astro.props;
const canonicalUrl = new URL(canonical, SITE_URL).href;

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: PERSON.name,
  jobTitle: PERSON.jobTitle,
  email: `mailto:${CONTACT.email}`,
  telephone: CONTACT.phone,
  url: SITE_URL,
  sameAs: [SOCIAL.github, SOCIAL.linkedin],
  address: { '@type': 'PostalAddress', addressLocality: 'Iași', addressCountry: 'RO' },
  knowsAbout: ['PHP', 'Laravel', 'PostgreSQL', 'TypeScript', 'React', 'Docker', 'Linux', 'Application security'],
};
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
<link rel="canonical" href={canonicalUrl} />
<meta property="og:type" content={ogType} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonicalUrl} />
<meta name="twitter:card" content="summary_large_image" />
<link rel="sitemap" href="/sitemap-index.xml" />
<script type="application/ld+json" set:html={JSON.stringify(personJsonLd)} />
```

- [ ] **Step 3: Write `src/components/ThemeToggle.astro`**

```astro
---
---
<button
  id="theme-toggle"
  type="button"
  class="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-ink"
  aria-label="Switch colour theme"
>
  <span data-theme-label>theme</span>
</button>
<script is:inline>
  (() => {
    const button = document.getElementById('theme-toggle');
    const label = button?.querySelector('[data-theme-label]');
    const sync = () => { if (label) label.textContent = document.documentElement.dataset.theme; };
    sync();
    button?.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('theme', next);
      sync();
    });
  })();
</script>
```

- [ ] **Step 4: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import SiteHead from '../components/SiteHead.astro';
import ThemeToggle from '../components/ThemeToggle.astro';
import { PERSON } from '../config/site';

interface Props {
  title: string;
  description: string;
  ogType?: 'website' | 'article';
}

const { title, description, ogType } = Astro.props;
const canonical = Astro.url.pathname;
const year = new Date().getFullYear();
---
<!doctype html>
<html lang="en">
  <head>
    <SiteHead title={title} description={description} canonical={canonical} ogType={ogType} />
    <!-- Runs before first paint so the correct theme is applied with no flash. -->
    <script is:inline>
      (() => {
        const stored = localStorage.getItem('theme');
        const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.dataset.theme = stored ?? preferred;
      })();
    </script>
  </head>
  <body class="bg-paper text-ink font-sans antialiased">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-paper focus:p-3">
      Skip to content
    </a>
    <header class="mx-auto flex max-w-3xl items-center justify-between px-6 py-8">
      <a href="/" class="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-ink">
        {PERSON.name}
      </a>
      <ThemeToggle />
    </header>
    <main id="main" class="mx-auto max-w-3xl px-6"><slot /></main>
    <footer class="mx-auto max-w-3xl border-t border-rule px-6 py-10 font-mono text-xs text-ink-muted">
      © {year} {PERSON.name}
    </footer>
  </body>
</html>
```

- [ ] **Step 5: Point the placeholder index at the layout and build**

Replace `src/pages/index.astro` body with a `<BaseLayout>` wrapper containing an `<h1>`.

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 6: Verify the fonts were emitted and include latin-ext**

```bash
ls dist/_astro/*.woff2 | head
grep -ro "latin-ext" dist/_astro/*.css | head -1
```

Expected: woff2 files present, `latin-ext` matched. If `latin-ext` is absent, the `@fontsource` import paths in Step 1 are wrong — inspect `node_modules/@fontsource/ibm-plex-sans/` for the correct filenames.

- [ ] **Step 7: Commit**

```bash
git add src/styles/global.css src/layouts src/components src/pages/index.astro
git commit -m "feat(portfolio): add design tokens, fonts and base layout

Colour tokens flip at runtime via data-theme so the theme toggle needs no
rebuild. Font subsets include latin-ext for Romanian diacritics."
```

---

### Task 6: Annotation and the presentational primitives

**Files:**
- Create: `src/components/Annotation.astro`, `src/components/StackList.astro`, `src/components/LinkList.astro`, `src/components/SectionHeader.astro`
- Modify: `src/styles/global.css` (annotation layer)

**Interfaces:**
- Consumes: colour tokens from Task 5
- Produces:
  - `Annotation.astro` props `{ variant: 'decision' | 'tradeoff'; label?: string }`, content via default slot
  - `StackList.astro` props `{ items: readonly string[] }`
  - `LinkList.astro` props `{ links: readonly ProjectLink[] }` — imports `ProjectLink` from `../schemas/project`
  - `SectionHeader.astro` props `{ index: string; title: string; id: string }`

- [ ] **Step 1: Add the annotation styles to `src/styles/global.css`**

Append after the `@layer base` block:

```css
@layer components {
  .annotation {
    border-left: 2px solid var(--accent-muted);
    background-color: var(--surface-tradeoff);
    padding: 1rem 1.25rem;
    margin-block: 1.25rem;
  }
  .annotation--decision {
    border-left-color: var(--accent);
    background-color: var(--surface-decision);
  }
  .annotation__label {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent-muted);
    margin-bottom: 0.5rem;
  }
  .annotation--decision .annotation__label { color: var(--accent); }
  .annotation__body { font-size: 0.9375rem; line-height: 1.7; }
  .annotation__body > * + * { margin-top: 0.75rem; }
  .annotation--decision .annotation__body { color: var(--ink); }
  .annotation--tradeoff .annotation__body { color: var(--ink-muted); }
}
```

- [ ] **Step 2: Write `src/components/Annotation.astro`**

```astro
---
interface Props {
  variant: 'decision' | 'tradeoff';
  label?: string;
}

const { variant, label } = Astro.props;

// The default labels are the phrasing from the source draft. They carry the
// voice of the page and should not be reworded without the owner's say-so.
const DEFAULT_LABELS = {
  decision: 'The decision I would point to',
  tradeoff: 'Trade-off',
} as const;

const heading = label ?? DEFAULT_LABELS[variant];
---
<aside class:list={['annotation', `annotation--${variant}`]} aria-label={heading}>
  <p class="annotation__label">{heading}</p>
  <div class="annotation__body"><slot /></div>
</aside>
```

`<aside>` rather than `<blockquote>`: these annotate the surrounding text, they do not quote another source.

- [ ] **Step 3: Write `src/components/StackList.astro`**

```astro
---
interface Props { items: readonly string[] }
const { items } = Astro.props;
---
<ul class="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-ink-muted">
  {items.map((item) => <li>{item}</li>)}
</ul>
```

- [ ] **Step 4: Write `src/components/LinkList.astro`**

```astro
---
import type { ProjectLink } from '../schemas/project';

interface Props { links: readonly ProjectLink[] }
const { links } = Astro.props;

const isExternal = (link: ProjectLink) => link.kind !== 'case-study';
---
<ul class="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
  {links.map((link) => (
    <li>
      <a
        href={link.href}
        class="text-accent underline underline-offset-4 hover:no-underline"
        {...(isExternal(link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {link.label}
        <span aria-hidden="true">{isExternal(link) ? ' ↗' : ' →'}</span>
      </a>
    </li>
  ))}
</ul>
```

- [ ] **Step 5: Write `src/components/SectionHeader.astro`**

```astro
---
interface Props { index: string; title: string; id: string }
const { index, title, id } = Astro.props;
---
<div class="mb-8 flex items-baseline gap-4 border-b border-rule pb-3">
  <span class="font-mono text-xs text-ink-muted">{index}</span>
  <h2 id={id} class="font-display text-xl font-semibold">{title}</h2>
</div>
```

- [ ] **Step 6: Build to verify all four components compile**

Temporarily render each once in `src/pages/index.astro`, then:

Run: `npm run build`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/components src/styles/global.css
git commit -m "feat(portfolio): add annotation component and presentational primitives

Decision and trade-off render as visually distinct annotations so a reader
cannot skim past the trade-off."
```

---

### Task 7: Index page

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/components/ContactLinks.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `getCollection('projects')`, all Task 6 components, `BaseLayout`
- Produces: the rendered home page. `ProjectCard.astro` props `{ project: CollectionEntry<'projects'>; index: string }`

- [ ] **Step 1: Write `src/components/ProjectCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import Annotation from './Annotation.astro';
import StackList from './StackList.astro';
import LinkList from './LinkList.astro';

interface Props {
  project: CollectionEntry<'projects'>;
  index: string;
}

const { project, index } = Astro.props;
const { data } = project;
---
<article class="border-t border-rule py-12 first:border-t-0">
  <div class="mb-1 flex items-baseline justify-between gap-4">
    <h3 class="font-display text-2xl font-semibold">{data.title}</h3>
    <span class="font-mono text-xs text-ink-muted">{index}</span>
  </div>

  <p class="mb-4 text-sm text-ink-muted">{data.tagline} · {data.status}</p>

  <StackList items={data.stack} />

  <p class="mt-5 leading-relaxed">{data.summary}</p>

  {data.tier === 'deep' && (
    <>
      <Annotation variant="decision">
        <p>{data.decision.claim}</p>
        <p>{data.decision.reasoning}</p>
      </Annotation>
      <Annotation variant="tradeoff">
        <p>{data.tradeoff}</p>
      </Annotation>
    </>
  )}

  <div class="mt-6"><LinkList links={data.links} /></div>
</article>
```

The `data.tier === 'deep'` check narrows the discriminated union, so `data.decision` and `data.tradeoff` type-check without assertions.

- [ ] **Step 2: Write `src/components/ContactLinks.astro`**

```astro
---
import { CONTACT, SOCIAL } from '../config/site';

const links = [
  { label: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: CONTACT.phoneDisplay, href: `tel:${CONTACT.phone}` },
  { label: 'GitHub', href: SOCIAL.github },
  { label: 'LinkedIn', href: SOCIAL.linkedin },
];
---
<ul class="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
  {links.map((link) => (
    <li>
      <a href={link.href} class="text-accent underline underline-offset-4 hover:no-underline">
        {link.label}
      </a>
    </li>
  ))}
</ul>
```

- [ ] **Step 3: Write `src/pages/index.astro`**

Prose transcribed verbatim from the source draft.

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import SectionHeader from '../components/SectionHeader.astro';
import ProjectCard from '../components/ProjectCard.astro';
import ContactLinks from '../components/ContactLinks.astro';
import { PERSON, SOCIAL, CV_PATH } from '../config/site';

const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
const pad = (n: number) => String(n).padStart(2, '0');

const heroLinks = [
  { label: 'Projects', href: '#projects' },
  { label: 'GitHub', href: SOCIAL.github },
  { label: 'LinkedIn', href: SOCIAL.linkedin },
  { label: 'CV', href: CV_PATH },
];
---
<BaseLayout
  title={`${PERSON.name} — ${PERSON.role}`}
  description="Full-stack developer, mostly backend. IT Systems & Security Engineer supporting 50 to 60 client organisations, and building software the rest of the time."
>
  <section class="py-12">
    <h1 class="font-display text-4xl font-semibold sm:text-5xl">{PERSON.name}</h1>
    <p class="mt-3 text-lg text-ink-muted">
      Full-stack developer, mostly backend. IT engineer by training and by day job.
    </p>
    <p class="mt-6 max-w-prose leading-relaxed">
      I build things that run in production and I can tell you why every decision in them
      was made. Currently an IT Systems &amp; Security Engineer supporting 50 to 60 client
      organisations, and building software the rest of the time.
    </p>
    <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
      {heroLinks.map((link) => (
        <li>
          <a href={link.href} class="text-accent underline underline-offset-4 hover:no-underline">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </section>

  <section class="py-12" aria-labelledby="about">
    <SectionHeader index="01" title="About" id="about" />
    <div class="max-w-prose space-y-5 leading-relaxed">
      <p>
        I started in first-line support, answering phones and diagnosing problems from
        nothing but a description. That taught me to ask better questions. Onsite work came
        next, where I finally had access to the systems and logs behind an application, and I
        started tracing problems to their cause instead of passing them on. That is what
        pushed me toward building rather than only fixing.
      </p>
      <p>
        Today I work as an IT engineer in a managed services environment, fully remote,
        across 50 to 60 client estates. The work is escalated incidents, root cause analysis
        across systems that were never designed to talk to each other, and automation of
        anything that repeats. It is good training for writing backend code, because you
        spend your days seeing how software fails in the real world.
      </p>
      <p>
        I build with an eye on failure modes and concurrency, I test end to end, and I write
        down the decisions I make, including the ones where I chose not to build something. I
        would rather find the gap myself than have someone else find it in production.
      </p>
      <p class="font-mono text-sm text-ink-muted">
        Currently: PHP and Laravel, PostgreSQL, TypeScript and React, Docker and Linux.<br />
        Currently learning: Going deeper on performance and on the parts of the stack I have
        only used, not understood.
      </p>
    </div>
  </section>

  <section class="py-12" aria-labelledby="projects">
    <SectionHeader index="02" title="Projects" id="projects" />
    {projects.map((project, i) => (
      <ProjectCard project={project} index={`${pad(i + 1)} / ${pad(projects.length)}`} />
    ))}
  </section>

  <section class="py-12" aria-labelledby="contact">
    <SectionHeader index="03" title="Contact" id="contact" />
    <p class="mb-6 max-w-prose leading-relaxed">
      Open to backend and full-stack roles, remote or Iași.
    </p>
    <ContactLinks />
  </section>
</BaseLayout>
```

- [ ] **Step 4: Build and inspect**

Run: `npm run build && npm run preview`
Open `http://localhost:4321`. Confirm: five projects, three with both annotation blocks, two without; the theme toggle flips without a flash; every link resolves.

- [ ] **Step 5: Confirm the zero-JavaScript budget**

```bash
find dist -name "*.js" -exec wc -c {} +
```

Expected: no bundled `.js` files, or a total well under 2048 bytes. The theme scripts are `is:inline` and live in the HTML.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/components/ProjectCard.astro src/components/ContactLinks.astro
git commit -m "feat(portfolio): add index page with hero, about, projects and contact"
```

---

### Task 8: Case study pages

**Files:**
- Create: `src/layouts/CaseStudyLayout.astro`, `src/pages/work/[slug].astro`, `src/pages/404.astro`

**Interfaces:**
- Consumes: `getCollection('projects')`, `render` from `astro:content`, Task 6 components
- Produces: `/work/apollo-booking`, `/work/finforge`, `/work/sigurantapenet`

- [ ] **Step 1: Write `src/layouts/CaseStudyLayout.astro`**

```astro
---
import BaseLayout from './BaseLayout.astro';
import StackList from '../components/StackList.astro';
import LinkList from '../components/LinkList.astro';
import { SITE_URL, PERSON } from '../config/site';
import type { ProjectLink } from '../schemas/project';

interface Props {
  title: string;
  tagline: string;
  summary: string;
  stack: readonly string[];
  links: readonly ProjectLink[];
  slug: string;
}

const { title, tagline, summary, stack, links, slug } = Astro.props;

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: title,
  description: summary,
  author: { '@type': 'Person', name: PERSON.name, url: SITE_URL },
  url: new URL(`/work/${slug}`, SITE_URL).href,
};
---
<BaseLayout title={`${title} — ${PERSON.name}`} description={summary} ogType="article">
  <script type="application/ld+json" set:html={JSON.stringify(articleJsonLd)} slot="head" />

  <a href="/#projects" class="font-mono text-xs text-ink-muted hover:text-ink" data-back-link>
    ← All projects
  </a>

  <article class="py-8">
    <h1 class="font-display text-3xl font-semibold sm:text-4xl">{title}</h1>
    <p class="mt-2 text-sm text-ink-muted">{tagline}</p>
    <div class="mt-5"><StackList items={stack} /></div>
    <p class="mt-6 max-w-prose leading-relaxed">{summary}</p>

    <div class="prose-column mt-10 max-w-prose leading-relaxed"><slot /></div>

    <div class="mt-12 border-t border-rule pt-6"><LinkList links={links} /></div>
  </article>
</BaseLayout>
```

`BaseLayout` needs a named `head` slot for the JSON-LD. Add `<slot name="head" />` inside its `<head>`, immediately before `</head>`.

- [ ] **Step 2: Add prose styles to `src/styles/global.css`**

Append to the `@layer components` block:

```css
  .prose-column h2 {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 2.5rem;
    margin-bottom: 0.75rem;
  }
  .prose-column p + p { margin-top: 1rem; }
  .prose-column code {
    font-family: var(--font-mono);
    font-size: 0.875em;
    background-color: var(--surface-tradeoff);
    padding: 0.1em 0.35em;
    border-radius: 4px;
  }
  .prose-column pre {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    background-color: var(--surface-tradeoff);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 1rem;
    margin-block: 1.5rem;
    overflow-x: auto;
  }
  .prose-column pre code { background: none; padding: 0; }
```

- [ ] **Step 3: Write `src/pages/work/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import CaseStudyLayout from '../../layouts/CaseStudyLayout.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects
    .filter((project) => project.data.tier === 'deep')
    .map((project) => ({
      params: { slug: project.id.replace(/^\d+-/, '') },
      props: { project },
    }));
}

const { project } = Astro.props;
const { Content } = await render(project);
const slug = project.id.replace(/^\d+-/, '');
---
<CaseStudyLayout
  title={project.data.title}
  tagline={project.data.tagline}
  summary={project.data.summary}
  stack={project.data.stack}
  links={project.data.links}
  slug={slug}
>
  <Content />
</CaseStudyLayout>
```

The `replace(/^\d+-/, '')` strips the ordering prefix so `03-sigurantapenet.md` becomes `/work/sigurantapenet`. These must match the `case-study` hrefs in the content frontmatter.

- [ ] **Step 4: Write `src/pages/404.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { PERSON } from '../config/site';
---
<BaseLayout title={`Not found — ${PERSON.name}`} description="That page does not exist.">
  <section class="py-24">
    <h1 class="font-display text-3xl font-semibold">404</h1>
    <p class="mt-3 text-ink-muted">That page does not exist.</p>
    <p class="mt-6 font-mono text-sm">
      <a href="/" class="text-accent underline underline-offset-4">Back to the home page</a>
    </p>
  </section>
</BaseLayout>
```

- [ ] **Step 5: Build and verify the three routes exist and slugs match**

```bash
npm run build
ls dist/work/
```

Expected: `apollo-booking/`, `finforge/`, `sigurantapenet/`.

Verify every `case-study` href in content resolves to a built page:

```bash
grep -ho "href: /work/[a-z-]*" src/content/projects/*.md | sed 's|href: /work/||' | \
  while read s; do [ -d "dist/work/$s" ] && echo "OK   $s" || echo "MISS $s"; done
```

Expected: three `OK`, zero `MISS`.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/CaseStudyLayout.astro src/pages/work src/pages/404.astro src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "feat(portfolio): add case study pages for the three deep projects"
```

---

### Task 9: SEO surface — robots, llms.txt, CV

**Files:**
- Create: `src/pages/llms.txt.ts`, `public/robots.txt`, `public/Sofron_Vasile_Stelian_CV.pdf`

**Interfaces:**
- Consumes: `getCollection('projects')`, `SITE_URL`
- Produces: `/llms.txt`, `/robots.txt`, `/Sofron_Vasile_Stelian_CV.pdf`. Sitemap comes from `@astrojs/sitemap`, already configured in Task 1.

- [ ] **Step 1: Compress and install the CV**

```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH \
   -sOutputFile=public/Sofron_Vasile_Stelian_CV.pdf \
   "/Users/vasilesofron/Downloads/Sofron_Vasile_Stelian_CV-PHP.pdf"
ls -la public/Sofron_Vasile_Stelian_CV.pdf
```

If `gs` is unavailable: `brew install ghostscript`. If compression drops below acceptable quality, fall back to `-dPDFSETTINGS=/printer`.

- [ ] **Step 2: Verify the compressed CV is under 500 KB and still text-selectable**

```bash
test $(stat -f%z public/Sofron_Vasile_Stelian_CV.pdf) -lt 512000 && echo "size OK" || echo "TOO LARGE"
python3 -c "import sys;sys.exit(0)" && mdls -name kMDItemTextContent public/Sofron_Vasile_Stelian_CV.pdf | head -c 200
```

Expected: `size OK`, and text content present rather than `(null)`. Open the file and confirm it reads cleanly before continuing.

- [ ] **Step 3: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://sofron-portfolio.vercel.app/sitemap-index.xml
```

Update the origin here alongside `SITE_URL` in Task 12. This is the one permitted duplication; it is a static file and cannot import TypeScript.

- [ ] **Step 4: Write `src/pages/llms.txt.ts`**

```ts
// src/pages/llms.txt.ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL, PERSON, CONTACT, SOCIAL } from '../config/site';

export const GET: APIRoute = async () => {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);

  const body = [
    `# ${PERSON.name}`,
    '',
    `> ${PERSON.role}. ${PERSON.jobTitle} supporting 50 to 60 client organisations, based in ${PERSON.location}.`,
    '',
    '## Projects',
    '',
    ...projects.map((p) => {
      const links = p.data.links.map((l) => `${l.label}: ${new URL(l.href, SITE_URL).href}`).join(' | ');
      return `- **${p.data.title}** — ${p.data.tagline} (${p.data.status}). ${p.data.summary} Stack: ${p.data.stack.join(', ')}. ${links}`;
    }),
    '',
    '## Contact',
    '',
    `- Email: ${CONTACT.email}`,
    `- Phone: ${CONTACT.phoneDisplay}`,
    `- GitHub: ${SOCIAL.github}`,
    `- LinkedIn: ${SOCIAL.linkedin}`,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
```

- [ ] **Step 5: Build and verify the SEO surface**

```bash
npm run build
test -f dist/sitemap-index.xml && echo "sitemap OK"
test -f dist/robots.txt && echo "robots OK"
test -f dist/llms.txt && echo "llms OK"
test -f dist/Sofron_Vasile_Stelian_CV.pdf && echo "cv OK"
grep -c "application/ld+json" dist/index.html
```

Expected: four `OK` lines and at least one JSON-LD block on the index.

- [ ] **Step 6: Validate the JSON-LD parses**

```bash
node -e "
const fs=require('fs');
const html=fs.readFileSync('dist/index.html','utf8');
const blocks=[...html.matchAll(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/g)];
blocks.forEach((b,i)=>{JSON.parse(b[1]);console.log('block',i,'parses OK')});
if(!blocks.length) throw new Error('no JSON-LD found');
"
```

Expected: at least one `parses OK`, no exception.

- [ ] **Step 7: Commit**

```bash
git add public src/pages/llms.txt.ts
git commit -m "feat(portfolio): add robots, llms.txt, JSON-LD surface and compressed CV"
```

---

### Task 10: Playwright end-to-end and accessibility tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/portfolio.spec.ts`, `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: the built site, served by `npm run preview`
- Produces: the executable form of the site's guarantees

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4321', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

- [ ] **Step 2: Write `tests/e2e/portfolio.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const DEEP_SLUGS = ['apollo-booking', 'finforge', 'sigurantapenet'];

test.describe('project structure', () => {
  test('renders five projects', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#projects ~ * article, section[aria-labelledby="projects"] article')).toHaveCount(5);
  });

  test('every project exposes at least one link with a usable href', async ({ page }) => {
    await page.goto('/');
    const articles = page.locator('section[aria-labelledby="projects"] article');
    const count = await articles.count();
    expect(count).toBe(5);

    for (let i = 0; i < count; i++) {
      const hrefs = await articles.nth(i).locator('a[href]').evaluateAll((els) =>
        els.map((el) => el.getAttribute('href') ?? ''),
      );
      expect(hrefs.length, `project ${i} has no links`).toBeGreaterThan(0);
      expect(
        hrefs.some((h) => h.startsWith('https://') || h.startsWith('/work/')),
        `project ${i} has no external or case-study link`,
      ).toBe(true);
    }
  });

  test('three projects render both a decision and a trade-off annotation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.annotation--decision')).toHaveCount(3);
    await expect(page.locator('.annotation--tradeoff')).toHaveCount(3);
  });

  test('decision and trade-off are visually distinguishable', async ({ page }) => {
    await page.goto('/');
    const decision = await page.locator('.annotation--decision').first()
      .evaluate((el) => getComputedStyle(el).borderLeftColor);
    const tradeoff = await page.locator('.annotation--tradeoff').first()
      .evaluate((el) => getComputedStyle(el).borderLeftColor);
    expect(decision).not.toBe(tradeoff);
  });
});

test.describe('case studies', () => {
  for (const slug of DEEP_SLUGS) {
    test(`/work/${slug} is reachable from the home page and links back`, async ({ page }) => {
      await page.goto('/');
      const link = page.locator(`a[href="/work/${slug}"]`).first();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`/work/${slug}/?$`));
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('[data-back-link]')).toBeVisible();
    });
  }
});

test.describe('assets and contact', () => {
  test('the CV is served as a PDF', async ({ request }) => {
    const response = await request.get('/Sofron_Vasile_Stelian_CV.pdf');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
  });

  test('llms.txt is served as plain text', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
  });

  test('contact links are correctly formatted', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href^="mailto:"]')).toHaveAttribute(
      'href', 'mailto:sofron_vasile123@yahoo.ro',
    );
    await expect(page.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:+40722566100');
  });
});

test.describe('theme', () => {
  test('the toggle flips the theme and persists it across navigation', async ({ page }) => {
    await page.goto('/');
    const initial = await page.locator('html').getAttribute('data-theme');
    await page.locator('#theme-toggle').click();
    const flipped = await page.locator('html').getAttribute('data-theme');
    expect(flipped).not.toBe(initial);

    await page.goto('/work/apollo-booking');
    await expect(page.locator('html')).toHaveAttribute('data-theme', flipped!);
  });
});

test.describe('layout', () => {
  test('no horizontal overflow', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('content renders with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('section[aria-labelledby="projects"] article')).toHaveCount(5);
    await context.close();
  });
});
```

- [ ] **Step 3: Write `tests/e2e/a11y.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/', '/work/apollo-booking']) {
  test(`${path} has no critical or serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    expect(
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`),
    ).toEqual([]);
  });
}
```

- [ ] **Step 4: Run the full suite**

Run: `npm run build && npm run test:e2e`
Expected: all tests pass on both the desktop and mobile projects.

- [ ] **Step 5: Fix whatever fails, then re-run until green**

Likely failures and their causes: contrast on `--ink-muted` against `--paper` (raise the muted lightness until axe passes); the project article selector matching the wrong elements (tighten to `section[aria-labelledby="projects"] > article`); the `data-back-link` attribute missing from `CaseStudyLayout`.

Do not weaken an assertion to make it pass. Fix the site.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test(portfolio): add end-to-end and accessibility coverage

Asserts the guarantees the site makes: every project links somewhere real,
deep projects render both annotations, the CV downloads, contact links are
well formed, and the page works with JavaScript disabled."
```

---

### Task 11: CI and the weekly external link check

**Files:**
- Create: `scripts/check-links.mjs`, `.github/workflows/ci.yml`, `.github/workflows/links.yml`

**Interfaces:**
- Consumes: content files, `package.json` scripts
- Produces: CI on push; a weekly link report that opens an issue on failure

- [ ] **Step 1: Write `scripts/check-links.mjs`**

```js
// Verifies every external link in the content collection still resolves.
// Runs weekly, not on push: a rate-limited third party must not turn a commit red.
import { readdirSync, readFileSync } from 'node:fs';

const DIR = 'src/content/projects';

// LinkedIn answers non-browser clients with 999. Treating that as a failure would
// fire a false alarm every week, which trains you to ignore the alarm.
const ACCEPTED = new Set([200, 201, 202, 203, 204, 301, 302, 303, 307, 308, 999]);

const urls = new Set();
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const content = readFileSync(`${DIR}/${file}`, 'utf8');
  for (const match of content.matchAll(/href:\s*(https:\/\/\S+)/g)) urls.add(match[1]);
}
for (const url of ['https://github.com/VasileStelian', 'https://www.linkedin.com/in/vasilestelian/']) {
  urls.add(url);
}

let failed = 0;
for (const url of [...urls].sort()) {
  let status = 0;
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (portfolio link check)' },
      signal: AbortSignal.timeout(20_000),
    });
    status = response.status;
  } catch (error) {
    console.log(`FAIL  ${url}  ${error.message}`);
    failed++;
    continue;
  }
  if (ACCEPTED.has(status)) {
    console.log(`OK    ${url}  ${status}`);
  } else {
    console.log(`FAIL  ${url}  ${status}`);
    failed++;
  }
}

console.log(`\n${urls.size} checked, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

Add to `package.json` scripts: `"check:links": "node scripts/check-links.mjs"`

- [ ] **Step 2: Run it locally**

Run: `npm run check:links`
Expected: exit 0. Every URL reports OK, LinkedIn reporting 999.

- [ ] **Step 3: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.12'
          cache: npm
      - run: npm ci
      - run: npm run test:unit
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 4: Write `.github/workflows/links.yml`**

```yaml
name: External link check

on:
  schedule:
    - cron: '0 6 * * 1'
  workflow_dispatch:

permissions:
  issues: write

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22.12'
      - id: links
        run: npm run check:links | tee link-report.txt
        continue-on-error: true
      - if: steps.links.outcome == 'failure'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('link-report.txt', 'utf8');
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '[BUG] Portfolio has dead external links',
              labels: ['bug', 'claude-ready', 'P2'],
              body: '## Summary\n\nThe weekly link check found unreachable links.\n\n## Report\n\n```\n' + report + '\n```\n\n## Acceptance Criteria\n\n- [ ] Every failing link is fixed or removed\n- [ ] `npm run check:links` exits 0',
            });
```

- [ ] **Step 5: Verify the workflow files parse**

```bash
node -e "
const {execSync}=require('child_process');
for (const f of ['.github/workflows/ci.yml','.github/workflows/links.yml'])
  execSync(\`python3 -c \\\"import yaml,sys;yaml.safe_load(open('\${f}'))\\\"\`);
console.log('both workflows parse');
"
```

Expected: `both workflows parse`.

- [ ] **Step 6: Commit**

```bash
git add scripts .github package.json
git commit -m "ci(portfolio): add build/test pipeline and weekly link check

Link verification runs on a schedule rather than on push so a rate-limited
third party cannot turn a commit red. LinkedIn's 999 is treated as healthy."
```

---

### Task 12: Vercel deploy and origin fixup

**Files:**
- Create: `vercel.json`
- Modify: `src/config/site.ts`, `public/robots.txt`

**Interfaces:**
- Consumes: a green build
- Produces: the live site; `SITE_URL` matching the assigned origin

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/_astro/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

- [ ] **Step 2: Deploy**

```bash
npx vercel --prod
```

Record the assigned origin from the CLI output.

- [ ] **Step 3: Update the origin in both places and redeploy**

Set `SITE_URL` in `src/config/site.ts` and the `Sitemap:` line in `public/robots.txt` to the assigned origin, then:

```bash
npm run build && npx vercel --prod
```

- [ ] **Step 4: Verify canonical, sitemap and llms.txt all carry the real origin**

```bash
ORIGIN="<assigned origin>"
curl -s "$ORIGIN" | grep -o '<link rel="canonical"[^>]*>'
curl -s "$ORIGIN/sitemap-index.xml" | head -3
curl -s "$ORIGIN/robots.txt"
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "$ORIGIN/Sofron_Vasile_Stelian_CV.pdf"
```

Expected: every URL uses the assigned origin; the CV returns `200 application/pdf`.

- [ ] **Step 5: Run Lighthouse against production**

```bash
npx lighthouse "$ORIGIN" --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless" --output=json --output-path=/tmp/lh.json --quiet
node -e "
const r=require('/tmp/lh.json');
for (const [k,v] of Object.entries(r.categories)) console.log(k, Math.round(v.score*100));
"
```

Expected: 100 across all four. Anything below 100 is fixed, not accepted.

- [ ] **Step 6: Commit**

```bash
git add vercel.json src/config/site.ts public/robots.txt
git commit -m "chore(portfolio): deploy to Vercel and set the production origin"
```

---

### Task 13: Humanizer pass and backlog issues

**Files:**
- Modify: content and page copy, only where the owner approves a change
- Create: GitHub issues

**Interfaces:**
- Consumes: all shipped copy
- Produces: a reviewed copy report; tracked backlog

- [ ] **Step 1: Run the humanizer skill as a detector**

Invoke the `humanizer` skill over: `src/pages/index.astro` prose, and the `summary`, `decision`, `tradeoff` fields plus markdown bodies of all five content files.

- [ ] **Step 2: Present findings without applying them**

Produce a table of: location, flagged pattern, suggested change. Apply nothing yet.

Per spec §10, the draft's em dashes, parallelism and rule-of-three constructions are deliberate voice. The owner decides each change. Auto-applying would sand the writing down to neutral and lose the quality that makes the page worth reading.

- [ ] **Step 3: Apply only the approved changes**

- [ ] **Step 4: Re-run the tests**

Run: `npm run test:unit && npm run build && npm run test:e2e`
Expected: all green. Copy edits must not break the schema or the E2E assertions.

- [ ] **Step 5: Open the tracked backlog issues**

```bash
gh issue create --title "[FEATURE] Restore full security disclosure once sigurantapenet.ro deploys the fixes" \
  --label "feature,security,claude-ready,P3" \
  --body "## Summary

Production at sigurantapenet.ro still serves the pre-remediation build. Per spec §9.1 the closing paragraph was reframed to avoid publishing live unfixed exposure. When the owner deploys the remediation, that constraint disappears.

## Acceptance Criteria

- [ ] Confirm production serves the remediated build
- [ ] Restore the fuller account in \`src/content/projects/03-sigurantapenet.md\`
- [ ] Update the disclosure-trail line to reflect deployment

## Priority

P3: Low"

gh issue create --title "[ENHANCEMENT] Promote diadrive.ro to a deep project" \
  --label "enhancement,claude-ready,P3" \
  --body "## Summary

diadrive.ro is \`tier: brief\`. It has real decision material — excluding the Display network on purpose — but no stated trade-off, and one will not be invented on the owner's behalf.

## Acceptance Criteria

- [ ] Owner writes the trade-off sentence
- [ ] Entry changed to \`tier: deep\` with \`decision\` and \`tradeoff\`
- [ ] Schema tests still pass

## Priority

P3: Low"
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs(portfolio): apply reviewed copy edits"
```

---

## Self-Review

**Spec coverage.** §3 stack → Task 1. §4 content model → Tasks 2–3. §5 routes → Tasks 7, 8, 9. §6 components → Tasks 5–7. §7 visual design → Tasks 4–6. §8 testing: 8.1 build-time → Task 3 Step 7; 8.2 unit → Task 2; 8.3 E2E → Task 10; 8.4 link check → Task 11; 8.5 performance budget → Task 7 Step 5 and Task 12 Step 5. §9.1 security copy → Task 3 Step 4, Global Constraints, Task 13 backlog. §9.2 Homelab → folded into Task 3 Step 3. §9.3 FINFORGE → Task 3 Step 3, Task 13 issue. §9.4 diadrive → Task 3 Step 5, Task 13 issue. §9.5 CV compression → Task 9 Steps 1–2. §9.6 `SITE_URL` → Task 1 Step 8, Task 12 Step 3. §10 humanizer → Task 13.

**Known gap, deliberate:** the spec's OG image asset (`public/og/*.png`) has no task. `SiteHead.astro` emits `og:title`, `og:description` and `og:url` but no `og:image`, so social previews will show no artwork. Generating OG images depends on the Task 4 visual direction and is a separate piece of work; it is not blocked on anything here. Task 13 should add a fourth issue for it if the owner wants it before launch. Screenshot capture for the Apollo and FINFORGE case studies is in the same position — the `public/screens/` directory is declared in the file structure but no task populates it, because the captures have to be taken by the owner from systems only they can access.

**Type consistency.** `Project` and `ProjectLink` are defined in Task 2 and consumed under those exact names in Tasks 6, 7 and 8. `projectSchema` is exported in Task 2 and imported in Task 3. Component prop names (`variant`, `label`, `items`, `links`, `project`, `index`, `id`, `title`, `tagline`, `summary`, `stack`, `slug`) match between definition and every call site. The `data-back-link` attribute is set in Task 8 Step 1 and asserted in Task 10 Step 2. The `.annotation--decision` and `.annotation--tradeoff` class names are defined in Task 6 Step 1 and asserted in Task 10 Step 2. `section[aria-labelledby="projects"]` is emitted in Task 7 Step 3 and queried in Task 10 Step 2.
