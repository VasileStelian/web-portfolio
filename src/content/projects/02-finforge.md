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
