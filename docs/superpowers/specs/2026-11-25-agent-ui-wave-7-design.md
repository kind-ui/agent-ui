# `@kind-ui/agent-ui` Wave 7 design: agent ops

- **Status:** Proposed 2026-11-25, for review in the plan PR. Nothing here is built yet. **Open** marks a decision that needs the user's answer before Task 1 merges.
- **Extends:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md` (the base spec). Every rule there binds Wave 7: §2 "Building on UI SDK", §4.1 ownership, §5 Step base, §6 motion and agent actions, §8 accessibility, §9 distribution, and the framework layers (0.7). This document adds Wave 7's components, the changes to shipped ones, and the neutral types they share. Task 1 folds §4 and the §6 confirm list below into the base spec.
- **Plan:** `docs/superpowers/plans/2026-11-25-agent-ui-wave-7.md`.
- **Builds on:** UI SDK `0.1.0-beta.17` (Waterfall, Timeline, Progress, Meter, Switch, Menu, `createGridFocus`, `createViewport`, `spatialMove`, `createPopup`, `createPendingAction`'s pattern), and three OSS packages: `diff` (jsdiff, BSD-3-Clause) for Diff, `@dagrejs/dagre` (MIT) for Flow Graph's layout, and nothing else new.
- **Test bed:** kind-ui/fx-gui, a web GUI for the fx coding agent built on Agent UI. Its spec §11 lists five Agent UI gaps it works around with stop-gaps in `components/stopgaps/`. Each Wave 7 change names the stop-gap it replaces (§9).

## 1. What Wave 7 is

Waves 1 to 6 cover a conversation: the turn, its steps, its output and the shell around it. Wave 7 covers the agent's work beyond one reply: steering a turn while it runs, approving a command where it shows, seeing what a write changed, retrying, and then the operator's view of runs: traces, activity, jobs, schedules, budgets and the graph of agents.

It ships in two releases:

- **7a (0.9.0), "the working turn":** the four fx-gui gaps that block a coding agent today (steering, the delivery mark, Terminal approval, retrying), then a minimal Diff, Step Group and Handoff. These live inside a conversation.
- **7b (0.10.0), "agent ops":** Trace, Run Timeline, Job Progress, Schedule Card, Agent Card, Usage Meter, Quota Notice, Activity Graph, Flow Graph, Context Meter's breakdown and Thread List's inbox. These live beside or outside a conversation.

The package is at 0.8.0. Wave 7 adds 12 components (56 to 68) and changes 8.

## 2. Scope: 18 roadmap items and 5 gaps become 12 components and 8 changes

Each merge keeps one job per component; a pattern the kit already covers becomes an option on the component that owns it (`docs/design-principles.md`, "When not to add").

### 2.1 The five fx-gui gaps (ship first, in 7a)

| Gap | Becomes | Why |
| --- | --- | --- |
| 1. Composer steering | **Composer** `running`, `onSteer`, Send beside Stop | Steering is sending while a turn runs; it's the Composer's Send, not a new control. A queued follow-up shows in the host's **Queue**, which gains "Send now". |
| 2. A steered or queued mark | **Message** `delivery: "steered" \| "queued"`, `onWithdraw` | It's a fact about a user message, shown in its header beside its time. |
| 3. Approval on Terminal and Tool | **Terminal** `approval`, `onApprove`, `onDeny`; Tool's approval part moves to a shared `approvalPart` both spread; **Confirmation** `onAlwaysAllow` | Tool already has the part. Terminal gets the same one, so a command shows, waits, then runs in one component. "Always allow" is a host-supplied third choice (base spec §4.1: an allow list is host policy). |
| 4. A diff view | **Diff** (new, minimal, 7a). Wave 8's code review builds on it. | Decided below. |
| 5. A retrying state | **Message** and **Tool** `retry: { attempt, maxAttempts?, retryAt?, reason? }`; **Tool** `onRetry` | A retry is a state of the turn or call, orthogonal to its status: the text so far stays, and the status stays `streaming` or `running`. |

**Gap 4, decided: a minimal Diff ships in 7a, and Wave 8's code diff extends it.** An edit tool waiting for approval is unreadable without its change: Terminal's approval (gap 3) answers "run this command?", and the same question for `write_file` needs a diff, which fx-gui fakes with Code Block `lang="diff"`. So 7a ships what that approval needs and nothing more:

- **In 7a:** one file per Diff; a unified view; old and new line numbers; `+N −M` in the header; unchanged runs past 3 lines of context collapsed behind "Show N lines" (findable); word-level marks on paired changed lines; the host's `highlight` (Code Block's); a `patch` that streams; virtualized past 400 lines; Copy; per-file Accept and Revert as host actions.
- **Left for Wave 8:** split view, a multi-file review with a file list, hunk-level accept and revert, comments, editing, and moved-line detection. Each is an option or a part on Diff or a component that composes it, so nothing in 7a is thrown away. A split view needs its own scroll sync and keyboard model; doing it in 7a would delay the approval it serves.

### 2.2 Roadmap items

| Roadmap item | Becomes | Release | Why |
| --- | --- | --- | --- |
| tool group | **Step Group** | 7a | One summary row over host-rendered steps: "Read 4 files, edited 2, ran 1 command", status aggregated, collapsed when done. Chain of Thought renders step *data* (title and Markdown); a tool group holds the host's own Tool and Terminal rows, approvals and output included, which Chain of Thought can't. |
| subagent list | **Step Group** with Subagents inside | 7a | Parallel subagents are the same shape: a header ("3 agents, 2 running"), an aggregate status, and each child a Subagent the kit already ships. A second component would differ only in its noun. |
| handoff | **Handoff** | 7a | One agent passing the conversation to another agent or a person: from, to, reason, status, and an optional approval through `approvalPart`. A recurring multi-agent pattern with its own outcome. |
| tool failure + retry | **Tool** `onRetry` and `retry` | 7a | Tool already shows the failure; it gains Retry and the retrying state (gap 5). |
| tool fallback | **Dropped**: a docs recipe on Tool's page | — | Tool already is the fallback UI for any tool without one of its own (it renders any input and output as JSON). A recipe shows a `renderers[name] ?? Tool` map. A fallback *chain* (one tool failed, another ran) is two Tools. |
| trace waterfall | **Trace** | 7b | UI SDK Waterfall over spans: model calls, tool calls and subagents on one time axis, nested, selectable. |
| tool timeline | **Trace** | 7b | A turn's tool calls on a time axis are a trace; `traceSpans(steps)` turns Steps with `startedAt`/`endedAt` into spans. |
| timeline | **Run Timeline** | 7b | UI SDK Timeline over a run's dated events. Named for its job, and so it doesn't shadow UI SDK's `Timeline` in a host's imports. |
| run activity | **Run Timeline** | 7b | A run's activity is its timeline of events ("Started", "Ada approved", "PR opened"), with UI SDK Timeline's `feed` for long ones. |
| job progress | **Job Progress** | 7b | A long job: percent or indeterminate, the current stage ("3 of 7: Installing"), elapsed and remaining time, Cancel and Retry, and its log as content. A Step, so it collapses and announces like the others. |
| schedule card | **Schedule Card** | 7b | A recurring run: its schedule in words, next run, last run's outcome, an on/off Switch, Run now and Edit. |
| background runs inbox | **Thread List** `groupBy: "status"`, `onArchive`, `Thread.progress` and `summary` | 7b | Background runs are threads that keep working; Thread List already shows `running`, `awaiting-input`, `error` and `unread`. An inbox is the same grid grouped by what needs the person ("Needs you", "Running", "Done"), with Archive. A second grid would duplicate every keyboard and virtualization rule. |
| agent card | **Agent Card** (**Open**: drop candidate) | 7b | An agent's identity and abilities: avatar, name, description, model, capability badges, status, one action (Start, Open). Kept because agents are addressed by name in multi-agent apps and the kit ships no public Avatar; dropped if the user judges it composable. |
| cost meter | **Usage Meter** | 7b | Spend against a budget is one case of usage against a limit; the same meter shows requests or tokens per period. It shares Context Meter's ring and details popover through `meterBase`. A conversation's own cost already shows in Context Meter. |
| context breakdown | **Context Meter** `breakdown` | 7b | What fills the window (system, tools, messages, files) is the detail of the meter that shows how full it is: a stacked bar and rows in its details. |
| quota banner | **Quota Notice** | 7b | A Notice (spreads `noticeBase`, as Guardrail Notice does) with a bar, the reset time and an Upgrade action, warning near the limit and error at it. "Banner" is a placement; the kit's word is Notice. |
| activity/heat graph | **Activity Graph** | 7b | A calendar heat map of runs or tokens per day on `createGridFocus`: one Tab stop, arrows between days, each day named in words. |
| flow graph | **Flow Graph** (**Open**: drop candidate) | 7b, last | A read-only graph of agents and tools and the handoffs between them, laid out by `@dagrejs/dagre`, panned and zoomed by `createViewport`, walked with `spatialMove`. It's the largest task and the most niche; it ships last so dropping it costs nothing else. Editing a graph is out of scope. |

**Totals:** 12 new components (Diff, Step Group, Handoff; Trace, Run Timeline, Job Progress, Schedule Card, Agent Card, Usage Meter, Quota Notice, Activity Graph, Flow Graph) and 8 changed (Composer, Queue, Message, Tool, Terminal, Confirmation, Context Meter, Thread List). Connection Status moves its countdown into a shared module with no change to its API. Dropped: tool fallback (a recipe).

## 3. Shared contracts

Frozen by Task 1 before any component task starts. Everything here is additive: no 0.8 option, part, state key or action changes meaning.

### 3.1 Neutral types (`packages/agent-ui/src/types/`)

```ts
// A retry in progress. `attempt` counts from 1 for the first retry.
interface RetryState {
  attempt: number;
  maxAttempts?: number;
  retryAt?: string; // ISO 8601; a countdown runs to it
  reason?: string; // "Rate limited", "Server error 503"; shown as words
}

interface Message {
  // … 0.8 fields
  delivery?: "steered" | "queued"; // a user message sent while a turn ran
  retry?: RetryState; // the turn is retrying; status stays "submitted" or "streaming"
}

interface ToolCall {
  // … 0.8 fields
  retry?: RetryState;
}

// `{ kind: "terminal" }` Steps gain the approval Tool calls already carry.
type Step = /* … */ | (StepBase & { kind: "terminal"; command: string; output: string; exitCode?: number; approval?: Approval });

interface Thread {
  // … 0.8 fields
  status?: "queued" | "running" | "awaiting-input" | "error" | "complete";
  progress?: number; // 0 to 1, for a running background run
  summary?: string; // "+120 −8 in 4 files", shown under the title
}

// Diff
interface DiffFile {
  path: string;
  oldPath?: string; // a rename
  status?: "added" | "modified" | "deleted" | "renamed";
  language?: string; // for `highlight`
}

// Trace: a span on one clock, in milliseconds from the trace's start, or ISO instants.
interface TraceSpan {
  id: string;
  name: string;
  kind?: "agent" | "model" | "tool" | "other";
  status?: StepStatus;
  start: number | string;
  end?: number | string; // absent while running: the span grows to `now`
  attributes?: Record<string, string | number | boolean>; // shown when selected
  children?: TraceSpan[];
}

// Run Timeline
interface RunEvent {
  id: string;
  at: string; // ISO 8601
  title: string;
  description?: string;
  status?: StepStatus;
  actor?: MessageAuthor;
}

// Agent Card, Handoff, Step Group's agents
interface AgentInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  model?: string;
  capabilities?: string[];
}

// Schedule Card
interface Schedule {
  id: string;
  label: string;
  description: string; // the schedule in words, which the host writes ("Weekdays at 9:00")
  enabled: boolean;
  nextRunAt?: string;
  lastRun?: { at: string; status: StepStatus; href?: string };
}

// Context Meter breakdown, Usage Meter breakdown
interface UsageSlice { id: string; label: string; value: number }

// Activity Graph
interface ActivityDay { date: string /* YYYY-MM-DD */; count: number }

// Flow Graph
interface FlowNode { id: string; label: string; kind?: "agent" | "tool" | "person" | "other"; status?: StepStatus; description?: string }
interface FlowEdge { id: string; from: string; to: string; label?: string; status?: StepStatus }
```

The AI SDK adapter maps none of the new fields: AI SDK 7 reports no retries, deliveries or spans. Its section in `packages/agent-ui/README.md` says so.

### 3.2 Shared core modules

| Module | What | Used by |
| --- | --- | --- |
| `core/countdown.ts` | `createCountdown(context, { key, at: () => string \| undefined })`: a `live` whole-second countdown that wakes on each second, writes nothing on the server, and stops at zero. Extracted from Connection Status, which then spreads it. `countdownText(seconds)` ("in 4 sec", "in 1 min 12 sec") over `durationLabel`. | Connection Status, Message and Tool retrying, Quota Notice, Schedule Card |
| `core/retry.ts` | `retryPart`: the `retry` slot definition (present while `retry` is set; text "Retrying, attempt 2 of 5, in 4 sec"; a running status mark), and `retryAnnouncement` ("Retrying, attempt 2"), announced once per attempt, never per second. | Message, Tool |
| `core/approval-part.ts` | `approvalPart`: Tool's approval slot, its `approvalState` memo and its options (`onApprove`, `onDeny`, `onAlwaysAllow`, `approvalReason`), moved out of `tool.ts` so Terminal and Handoff spread it unchanged. | Tool, Terminal, Handoff |
| `core/meter-base.ts` | `meterBase`: Context Meter's ring trigger, hover-and-focus details popover (`hoverPopupPreset`), number formatting and locale, moved out of `context-meter.ts`. | Context Meter, Usage Meter |
| `core/aggregate.ts` | `aggregateStatus(statuses)`: `awaiting-input` if any, else `running` if any is `running` or `pending` after one ran, else `error` if any, else `cancelled` if all, else `complete`. | Step Group, Job Progress, Handoff |

### 3.3 Cross-cutting rules for every Wave 7 change

- **Built on UI SDK (base spec §2):** one `definePrimitive` per component in `core/<name>/`; render files call `createParts` or wrap a UI SDK component. **No new spec §2 exception row.** Diffing (jsdiff) and graph layout (dagre) are pure data, like the Markdown engine's libraries; timers are not interaction. A task that finds it needs a row stops and asks.
- **Five render layers:** React, Web Components, Vue, Svelte and Solid, with the same part names, options, state keys and default children (framework layers plan D5), parity-tested (`parity.ts`, `parity.spec.ts`) and server-rendered (`hydration.spec.ts`) in each.
- **Agent actions (base spec §6):** offered only while available; same code paths as a person's input; callbacks report `details.source`. Actions taking an id refuse an unknown one and list ids through `agent.items`.
- **Confirm list additions:** `composer.steer` and `composer.queue` (the composer is already marked), `terminal.approve`/`deny`/`alwaysAllow` (through Confirmation, which can't be unmarked), `handoff.approve`/`deny`, `diff.revert` (Diff's root is marked while `agentConfirm`, default `true`, and `onRevert` is set, so `accept` and `copy` need a person then too, since the bridge reads the mark per component), and every Schedule Card action (`setEnabled`, `runNow`, `edit`; marked while `agentConfirm`, default `true`). Nothing else renders `data-agent-confirm`; `message.withdraw`, `tool.retry`, `jobProgress.cancel`, `diff.accept` and Thread List's `archive` don't, and hosts gate them through `allow` if they want a person.
- **Announcements:** polite, on outcomes only: a steer sent or queued ("Steer sent", "Queued"), a retry starting ("Retrying, attempt 2"), an approval decided (Confirmation's own), a job finishing or failing, a handoff accepted or declined, a quota crossing into warning or error. Never a countdown tick, a streamed hunk, a span or an event appended.
- **Stability:** nothing that comes and goes moves what the reader is looking at. Send and Stop share the actions row at a fixed width; the delivery mark and the retry line sit in a message's header and footer rows that already exist; a Diff's collapsed runs keep their row height; Trace and Activity Graph have fixed row and cell sizes.
- **Motion:** `motion: "auto" | "reduced" | "none"` on every animated primitive; tokens from `core/motion/tokens.ts`; reduced is at most a 120 ms fade. No loops while nothing is waiting: a running span's bar grows by its width, not a shimmer; an indeterminate Job Progress uses Progress's own indeterminate style, which reduced motion stills.
- **Design:** `--kind-*` tokens only; shared controls through `data-kind-*`; focus rings only on `:focus-visible`, never on a text field, through `--kind-focus-ring`. New glyphs are Lucide's, drawn as CSS masks, listed in `THIRD_PARTY_NOTICES.md`. No sparkle or star-burst icon or animation anywhere.

## 4. Behavior: 7a

### Composer steering (gap 1)

- `running?: boolean`: the host says a turn is running. A submission's own pending lock (`pending`, from `onSubmit`'s promise) is separate: the draft clears when the submission resolves, whether or not the turn still runs. Stop shows while `pending || running` with `onStop` (0.8 showed it only while `pending`; a host that never passes `running` sees no change).
- `onSteer?(draft, details: { mode: "steer" | "queue"; source })`: while `running` and set, Send stays beside Stop instead of being replaced. Send's name and words follow `steerMode` (`"steer"` default, or `"queue"`): "Steer" or "Queue". A chevron button beside it opens a two-item Menu ("Steer now", "Queue for next turn", each with its key) for the other mode, so both modes have a pointer path. Enter sends in `steerMode`; Mod+Enter (Alt+Enter under `submitOn: "mod-enter"`) sends in the other. IME composition never sends.
- The steer follows the submit contract (base spec §4.1): it snapshots the draft, locks against a double send until its promise settles, clears only the sent snapshot on resolve, and keeps the draft on reject. It's announced once ("Steer sent", "Queued").
- Agent actions `steer` and `queue`, offered while `running` and `onSteer` is set; the composer's existing mark gates them.
- **Queue** gains `onSend?(id, details)` ("action"): each pending item shows "Send now", which the host turns into a steer. Agent action `send(id)`.

### Message delivery mark (gap 2)

- `delivery: "steered"` adds "Steered" to a user message's header, with a turn-arrow glyph; `"queued"` adds "Queued" with the pending status mark. Words, not color alone; the header row already exists, so nothing moves. The mark is part of the message's accessible description.
- `onWithdraw?(details)` ("action", `createPendingAction`): while `delivery: "queued"`, Withdraw sits in the header beside the mark; it locks until the host changes `delivery` or removes the message. Agent action `withdraw`.

### Retrying (gap 5)

- `retry` on Message and Tool renders the `retry` part (`core/retry.ts`): "Retrying, attempt 2 of 5, in 4 sec" with the reason after it when given ("Rate limited"). On Message it sits in the footer row where the outcome goes (Wave 6), so the streamed text above doesn't move; on Tool beside the error part.
- The countdown is `live` and writes one text node per second; it's never announced. "Retrying, attempt N" is announced once when `attempt` changes.
- **Tool** `onRetry?(call, details)` ("action", `createPendingAction`) adds Retry to a failed call; released when the call's status changes. Agent action `retry`.

### Terminal approval and the shared approval part (gap 3)

- Terminal spreads `approvalPart`: with an actionable `approval`, the Confirmation sits after the command line and before the output, the step's status reads `awaiting-input`, and the output part is absent until there's output. A denial keeps the command and shows Confirmation's outcome ("Denied: <reason>"); nothing else moves.
- `onAlwaysAllow?(decision, details)` on Confirmation (and through `approvalPart` on Tool, Terminal and Handoff): a third choice, `alwaysLabel` (default "Always allow"), that approves and tells the host to remember. It's present only while set, takes the same lock, and the decision carries `always: true`. The host owns the allow list.

### Diff (gap 4, minimal)

- Input: `patch` (unified diff text for one file, as `git diff` or jsdiff's `createPatch` writes it; may stream) or `before` and `after` (diffed in core with jsdiff's `structuredPatch`, 3 lines of context). `file: DiffFile` names it. Word marks come from jsdiff's `diffWordsWithSpace` over each paired removed and added line.
- Parts: `root` (a `figure` named by the path), `header` (path, rename arrow, status badge, "+N −M" with words "N added, M removed", Copy, Accept, Revert), `viewport` (internal Scroll Area, virtualized past 400 rows with `createVirtualizer`), `hunk` (its `@@` header as a row), `line` (old number, new number, a `+`/`−` sign that's also in the accessible text, the code), `collapsed` (a button "Show N lines" for unchanged runs longer than 6; findable through `bindFindable`). Highlighting is Code Block's `highlight`, applied per line.
- Rows are a table (`role="table"` with row headers for numbers) so a screen reader reads old, new and the change; the table holds no focus stop of its own beyond Copy, Accept, Revert and each "Show N lines". The viewport is a `focus: "tab-stop"` scroller as Conversation's is, so the keyboard can scroll a long diff.
- `onAccept` and `onRevert` (`"action"`, one `createPendingAction`); agent actions `accept`, `revert`, `expandAll`, `copy`. `revert` renders `data-agent-confirm` while `agentConfirm` (default `true`).
- Streaming: a growing `patch` parses only from the last complete hunk; rows keep their elements.

### Step Group

- A Step (`stepBase`) whose title is a summary and whose content is the host's steps (Tool, Terminal, Subagent rows) in a StepList. `items: { id, status, group? }[]` tells core what the children are, since it can't read them; `labels?: Record<string, (count) => string>` turns each group's count into words, joined with `Intl.ListFormat` ("Read 4 files, edited 2 files and ran 1 command"); without `labels` the title is "N steps". `label` replaces it.
- Status is `aggregateStatus` over `items` unless the host passes one; auto open and close are the Step base's, so a finished group folds to its summary. `meta` shows "2 running" or the duration.
- For parallel subagents, every item's `group` is `"agent"`; the docs show `labels: { agent: (n) => `${n} agents` }` and Subagents inside. `onCancel` ("action") adds Stop all while any item runs.
- Agent actions: Step's `expand`, `collapse`, plus `cancel` with `onCancel`.

### Handoff

- `from` and `to` (`AgentInfo`, or `{ kind: "person", name }`), `reason?`, `status: "pending" | "accepted" | "declined" | "complete"`. Renders "<from> handed off to <to>" with both avatars (bare UI SDK Avatar, `aria-hidden`; names in text), the reason as a quote, and the status in words with its mark.
- With an actionable `approval` it spreads `approvalPart` ("Let Billing take over?"). Announces "Handed off to <to>" once on `accepted`, "<to> declined" on `declined`.
- Agent actions: `approve`, `deny` (through its Confirmation, which is marked).

## 5. Behavior: 7b

### Trace

- UI SDK Waterfall over `spans` (`TraceSpan[]`), with columns Name (indented by level, the kind's glyph, the status mark), Duration, and the bar (`--waterfall-start`, `--waterfall-size`). The axis is `WaterfallAxis` with `format` in milliseconds or seconds by range. Running spans (no `end`) grow to `now`, which the host passes or a one-second `live` clock supplies.
- Selecting a span (`value`/`onValueChange`, Waterfall's) shows a `details` part beside or below (by `--kind-trace-details`): name, kind, status, start, duration and `attributes` as a definition list. Expanded spans are Waterfall's `expanded`.
- Virtualized through `visibleWaterfallRows` and `createVirtualizer` with `aria-rowcount`, as Waterfall's "Large Traces" shows; rows have a fixed height.
- `traceSpans(steps)` (`core/trace/spans.ts`) builds spans from Steps with `startedAt`/`endedAt` (children nest; tool, subagent and reasoning kinds map). Agent actions `select(id)`, `expand(id)`, `collapse(id)`; `agent.items` lists span ids.

### Run Timeline

- UI SDK Timeline over `events: RunEvent[]`, newest last by default (`order: "oldest-first" | "newest-first"`). Each item: the status mark as `TimelineMarker`, the title, `<time datetime>` read with `timeLabel` (relative in the browser, absolute on the server, Wave 6 D13), the actor's name, and the description as Markdown. A running last event gets `status="current"`.
- `feed` (UI SDK's) with `busy` while loading, and `onLoadMore` near the end for long histories. New events play the `"fade-up"` entrance once; existing ones never replay it.
- No actions but the bridge's own; `agent.items` lists event ids.

### Job Progress

- `stepBase` with UI SDK Progress in a `progress` part kept outside the content (so it shows while closed, as Plan's does): `value` 0 to 1 or `undefined` for indeterminate, `stage` and `stageIndex`/`stageCount` ("3 of 7: Installing dependencies"), elapsed from `startedAt` and remaining from `etaSeconds`, in `meta`. The content is the host's log (often a Terminal).
- `onCancel` and `onRetry` (`"action"`, one `createPendingAction`); Cancel's focus recovery goes to the trigger. Announces completion and failure through the Step base. Agent actions `cancel`, `retry`, `expand`, `collapse`.

### Schedule Card

- `schedule: Schedule`. Parts: title (`label`), the description, "Next run <time>" (`timeLabel`, with a countdown under an hour), the last run's status mark and words linked to its `href`, an Enabled Switch (bare UI SDK Switch, controlled from `enabled` through `onEnabledChange`, written back when refused), Run now (`onRunNow`, `"action"`), and Edit (`onEdit`, `callback`).
- The card is a `group` named by `label`. `agentConfirm` (default `true`) marks the root while set, so `setEnabled` and `runNow` need a person. Agent actions `setEnabled(on)`, `runNow`, `edit`.

### Agent Card (Open)

- `agent: AgentInfo`, `status?: StepStatus`. Avatar, name (heading, `level` default 3), model, description, capability badges (`data-kind-badge`), status mark and words, and one action (`actionLabel`, `onAction`, `"callback"`). An `href` makes the name a link instead.
- Agent action `run` with `onAction`. No popup: a host that wants it on hover puts it in its own Hover Card.

### Usage Meter and Context Meter's breakdown

- `meterBase` holds the ring, the hover-and-focus details popover and formatting. Context Meter spreads it unchanged and gains `breakdown?: UsageSlice[]` (system, tools, messages, files…), drawn as a stacked bar (one segment per slice with `--kind-usage-slice-<i>` colors from the chart tokens) and a row per slice with tokens and percent.
- **Usage Meter:** `used`, `limit`, `unit?: "tokens" | "requests" | "currency"` (default `"currency"` with `currency`), `period?` ("This month"), `resetAt?` (countdown under a day), `breakdown?` (per model or per agent), `label` (default "Usage"). The ring's level: normal, warning at `warnAt` (default 0.8), error at 1. Agent actions `open`, `close`.

### Quota Notice

- Spreads `noticeBase`. `used`, `limit`, `unit`, `resetAt`; the variant is `warning` from `warnAt` (default 0.8) and `error` at the limit, unless the host passes one. Shows "You've used 80% of this month's requests" (or the host's `label`), a bar (bare UI SDK Meter, with its value in words), "Resets in 3 days" (`countdownText`), Upgrade (`onUpgrade`, `"callback"`, `upgradeLabel`), and Dismiss as Notice's.
- Announces on a variant change (Notice's rule), never on `used` alone. Agent actions `upgrade`, `dismiss`.

### Activity Graph

- `days: ActivityDay[]`, `now` (ISO date; default `todayKey(timeZone)` in `bind`, so server markup shows a fixed range from the data's last day), `weeks` (default 53), `levels` (default 4, quantile buckets over non-zero counts), `unit` ("runs") and `label`.
- A `grid` on `createGridFocus`: 7 rows (weekdays, labelled with `Intl` short names) by `weeks` columns; each cell a `gridcell` named "12 runs on Tuesday, November 3, 2026" (or "No runs on …"), its level in `data-level` and a `--kind-activity-level-<n>` fill. Future days are empty, non-focusable cells. Month labels over the columns. A legend reads "Less … More" with the level swatches, `aria-hidden` beside a visually hidden sentence.
- `onSelect(date)` (`"callback"`) on Enter or a press. Agent actions `select(date)`. Fixed 12px cells (`--kind-activity-cell`) so nothing depends on fonts.

### Thread List inbox

- `groupBy?: "date" | "status"` (default `"date"`, 0.8's grouping). With `"status"`: "Needs you" (`awaiting-input`, `error`, then unread `complete`), "Running" (`running`, `queued`), "Done" (the rest, newest first). `pinned` still comes first.
- Rows show `summary` under the title and a thin `progress` bar (bare UI SDK Progress) while running; row height grows to `--kind-thread-row-height-tall` (52px) for every row once any thread has a `summary`, so rows stay a fixed height for the virtualizer.
- Menu gains Archive (`onArchive`, `"action"`) and Mark as read (`onReadChange`, `"callback"`). Agent actions `archive(id)`, `markRead(id, read?)`.

### Flow Graph (Open)

- `nodes: FlowNode[]`, `edges: FlowEdge[]`, `direction: "down" | "right"` (default `"right"`). Layout runs in core with `@dagrejs/dagre`, cached by the graph's ids, edges and node sizes (fixed: `--kind-flow-node-width` × `--kind-flow-node-height`), so streaming a status change doesn't lay out again.
- The frame binds `createViewport` (pan, pinch and Ctrl-wheel zoom, +, −, 0; `fit` on first bind) and the world draws edges as one `aria-hidden` SVG and nodes as HTML. Nodes are a `group` of buttons with one Tab stop through `createRovingFocus` with `move: spatialMove()`; focus `reveal`s a node. Each node is named "<label>, <kind>, <status>" and described by its edges in words ("Hands off to Billing"), so the graph reads without the picture.
- `value`/`onValueChange` select a node. Running nodes and edges show the running status mark; nothing loops beyond it. Agent actions `select(id)`, `fit`, `zoomIn`, `zoomOut`.

## 6. What 7a and 7b don't do

- Split view, multi-file review, hunk actions, comments and editing in Diff (Wave 8's code review).
- Editing a flow graph (adding nodes, connecting ports with `createConnect`).
- Parsing cron: Schedule Card shows the host's words. The docs show `cronstrue` for hosts that store cron.
- Persisting anything: approvals, allow lists, queued steers and schedules are the host's.
- An inbox separate from Thread List; a toast for quota (Quota Notice sits in the page).
- Charts beyond Activity Graph's heat map and the meters (kind-ui/charts owns charts).

## 7. Accessibility

Base spec §8 holds. In addition:

- Every new root is named: Diff by its path, Trace and Run Timeline by `label`, Activity Graph's grid by `label` with a summary ("812 runs in the last year") as its description, Flow Graph's frame by `label`.
- Each visual (bar, heat cell, node, edge) has its words: bars through Waterfall's `getBarLabel`, cells through their names, edges in node descriptions, slices in their rows.
- One Tab stop per collection: Trace (Waterfall's treegrid), Run Timeline (Timeline's list), Activity Graph (grid), Flow Graph (roving group).
- `checkPattern` for treegrid (Trace), list and feed (Run Timeline), grid (Activity Graph), table (Diff), and `checkDirection` under `dir="rtl"` for Activity Graph and Flow Graph.

## 8. Testing

Base spec §10 holds, with the framework layers' parity and hydration checks for every new part. Per component: core unit tests only for pure helpers (`aggregateStatus`, `countdownText`, `traceSpans`, the diff row model, quantile levels, the dagre layout cache); one browser spec per component (in `tests/browser/wave-7/`) with an `expectAgentActions` snapshot, the keyboard path and axe in light and dark; budgets for Diff (streaming a hunk among 40 and 2,000 lines), Trace (selecting and expanding among 50 and 5,000 spans) and Activity Graph (moving between days). Fixtures use fixed ISO dates, `now` passed in and `timeZone: "UTC"`.

## 9. fx-gui stop-gaps each change replaces

| Change | fx-gui today | Replaced by |
| --- | --- | --- |
| Composer `running`, `onSteer` | `components/stopgaps/steer-keys.tsx`: catches Enter and ⌘Enter in `onKeyDownCapture` on a wrapper; no Send button while a turn runs | Send beside Stop, both modes by key and pointer |
| Queue `onSend` | Queue items whose "send now" is a host button outside the row | Send now on the item |
| Message `delivery`, `onWithdraw` | `components/stopgaps/delivery-mark.tsx`: the text "Steered" or "Queued" beside the Message | The header mark and Withdraw |
| Terminal `approval` | A Confirmation stacked above the Terminal in the Tool row | One Terminal: command, approval, then output |
| Confirmation `onAlwaysAllow` | "Always allow in this thread" as a host button beside Confirmation | The third choice |
| Diff | `components/stopgaps/diff-view.tsx`: Code Block `lang="diff"` over `createTwoFilesPatch` | Diff with line numbers, word marks, collapsed context, Accept and Revert |
| Message and Tool `retry` | `components/stopgaps/retrying.tsx`: a Notice under the streaming Message, "Retrying (attempt n)…" | The retry line and its countdown |
| Step Group | Chain of Thought folding a finished turn's tool calls into "Read 4 files, edited 2, ran 1 command", losing each Tool's details | Step Group over the real Tool rows |
| Context Meter `breakdown` | Context Meter without a breakdown | The breakdown in its details |
| Quota Notice | A Notice "Retries exhausted" / limit text written by hand | Quota Notice where the provider reports limits |
| Trace, Run Timeline, Job Progress, Schedule Card, Agent Card, Usage Meter, Activity Graph, Thread List inbox, Handoff, Flow Graph | Nothing: fx-gui leaves these out today (no subagents in `libfx/browser`, no background runs in the browser) | Adopted when fx-gui gains the Mac app's runs; tested in the kit's fixtures until then |

## 10. Open questions

1. **Flow Graph:** keep it as 7b's last task (adds `@dagrejs/dagre`, 17 KB gzip measured, in its own primitive's bundle only) or drop it from Wave 7?
2. **Agent Card:** keep, or drop as composable?
3. **Names:** Step Group (tool group and subagent list), Trace (trace waterfall and tool timeline), Run Timeline (timeline and run activity), Usage Meter (cost meter), Quota Notice (quota banner). Rename any?
4. **Background runs as Thread List's `groupBy: "status"`** rather than a separate inbox component: agreed?
5. **Composer's split Send while running** (Send plus a chevron menu for the other mode): agreed, or one mode only by pointer with the other by key?
6. **Versions:** 7a as 0.9.0 and 7b as 0.10.0, two changesets; or one 0.9.0 at the end of 7b?
