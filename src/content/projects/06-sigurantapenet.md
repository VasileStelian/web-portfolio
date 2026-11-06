---
tier: deep
order: 6
title: Development on an inherited Laravel platform
tagline: sigurantapenet.ro, employer work at Startech Team
status: in production
stack:
  - Laravel
  - MySQL
  - Blade
  - Bootstrap
  - Tailwind v4
  - JavaScript
summary: >-
  From March to September 2026 I took over development of sigurantapenet.ro, an online
  safety training platform that other people had built in Laravel over three years. It
  stayed in production the whole time: 262 commits across the back end and the front
  end, as part of my job at Startech Team.
highlights:
  - label: Changed while running
    text: >-
      262 commits between March and September 2026 on an application that never went
      offline for them. It is the one project here that I did not start, which means
      every change had to fit code written before I arrived and leave the parts I did not
      touch working exactly as they were.
  - label: 37 pages migrated
    text: >-
      Introduced Tailwind v4 into a three-year-old Bootstrap/SCSS codebase behind an
      explicit opt-in allow-list, migrating 37 pages incrementally with no regressions to
      anything untouched. No freeze, no big-bang rewrite, and no page left broken while
      the migration was half done.
  - label: Rebuilt on a system
    text: >-
      Gave the front end shared CSS primitives, reusable Blade components and layouts
      built for their purpose, then rebuilt the homepage, the sign-in flow and the whole
      learning area on top of them.
  - label: ADA Simulator
    text: >-
      Built the ADA Simulator in JavaScript. It turns a guide from DNSC, Romania's
      national cyber security directorate, into an interactive exercise in spotting
      deepfakes, fake influencers generated with AI and bots, and explains the dead
      internet theory. A password strength checker sits alongside it.
  - label: Free to paid closed
    text: >-
      Closed a path from a free account to a paid business plan. Three password-change
      endpoints were reachable by any authenticated user and unscoped to the caller, so
      one of them could be used to reach handlers belonging to other account tiers,
      including the one that upgrades a plan.
  - label: Passwords migrated
    text: >-
      Moved the entire user base off unsalted MD5 without a single forced reset or a
      minute of downtime. Expiring every password would have cost an email campaign, a
      support spike, and every dormant account that never reads the email. Instead the
      login path detects the legacy format, verifies against it once, and writes bcrypt
      in its place — users noticed nothing. The cost, documented rather than hidden:
      dormant accounts never sign in, so they never migrate, and the legacy verification
      path stays alive until a planned cutoff.
links:
  - label: Live site
    href: https://sigurantapenet.ro
    kind: live
  - label: Case study
    href: /work/sigurantapenet
    kind: case-study
shots:
  - label: Rebuilt homepage
    desktop: /screens/sigurantapenet-desktop.webp
    mobile: /screens/sigurantapenet-mobile.webp
    alt: The training platform's homepage, rebuilt on the shared components and layouts
---

## Working in code I did not start

The platform had been running for three years when I took it over: Laravel, MySQL,
Blade, and a front end in Bootstrap and SCSS. It stayed in production while I worked on
it, so no change could need a maintenance window, and the modules I was not working on
had to behave exactly as they did before.

## Tailwind without a big bang

Rewriting the front end in one go would have meant either freezing the product or
keeping a long-lived branch that drifted further from production every week. Instead,
Tailwind v4 went in next to Bootstrap behind an explicit opt-in allow-list, so the new
utility classes could not collide with Bootstrap's own class names. Pages moved over one
at a time. 37 of them were migrated with no regressions in the modules I did not touch,
and each step could be reversed on its own.

Shared CSS primitives, reusable Blade components and purpose-built layouts came next,
and the homepage, the sign-in flow and the whole learning area were rebuilt on them.

## The password migration

Rehashing on login was the decision worth defending. The verification path checks
whether the stored hash is legacy format, verifies against it, and on success writes a
bcrypt hash in its place. A user signs in normally and never learns anything happened.

The honest cost is that dormant accounts never sign in, so they never migrate. The
legacy verification path has to stay alive for them, which is a second code path in
the most security-sensitive function in the application. That is a planned cutoff, not
a finished job, and it was documented that way.
