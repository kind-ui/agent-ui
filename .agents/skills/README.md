# Skills

Skills for working on `@kind-ui/agent-ui`. Each one is a folder with a `SKILL.md` in plain Markdown, so it works in any agent harness. Adapted from Apache-2.0 and MIT work; see `THIRD_PARTY_NOTICES.md` at the repo root.

| Skill | Use it when | What it does |
| --- | --- | --- |
| [`ui-sdk`](ui-sdk/SKILL.md) | You build or change a component. | The official UI SDK skill, installed from `@ui-sdk/core` (`skills-lock.json`). How to compose UI SDK and build on `@ui-sdk/core`. |
| [`write-code`](write-code/SKILL.md) | You write or change code anywhere in the repo. | Starts from the file that already does the same job, writes the code, runs the checks the change reaches and rereads the diff cold. |
| [`unslop`](unslop/SKILL.md) | You're finishing a change, or a file reads as generated. | Removes comments that restate the code, filler JSDoc, checks for impossible cases, one-caller helpers and vague names. Behavior stays the same. |
| [`write-docs`](write-docs/SKILL.md) | You write or review a docs page. | The site's voice and component page outline: open with the point, explain one thing at a time, check every claim against the code. |
| [`fumadocs`](fumadocs/SKILL.md) | You change `apps/docs`. | Where pages, examples and generated API tables live, which Fumadocs CLIs to use, static export limits and upgrades. |
| [`documentation-writer`](documentation-writer/SKILL.md) | You plan a new kind of page. | Installed from github/awesome-copilot (`skills-lock.json`). Picks the Diátaxis type (tutorial, how-to, reference, explanation) and outlines the page. |
| [`expert-review`](expert-review/SKILL.md) | Before every push. | Picks the layer experts the diff reaches (`node scripts/expert-scope.mjs`), runs them in parallel and hands back one table of findings. |
| [`apple-design`](apple-design/SKILL.md) | You add or review motion, a gesture, a sheet or a transition. | Vendored, with only `metadata.internal` added. Response, direct manipulation, interruptibility, springs, materials, typography and restraint. |
| [`impeccable`](impeccable/SKILL.md) | You have a component's screenshots, before `expert-review`. | Vendored: the core skill with `audit`, `critique`, `polish` and `distill` only; its detector runs through `npx impeccable@4.10.0 detect`. |
| [`web-interface-guidelines`](web-interface-guidelines/SKILL.md) | The checklist pass on a component's render and style files. | Vendored with a skill header and `metadata.internal`. MUST/SHOULD/NEVER rules for keyboard, focus, forms, layout stability, animation and theming. |
| [`vue-best-practices`](vue-best-practices/SKILL.md) | You write or review a file under `src/vue/`, a Vue fixture or a Vue docs example. | Installed from vuejs-ai/skills (`skills-lock.json`). Vue 3 Composition API, reactivity, slots, render functions, SSR and `vue-tsc`. |
| [`svelte-core-bestpractices`](svelte-core-bestpractices/SKILL.md) | You write or review a file under `src/svelte/`, a Svelte fixture or a Svelte docs example. | Installed from sveltejs/ai-tools (`skills-lock.json`). Svelte 5 runes, snippets, attachments, events and reactivity. |
| [`solid-best-practices`](solid-best-practices/SKILL.md) | You write or review a file under `src/solid/`, a Solid fixture or a Solid docs example. | Written here from Solid's 2.0 migration guide, since UI SDK needs Solid 2 and the available Solid skills teach Solid 1. |

A framework skill sits beside `ui-sdk`, never instead of it: read `ui-sdk` and `node_modules/@ui-sdk/<framework>/docs/llms.txt` first, then the framework's skill for the language rules.

The chain: write with `write-code`, check the screenshots with `impeccable` and `web-interface-guidelines` (motion with `apple-design`), finish with `unslop`, then run `expert-review` before you push. `docs/design-principles.md` says what the design skills hold us to; `AGENTS.md` "Component task routine" says when each runs.

The skills live in `.agents/skills/`, where Codex, Cursor, Gemini CLI and GitHub Copilot find them; `.claude/skills` links to the same folder for Claude Code. In a harness that doesn't load skills, ask your agent to read the skill's `SKILL.md` and follow it.

These skills are for working on this repository. The one skill it publishes for apps that use Agent UI is [`agent-ui`](../../packages/agent-ui/skills/agent-ui/SKILL.md), which `skills.sh.json` points the skills CLI at. So that `npx skills add kind-ui/agent-ui` offers only that one, every skill written or vendored here sets `metadata.internal: true` in its frontmatter; the ones installed from elsewhere are skipped because `skills-lock.json` lists them. Add the same field to any new skill here.
