# Stitch design system and screens — notes

Generated via the Stitch MCP server per Task 4 of the portfolio rebuild. This is a record
of what was created; the generated markup itself is reference-only and was never copied
into `src/` (spec §7.3).

## Identifiers

| Resource | ID |
|---|---|
| Stitch project | `868589041702559116` (`projects/868589041702559116`) |
| Design system asset | `assets/13426667050352618069` (version `1`) |

### The three screens (canonical)

| # | Screen | Resource name | Size (px, @2x capture) |
|---|---|---|---|
| 1 | Home, desktop | `projects/868589041702559116/screens/cd3f5b0782fc444a8f5fbd0f61897626` | 2560 × 8814 |
| 2 | Case study, desktop ("NomadDB Partition Manager") | `projects/868589041702559116/screens/dd9ced6d7c3047c896b23a8b4187a7ea` | 2560 × 5252 |
| 3 | Home, mobile (375px content, captured @2x) | `projects/868589041702559116/screens/75d4312901d74af791e862d1c68ad483` | 780 × 8250 |

### Duplicate screens present in the project (not canonical — recommend deleting)

The `list_screens` tool returned empty for roughly 40 minutes of wall-clock time across
this session, and the project's `thumbnailScreenshot` never updates past the *first*
screen ever generated for a project. Both of those looked, from every tool available,
like "nothing happened," even though generation was completing normally server-side. That
led to two unnecessary retries of the desktop home screen before `list_screens` finally
returned real data and exposed all five screens that actually exist:

| Screen | Resource name | Notes |
|---|---|---|
| Home retry #1 | `projects/868589041702559116/screens/664950ea41db40b78dff4a9c07aa7c83` | 2560×7776, duplicate of screen 1 |
| Home retry #2 | `projects/868589041702559116/screens/c855178da2144aaa8f4125217b77ec9d` | 2560×8826, duplicate of screen 1 |

There is no `delete_screen` tool exposed by this MCP server (only `delete_project`), so
these two duplicates could not be removed programmatically. **Owner action needed:**
delete these two in the Stitch web UI if a clean project is wanted before Task 5.

## Tokens actually accepted by Stitch

Every value in the brief's Step 2 payload was accepted verbatim — **no enum rejections,
no substitutions.** `list_design_systems` on the project echoes back exactly what was
sent:

| Field | Value sent | Accepted? |
|---|---|---|
| `colorMode` | `LIGHT` | yes |
| `headlineFont` | `IBM_PLEX_SERIF` | yes |
| `bodyFont` | `IBM_PLEX_SANS` | yes |
| `labelFont` | `JETBRAINS_MONO` | yes |
| `roundness` | `ROUND_FOUR` | yes |
| `colorVariant` | `NEUTRAL` | yes |
| `customColor` / `overridePrimaryColor` | `#8C4A3F` | yes |
| `overrideSecondaryColor` | `#6B6B5E` | yes |
| `overrideNeutralColor` | `#FAF9F5` | yes |

These match spec §7.1's light-mode row exactly (`--color-accent` → `#8C4A3F`,
`--color-muted-accent` → `#6B6B5E`, `--color-paper` → `#FAF9F5`) and spec §7.2's font
roles exactly. **Spec §7.1 wins for the dark-mode tokens** (`#131311` paper, `#EDEBE4`
ink, `#C4796A` accent, `#8A8878` muted-accent) — the brief's Step 2 payload only
configured `colorMode: LIGHT`, so Stitch never generated a dark variant. That's expected,
not a divergence: dark mode was never requested of Stitch, and Task 5 should implement it
directly from spec §7.1 rather than trying to derive it from anything Stitch produced.

### Why there's no structured spacing/type scale from Stitch for this asset

`create_design_system`/`list_design_systems` support optional `spacing` and `typography`
maps on the theme, and Stitch clearly *can* populate them — a diagnostic project created
during this session with **no** design system supplied got a fully auto-derived scale
(named colors, an 8-role typography scale, a spacing map) written back onto its asset.
But our asset was created with an explicit, fully-specified theme (all the fields above),
and Stitch never enriched it with derived `spacing`/`typography`/`namedColors` fields —
`list_design_systems` for `assets/13426667050352618069` still shows only the bare fields
we sent, even after three screens were generated against it. So there is no
Stitch-authored numeric scale to transcribe here. What follows is a qualitative read of
the actual screenshots, not structured output from the tool:

- **Spacing:** generous section-level whitespace, hairline rules between sections,
  content column reads close to spec's "≈68 characters" measure on desktop. No
  pixel-precise scale can be responsibly quoted from a screenshot — Task 5 should define
  its own scale (e.g. a standard 4/8px-based scale) rather than reverse-engineer one.
- **Type:** headline serif is used correctly for project/page titles (case study title,
  project entry titles). The single largest hero display piece (the name "Sofron
  Vasile-Stelian" on the home screens) renders in a heavy grotesque/sans face instead of
  IBM Plex Serif — see divergences below. Body copy and monospace labels read as expected
  (IBM Plex Sans body, JetBrains Mono labels/stack-chips/metadata).

## Divergences from the brief/spec, and which wins

1. **Hero headline font.** The large display name on both home screens (desktop and
   mobile) renders in a bold grotesque/sans face, not IBM Plex Serif. Project/case-study
   titles elsewhere on the same screens *do* render serif correctly. **Spec §7.2 wins:**
   Task 5 should set `font-family: var(--font-headline)` (IBM Plex Serif) on the hero
   name explicitly rather than following Stitch's rendering.

2. **Icon usage.** designMd explicitly said "no icon sets." Stitch added icon glyphs
   anyway: a terminal-prompt icon in the site header (screens 2 and 3), bracket/frame
   icons in front of "Code"/"Demo"/"Specs" links (all screens), and a full icon-based
   architecture diagram on the case-study screen (server/load-balancer icons, not
   requested by the prompt at all). **Brief wins:** none of this should be carried into
   `src/`; Task 5's hand-written components should stay text-only, matching the
   "restraint over decoration" intent.

3. **TRADE-OFF rule color reads cool, not olive.** In the rendered screens the TRADE-OFF
   left rule and label read as a neutral slate/blue-gray rather than the warm
   graphite-olive `#6B6B5E` specified. This may be a rendering/screenshot artifact rather
   than the literal token, since the token itself was accepted unmodified (see table
   above). **Spec wins regardless:** Task 5 should hand-apply `#6B6B5E` and not sample
   color from the Stitch screenshots.

4. **Site navigation is inconsistent between screens.** Each screen was generated
   independently, so the header nav differs across all three (home: "About / Systems /
   Protocols / Trade-offs" + "Connect"; case study: "Archive / System / Contact" +
   terminal icon; mobile: "ENGINEERING_LOG" wordmark only). Expected consequence of
   per-screen generation, not a defect — Task 5 builds one shared header component, so
   this doesn't propagate.

5. **Section labels are editorialized beyond the literal brief wording.** "Projects"
   became "Systems & Implementations", "Contact" became "Establish Connection" /
   "Establish a Connection". Consistent with the "Annotated Engineering Record" voice;
   flagged as a content choice, not a defect. Task 5 can keep or discard per the owner's
   taste — content copy is out of scope for what Stitch is meant to lock in (spec §7.3:
   Stitch is for tokens/proportions, not copy).

6. **`update_design_system` could not be exercised as the brief's Step 2 describes.**
   See report for the full account — six payload variants were tried and all were
   rejected by the API with an opaque `Request contains an invalid argument` error, even
   though `create_design_system` accepted the identical payload. This did not block
   anything: `generate_screen_from_text` successfully used the asset by ID directly
   across all three screens, and `get_project`'s theme becomes populated as a side effect
   of the *first* successful screen generation, achieving the same practical outcome
   ("apply to the project") that Step 2 called for.

## What the DECISION/TRADE-OFF treatment actually looks like (the important part)

This is the one thing worth being unambiguous about: the core differentiator works.
Across all three screens, DECISION blocks consistently get a saturated red/oxide left
rule, a bold monospace all-caps "DECISION" label, and a faintly tinted (pale
pink/red) background; TRADE-OFF blocks consistently get a cooler, more muted rule and
label and a paler neutral tint. No drop shadows, no card chrome, hairline rule only. On
the mobile screen at narrow width the left rule and label remain fully legible and the
block never collapses into something skimmable — a reader cannot miss the trade-off. This
is a genuine, structurally sound realization of the brief's central design intent, even
though the exact hex values drifted from spec (see divergence #3) and should be
hand-corrected in Task 5.

## Screenshots

Full-resolution screenshots for all three canonical screens were downloaded and reviewed
during this task (not committed to the repo — Stitch output is reference-only per spec
§7.3). The owner can view the live screens directly in the Stitch project
(`868589041702559116`) or ask for the reviewed screenshots to be shared separately.
