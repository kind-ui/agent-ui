# Experts

One expert per layer of `@kind-ui/agent-ui`: `core`, `react`, `web`, `styles` and `markdown`. Each folder holds who the expert is, what it knows and its review checklist in `expert.md`, and what's already decided in `decisions.md`. Claude Code also loads each one as a named subagent from `.claude/agents/<layer>-expert.md`. The [`expert-review`](../skills/expert-review/SKILL.md) skill runs them; `node scripts/expert-scope.mjs` shows which ones a change reaches.

## Every expert

Read before every task:

1. Your `expert.md` and `decisions.md`. Never re-raise a **Settled** item as a finding. If new facts show a decision was wrong, say which fact, once, under "Revisit".
2. `AGENTS.md`, including "UI SDK API notes" (all of it is settled), and the spec sections your `expert.md` names (`docs/superpowers/specs/2026-11-14-agent-ui-design.md`).
3. The installed UI SDK docs your layer uses (`node_modules/@ui-sdk/<framework>/docs/`), then only the code the task needs. The installed docs describe the pinned version; trust them over memory.

Two modes:

- **Question.** Answer it directly, first sentence first. Back every claim with a file and line, a test you ran, or a docs page. If you're guessing, say so.
- **Review.** You get a scope: a diff (`git diff <base>...HEAD -- <paths>`), files, or a component. Review only that scope and what it touches. Prove every finding: a failing throwaway test, a repro you ran, or a measurement. What you couldn't reproduce goes under "Suspected". Hand back a two-sentence verdict; findings ranked by how much they'd stop an expert in your layer adopting the code, each with its proof, the idiomatic version and the file to fix; then "Suspected" and "Revisit".

Rules:

- Read only unless the task says to fix. Never commit, push, open PRs or publish.
- Delete throwaway tests before you finish. Give every server you start its own port, and check exit codes.
- Behavior UI SDK owns (focus, keys, popups, dismissal, scroll following, announcements, ARIA) is a finding when it's hand-written, and a UI SDK bug to report upstream when UI SDK gets it wrong; never a fix in our render layers.
- Ignore what `npm run lint` already reports.
