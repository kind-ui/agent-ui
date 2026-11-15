# Skills

Skills for working on `@kind-ui/agent-ui`. Each one is a folder with a `SKILL.md` in plain Markdown, so it works in any agent harness. Adapted from Apache-2.0 work; see `THIRD_PARTY_NOTICES.md` at the repo root.

| Skill | Use it when | What it does |
| --- | --- | --- |
| [`ui-sdk`](ui-sdk/SKILL.md) | You build or change a component. | The official UI SDK skill, installed from `@ui-sdk/core` (`skills-lock.json`). How to compose UI SDK and build on `@ui-sdk/core`. |
| [`write-code`](write-code/SKILL.md) | You write or change code anywhere in the repo. | Starts from the file that already does the same job, writes the code, runs the checks the change reaches and rereads the diff cold. |
| [`unslop`](unslop/SKILL.md) | You're finishing a change, or a file reads as generated. | Removes comments that restate the code, filler JSDoc, checks for impossible cases, one-caller helpers and vague names. Behavior stays the same. |
| [`expert-review`](expert-review/SKILL.md) | Before every push. | Picks the layer experts the diff reaches (`node scripts/expert-scope.mjs`), runs them in parallel and hands back one table of findings. |

The chain: write with `write-code`, finish with `unslop`, then run `expert-review` before you push.

The skills live in `.agents/skills/`, where Codex, Cursor, Gemini CLI and GitHub Copilot find them; `.claude/skills` links to the same folder for Claude Code. In a harness that doesn't load skills, ask your agent to read the skill's `SKILL.md` and follow it.
