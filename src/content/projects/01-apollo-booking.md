---
tier: deep
order: 1
title: Apollo Booking
tagline: Appointment platform, my own product
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
  An appointment platform built from scratch and running in production: Laravel backend,
  Filament admin, public REST API, email and SMS confirmations, deployed on a VPS, with a
  separate marketing site consuming its API.
highlights:
  - label: Concurrency
    text: >-
      Made double-booking structurally impossible rather than merely unlikely, by moving
      the rule into a partial unique index in PostgreSQL. An application-level check
      leaves a race window — two requests can both read "slot is free" before either
      writes. A database constraint is atomic, so the guarantee holds however many
      workers run. The cost, accepted deliberately: the error arrives as a constraint
      violation the application has to translate into something a person understands.
  - label: Reskin, not fork
    text: >-
      Built so that a second client is a marketing skin rather than a branch of the
      product. The Laravel product is client-agnostic; each client gets its own static
      site pulling services, specialists and gallery over a read-only JSON API with rate
      limiting and CORS. Onboarding a client never touches the code that runs the
      bookings.
  - label: One code path
    text: >-
      Isolated business logic in Action classes so the same code serves both the admin
      panel and the public API, and can be tested without an HTTP request. 300+ Pest
      tests run on every change, and each booking rule is verified once instead of twice.
  - label: Deploys itself
    text: >-
      Editing a service in the admin rebuilds the marketing site with no manual step:
      Laravel observers fire deploy hooks on content change and Cloudflare Pages rebuilds
      against the API. Publishing used to mean editing in one place and remembering to
      redeploy the other.
  - label: Booking integrity
    text: >-
      Closed the two paths that matter on a public booking form. A booking cannot be
      confirmed by an email address the requester does not control, because confirmation
      requires an emailed OTP; and the first-run setup wizard cannot be claimed by
      whoever reaches the URL first. Admin accounts sit behind TOTP.
  - label: Runs on my pager
    text: >-
      Dockerised on FrankenPHP and deployed to a Hetzner VPS through Coolify with a queue
      worker and scheduler, media on Cloudflare R2. When it breaks at 2am it is mine to
      fix, which is a different relationship with your own code than shipping it over a
      wall.
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
