---
order: 1
title: Software Developer, OptimumDesk platform
employer: Startech Team
period: October 2026 — present
highlights:
  - label: XDR, two ways
    text: >-
      Built the platform's XDR module two ways. The first is an integration with Wazuh
      over its API: events collected by the agents go in, and the alerts come back into
      the portal. The second is a detection engine built into the platform that runs the
      same rules without Wazuh, and it gives an identical result on all 307 test cases,
      checked one by one against the original implementation.
  - label: 201 PRs in five weeks
    text: >-
      201 pull requests merged between 2 October and 5 November 2026: 117 on the portal
      (PHP, React, TypeScript) and 84 on the API the agents talk to (PHP, Go). Each one
      has its tests written before the code, comes from its own git worktree and can be
      merged on its own.
  - label: Vendor APIs
    text: >-
      Integrations with Bitdefender GravityZone, Check Point and FortiGate. GravityZone
      endpoints sync every hour and its events arrive by webhook; calls stay within the
      vendor's limit of five a minute, and a failed delivery is retried. Check Point and
      FortiGate configuration is read over REST through an agent that sits inside the
      client's network.
  - label: Go on the endpoint
    text: >-
      Components in Go for the agents installed on client machines, on Windows and Linux.
      The Linux collector reads journald and auditd, and it went to production after I
      had tested it on virtual machines of my own.
  - label: One query, two databases
    text: >-
      Dashboard screens in React and TypeScript, computed from data the platform already
      holds. Every new query runs on MySQL and on Oracle 19c, for the customers who
      install the platform on their own servers, and each one has a test that passes it
      through the strict dialect translator.
---
