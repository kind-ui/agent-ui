# `@kind-ui/agent-ui` Wave 7 redesign: the working turn

- **Status:** Proposed 2026-11-26, design only, for the user's review. Nothing here is built. Mockups for every item, in light and dark at 1280 and 390 px, are attached to the PR that adds this file.
- **Replaces:** the first Wave 7 draft (`2026-11-25-agent-ui-wave-7-design.md`, on the unmerged `wave-7b` branch), which proposed 12 new components and 8 changes. Each item below says how it differs from that draft.
- **Extends:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md` (the base spec). Every rule there binds Wave 7: §2 "Building on UI SDK", §4.1 ownership and the approval contract, §5 Step base, §6 motion and agent actions, §8 accessibility, §9 distribution, and the five render layers. `docs/design-principles.md` decides the look.
- **Builds on:** UI SDK `0.1.0-beta.17` (Progress, Meter, Menu, Alert Dialog, Radio group, `createVirtualizer`, `createListFocus`'s pattern, `createPopup`, `bindStepPanel`, `announce`) and one new OSS package, `diff` (jsdiff, BSD-3-Clause), for Diff.

## 1. What changed, and why

The first draft listed what an agent product *could* show. This one starts from what people do with agents and keeps only what a recurring moment needs and shipped components can't give by composition (`docs/design-principles.md`, "When not to add"). Our research studied three kinds of use, each across many shipping products, then the reference kits' source code for each candidate:

- **Pairing with a local agent.** A developer watches a turn run for seconds to minutes. In that time they approve commands and edits, redirect the agent, then keep or undo what it changed. Most pain is approval prompts, losing work on undo, hangs with no feedback, and limits that drain fast.
- **Delegating to background agents.** Several runs start, the person leaves and comes back. They need to see which runs need them, then review what changed. Review is the bottleneck; stale status and unwatched spend are the complaints.
- **Operating agents.** Traces, catalogues, graphs and heatmaps live in the operator's own console, not in the end-user UI this library serves.

The moments that recur, strongest first: approve an act where it shows, with how far the approval reaches; review what changed and keep or undo it; send while a turn runs; see which runs need me; one summary of a turn's work; usage against a limit; retrying and stalls; how full the context is; undo to a point; recurring runs. Each item below names its moment.

### 1.1 Scope

| Item | Kind | Release |
| --- | --- | --- |
| **Diff** (§4) | New. One component for one file or a run's changes: the summary, Keep all and Undo all, per-file and per-change Keep and Undo. | 7a (0.9.0) |
| **Step Group** (§5) | New. One line that names a turn's work and expands to the host's own step rows. | 7a |
| **Composer and Queue** (§6) | Change. Steer, Queue, and Stop and send while a turn runs; the Queue docks to the composer; take back the last queued message. | 7a |
| **Message** (§7) | Change. Queued, steering and not-sent marks; Withdraw returns the text to the composer; retrying, Retry now, "Failed after N attempts". | 7a |
| **Terminal** (§8) | Change. The approval lives in the command's own block; the outcome becomes the run's result. | 7a |
| **Confirmation** (§9) | Change. Always allow with its scope, an "Always allowed" outcome, a deadline and an expired outcome, a danger style. | 7a |
| **Stalled** (§10) | Change to Step base, Status and Thinking Indicator. "No update for 2 min" over a running state. | 7a |
| **Context Meter** (§11) | Change. A breakdown with Free space, compaction, and several usage limits (Usage Meter folds in here). | 7b (0.10.0) |
| **Notice** (§12) | Change. A reset line, ways out, and the limit recipe (Quota Notice folds in here). | 7b |
| **Thread List** (§13) | Change. Group by what needs the person; Archive with Unarchive; one mark per row. | 7b |
| **Checkpoint** (§14) | Change. Restore scope (code, conversation or both) and what will be lost, with Compare. | 7b |
| **Cost hint** (§15) | Change to Model Selector and Model Control. A relative cost per model, in the row. | 7b |
| **Schedule Card** (§16) | **Pending user decision.** New, after 7b if kept. | — |

**Dropped** from the first draft, each because no in-app moment needs it: Trace, Run Timeline, Job Progress, Agent Card, Activity Graph, Flow Graph, Handoff, and Tool's Retry button (§17). Usage Meter and Quota Notice fold into Context Meter and Notice. Dropping Flow Graph drops `@dagrejs/dagre`.

**Totals:** 2 new components (56 to 58) and 11 changed, against the first draft's 12 new and 8 changed.

## 2. Shared vocabulary

These words are binding: every component in this wave, and its docs and examples, use them as written. A test in `scripts/tests/` keeps the default strings in one table (`core/words.ts`), so drift fails the check.

### 2.1 Approvals and decisions

| Moment | Words | Rules |
| --- | --- | --- |
| Question | "Run `npm test`?", "Edit `src/app.ts`?", "Allow `search_docs`?" | The question names the act and its object. A command shows in full while it waits, never truncated. |
| Choices | **Deny** · **Approve** · optional **Always allow** with its scope ("Always allow `npm test`") | Deny is the quieter button and comes first; Approve is the primary pill and comes last. Always allow is secondary, sits between them, and exists only when the host offers it. Never OK, Yes or No. On Terminal the approve verb is **Run**. |
| Scope | One model: *what* (the button: "`npm test`") and *where* (the host's `alwaysScope`, "in this project"), in the same words in the detail line and the outcome | Detail: "Covers commands starting with `npm test`, in this project." Outcome: "Always allowed `npm test` in this project". A host whose lasting choice ends with the session writes "in this session" in both places; never one word before and another after. |
| Waiting | "Waiting for approval", in the meta beside the mark | Words, not only the ring. |
| Sending | "Sending decision" | Already Confirmation's. |
| Decided | **Approved** · **Always allowed** (+ what and where) · **Approved automatically** · **Denied: <reason>** · **Expired before a decision** · **Cancelled before a decision** | Past tense, in the buttons' place on the same line, focusable. After the act runs, its result is said once, where the component already says results: a Terminal's header mark and meta ("Exit 1 · 6 sec"). The outcome line keeps the decision, so a lasting choice ("Always allowed `npm test` in this project") stays visible. |
| Edits after the fact | **Keep** · **Undo** (per change, per file, **Keep all**, **Undo all**) → **Kept** / **Undone** | Approve and Deny gate a write before it happens. Keep and Undo judge a write already applied. Never both pairs on one control. |
| Marks | Approved: check. Denied: a slash in a ring. Expired: a clock in a ring. Stopped and Cancelled: the minus. Failed: the ✕. | One meaning per mark, the same in every component. Denied and expired join `status-mark.css` as glyphs (`data-status="denied"`, `"expired"`), so a step that never ran doesn't look stopped. Where a header already carries the mark (Terminal), the outcome line under it carries only words. |
| Roles | Never `role="alert"` on mount. Announce the outcome once, politely. | — |

### 2.2 Status placement

- **The header row carries status:** the mark, then words in the meta slot at the row's end ("Running", "Waiting for approval", "Failed after 12 sec"), with the duration. Never color alone.
- **Mark only what needs attention.** Running, waiting, failed and stopped get marks. Complete is quiet: once on a group, never a check on every row.
- **Outcomes replace actions in place,** at the same height, and take focus when the focused button leaves.
- **A group takes its most urgent child's status:** waiting > failed > running > pending > stopped > complete. Never the last child's.
- **A failure inside a closed group shows on the group** ("1 failed"), in its meta and its accessible name.
- **Retrying and stalled are overlays on a status, not statuses:** "Rate limited. Retrying in 4 sec, attempt 2 of 5"; "No update for 2 min". The status under them stays `running` or `streaming`.

### 2.3 Lines of work

- One line per event: **verb + target** ("Read `auth.ts`", "Ran `npm test`"). Present tense while running ("Reading 3 files"), past tense when done ("Read 3 files").
- Durations go from ms to sec at 1 second, and to min past 60. A running item's elapsed time ticks without being announced. Countdowns tick in seconds only under a minute; a schedule or a reset reads in minutes.
- Relative time within a day, an absolute date beyond, the exact time in a tooltip, `<time datetime>` always (Wave 6's `core/time.ts`).
- Announce outcomes only: failures, waiting for you, done. Never a tick, a streamed row or an appended line.

### 2.4 Identity

People are circles, agents rounded squares with a glyph when there's no image. Names are text; avatars are `aria-hidden`. No default "AI" badge. `MessageAuthor` gains `kind?: "agent" | "person"` (§3), which Message and Subagent read.

## 3. Shared contracts

Everything is additive: no 0.8 option, part, state key or action changes meaning, except where §7 and §9 say so.

```ts
// types/records.ts and types/tool.ts additions

// A retry in progress. `attempt` counts from 1 for the first retry.
interface RetryState {
  attempt: number;
  maxAttempts?: number;
  /** Seconds until the next attempt, as the server reported it. Counted from when the host passes it, so a wrong device clock doesn't skew it. */
  retryAfter?: number;
  /** What went wrong, in words: "Rate limited", "Server error 503". Leads the line. */
  reason?: string;
}

interface Message {
  // … 0.8 fields
  /** A user message that isn't with the agent yet. Absent once delivered. */
  delivery?: "queued" | "steering" | "not-sent";
  retry?: RetryState;
}

interface MessageAuthor {
  // … 0.8 fields
  kind?: "agent" | "person";
}

interface Approval {
  // … 0.8 fields
  state: "requested" | "submitting" | "submit-failed" | "responded" | "auto" | "expired" | "cancelled";
  decision?: { approved: boolean; reason?: string; always?: boolean; scope?: string };
  /** ISO 8601. Shows "Decide in 4 min"; past it, the request reads Expired unless the host resolves it. */
  expiresAt?: string;
}

// Terminal steps carry the approval tool calls already do.
type Step = /* … */ | (StepBase & { kind: "terminal"; command: string; output: string; exitCode?: number; approval?: Approval });

interface Thread {
  // … 0.8 fields
  status?: "queued" | "running" | "awaiting-approval" | "awaiting-input" | "error" | "complete";
  /** ISO 8601: when it started waiting on the person. Orders "Needs you", oldest first. */
  waitingSince?: string;
  /** The second line: "+120 −8 in 4 files", or the latest step while running. */
  summary?: string;
  archived?: boolean;
}

interface ModelOption<Icon = string> {
  // … 0.8 fields
  /** A short relative cost the host writes: "1×", "3×", "Free", "$0.40". */
  cost?: string;
}

// Diff
interface DiffFile {
  path: string;
  oldPath?: string; // a rename
  status?: "added" | "modified" | "deleted" | "renamed";
  language?: string; // for `highlight`
  patch?: string; // unified diff for this file; may stream
  before?: string; // or both sides, diffed in core
  after?: string;
  streaming?: boolean;
  decision?: "kept" | "undone";
  /** Per change (hunk), by index in the parsed patch. */
  changes?: ({ decision?: "kept" | "undone" } | undefined)[];
}

// Step Group
interface StepGroupItem { id: string; status: StepStatus; kind?: string; target?: string }

// Context Meter
interface UsageSlice { id: string; label: string; value: number }
interface UsageLimit {
  id: string;
  label: string; // "5-hour limit", "Weekly limit"
  used: number;
  total: number;
  unit?: "tokens" | "requests" | "credits" | "currency"; // default "requests"
  currency?: string;
  resetsAt?: string; // ISO 8601
  windowStartedAt?: string; // ISO 8601; with resetsAt, gives the pace
}
```

`Approval.state` gains two members. A host that switches over it exhaustively gets a type error, which the 0.9 changeset names. The AI SDK adapter maps none of the new fields; its README section says so.

**Shared core modules:**

| Module | What | Used by |
| --- | --- | --- |
| `core/words.ts` | Every default string in §2, one table, so components and docs can't drift. | All |
| `core/countdown.ts` | A `live` whole-second countdown from a relative `seconds` value, writing nothing on the server and stopping at zero; `countdownText` ("in 4 sec", "in 1 min 12 sec") over `durationLabel`. Moved out of Connection Status, which spreads it unchanged. | Message, Notice, Connection Status |
| `core/retry.ts` | The retry line's text and its parts (`retryText`, `retryAnnouncement`). | Message |
| `core/approval-part.ts` | Tool's approval slot, its state memo and its options, moved out of `tool.ts` so Terminal spreads it unchanged. | Tool, Terminal |
| `core/aggregate.ts` | `aggregateStatus(statuses)` by §2.2's order. | Step Group, Thread List |
| `core/stalled.ts` | `stalledFor(lastActivityAt, now, after)` and the "No update for N min" words, on Wave 6's one-minute clock (`everyMinute`). | Step base, Status, Thinking Indicator |

**Cross-cutting rules** (each item meets them, so they're not repeated below):

- One `definePrimitive` per component; render files call `createParts` or wrap a UI SDK component. **No new spec §2 exception row.** Diffing is pure data, like the Markdown engine's libraries.
- Five render layers with the same part names, options, state keys and default children, parity-tested and server-rendered in each.
- Agent actions are offered only while available, run the same code as a person's input, report `details.source`, and refuse unknown ids listed in `agent.items`. Additions to the confirm list are named per item.
- `motion: "auto" | "reduced" | "none"` on every animated primitive; tokens only; the reduced form is opacity over 120 ms at most. No loop runs while nothing is waiting.
- `--kind-*` tokens only; shared controls through `data-kind-*`; focus rings only under `:focus-visible`, never on a text field. New glyphs are Lucide's, drawn as CSS masks and listed in `THIRD_PARTY_NOTICES.md`. No sparkle icon or animation.

## 4. Diff (new)

**Problem.** I need to decide which of the agent's edits to keep, and see what a run changed, without leaving the conversation.

**Why composing isn't enough.** Code Block with `language="diff"` has no line numbers, no collapsed context, no counts, no per-change decisions and no decided state; a Tool or Step around it can't add them. File Tree lists changed files but not their changes.

**One component, one or many files.** `files` holds one file or a run's changes. With one file, Diff is a single file block. With several, a summary header sits above a list of file blocks, each collapsed to a row until opened. One component keeps one keyboard model and one decision model; a "changes summary" beside a "file diff" would duplicate both.

### Anatomy

- **Summary** (several files only): "4 files changed" then `+120 −8`, then **Undo all** (quiet) and **Keep all** (secondary). Under the title, review progress once anything is decided: "2 of 4 reviewed".
- **Row actions on hover or focus.** Undo all and Keep all always show. A file row's and a change header's Undo and Keep show on `:hover` and `:focus-within`, and always under `(hover: none)` and at 390 px, so at most one row's pair is on screen with a pointer. Their space is reserved, so nothing moves when they appear. Outcomes and "Keeping…" always show.
- **File row:** a status word for added, deleted and renamed files (modified says nothing, binary included), the path with an ellipsis at its *start* when it's long so the file name stays, "from `old/path.ts`" on a second line for a rename, `+N −M` in tabular figures with a real minus sign and the zero side hidden, then **Undo** and **Keep**, then the chevron. While the patch streams, the counts are replaced by the running mark.
- **Change header** (a hunk): "Change 1 of 3 · line 19" in words, never raw `@@`, with that change's **Undo** and **Keep** at the end. Present only when the host takes per-change decisions.
- **Lines:** four columns: old number, new number, sign, code. Numbers and signs are drawn from attributes, so a copy is clean code. Added and removed lines are real `<ins>` and `<del>` with visually hidden "Added:" and "Removed:". Changed words inside a paired line get a stronger tint. Fills are faint tints from tokens (`--kind-diff-added`, `--kind-diff-removed`), and the sign carries the change for color-blind readers.
- **Collapsed context:** unchanged runs longer than 6 lines keep 3 on each side and fold into one row, "Show 12 lines", with hidden text naming where they are ("12 unchanged lines after change 2"). It keeps a row's height; opening it grows below.
- **Outcome:** a decided file or change shows **Kept** or **Undone** in its buttons' place, as muted words after a check or an arrow back, so an outcome never looks like the button it replaced. An undone change stays where it is, dimmed to 45% with its lines struck through for assistive technology ("Undone" before them); it doesn't disappear, so nothing moves.

### States and wording

| State | Summary | File row | Change header |
| --- | --- | --- | --- |
| Streaming | "Editing 2 files" + running mark | running mark in place of counts. No Keep or Undo on any file until the whole patch has arrived | — |
| Ready | "4 files changed · +120 −8", Undo all, Keep all | counts, Undo, Keep | Undo, Keep |
| Sending | the pressed button holds its width under a running mark; the others are `aria-disabled` | "Keeping…" or "Undoing…" after a running mark, in the buttons' place | same |
| Partly reviewed | "2 of 4 reviewed" under the title | **Kept** / **Undone** in place of the buttons | same |
| All reviewed | "All changes reviewed · 3 kept, 1 undone"; Keep all and Undo all leave, focus moves to the summary | — | — |
| Undo all asked | the actions line becomes "Undo all 4 files? This can't be undone." **Cancel** · **Undo all** (danger), in place | — | — |
| Failed to apply | "Couldn't undo `auth.ts`" beside the row's buttons, which stay | — | — |
| Binary or no text | "Binary file, not shown" / "Renamed, no changes" in the body | counts hidden | — |
| Too large | after 2,000 lines: "Show full diff (6,400 lines)" | — | — |

### After an action

Keep or Undo calls the host and locks that target (`createPendingAction`, keyed by path and change) until the host reports `decision` or replaces the file. The outcome replaces the buttons at the same height and takes focus if the pressed button had it, as Confirmation's does. Keep all and Undo all lock every undecided target. Undo all asks first, in place (above), because it can't be taken back from inside the component. Outcomes are announced once: "Kept `auth.ts`", "Undid 4 files".

### Keyboard and ARIA

- The root is a `region` named "Changes" (or the one file's path). The summary is a heading.
- File rows are one roving group (`createListFocus`): Up and Down move between rows, Home and End jump, Enter and Space open and close. A row's Undo and Keep follow it in tab order. Shortcuts scoped to a focused row or change: `K` keeps, `U` undoes (listed in the docs, offered through `aria-keyshortcuts`), so they can't fire from a text field.
- Each open file's lines are a `table` with visually hidden column headers "Old line, New line, Change, Code"; a blank line reads "blank". The viewport is a `focus: "tab-stop"` scroller, as Conversation's is, so a long diff scrolls from the keyboard.
- "Show N lines" buttons are findable (`bindFindable`): find in page opens them.

### Mobile (390 px)

The summary wraps: title and counts on one line, Undo all and Keep all on the next, each half the width. File rows keep path, counts and the chevron; Undo and Keep become icon buttons (an arrow back and a check) named "Undo `auth.ts`" and "Keep `auth.ts`", 44 px targets. Lines drop to one number column (the new line's) and scroll sideways; Code Block's Wrap toggle sits in the file header's menu.

### Motion

Opening a file uses the Step panel's height motion. A decided change dims over `--kind-duration-base`. Streaming follows the end while the reader is there, as Terminal does. Nothing animates per line.

### API

```ts
type DiffTarget = { path?: string; change?: number }; // no path: every undecided file

type DiffOptions = {
  files?: DiffFile[];
  label?: string; // the region's name, default "Changes"
  onKeep?: (target: DiffTarget, details: ActionDetails) => unknown; // "action"
  onUndo?: (target: DiffTarget, details: ActionDetails) => unknown; // "action"
  perChange?: boolean; // show change headers with their own Keep and Undo
  open?: string[]; // open files, controlled; defaultOpen, onOpenChange
  highlight?: CodeBlockHighlight; // Code Block's
  keepLabel?: string; undoLabel?: string;
  agentConfirm?: boolean; // default true
  motion?: MotionMode;
};
```

Core: jsdiff's `structuredPatch` for `before`/`after`, `parsePatch` for `patch` (only complete hunks of a streaming patch are parsed; the rest waits), `diffWordsWithSpace` for word marks, paired by similarity rather than by position, skipping pairs past 25% edit distance and merging marks split by one character. Virtualized past 400 rows with `createVirtualizer`. Parts: `root`, `summary`, `summary-title`, `summary-counts`, `summary-actions`, `keep-all`, `undo-all`, `file`, `file-trigger`, `file-path`, `file-counts`, `file-keep`, `file-undo`, `file-outcome`, `file-content`, `viewport`, `change`, `change-keep`, `change-undo`, `line`, `collapsed`. Agent actions `keep(path?, change?)`, `undo(path?, change?)`, `open(path)`, `expandAll`, `copy(path)`; `agent.items` lists the paths. **`undo` joins the confirm list**: the root renders `data-agent-confirm` while `agentConfirm` and `onUndo` are set. Web events: `keep`, `undo` (`can-keep`, `can-undo`), `openchange`.

### How it differs from the first draft

The draft shipped one file per Diff, per-file Accept and Revert, and deferred the multi-file summary and per-change decisions to Wave 8. Review is the core of the moment, so both move into 7a, and split view is deferred instead. The verbs change to Keep and Undo (the edit is already applied). Added and removed lines become `<ins>`/`<del>` with spoken words instead of a sign in the text; numbers leave the selection; hunk headers read in words; a decided state exists; and Undo all confirms in place.

## 5. Step Group (new)

**Problem.** A 30-call turn buries the answer; I want one line that says what was done, and what's running now.

**Why composing isn't enough.** Chain of Thought renders step *data* (a title and Markdown); a turn's work is the host's own Tool, Terminal and Subagent rows, with their approvals and output. Step has no aggregate status, no summary and no rule for opening when a child needs input.

### Anatomy

A Step-based row: the aggregate mark, the title, the meta, the chevron. Its content is the host's rows in a StepList, on the Step guide line. Rows inside show marks only when running, waiting, failed or stopped; a complete child's mark is a quiet dot, so the column stays aligned without a check on every row.

### States and wording

The title names the work, not a count. The host gives each kind four forms; core joins kinds in first-use order, counts unique targets, and caps at `maxClauses` (default 2), then "and N other steps".

| State | Title | Meta |
| --- | --- | --- |
| Running | the live step: "Running `npm test`" | "3 of 5" |
| Waiting | the work so far, "Read `package.json` and `build.ts`"; the waiting child shows the question | open (as it opens by itself): "1 waiting", since the child says what; folded: "Waiting for approval" |
| Done | "Read `auth.ts`, `db.ts` and ran `npm test`" | "41 sec" |
| Done, with a failure | the same title | "1 failed · 41 sec", in the name too |
| Stopped | the same title | "Stopped after 41 sec" |
| Failed (the turn) | the same title | "Failed after 12 sec" |
| Parallel agents running | "Running 3 agents" | "1 of 3" |
| Parallel agents done | "Ran 3 agents" | "1 failed · 2 min 4 sec" |

Without `kinds`, the title counts by kind ("12 steps"). Under `minItems` (default 3) items, no group renders: the children show flat, since grouping two rows hides more than it saves.

### After an action

Folding follows the Step base with three rules: open by itself while any item is `awaiting-input` (a closed group can never hide an approval); fold once, about 1 s after finishing, unless the person opened it; never fold while focus or a text selection is inside. Find in page and a deep link to a child open it (`bindStepPanel`). Children's terminal transitions inside 300 ms announce as one sentence: "3 agents finished, 1 failed".

### Keyboard and ARIA

The trigger is a button with `aria-expanded`; its name is the title plus the meta ("Read `auth.ts` and ran `npm test`, 1 failed, 41 sec"). The content is a `list`; each child keeps its own semantics. While running, the meta isn't a live region; outcomes announce through `announce`.

### Mobile (390 px)

The title wraps to two lines, then truncates with the full sentence in the name; the meta stays on the first line's end.

### Motion

The Step panel's height motion. Rows that arrive while open play the `"fade-up"` entrance once; nothing plays when the group opens.

### API

```ts
type StepGroupKind = { live: string; done: string; one: string; many: string }; // "Reading", "Read", "file", "files"

type StepGroupOptions = StepOptions & {
  items?: StepGroupItem[]; // what the children are, since core can't read them
  kinds?: Record<string, StepGroupKind>;
  maxClauses?: number; // default 2
  minItems?: number; // default 3
  current?: string; // the live step's words, else the first running item's kind and target
};
```

Status is `aggregateStatus(items)` unless the host passes one. Agent actions are the Step base's `expand` and `collapse`. Web: `kind-step-group` holds the host's children; `items` and `kinds` are properties.

### How it differs from the first draft

The draft's title was a count ("Read 4 files, edited 2"), had no live step while running, aggregated status as "running if any running", had a Stop all action, and could fold with an approval inside. Now: the live step is the title while running, targets are named, status takes the most urgent child, a closed group never hides an approval, it never folds under the reader, small groups don't group, and Stop all is gone (the composer's Stop stops the turn).

## 6. Composer and Queue (change)

**Problem.** I need to correct a running agent without throwing away its current step, and see, edit or send now what I've queued.

**Why composing isn't enough.** While a turn runs the composer offers only Stop; nothing can send. Queue reorders and removes but has no Send now or Edit, and sits apart from the composer as a to-do list.

### Anatomy

- **Actions row while running:** with an empty draft, only **Stop**. Once there's text, **Send** appears beside Stop, named by its effect: "Steer" (deliver at the agent's next step) or "Queue" (after this turn). A chevron on Send opens a menu of the other mode and **Stop and send**, each with its key.
- **The docked queue:** when Queue is a direct child of the composer, it docks to the composer's top edge as part of the same box: a header "2 queued" with a chevron, then one row per message with its text on one line and **Send now**, **Edit** and **Remove** as named icon buttons. They show on hover and focus, and always on touch, as Diff's row actions do. It stays docked whether or not a turn runs.

### States and wording

| State | Actions | Words |
| --- | --- | --- |
| Idle | Send | — |
| Running, empty draft | Stop (the ink circle, as today) | Stop's name: "Stop generating" (or "Cancel sending" while a submission uploads) |
| Running, with text | Stop · Send ▾ | Stop turns quiet (a fill, not ink), since Send is now the one primary. Send reads "Steer" (default) or "Queue" by `steerMode`; tooltip "Send into the current turn · Enter" / "Send after this turn · Enter" |
| Menu | Steer now `Enter` · Queue for later `⌥Enter` · Stop and send `⇧⌘Enter` | the current mode is checked |
| Queue row | Send now · Edit · Remove, as icon buttons with names | the row is named "Queued message 2 of 3, not sent"; Send now's tooltip "Send into the current turn" while running, "Send now" otherwise |
| Send now unavailable | Send now `aria-disabled` | tooltip "Available after you answer the pending request" |

### After an action

- **Steer** sends the draft through `onSteer` with `mode: "steer"`; the message appears in the transcript with `delivery: "steering"` (§7). **Queue** hands it to the host with `mode: "queue"`, which adds a Queue item. **Stop and send** stops the turn and sends as a new turn. Each follows the submit contract (base spec §4.1): snapshot, lock, clear only the sent snapshot, keep the draft on failure. Announced once: "Steer sent", "Queued", "Stopped and sent".
- **Stopping never sends the next queued message.** Queued items wait for the person.
- **Edit** (and **Withdraw** on a message) removes the item through the host and puts its text back into the composer: appended after a line break if the draft has text, else as the draft, with the caret at the end. Reason `"queue-edit"`.
- **Take back:** `Alt+Up` (`⌥↑`) in an empty composer takes back the last queued message the same way.
- Moves keep Queue's reorder; "Moved to 2 of 3" is announced.

### Keyboard and ARIA

Enter never stops a turn, and IME composition never sends. `Mod+Enter` (or `Alt+Enter` under `submitOn: "mod-enter"`) sends in the other mode. The menu is UI SDK Menu on the Send chevron (`data-agent-hidden`, so an agent sees `steer`, `queue` and `stopAndSend`). The docked queue is Queue's `list` with roving focus; its header is a disclosure button.

### Mobile (390 px)

The actions row keeps Stop and Send at the end; the chevron is part of Send's pill, and the model trigger shows its short name (Wave 5's narrow rule). Queue rows keep their three icon buttons and truncate the text, so a row stays one line.

### Motion

Send fades in beside Stop when the first character arrives (the row reserves its width, so nothing moves). The docked queue grows from the composer's top edge with the `expand` preset; rows leave with the Queue's existing exit.

### API

```ts
type ComposerSteerMode = "steer" | "queue" | "stop-and-send";

type ComposerOptions = /* 0.8 */ & {
  running?: boolean; // a turn is running; Stop shows while pending || running
  onSteer?: (draft: ComposerDraft, details: ActionDetails & { mode: ComposerSteerMode }) => unknown; // "action"
  steerMode?: "steer" | "queue"; // Send's default while running; default "steer"
  stopAndSend?: boolean; // offer Stop and send; default true when onStop and onSteer are set
};

type QueueOptions = /* 0.8 */ & {
  onSend?: (id: string, details: ActionDetails) => unknown; // "action": Send now
  onEdit?: (id: string, details: ActionDetails) => unknown; // "action": the text goes back to the composer once it resolves
  sendDisabledReason?: string;
};
```

The composer finds a docked Queue through `core/text-target.ts`'s registry (Wave 5), which gains `takeBack()`. Agent actions: Composer `steer`, `queue`, `stopAndSend` while running (the composer's existing mark gates them); Queue `send(id)`, `edit(id)`. Web: `composersteer` event with `detail.mode`; Queue `send` and `edit` events with `can-send`, `can-edit`.

### How it differs from the first draft

The draft had two modes and a separate Queue list with Send now only. Now: Stop and send joins the menu; Send shows only once there's text; the Queue docks to the composer with Send now, Edit and Remove on every row (on hover or focus, always on touch); stopping doesn't drain the queue; and a key takes back the last queued message.

## 7. Message (change)

**Problem.** I need to know my steer hasn't landed yet, take it back if I changed my mind, and see whether a slow reply is still trying.

**Why composing isn't enough.** These are states of one message: its footer row and its outcome row already exist (Wave 6). Connection Status covers the app being offline, not one request backing off.

### Anatomy and wording

- **Delivery** sits in the footer line, end-aligned under the user's bubble, in `xs` muted words, so the reader isn't moved:
  - `queued`: the bubble turns muted with a dashed edge; footer "Queued, not sent" with **Withdraw**. Use it when the message is already in the host's store but waiting on the server (a background run's follow-up). A message still in the browser belongs in the docked Queue (§6), never in both.
  - `steering`: footer "Steering…" (sent, not yet read by the agent) with **Withdraw**. Words only, no mark: one quiet line, not a second loop beside the reply's.
  - `not-sent`: footer "Not sent" in danger words with **Retry**.
  - Delivered: no mark. "Steered" is never shown after the fact.
- **Retrying** sits in the outcome row under the streamed text: "Rate limited. Retrying in 4 sec, attempt 2 of 5", with **Retry now** and **Cancel**. Without a reason: "Retrying in 4 sec, attempt 2 of 5"; without a delay: "Retrying, attempt 2 of 5".
- **Exhausted:** when `status` becomes `error` while `retry` is still set, the outcome reads "Failed after 5 attempts" with **Retry**.
- Three verbs stay distinct: **Retry** repeats a failed request, **Continue** resumes a cut-off one, **Regenerate** asks for another answer.

### After an action

**Withdraw** calls `onWithdraw`; once it resolves, the text goes back to the composer as Queue's Edit does (§6), and the host removes the message. **Retry now** calls `onRetryNow`, locked until `retry.attempt` changes. **Cancel** calls `onCancelRetry`. Announcements: "Retrying, attempt 2" once per attempt, "Failed after 5 attempts", "Not sent". Never the countdown.

### Keyboard and ARIA

The footer's words are the message's accessible description ("Steering, not yet read"). Withdraw, Retry now and Cancel are small buttons (`data-kind-button`, `sm`) with a 24 px target and 44 px under a coarse pointer, never bare text. The retry line is `role="status"` while counting; the exhausted outcome is announced, not an alert on mount.

### Mobile (390 px)

The footer wraps below the bubble; the retry line wraps its buttons under the sentence.

### Motion

A steering or queued message pops in from its trailing corner like any user message; the footer's words crossfade when delivery changes. A withdrawn message leaves with the Conversation's row exit.

### API

```ts
type MessageOptions = /* 0.8 */ & {
  delivery?: "queued" | "steering" | "not-sent";
  onWithdraw?: (details: ActionDetails) => unknown; // "action"
  onResend?: (details: ActionDetails) => unknown; // "action": Retry on "Not sent"
  retry?: RetryState;
  onRetryNow?: (details: ActionDetails) => unknown; // "action"
  onCancelRetry?: (details: ActionDetails) => unknown; // "action"
};
```

Agent actions `withdraw`, `resend`, `retryNow`, `cancelRetry`, each offered only while it shows. Web events `withdraw`, `resend`, `retrynow`, `cancelretry`, with `can-*` attributes.

### How it differs from the first draft

The draft labelled delivered messages "Steered" forever and put a turn-arrow glyph in the header; Withdraw dropped the text. Now delivery is a short-lived footer state that ends at delivery, Withdraw returns the text to the composer, queued messages look queued, and retrying leads with the reason, offers Retry now and Cancel, and ends in "Failed after N attempts".

## 8. Terminal (change)

**Problem.** I want to approve a command where it shows, then watch it run in the same block.

**Why composing isn't enough.** Terminal can't host a Confirmation today; stacking one above it shows the command twice and splits one act in two.

### Anatomy and wording

| State | Header | Body |
| --- | --- | --- |
| Waiting | mark (waiting), "Run `npm test`?", meta "Waiting for approval" | an optional risk line ("Deletes files outside the project"); **Deny** · **Always allow `npm test`** · **Run**; the detail "Covers commands starting with `npm test`, in this project." |
| Danger | the same | the risk line after the warning mark (the mark carries the color, the words stay ink); **Deny** · **Run** (danger); no Always allow |
| Sending | — | "Sending decision", buttons locked |
| Approved, running | `npm test`, running mark, meta "4 sec" | outcome line "Approved" (or "Always allowed `npm test` in this project") after a muted check, then the output, which grows below |
| Ran | `npm test`, complete mark, meta "6 sec" | the outcome keeps the decision; the output stays |
| Failed | `npm test`, failed mark, meta "Exit 1 · 6 sec" | the same |
| Denied | `npm test`, denied mark (slash), no meta | outcome "Denied: not outside the project", words only; no output |
| Expired | `npm test`, expired mark (clock), no meta | outcome "Expired before a decision", words only |

The block can't be collapsed while it waits (its trigger is `aria-disabled` for closing).

### After an action

The question in the title becomes the command, and the choices line becomes the outcome in place, at the same height, focused if a choice had focus. Output appears under it; the viewport reserves its minimum height when the command is approved, so the first line moves nothing. When the run ends, the header's mark and meta say the result ("Exit 1 · 6 sec"); the outcome line isn't rewritten, so the result is said once.

### Keyboard, ARIA, mobile, motion

Confirmation's (§9). The waiting title wraps instead of truncating, at every width, so the command is always whole. At 390 px the meta stays on the first line's end and the three choices share one row while they fit, else Always allow takes its own row above. Motion is Confirmation's swap; the output uses Terminal's own streaming.

### API

Terminal spreads `approvalPart`: `approval`, `onApprove`, `onDeny`, `onAlwaysAllow`, `alwaysLabel`, `alwaysTarget`, `alwaysScope`, `alwaysDetail`, `risk`, `riskText`, `approveLabel` (default "Run"). Agent actions `approve`, `deny`, `alwaysAllow`, through its Confirmation, which is marked.

### How it differs from the first draft

The draft put a Confirmation between the command and the output, kept a generic "Approve" verb and a colored ring as the only wait signal. Now: the question is the command, "Waiting for approval" is in words, the verb is Run, the result is said once in the header, a dangerous command can't be always-allowed, and the block can't fold while it waits.

## 9. Confirmation (change)

**Problem.** Stop asking me about safe acts, show me what I allowed, and don't leave a stale request looking live.

**Why composing isn't enough.** An extra button whose outcome reads "Approved" loses the scope and the decision; a deadline is state of the request.

### Anatomy and wording

- **Choices**, in this order: **Deny** (secondary) · **Always allow `<scope>`** (secondary, host-offered) · **Approve** (primary). This reverses 0.8's Approve-first order; the 0.9 changeset says so.
- **Scope line** under the choices when `alwaysDetail` is set: "Covers `search_docs` in this project." The outcome repeats the same *where* (§2.1 Scope). The host owns the list and its revocation (settings, not here).
- **Deadline:** with `expiresAt`, the meta reads "Decide in 4 min", in minutes, then "Decide in 40 sec" under a minute.
- **Outcomes:** "Approved", "Always allowed `search_docs` in this project", "Approved automatically", "Denied: <reason>", "Expired before a decision", "Cancelled before a decision", each after its mark (§2.1 Marks).
- **Danger:** `risk: "danger"` gives the danger mark, the risk line, a danger Approve, and no Always allow.

### After an action

As 0.8: the choice locks, "Sending decision", then the outcome in place, focused if a choice had focus, announced once. At the deadline, the host decides; until it does, the choices stay but the meta reads "Expired", and an approval whose `state` is `expired` shows the expired outcome.

### Keyboard and ARIA

Unchanged: a `group` named by the label; the outcome is a `focus: "tab-stop"`. Always allow's name includes its scope.

### Mobile (390 px)

Deny and Approve stay on one row; Always allow takes its own row above them when the three don't fit, so the primary stays last and under the thumb.

### API

```ts
type ConfirmationOptions = /* 0.8 */ & {
  onAlwaysAllow?: ConfirmationCallback; // the decision carries always: true and scope
  alwaysLabel?: string; // default "Always allow"
  alwaysTarget?: string; // what: "npm test", shown in the label and the outcome
  alwaysScope?: string; // where: "in this project", shown in the detail and the outcome
  alwaysDetail?: string;
  risk?: "danger";
  riskText?: string;
};
```

`expiresAt` comes on the `Approval`. Agent action `alwaysAllow`, marked like `approve`.

### How it differs from the first draft

The draft's third button had no scope and its outcome read "Approved". Now the scope is in the button, a detail line and the outcome; danger actions can't be always-allowed; and requests can expire or be cancelled with words for each.

## 10. Stalled (change)

**Problem.** Is it still working, or has it hung?

**Why composing isn't enough.** It's an overlay on an existing running state, so it belongs to the components that show running: the Step base (every Step-based row), Status and Thinking Indicator.

### Anatomy and wording

With `lastActivityAt` and `stalledAfter` (default 120 sec), once no activity arrives for that long the meta reads "No update for 2 min" in warning-colored words, updated each minute. The mark stays running, since the work hasn't stopped; the words carry the warning, so the mark doesn't repeat it. Thinking Indicator's label becomes "Still working · no update for 2 min". The host may put **Stop** beside it; the component adds no action of its own.

### After, ARIA, mobile, motion

Announced once, politely, when it starts ("No update for 2 min"), and once when activity resumes ("Working again"). Nothing else. The meta's width is reserved by the row; at 390 px the words wrap under the title. No new motion.

### API

`lastActivityAt?: string`, `stalledAfter?: number` on `StepOptions`, `StatusOptions` and `IndicatorOptions`; state `stalled: boolean`, `stalledMinutes`. Reads the shared one-minute clock, never a per-second timer.

### How it differs from the first draft

New: the draft had no stalled state.

## 11. Context Meter (change)

**Problem.** What fills my context, when will it compact, and how much of my plan is left?

**Why composing isn't enough.** It's Context Meter's own detail. A separate Usage Meter would put a second ring beside the first and split one glance into two controls.

### Anatomy

The trigger stays a ring. The details card has three bands:

- **Summary:** "57% full" and "72,900 of 128,000 tokens", with **Compact** (when `onCompact` is set) at the row's end; a stacked bar of the breakdown with a tick at `compactAt`; and the level in words when it's high: "86% full · Filling up" (80%), "Almost full" (95%).
- **Breakdown rows:** swatch, label, tokens, percent, then **Free space** last with a hollow swatch. Rows with 0 stay, so the card's height is stable. Focusing or hovering a row highlights its slice.
- **Limits** (with `limits`): one row per window, "5-hour limit · 62% used · Resets 5:00 PM, in 3 hr" and "Weekly limit · 24% used · Resets Tue", each with a thin bar and, with `windowStartedAt`, "Ahead of pace" or "On pace". From 80% a window says "Running low" first, so its warning color is never alone.

### States and wording

The ring shows the context until a limit reaches 80%; then it shows that limit, and the trigger is named by it ("Weekly limit, 82% used"), so a near cap is never hidden behind a quiet context ring. Slice colors come from a category palette (`--kind-category-1` to `-6`) that never uses status colors, so "Files" is never red. Segments get a 1% minimum width. Resets read in minutes, at most once a minute. While compacting, a running mark and "Compacting" take Compact's place.

A compacted conversation shows the point it happened with a Status row in the transcript ("Compacted the conversation · 64k → 12k tokens"), a docs recipe, not a new part.

### Keyboard and ARIA

As 0.8 (a popover on press, hover and keyboard focus). The bar is one `img` named by the whole breakdown as a sentence ("57% full: Messages 41,200, Files 18,100, Tools 9,800, System 3,800, Free space 55,100"); rows are a labelled list. Each limit is a `meter` with `aria-valuetext` "62% used, resets 5:00 PM".

### Mobile (390 px)

The card presents as a sheet (Picker's presentation); rows keep their four columns, percentages drop below 360 px.

### Motion

Rows' share bars grow once when the card opens; the reduced form is a fade.

### API

```ts
type ContextMeterOptions = /* 0.8 */ & {
  breakdown?: UsageSlice[]; // slices must not overlap; cached and reasoning counts are rows without a share
  compactAt?: number; // 0 to 1
  onCompact?: (details: ActionDetails) => unknown; // "action"
  limits?: UsageLimit[];
  layout?: "popover" | "inline"; // inline puts the card in the page, for settings
};
```

Agent action `compact`. Web event `compact` (`can-compact`).

### How it differs from the first draft

The draft added a separate Usage Meter with one limit, and a breakdown whose slices fell back to status colors. Now: one meter, several windows each with its reset and pace, the ring follows the fullest limit past 80%, a Free space row, a category palette, a compaction tick and Compact.

## 12. Notice (change)

**Problem.** I've hit my limit: which one, when does it reset, and how do I keep going?

**Why composing isn't enough.** Notice already has a variant, title, text, actions and Dismiss. What's missing is a reset line and the rule for dismissal; a separate Quota Notice would duplicate the rest.

### Anatomy and wording (the recipe)

- **Near the limit** (warning): title "12 requests left", reset line "Resets Dec 1"; actions the host offers, e.g. **Upgrade**; dismissible.
- **At the limit** (error): title "You've reached your weekly limit", reset line "Resets Tuesday at 9:00 AM"; under an hour, a countdown, "You can send messages again in 42 min", which ends as "You can send messages again." Actions beyond Upgrade: **Use credits**, **Switch to `<model>`**, **Continue at reset**. No Dismiss.
- **Paying past the limit** (info): "Now using credits · $3.20 this month".
- What stops is said plainly: "New runs pause until then."

### After, ARIA, mobile, motion

A Notice that appears after mount at `error` takes `role="alert"`; otherwise it stays `note` and announces once, as Conversation's error does (Wave 6). A dismissed warning comes back when the host re-keys it at a higher level; the recipe shows the key. At 390 px the actions wrap under the text, the primary last. Crossing from warning to error swaps the mark in place, no remount.

### API

```ts
type NoticeOptions = /* 0.8 */ & {
  resetsAt?: string; // renders the reset line through core/time.ts
  dismissible?: boolean; // default: true unless variant is "error"
};
```

### How it differs from the first draft

The draft had a separate Quota Notice with a bar, "Resets in 3 days" at the limit, Upgrade as the only way out, and Dismiss at the limit. Now it's Notice with a reset line and a recipe, leads with what's left, names the day and time, offers more ways out, and can't be dismissed at the limit.

## 13. Thread List (change)

**Problem.** With many runs going, show me which need me first.

**Why composing isn't enough.** Thread List has the statuses but no grouping by what needs the person, no archive, and stacks several marks on one row.

### Anatomy and wording

With `groupBy: "status"`:

| Group | Heading | Order | Row meta |
| --- | --- | --- | --- |
| Needs you | "Needs you 3" (each heading is its name and a muted count) | oldest waiting first | second line "Approval · Run `rm -rf dist`?" or "Question · Which payment provider?"; time waiting at the end of the first |
| Running | "Running 3"; a queued row says "Queued" itself | newest first | second line the latest step, "Editing `theme.css` · +48 −6" |
| Done | "Done 13", the newest shown, the rest behind "12 more done", paged | newest first | the summary |

A row is two lines: the title with its one mark and time at the end, then the second line. Empty "Needs you": the group is absent; when nothing at all is waiting and nothing runs, the list's empty text is "Nothing is waiting on you." One mark per row, by priority: approval > question > failed (unseen) > running > done (unseen). Failed and done marks show only while unread, so a seen failure leaves "Needs you".

### After an action

**Archive** (row menu) moves a thread out at once and calls `onArchive`; if that rejects, it comes back and "`<title>` was restored" is announced. An `archived` view lists archived threads; with `onUnarchive`, **Unarchive** takes the time's place on hover or focus, always on touch.

### Keyboard, ARIA, mobile, motion

Thread List's grid is unchanged. Headings stay `rowheader` rows; the "12 done" row is a disclosure button. Row meta joins the row's name. At 390 px the second line wraps once, then truncates. Rows moving between groups use the list's existing slide.

### API

```ts
type ThreadListOptions = /* 0.8 */ & {
  groupBy?: "date" | "status";
  onArchive?: (id: string, details: ActionDetails) => unknown; // "action"
  onUnarchive?: (id: string, details: ActionDetails) => unknown;
  view?: "active" | "archived";
};
```

Agent actions `archive(id)`, `unarchive(id)`.

### How it differs from the first draft

The draft grouped by status but kept failed runs in "Needs you" forever, didn't tell approval from question, showed a check, a dot and a bold title on one unread row, let Done grow without limit, and had no Unarchive. All five are fixed above. Its per-row progress bar is gone: a row's second line says more than a bar.

## 14. Checkpoint (change)

**Problem.** I want to undo to a point, choosing code, conversation or both, and see what I'll lose first.

**Why composing isn't enough.** Checkpoint already owns the restore and its confirm dialog; the scope and what's lost belong in that dialog.

### Anatomy and wording

The dialog: title "Restore to this point?", a description naming the point ("Before “Switch to the session table”, 4 min ago."), then a radio group "Restore" with **Code and conversation** (default), **Code only**, **Conversation only** (only the scopes the host offers), then what will be lost, in words that follow the choice: "Undoes changes to 3 files (+12 −40) and removes 4 later messages." With `onCompare`, a **Compare** button opens the host's view of the change (a Diff in a dialog, in the recipe). Actions **Cancel** · **Restore**.

Messages sent during a turn that can't be restored as code are marked by the host; the dialog says "Code from 2 messages can't be restored."

### After, ARIA, mobile, motion

As 0.8: Restore locks, closes on success, and the outcome "Restored code and conversation" replaces the trigger. The radio group is UI SDK Radio group; the loss sentence is the dialog's description, so it's read on open. At 390 px the dialog is a sheet; the radios stack.

### API

```ts
type CheckpointScope = "both" | "code" | "conversation";
type CheckpointOptions = /* 0.8 */ & {
  scopes?: CheckpointScope[]; // default ["both"]: no choice shown
  defaultScope?: CheckpointScope;
  changes?: { files: number; additions: number; deletions: number };
  laterMessages?: number;
  onCompare?: (details: ActionDetails) => void;
};
// onRestore's details gain scope
```

### How it differs from the first draft

New: the draft didn't touch Checkpoint.

## 15. Cost hint in the model pickers (change)

**Problem.** I want to know what a model costs before I pick it.

**Why composing isn't enough.** It's one fact in rows that already exist.

### Anatomy and wording

A row's trailing meta shows `cost` in tabular figures ("1×", "3×", "Free"). A footer line under the list explains the unit once: "Cost per request, relative to the default model" (`costNote`). The trigger never shows it. At 390 px the cost stays at the row's end; the description wraps.

### API

`ModelOption.cost` (§3); `costNote?: string` on Model Selector and Model Control. The row's name appends ", 3 times the cost" through a `costName` formatter the host can replace.

### How it differs from the first draft

New.

## 16. Schedule Card (pending user decision)

**Problem.** Is my recurring run on, when does it run next, did the last run work, and can I run it now?

**For:** five background-agent products show the same shape (a schedule in words, the next run, the last run's outcome, an on/off switch, Run now and Edit), and Settings Menu with a Switch can't put those together. **Against:** neither the local-coding nor the operations studies needed it; it lives on a settings page more than in a conversation, and a host can lay out a Switch, two lines of text and two buttons. **Recommendation:** wait for a host that needs it, then build it as below.

**If kept:** the title line ends with the state, "Next: Today 9:00 AM PST" (zone shown when it differs), or "Paused: too many failures", or "Last run failed". One derived state drives both mark and words. The detail line is "agent · cadence · project". Below a hairline (not a box inside the card), the last run's summary with its outcome and link, and up to 5 recent outcomes as one image named in words ("Last 5 runs: 4 succeeded, 1 failed"). The Enabled switch is named by what it does ("Pause Daily triage"). Run now and Edit sit in a footer that wraps at 390 px. Countdowns in minutes only. API: `schedule` (`{ id, label, description, enabled, nextRunAt?, pausedReason?, lastRun?: { at, status, summary?, href? }, history?: StepStatus[] }`), `onEnabledChange`, `onRunNow`, `onEdit`; every action on the confirm list.

## 17. Dropped

| Item | Why |
| --- | --- |
| Trace | Operator consoles only; hosts can compose UI SDK Waterfall; in a conversation the failed step is the failed Tool row. |
| Run Timeline | Run history is the transcript or a console list. A docs recipe on UI SDK Timeline covers the rest. |
| Job Progress | Long work is a Terminal stream or a Task or Plan checklist; no percent-and-ETA moment was found. Its stall signal survives as §10. |
| Agent Card | Catalogues are admin or marketplace pages; picking an agent in chat is Picker. |
| Activity Graph | No in-app moment; consoles chart time ranges. |
| Flow Graph | Graphs live in editors and their debuggers. Drops `@dagrejs/dagre`. |
| Handoff | Evidence only in support products, and none asks the end user to approve a handoff. A host shows one with Message's `author` and a Status row (docs recipe). |
| Tool's Retry button | No product puts a per-tool Retry in front of the person: tool failures go back to the model, and re-running a tool that writes repeats its effects. |

## 18. Accessibility and testing

Every item meets base spec §8. Specifically: every status has words; outcomes take focus only when the pressed button had it; nothing is `role="alert"` on mount; countdowns are never announced; every new control has a 24 px target and 44 px under a coarse pointer. Each item gets a fixture page per state shown in the mockups, browser specs for its keyboard path and announcements, parity and hydration in five layers, `checkPattern` where UI SDK has the pattern, and budgets for Diff (a streamed hunk among 10 and 1,000 lines) and Step Group (a child status change among 10 and 200 children).

## 19. Mockups

Static prototypes built from the library's own compiled stylesheet and tokens, with the new parts drawn from tokens only, rendered in light and dark at 1280 and 390 px. One page per item, every state above in numbered frames: `diff`, `step-group`, `composer`, `message`, `terminal`, `confirmation`, `stalled`, `context-meter`, `notice`, `thread-list`, `checkpoint`, `cost-hint`, `schedule-card`. They're attached to this spec's PR, not committed. Product names in the mockups' sample data (model names) are example data a host would pass, not references.

## 20. Open questions

1. **Schedule Card:** build after 7b, or wait for a host (§16)?
2. **Per-change Keep and Undo in 7a:** the mockups show them; if a host can't apply per-change decisions, Diff still works per file (`perChange: false`). Ship both now, or per file first?
3. **Steer as the default mode:** Send reads "Steer" while running. Some hosts may prefer "Queue" as the safer default; `steerMode` allows either, but which do the docs show?
4. **Confirmation's button order** flips to Deny before Approve (§9). It matches the vocabulary but changes 0.8's visual order. Accept the change?
5. **Where a run's result goes after an approval** (§2.1, §8): the research said the outcome line turns into the result ("Exited with code 1"). Terminal's header already says it, so this spec keeps the decision on the outcome line and says the result once, in the header. Agree?
