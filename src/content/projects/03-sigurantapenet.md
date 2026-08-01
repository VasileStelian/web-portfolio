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
highlights:
  - label: Passwords migrated
    text: >-
      Moved the entire user base off unsalted MD5 without a single forced reset or a
      minute of downtime. Expiring every password would have cost an email campaign, a
      support spike, and every dormant account that never reads the email. Instead the
      login path detects the legacy format, verifies against it once, and writes bcrypt
      in its place — users noticed nothing. The cost, documented rather than hidden:
      dormant accounts never sign in, so they never migrate, and the legacy verification
      path stays alive until a planned cutoff.
  - label: Free to paid closed
    text: >-
      Closed a path from a free account to a paid business plan. Three password-change
      endpoints were reachable by any authenticated user and unscoped to the caller, so
      one of them could be used to reach handlers belonging to other account tiers,
      including the one that upgrades a plan.
  - label: Closed by default
    text: >-
      Flipped the default from open to closed across 14+ unauthenticated routes that
      exposed user enumeration and company data export. Rather than adding a check to
      each controller, enforcement moved into role-based middleware, so a route added a
      year from now is protected unless someone deliberately opts out. The failure mode
      changes from "forgot to add a check" to "explicitly removed one".
  - label: Vulnerabilities fixed
    text: >-
      A SQL injection in the video listing query, missing validation on two rating
      endpoints, and password reset tokens generated with mt_rand() instead of a CSPRNG —
      predictable enough to take over an account without ever knowing the password. All
      of it surfaced in a review I started myself, on code I inherited rather than wrote.
  - label: 37 pages migrated
    text: >-
      Introduced Tailwind v4 into a three-year-old Bootstrap/SCSS codebase behind an
      explicit opt-in allow-list, migrating 37 pages incrementally with no regressions to
      anything untouched. No freeze, no big-bang rewrite, and no page left broken while
      the migration was half done.
  - label: Handed over, not patched
    text: >-
      Reported every finding to the owner with commits and written explanations, and
      stopped at the ownership boundary: issues in a module owned by another engineer
      were documented with reproduction steps and handed over rather than patched
      unasked. Remediation is delivered and awaiting deployment on their side.
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
