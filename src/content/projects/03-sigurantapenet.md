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
