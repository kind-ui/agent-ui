# UI SDK update agent

These are the instructions the UI SDK update agent follows on every `ui-sdk-update` pull request. Renovate opens that pull request as `kindui-bot[bot]` (`renovate.json`, `.github/workflows/renovate.yml`), and `.github/workflows/ui-sdk-update.yml` runs Copilot CLI with this file each time the pull request opens or Renovate pushes to it. Edit this file to change what the agent does.

## What you get

- The pull request's branch, checked out with Renovate's version bump and lockfile.
- `UI_SDK_FROM` and `UI_SDK_TO`: the `@ui-sdk/*` versions before and after the bump.
- `UI_SDK_SUMMARY`: the path to write your summary to.
- Dependencies installed (`npm ci`) and Playwright's Chromium.

You can't push, comment or call `gh`. The workflow commits everything you leave in the working tree to this pull request's branch as `kindui-bot[bot]` and posts your summary as its comment. So leave the tree holding only changes you mean to ship.

## Rules

- Never merge, never push, and never touch `main`. The workflow pushes only to this pull request's branch.
- Don't change `.github/workflows/`: the bot can't push workflow changes, and the run fails if you do.
- Don't change dependencies other than `@ui-sdk/*` and what they require as peers.
- Don't mention projects other than UI SDK and our own as references, in code, docs or the summary.
- Follow `AGENTS.md` and the skills it names (`write-code`, `unslop`), as any change in this repo does.

## Steps

1. **Read the changelogs.** For each `@ui-sdk/*` package we depend on (`core`, `react`, `web`, `vue`, `svelte`, `solid`), read its CHANGELOG entries after `UI_SDK_FROM` up to and including `UI_SDK_TO`. They're at `https://raw.githubusercontent.com/vercel-labs/ui/main/packages/<name>/CHANGELOG.md`; the pull request's release notes come from the same place. Compare the installed docs (`node_modules/@ui-sdk/<framework>/docs/`) where an entry is unclear.

2. **Decide whether the release matters.** If no entry touches an API, behavior, type, style or doc we use, change nothing but the changeset (step 8), and say in the summary that the release needs no adaptation and why.

3. **Adapt to breaking changes.** Fix `packages/agent-ui/src/core/` and all five layers (`react`, `web`, `vue`, `svelte`, `solid`), their fixtures, the docs examples and the registry consumers for every breaking change. Keep the five layers' parts and markup in parity, as `scripts/tests/parity.test.mjs` and `tests/browser/parity.spec.ts` check.

4. **Recheck the open gaps.** `AGENTS.md`'s "UI SDK API notes" lists UI SDK gaps we work around, under "Still open as of <version>" and in each layer's bullets. For each one, check whether this release fixes it:
   - Fixed: remove the workaround, the test skip (`test.fail`, `rootIdGap`, a layer gate), the `known` entry in the parity or pattern checks, and the note, and say so in the summary.
   - Not fixed: keep it, and move it under "Still open as of `UI_SDK_TO`".

5. **Adopt clear wins.** Take up new agent bridge and snapshot features when they plainly help the components (a better label, a lighter snapshot, a new action shape), the way the beta.17 upgrade did. Leave anything debatable for a person, and list it under "Still open".

6. **Size budgets.** Run `npm run check:size`. Raise a limit in `size-budget.json` only when UI SDK's own code grew, and give the cause and the growth in the summary. Never raise one to hide our own growth.

7. **Check.** Run `npm run lint`, `npm run typecheck`, `npm run test:scripts` and `npm run test:unit`, then the browser specs your changes reach (`node scripts/affected-specs.mjs`, `npx playwright test <spec> --project wave-<n>-<layer>`). CI runs the full suite on the pull request after the push, so don't run every browser spec here. If something fails that you can't fix, leave the tree consistent and list it under "Still open".

8. **Changeset.** Add `.changeset/ui-sdk-<UI_SDK_TO with dots as dashes>.md` for `@kind-ui/agent-ui`, written for people who use the package: what changes for them, and nothing about how. Use `patch` when nothing public changes, `minor` otherwise. Keep one changeset per release: update it on later runs.

9. **Update `AGENTS.md`.** Change "Pinned version" and the upgrade bullet to `UI_SDK_TO`, as the beta.17 upgrade did.

## The summary

Write Markdown to `UI_SDK_SUMMARY`, short and plain, with these four headings and nothing else:

```md
### What changed
The UI SDK entries that reach us, one line each.

### What we adapted
Each change we made and why, with file paths.

### What we removed
Workarounds, skips and `known` entries this release made unnecessary.

### Still open
Gaps still open as of this version, failing checks, and anything left for a person to decide.
```

Write "Nothing." under a heading with nothing to say. For a release that needs nothing, say that under "What changed".
