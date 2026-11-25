# fx GUI: libfx → Agent UI mapping

A throwaway spike. It maps every libfx 0.0.18 event and capability the app touches, and the ones it doesn't yet, to the Agent UI 0.8.0 component that shows it.

- **Fits:** the component takes the data as libfx gives it, or with a field renamed.
- **Needs glue:** it works, but the app keeps state or timing libfx doesn't give it.
- **Gap:** something is missing, in libfx or in Agent UI. The "Agent UI gaps" section lists the ones on our side.

## Tool approvals: the short answer

**libfx has no approval step of its own, but a host tool can wait for a decision, and that's enough for Tool and Confirmation.**

- No tool option like `needsApproval`, no approval event and no approve or deny call. The CLI's permission prompts don't apply to libfx tools. `FxToolObservation.wait({ kind: "approval" })` and the `permission.*` and `wait.*` hook events exist, but they only observe: they "never make a permission decision".
- The glue: the app runs every host tool's `execute()`. `write_file` and `bash` await a promise the person settles before they touch the workspace. A denial returns `{ type: "libfx.tool-result", isError: true, text: "The user denied this call: <reason>" }`, which reaches the model as a failed call it can recover from.
- `context.executionId` equals the `tool_start` event's `id`, checked in the browser against libfx's WebAssembly build. So the app keys `Approval.approvalId` by it, and the Tool that `tool_start` drew shows Approve and Deny. Bash calls get a Confirmation above their Terminal.

How close the glue gets, and where it stops:

| Agent UI expects | With libfx |
| --- | --- |
| Show the call before it runs, with its input | Yes: `tool_start` carries the whole input (or a 64 KiB preview). |
| A waiting state (`awaiting-input`) | Glue: libfx's events say the call is running. The app sets `call.approval.state: "requested"` itself, which Tool turns into `awaiting-input`. |
| Deny with a reason the model sees | Yes: a failed tool result with the reason. |
| The outcome stays in place | Yes: `approval.state: "responded"` with `decision`. |
| Stop while a call waits | Glue: cancelling a turn aborts `context.signal`, but a pending promise in `execute()` isn't settled by libfx. The app denies every open request when the turn ends. |
| Survive a reload or crash | Gap: the wait lives in page memory. A durable session replays a cut-off call only if the tool is `idempotent`, and the decision is gone. A server deployment would need to store pending approvals itself. |
| Approve provider tools (`web_search`) | Gap: they run at the provider, so nothing can gate them. MCP tools can be gated only by wrapping each one. |
| Parallel calls, each with its own approval | Partial: on WebAssembly, calls run one after another, so approvals come one at a time. The native backend runs up to 16 at once, and Tool handles each separately. |

The ask for fx: an approval hook, either `approve(call)` on the agent or a `needsApproval` flag that pauses the turn with an `approval_request` event and `session.respond(id, decision)`. That would make approvals durable and visible in `session.stream()`, so a second tab or a server-rendered UI could show them.

## Turn events

| libfx | Agent UI | Fit | Notes |
| --- | --- | --- | --- |
| `prompt()` input | Composer, Message (`messageRole="user"`) | Fits | |
| `text_delta` | Message, Markdown with `streaming` | Fits | Markdown repairs half-written fences while the reply streams, so Streaming Text (plain text) isn't needed here. |
| `reasoning_delta` | Reasoning (`text`, `status`) | Needs glue | No start or end events. A reasoning run ends when another event arrives, and the app times it for `durationSeconds`. |
| `tool_start` | Tool (`call.input`) | Fits | `input` arrives whole, so `input.state` is always `"ready"`, and the input never streams. |
| `tool_start` with `inputTruncated` | Tool | Needs glue | Pass `inputPreview` (a string) as the input value. |
| `tool_end` (`content`, `isError`) | Tool (`call.output`, `outcome: "error"`, `error`) | Needs glue | `content` is text: JSON for object results, so the app parses it back. Durations are timed by the app. |
| `tool_end` for `bash` | Terminal (`command`, `output`, `exitCode`, `status`) | Needs glue | The exit code is inside the tool's own result. Terminal has no approval part, so a Confirmation sits above it. |
| `user_message` (a steer joined the turn) | Message (`messageRole="user"`) between two assistant Messages | Needs glue | The app closes the current reply, shows the steer and starts a new reply in the same turn. libfx wraps the text it sends the model in `<user_steering>`. The event's `text` is the person's own words. |
| `turn.result.stopReason` | Message `status` and MessageOutcome | Fits | `cancelled` → `aborted` ("Stopped"), `error`/`refused` → `error` with `result.error.message`. `max_output_tokens` could map to Continue (`onContinue`), which isn't wired yet. |
| `turn.result.usage` | Context Meter | Fits | Not wired. libfx doesn't give the model's context window; the catalog entry might. |
| `onEvent`: `transport.retry` | Notice (warning) | Needs glue | Diagnostics come on the agent's `onEvent`, not the turn, so the app routes them to the running turn. |
| `onEvent`: `transport.error`, `session.error` | Connection Status, Notice | Needs glue | Not wired. |
| Turn ends with `error: "HostStreamFailed"` | Message outcome, Notice | Needs glue | A bad key or no network gives this opaque message, so the app rewrites it. |

## Capabilities

| libfx | Agent UI | Fit | Notes |
| --- | --- | --- | --- |
| `session.steer(text)` | Composer | **Gap** | Composer locks Send while a submission is pending and puts Stop in its place. The app catches Enter in `onKeyDownCapture` while a turn runs and steers with the draft. There's no Send button for it, and nothing says Enter steers but the placeholder. |
| Queued steers, `turn.withdraw(id)` (engine only) | Queue (items with remove) | Needs glue | The app shows the queued steer as one status line until its `user_message` arrives. A durable session's `steer()` can't be withdrawn. |
| `session.cancel()`, `signal` | ComposerStop, Message `aborted` | Fits | Verified: Stop during a streaming reply shows "Stopped". |
| `agent.session(id, { model: { id, effort } })` | Model Control (`models`, `levels`, `effort`) | Fits | A model applies per session object, so a change takes effect on the next turn, not mid-turn. The app disables the control while a turn runs. |
| `listModels({ apiKey })` | Model Control `models` | Needs glue | It returns ids only: the app splits `provider/model` into `group` and `name`. No per-model effort levels, so `efforts` stays unset. |
| `model.fast`, `model.ultrafast` | Model Control toggles | Fits | Toggles in Model Control's `settings`. Not wired. |
| `supportsJspi()` | Notice (error) | Fits | |
| Host JS tools over an in-browser workspace | File Tree (`entries` with `change`, `additions`, `deletions`), Code Block | Needs glue | libfx has no file events. The app's tools write through just-bash, and the app diffs each file against the seed. |
| Writes the agent made | (diff view) | **Gap** | Code Block shows the file, not what changed. |
| `web_search` provider tool | Tool, Sources | Needs glue | Not wired. Results arrive as `tool_end.content` text, not structured sources. |
| MCP tools (`createMcpAdapter`) | Tool | Fits | Not wired. MCP form and URL requests (`FxWaitRequest` `mcp_form`, `mcp_url`) would map to Question and a Confirmation with a link. |
| `FxWaitRequest` `kind: "question"` | Question | Needs glue | Only through hooks observation of the host's own waits. |
| Prompt images, `resizeImage` | Composer attachments | Fits | Not wired. |
| `session.checkpoint()`, `checkpoint` option | Checkpoint | Needs glue | A checkpoint is the whole session as bytes. Restoring means a new agent created with it, not a jump back to a message. |
| Durable sessions, `session.stream(cursor)` | Thread List, Sidebar, Connection Status | Needs glue | In the browser, sessions live in page memory. A server deployment could list sessions and reconnect a stream from its cursor. |
| Hooks: `turn.*`, `model.*`, `tool.*` | Chain of Thought, Task | Needs glue | Observation only. Useful for timing and a step log. |
| Hooks: `delegation` (subagents) | Subagent | Gap | Only ACP sessions emit it. `createFxAgent()` sessions don't get the subagent tool. |
| `createFxTerminal()` (`fx-term.wasm`) | none | n/a | fx's own terminal UI, for xterm.js. Out of scope here. |

## Agent UI gaps this found

Candidates for a wave, most useful first:

1. **Steering in the Composer.** While a submission is pending, Send is replaced by Stop and Enter is refused. A coding agent needs both: send a steer (or queue a follow-up) and stop. That means a `steer` mode, or `onSteer`, that keeps Send beside Stop and calls it while pending. It should also show a steer that's waiting for the next safe point, with an optional withdraw.
2. **A steered message.** A user Message that joined a running turn needs a mark ("Steered", or "Queued" until it joins). The app writes that text itself.
3. **Approval on Terminal.** Tool has an approval part, Terminal doesn't. A shell command waiting for "Run?" is the most common approval in a coding agent. Today it's a Confirmation above a Terminal.
4. **A diff view.** File Tree counts changed lines, but nothing shows the change itself. Code Block shows whole files.
5. **Retries inside a turn.** Message has no "retrying" state with an attempt and a reason. Connection Status is page-wide.

## What the spike checked

- Replay mode end to end in Chromium, light and dark: three approvals with the keyboard, real just-bash writes and a real command, File Tree and Code Block updating. No console errors.
- Replay mode in Firefox. The unsupported notice with JSPI removed (Firefox 159 and Safari 27 have it now).
- Live mode through libfx's WebAssembly build against a local OpenAI-compatible mock (`npm run mock`): a real tool call, approval, a steer that cut the streaming reply short, and Stop. `fx-core.wasm` was served as `application/wasm`.
- Live mode with an invalid AI Gateway key: the request goes from the tab straight to `ai-gateway.vercel.sh`, and the turn fails with a readable message. No real key was available, so a real model run wasn't checked.
