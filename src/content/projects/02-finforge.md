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
highlights:
  - label: No lost edits
    text: >-
      Two people editing the same budget on two phones cannot silently overwrite each
      other. Every save carries a version and applies in one transaction scoped to what
      the caller may write; a stale version is rejected before anything is written, and
      other sessions are notified over SSE and re-fetch. The failure this removes is the
      quiet one — an edit that disappears and nobody ever learns it happened. The cost:
      version-per-save is coarse and rejects some edits that would not truly have
      conflicted. Invisible at two users; at scale it would need finer granularity.
  - label: Boundary held
    text: >-
      Moved the app from localStorage to a real backend by changing the adapter and one
      hook — not the pages. The domain logic (surplus, recurring projection, goal
      allocation) sits in pure functions with no framework or storage access, and
      persistence sits behind a single storage interface. The migration was the proof
      that the boundary was in the right place.
  - label: Auth done properly
    text: >-
      argon2id hashing, opaque session tokens in httpOnly cookies, double-submit CSRF,
      and per-route rate limits with the tightest bucket on login — on a personal project
      nobody would have audited, because the data is our household finances.
  - label: Decisions on record
    text: >-
      Architecture decisions are written down as ADRs, including the ones that
      deliberately keep features out. The record of what was refused is the part that
      stops a small tool turning into an unmaintained big one.
links:
  - label: Source (registru)
    href: https://github.com/VasileStelian/registru
    kind: repo
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
