# Agent benchmark

How much work does it take an agent to use an Agent UI screen, and how much did the UI SDK 0.1.0-beta.17 upgrade (#189) change that? This benchmark gives a coding agent one task on the same chat app screen, before and after the upgrade, and counts what it took: tool calls, text read, time, tokens and cost.

It follows UI SDK's own agent benchmark (`benchmarks/agent` in the UI SDK repository): the same task shape, the same tools and the same measures.

| Version | Commit     | UI SDK         | Tools         |
| ------- | ---------- | -------------- | ------------- |
| Before  | `5852177d` | 0.1.0-beta.1   | Browser tools |
| Before  | `5852177d` | 0.1.0-beta.1   | Agent tools   |
| Before  | `5852177d` | 0.1.0-beta.1   | WebMCP        |
| After   | `7a0127ff` | 0.1.0-beta.17  | Browser tools |
| After   | `7a0127ff` | 0.1.0-beta.17  | Agent tools   |
| After   | `7a0127ff` | 0.1.0-beta.17  | WebMCP        |

`5852177d` is `main` at Agent UI 0.7.2, just before #189 merged, and `7a0127ff` is the merge of #189. Only React is measured.

- **Browser tools** are how agents use most pages today: read the accessibility tree, click, type, press a key.
- **Agent tools** are the three tools a UI SDK page gives an agent, `snapshot`, `query` and `act`, from `createAgent` and `agentTools` in `@ui-sdk/react/agent`.
- **WebMCP** is the same bridge with no tool written by the app: the page calls `registerTools`, and AI SDK's MCP client (`createMCPClient` with `Experimental_WebMCPTransport` from `@ai-sdk/mcp`) reads the tools back from `document.modelContext`, as a browser's agent would. It needs a browser with WebMCP; Playwright's Chromium has it behind `--enable-experimental-web-platform-features`.

## Results

Medians of three runs per row, with Claude Sonnet 5.5 (the CLI's default medium reasoning) through the GitHub Copilot CLI 1.0.115-7, on November 24, 2026. Every run was correct. The before WebMCP row was added after the others and ran on its own; the rest ran side by side.

| Version | Tools   | Tool calls | Text read | Time | Tokens | Cost   |
| ------- | ------- | ---------- | --------- | ---- | ------ | ------ |
| Before  | Browser | 13         | 117.1k    | 27 s | 156.0k | $0.059 |
| Before  | Agent   | 6          | 7.4k      | 17 s | 64.7k  | $0.038 |
| Before  | WebMCP  | 6          | 7.4k      | 16 s | 65.1k  | $0.039 |
| After   | Browser | 12         | 109.0k    | 32 s | 208.4k | $0.071 |
| After   | Agent   | 6          | 6.6k      | 19 s | 76.6k  | $0.042 |
| After   | WebMCP  | 6          | 6.6k      | 19 s | 76.5k  | $0.042 |

With the beta.17 agent tools, an agent finishes the task in 6 calls instead of 12 with browser tools, reading 6.6k characters instead of 109.0k; beta.1's agent tools also took a median of 6 calls.

What changed between the versions, run by run:

| Version | Tools   | Tool calls per run | Text read per run   |
| ------- | ------- | ------------------ | ------------------- |
| Before  | Agent   | 6, 5, 17           | 7.4k, 6.8k, 20.5k   |
| Before  | WebMCP  | 6, 6, 7            | 6.8k, 7.4k, 7.6k    |
| After   | Agent   | 6, 6, 6            | 6.6k, 6.6k, 6.6k    |
| After   | WebMCP  | 6, 6, 13           | 6.6k, 6.6k, 7.4k    |

- Every after run with agent tools took 6 calls; one before run took 17, after it couldn't tell whether its pin had taken.
- The snapshot is smaller on beta.17 (3,195 characters against 3,629), so the same calls read less text.
- Tokens and cost rose a little with agent tools, because beta.17's tool descriptions are longer and every model call sends them.
- WebMCP takes what the agent tools take on each version: the same three tools, with no tool code in the app.

The 18 runs in the table cost $1.042, as GitHub bills Copilot (AI credits at $0.01).

## The task

The screen is one chat app made only of Agent UI components: a Sidebar with a Thread List of 16 chats, a Conversation with Messages and Tools, one of them awaiting approval, and a Composer with a Context Bar, Model Control and Approval Mode. The agent is asked to:

- open the chat "Flaky checkout tests"
- switch the model to GPT-6.1 Sol and set the effort to High
- set the approval mode to Ask every time
- approve the pending `run_tests` tool call in that chat
- pin the chat "Compare pricing tiers"
- leave everything else as it is, and send no message

A run is correct when the agent called `done` and the screen's state has exactly those changes: that chat open, that model and effort, that mode, only `run_tests` approved, only those two chats pinned, no chat renamed or deleted, the settings and context unchanged and no message sent.

## Run it

You need the [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-cli), signed in, and Chromium for Playwright (`npx playwright install chromium`).

```sh
node benchmarks/agent/harness/bench.mjs --runs 3
node benchmarks/agent/harness/bench.mjs --rows before-agent,after-agent
```

It checks out each version with `git worktree` under the system's temporary folder, runs `npm ci` there, copies [`app`](app) into it and serves it with that version's Vite, so each screen renders its own version's render files on the UI SDK its lockfile pins. The checkouts stay for the next run; `git worktree remove` takes them away. Then it opens one headless browser per row and starts one agent in each at the same moment. When they finish it prints a table, and the median of every measure when there is more than one run.

| Flag      | Default                             |                                                     |
| --------- | ----------------------------------- | --------------------------------------------------- |
| `--rows`  | every row                           | `before-browser`, `before-agent`, `before-webmcp`, `after-browser`, `after-agent`, `after-webmcp`. |
| `--runs`  | `1`                                 | How many times to run every row.                    |
| `--model` | `claude-sonnet-5.5`                 | Any model the Copilot CLI takes.                    |
| `--port`  | `KIND_FIXTURE_PORT_BASE`, else 5800 | The apps listen on it and the next port, the tools from 10 above it. |
| `--out`   |                                     | Where to write results. A temporary folder.         |

Results go to `results.json`, with every tool call an agent made in `calls.jsonl` beside it. Set `CHROMIUM` to use a browser of your own, and `COPILOT_CLI_PATH` to use a Copilot CLI that isn't on the PATH.

## What is measured

- **Tool calls:** every call the agent made, with the last one, `done`.
- **Text read:** the characters the tools returned.
- **Time:** from the agent's start to its exit.
- **Tokens:** the prompt and completion tokens of every model response, from the CLI's log.
- **Cost:** what the CLI reports the session cost, in AI credits at $0.01 each.
- **Correct:** whether the screen ended in the state the task asks for.

## How it stays fair

- **One screen.** Both versions render [`app/src/screen.tsx`](app/src/screen.tsx) with the same data, from [`app/src/data.ts`](app/src/data.ts).
- **One agent.** Every run gets the same task and rules, only the Copilot CLI's Bash tool, with only `node` allowed, and an empty folder holding the one command it may run. The prompt is in [`harness/task.mjs`](harness/task.mjs). The bridge is created with an `allow` that approves every step, standing in for the person who gave the task.
- **Tools as they ship.** The browser tools follow the Playwright MCP server's: a snapshot of the accessibility tree with refs, and actions that answer with the new snapshot. The agent tools come with the descriptions each version's `agentTools` exports, word for word, and WebMCP with the descriptions the MCP client lists.

## Differences from UI SDK's benchmark

- **Agent harness.** UI SDK runs Sonnet through Claude Code with a short system prompt of its own. This one runs Claude Sonnet 5.5 through the GitHub Copilot CLI, whose own system prompt can't be replaced, so the rules sit in the task prompt and every model call carries the CLI's prompt too. Token counts are higher for every row because of it, and they compare across rows, not with UI SDK's table.
- **Window.** The browser is 1280 × 900, so the Sidebar shows beside the conversation rather than as a drawer.
