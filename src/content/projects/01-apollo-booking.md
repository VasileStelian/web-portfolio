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
