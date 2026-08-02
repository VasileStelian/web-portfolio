---
tier: deep
order: 1
title: School Logistics
tagline: Multi-tenant SaaS for driving schools, built solo end to end
status: shipped
stack:
  - Laravel 12
  - PHP 8.4
  - React 18
  - TypeScript
  - Inertia.js
  - MySQL
  - Stripe / Cashier
  - Filament 3
  - Redis
  - PHPUnit
  - Playwright
  - Hetzner / Forge
summary: >-
  A B2B SaaS for Romanian driving schools: scheduling, students, instructors, billing and
  a DRPCIV exam e-learning platform. 29 models, 30 controllers, 62 migrations and roughly
  41,500 lines of production code, delivered on my own over three and a half months. The
  ScoliDeSofer.ro directory below is its acquisition channel.
highlights:
  - label: Tenants cannot leak
    text: >-
      Cross-school data leaks are structurally impossible rather than a thing a developer
      has to remember. A single Eloquent global scope filters every query by school, so no
      controller carries a tenancy clause and forgetting one is not a failure mode that
      exists. Thirty controllers, one place where isolation is enforced.
  - label: Billing that reconciles
    text: >-
      Built the whole monetisation path on Stripe through Cashier: checkout, customer
      portal, five webhook handlers, and per-student metered billing reported
      automatically. Licence provisioning is idempotent and transactional, so a webhook
      delivered twice — which Stripe does by design — grants access once rather than
      double-charging or double-provisioning.
  - label: 24-hour hole closed
    text: >-
      Plan expiry is checked at request time, not only by the nightly job. A cron-only
      check leaves a school with up to a day of paid features after it has stopped paying;
      the runtime check closes that window. Gating itself lives in middleware and one
      service rather than scattered across controllers.
  - label: 1,272 tests
    text: >-
      1,235 PHPUnit tests plus 37 Vitest and a Playwright end-to-end suite, all passing —
      22,530 lines of test against 41,500 lines of production code, a ratio close to one to
      two. On a system where a bug means a school bills the wrong customer or sees another
      school's students, that ratio is the point rather than a vanity number.
  - label: 1,741 exam questions
    text: >-
      Built the DRPCIV e-learning side as a product in itself: the full official question
      bank for categories B and C with 425 images, a quiz engine, an exam simulator and
      per-student progress tracking. Getting the content in and correct was as much of the
      work as the engine that serves it.
  - label: Billing hardened
    text: >-
      Threat-modelled the money path specifically and hardened it: webhook signatures
      verified, rate limiting, role-based access across owner, secretary, instructor and
      student, audit logging, and Stripe price IDs resolved on the server only — a client
      that posts its own price ID gets nowhere.
  - label: 66 PRs, 97 issues
    text: >-
      Shipped through one pull request per issue, with the whole history reviewable. Solo
      projects usually show as a wall of commits straight to main; this one is worth
      pointing at because it demonstrates the process a team would ask about, not just the
      code.
  - label: 19 EUR a month
    text: >-
      Designed the production infrastructure to run for about nineteen euros a month on
      Hetzner with Forge and Cloudflare R2. For a product priced per school, hosting cost
      per tenant is part of whether the business works, not an afterthought.
links:
  - label: Case study
    href: /work/school-logistics
    kind: case-study
---

## Multi-tenancy

Every tenant-owned model uses one trait. The trait registers a global scope that adds the
school constraint to every query, and a creating hook that stamps the current school on
insert. The result is that a controller reads as if tenancy did not exist:

```php
// Returns only this school's students. There is no where() to forget.
$students = Student::query()->orderBy('last_name')->get();
```

The alternative — a `where('school_id', ...)` in each of thirty controllers — works right
up until someone adds the thirty-first and does not. That failure is silent, and its
consequence is one school reading another school's data.

The cost is that the scope has to be explicitly removed in the few places that genuinely
cross tenants, such as the admin panel. That is a deliberate, visible exception rather
than a default.

## Billing

Stripe delivers webhooks at least once, not exactly once, which means every handler has to
assume it will be called again with the same event. Provisioning runs inside a transaction
keyed on the event, so a duplicate delivery finds the work already done and returns.

Price identifiers never come from the client. The browser sends a plan name; the server
resolves it to a Stripe price. A client that posts its own price ID is choosing a plan that
does not exist as far as the backend is concerned.

## Where it stands

The engineering is done and the suite is green. What this project does not have yet is
traction — no customer count, no revenue, no usage figures — because it has not launched.
The numbers above are all output, verifiable from the repository. When there are outcome
numbers, they will say more than any of this.
