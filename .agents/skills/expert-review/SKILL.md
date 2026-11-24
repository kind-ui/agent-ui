---
name: expert-review
description: Reviews an agent-ui change with its layer experts (core, react, web, styles, markdown), only the ones the diff reaches. Use before every push, or when asked for an expert review. Pass a base ref, expert names, or nothing.
metadata:
  internal: true
---

# Expert review

Run the layer experts on what changed. Each expert lives in `.agents/experts/<layer>/`: who it is, what it knows and its review checklist in `expert.md`, what's decided in `decisions.md`. You orchestrate; the experts review.

| Expert | Owns |
| --- | --- |
| `core` | `src/core/` primitives (not `motion/` or `markdown/`), `src/types/`, `src/adapters/`, `src/internal/`, `scripts/` |
| `react` | `src/react/`, `tests/fixtures/react/` |
| `web` | `src/web/`, `tests/fixtures/web/` |
| `styles` | `src/styles/`, `src/core/motion/` |
| `markdown` | `src/core/markdown/` and its tests |

Core primitives and browser specs are shared: both render experts read them for what a user of their layer would meet.

## 1. Find the scope

```sh
node scripts/expert-scope.mjs --base origin/main          # a branch before pushing
node scripts/expert-scope.mjs --base <parent-branch>      # a stacked PR: only this layer's commits
node scripts/expert-scope.mjs --json                      # each expert from its "Last reviewed" commit
```

Arguments narrow it: a ref becomes `--base`; expert names keep only those experts. An empty plan means no expert is needed: say so and stop.

Run `npm run lint` first, so the experts spend their review on what the linters and the UI SDK guard can't catch.

## 2. Ask the experts

Spawn one background agent per expert in the plan, all at once (in Claude Code, the named `<layer>-expert` agents in `.claude/agents/`; elsewhere, a general-purpose agent told to read `.agents/experts/<layer>/expert.md` first and act as it). Prompt:

```
Review mode. Scope: git diff <base>...HEAD.
Your files: <own>. Shared files: <shared>.
Review your files, and the shared ones only for what your layer meets.
Don't report anything decisions.md lists, or these lint findings: <findings, or none>.
```

Give each expert only this. Experts that write throwaway tests use their own ports and delete the tests before they finish.

## 3. Collect

1. One table: expert, verdict, proven findings by rank, suspected, revisit.
2. Dedupe: a finding several experts report is one item, listed once, with every layer it reaches.
3. Hand the table to the user. Don't fix anything unless asked.

## 4. After triage

Each finding goes one of three ways, in the same turn:

- **Fix now**: fix it, with its proof as the test when it changes behavior.
- **Later**: one line under "Known and open" in that expert's `decisions.md`.
- **Won't do / decided otherwise**: one line under "Settled" in `decisions.md`, with the reason, so no expert raises it again.

Then move `Last reviewed:` in each expert's `decisions.md` to the reviewed `HEAD`.
