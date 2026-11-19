---
name: impeccable
description: "Design review and refinement vocabulary for a component's rendered result: audit (accessibility, performance, theming, responsive, anti-patterns), critique (UX review with heuristic scoring), polish (final pass before shipping) and distill (strip to essence). Use on a component's light and dark screenshots before expert-review, or when asked to audit, critique, polish or simplify a UI."
version: 4.10.0
license: Apache 2.0
---

This skill gives you the tools and permission to make design that earns the name out-of-distribution craft. Work as an award-winning design director would: production-grade code, a clear POV, a deep grasp of what the client and its users need, and exceptional craft.

Core principles:
- Finish the job. No hedging, no shortcuts: the deliverable is complete, except assets the user must provide.
- Scale ambition to the surface's mode (see Modes). On Operate and Read, ambition shows as precision and restraint, and patterns the visitor already knows earn their place.
- Verify by looking at the rendered result at the sizes it ships at, and batch the checks: fix what one look shows before looking again.

## In this repository

Only `audit`, `critique`, `polish` and `distill` are vendored, with the references they load. Every agent-ui component is **Operate** mode: app UI inside someone else's product, where scanability, consistency and native expectations outrank expression.

- **Project context.** There is no PRODUCT.md or DESIGN.md. Read `docs/design-principles.md`, then `AGENTS.md`, the component's spec section and its stylesheet in `packages/agent-ui/src/styles/`. The tokens are `--kind-*` in `agent-ui.css`. Don't create PRODUCT.md or DESIGN.md.
- **Detector.** `impeccable detect` in the references means `DO_NOT_TRACK=1 npx impeccable@4.10.0 detect` (add `--json`). Point it at a fixture or docs page URL, once at `--viewport 1280x800` and once at `--viewport 390x844`, or at the component's stylesheet and render files.
- **Screenshots.** Where a reference says `impeccable shot`, capture the fixture page (`?c=<case>`) or the docs example with Playwright in light and dark, wide and at 390px, with nothing focused unless the shot shows focus.
- **Not available here.** The launcher (`impeccable context`), `critique-storage`, `audit-storage`, `live-server`, `font-fetch`, hooks and native-platform references aren't vendored. Skip those steps; write a report to the session's files, not the repo. When a critique can't run its two assessments as sub-agents, it says so on its first line, as `critique.md` requires.
- **Boundaries.** `unslop` owns generated-looking code and `expert-review` owns each layer's rules (tokens, reduced motion, no layout shift, UI SDK ownership of focus and ARIA). This skill judges what a person sees: hierarchy, density, rhythm, copy, states, and whether an element earns its place. Don't re-report what `npm run lint` or an expert's `decisions.md` already settles.

Read [reference/craft-floor.md](reference/craft-floor.md) immediately before any UI edit, including small refinements. It carries the quality floor, the absolute bans, and the reflexes no detector catches. Do not load it for review-only work.

## How to design

- **The brief wins.** Honor the spec and the repository's settled decisions even when they conflict with a saturated-pattern warning. Redirecting a clear brief toward your taste is failure.
- **Refinement preserves.** Refinement keeps the incumbent identity, behavior, copy, and everything outside scope. Ask before replacing factual copy or adding claims.
- **Visual authority is evidence, not a filename.** The tokens, stylesheets and screenshots are the design system here.

## Modes

The mode names what the visitor's success looks like on this surface.

- **Operate:** the visitor completes a task. App UI, dashboards, editors, admin, settings, tools. Scanability, consistency, native expectations, and the real usage scene outrank expression. Brand lives in precise details.
- **Read:** the visitor understands something. Docs, articles, guides. Structure for comprehension, then make the reading experience worth staying in. The docs site is Read.

## Commands

| Command | Category | Description | Reference |
|---|---|---|---|
| `audit [target]` | Evaluate | Technical quality checks (a11y, perf, theming, responsive, anti-patterns) | [reference/audit.md](reference/audit.md) |
| `critique [target]` | Evaluate | UX design review with heuristic scoring | [reference/critique.md](reference/critique.md), [reference/critique-rubric.md](reference/critique-rubric.md) |
| `polish [target]` | Refine | Final quality pass before shipping | [reference/polish.md](reference/polish.md) |
| `distill [target]` | Refine | Strip to essence, remove complexity | [reference/distill.md](reference/distill.md) |

Load the command's reference and follow it, with the substitutions above. References name other commands (`harden`, `layout`, `bolder`, `quieter` and so on) as follow-ups; they aren't vendored, so name the fix instead.
