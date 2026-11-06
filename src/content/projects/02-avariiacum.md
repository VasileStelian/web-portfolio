---
tier: deep
order: 2
title: avariiacum.ro
tagline: Outage reporting for utilities, by neighbourhood, my own product
status: in production
stack:
  - Next.js 16
  - React 19
  - TypeScript
  - Supabase
  - PostgreSQL
  - Vercel
  - Vitest
summary: >-
  A public site where residents report, without an account, that the water, power, gas,
  hot water or heating is off in their neighbourhood. When enough different people
  report the same thing within the hour, the page says an outage is likely. Live for
  Bacău, Iași and Galați, and built in two days, 5 and 6 October 2026.
highlights:
  - label: Three people, one hour
    text: >-
      One report could be one flat's problem. Three reports from different people in the
      same neighbourhood within the same hour turn the page to "Probabil avarie" (likely
      outage). The state clears itself once the reports stop, so nobody has to remember
      to close an outage that is over.
  - label: Fresh but cached
    text: >-
      Pages are rendered on the server and cached for 60 seconds, and a new report
      regenerates them straight away, so a report shows up the moment it is made. What
      reaches the browser is plain HTML.
  - label: Anonymous, not open
    text: >-
      There are no accounts, and the browser never touches the database: row level
      security keeps it closed. Each device can report a given service in a given
      neighbourhood once every two hours, and the limit is checked atomically in SQL, so
      two quick taps cannot both get through.
  - label: Forgets on purpose
    text: >-
      No personal data is kept for long. The IP address becomes an HMAC fingerprint, and
      a pg_cron job that runs every 15 minutes deletes it no more than two hours and a
      quarter after it was written.
  - label: Two days, full checks
    text: >-
      A two-day build, with the checks of a longer one: lint, type checks, unit tests, a
      production build, a smoke test on the HTML the server returns, and database and
      reporting-flow tests in Chromium against a local Supabase.
links:
  - label: Live site
    href: https://avariiacum.ro
    kind: live
  - label: Source
    href: https://github.com/VasileStelian/avariiacum
    kind: repo
  - label: Case study
    href: /work/avariiacum
    kind: case-study
shots:
  - label: City page
    desktop: /screens/avariiacum-desktop.webp
    mobile: /screens/avariiacum-mobile.webp
    alt: >-
      The Bacău page: one row per neighbourhood, one column each for water, power, gas
      and heating, with the button to report a problem
---

## From reports to an outage

A report says one thing: this service is off, here, now. On its own that proves little,
because it could be a single building or a single tap. The page changes state only when
three different people in the same neighbourhood report the same service within the same
hour, and then it shows "Probabil avarie". When the reports stop coming, the state clears
on its own. An outage that nobody closes would be worse than none at all, because the
page would keep saying something that is no longer true.

## Fast pages that do not go stale

Every city page is rendered on the server and cached for 60 seconds. A new report
regenerates the page at once rather than waiting for the cache to run out, so the cache
only ever saves work and never hides a report. The content arrives as plain HTML.

## Anonymous, with limits

Taking reports without accounts means the limits have to live somewhere else:

- The browser has no access to the database. Row level security closes it.
- One report per device, per service, per neighbourhood, every two hours. The check and
  the write happen together in SQL, so two requests sent at the same moment cannot both
  pass.
- The IP address is stored only as an HMAC fingerprint, and a pg_cron job running every
  15 minutes deletes it within two hours and fifteen minutes.

## How it is checked

Lint, type checks, unit tests, a production build and a smoke test on the HTML the server
actually returns. On top of that, database tests and tests of the whole reporting flow run
in Chromium against a local Supabase. The source is public on GitHub.
