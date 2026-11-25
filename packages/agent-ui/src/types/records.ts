import type { StepStatus } from "./step.js";

export interface Source {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
  mediaType?: string;
  /** An icon for the source, like its site's favicon. */
  favicon?: string;
}

/** Who wrote a message. */
export interface MessageAuthor {
  id: string;
  name: string;
  /** An image of the author. Without one, the avatar shows the name's initials. */
  avatarUrl?: string;
}

/** A conversation in a list of them. */
export interface Thread {
  id: string;
  title: string;
  /** ISO 8601. Picks the thread's date group. */
  updatedAt?: string;
  pinned?: boolean;
  /** A group of the host's, like a project or a folder, in place of the date group. Empty means none. */
  group?: string;
  /** The thread's own URL, so its row is a real link. */
  href?: string;
  /** Where the thread's background work stands. */
  status?: "queued" | "running" | "awaiting-input" | "error" | "complete";
  /** How far a running background run has come, from 0 to 1. */
  progress?: number;
  /** A line under the title, like "+120 −8 in 4 files". */
  summary?: string;
  unread?: boolean;
  /** The text that matched a search. */
  snippet?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  status: "pending" | "running" | "complete" | "error";
  files?: string[];
}

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "running" | "complete" | "skipped";
}

export interface QueueItem {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "complete";
}

export interface TestCase {
  id: string;
  name: string;
  status: "pass" | "fail" | "skip";
  durationMs?: number;
  error?: { message: string; stack?: string };
}

export interface TestSuite {
  id: string;
  name: string;
  tests: TestCase[];
}

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface Question {
  id: string;
  prompt: string;
  kind: "single" | "multiple" | "text";
  options?: QuestionOption[];
  required?: boolean;
  placeholder?: string;
}

/** Answers by question id: an option's value, several values, or text. */
export type Answers = Record<string, string | string[]>;

/** A model to choose from. `Icon` is what each render layer takes as an icon: an image URL unless it says otherwise. */
export interface ModelOption<Icon = string> {
  id: string;
  name: string;
  group?: string;
  description?: string;
  /** Shown before the name, in the list and in the field. Decorative: the name stays the model's label. */
  icon?: Icon;
  disabled?: boolean;
  /**
   * The `value`s of the effort levels the model supports, for Model Control. Leave it out for every level; `[]` for
   * a model without effort levels.
   */
  efforts?: string[];
}

export interface SuggestionItem {
  id: string;
  label: string;
  description?: string;
}

/** Token counts for one context window, as the model reports them. */
export interface TokenUsage {
  input?: number;
  output?: number;
  reasoning?: number;
  cached?: number;
}

/** A file or folder in a file tree. */
export interface FileTreeEntry {
  /** Relative and `/`-separated, like `src/index.ts`. A path ending in `/` is an empty folder. */
  path: string;
  /** How the change being shown touched the file, shown as a badge. */
  change?: "added" | "modified" | "deleted" | "renamed";
  /** Lines the change added, a whole number from 0, shown as `+N`. */
  additions?: number;
  /** Lines the change removed, a whole number from 0, shown as `−N`. */
  deletions?: number;
}

/** One line of a stack trace. `raw` is the line as written; the rest is what could be read from it. */
export interface StackFrame {
  raw: string;
  fn?: string;
  file?: string;
  /** Counted from 1. */
  line?: number;
  /** Counted from 1. */
  column?: number;
  /** Whether the frame is in a library rather than the app. */
  library?: boolean;
}

/** A word of a transcript segment, timed in seconds. */
export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
}

/** A speaker's turn in a transcript, timed in seconds. */
export interface TranscriptSegment {
  id: string;
  speaker: string;
  start: number;
  end: number;
  text: string;
  words?: TranscriptWord[];
}

/** An action the selection toolbar offers for the selected text. */
export interface SelectionActionItem {
  id: string;
  label: string;
  description?: string;
}

/** A row of a picker. `Icon` is what each render layer takes as an icon. A row with `items` opens a page of them. */
export interface PickerItem<Icon = unknown> {
  value: string;
  label: string;
  /** A second line under the label. */
  description?: string;
  /** Trailing text, like a branch's ahead and behind counts. */
  meta?: string;
  icon?: Icon;
  /** More words the search matches. */
  keywords?: string[];
  group?: string;
  disabled?: boolean;
  items?: PickerItem<Icon>[];
}

/** A footer row of a picker, like "More models". */
export interface PickerAction<Icon = unknown> {
  id: string;
  label: string;
  description?: string;
  icon?: Icon;
}

/** An entry of a menu. One with `items` opens a submenu of them. */
export interface MenuEntry<Icon = unknown> {
  id: string;
  label: string;
  description?: string;
  icon?: Icon;
  group?: string;
  disabled?: boolean;
  items?: MenuEntry<Icon>[];
}

/** A setting that is on or off, drawn as a switch. */
export interface SettingsToggle<Icon = unknown> {
  type: "toggle";
  id: string;
  label: string;
  description?: string;
  icon?: Icon;
}

/** A value a choice setting can take. Options with a `group` are listed under its label, in first-seen order. */
export interface SettingsOption<Icon = unknown> {
  value: string;
  label: string;
  icon?: Icon;
  group?: string;
  /** Shown dimmed: it can be focused but not chosen. Defaults to `false`. */
  disabled?: boolean;
}

/** A setting with one value of several, chosen in a submenu of its own. */
export interface SettingsChoice<Icon = unknown> {
  type: "choice";
  id: string;
  label: string;
  icon?: Icon;
  options: SettingsOption<Icon>[];
}

/** A row of a settings menu. */
export type SettingsEntry<Icon = unknown> = SettingsToggle<Icon> | SettingsChoice<Icon>;

/** A settings menu's values by setting `id`: `true` or `false` for a toggle, an option's `value` for a choice. */
export type SettingsValues = Record<string, boolean | string>;

/** A mode of an approval mode menu. A `danger` mode lets the agent do more without asking. */
export interface ApprovalModeOption {
  value: string;
  label: string;
  description?: string;
  danger?: boolean;
}

/** A level of an effort slider, in order from least to most effort. */
export interface EffortLevel {
  value: string;
  label: string;
}

/** A file, selection or other context attached to the next message. */
export interface ContextChip<Icon = unknown> {
  id: string;
  label: string;
  /** What the context is, like `"file"`, written as `data-kind`. */
  kind?: string;
  icon?: Icon;
}

/** A way to regenerate a message, like "More concise". One with `items` opens a submenu of them. */
export interface RegenerateOption<Icon = unknown> {
  id: string;
  label: string;
  description?: string;
  icon?: Icon;
  items?: RegenerateOption<Icon>[];
}

/** A retry in progress. */
export interface RetryState {
  /** Counts from 1 for the first retry. */
  attempt: number;
  maxAttempts?: number;
  /** ISO 8601. A countdown runs to it. */
  retryAt?: string;
  /** Why it's retrying, in words, like "Rate limited" or "Server error 503". */
  reason?: string;
}

/** The file a diff changes. */
export interface DiffFile {
  path: string;
  /** The path before a rename. */
  oldPath?: string;
  status?: "added" | "modified" | "deleted" | "renamed";
  /** The language for `highlight`. */
  language?: string;
}

/** A span of a trace, timed in milliseconds from the trace's start or as ISO 8601 instants. */
export interface TraceSpan {
  id: string;
  name: string;
  kind?: "agent" | "model" | "tool" | "other";
  status?: StepStatus;
  start: number | string;
  /** Absent while running: the span grows to now. */
  end?: number | string;
  /** Shown when the span is selected. */
  attributes?: Record<string, string | number | boolean>;
  children?: TraceSpan[];
}

/** A dated event of a run. */
export interface RunEvent {
  id: string;
  /** ISO 8601. */
  at: string;
  title: string;
  /** Markdown. */
  description?: string;
  status?: StepStatus;
  /** Who did it. */
  actor?: MessageAuthor;
}

/** An agent: who it is and what it can do. */
export interface AgentInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  model?: string;
  capabilities?: string[];
}

/** A recurring run. */
export interface Schedule {
  id: string;
  label: string;
  /** The schedule in words, which the host writes, like "Weekdays at 9:00". */
  description: string;
  enabled: boolean;
  /** ISO 8601. */
  nextRunAt?: string;
  /** The last run: when it started (ISO 8601), how it ended, and where to see it. */
  lastRun?: { at: string; status: StepStatus; href?: string };
}

/** A part of a total, like the tokens the system prompt takes up in a context window. */
export interface UsageSlice {
  id: string;
  label: string;
  value: number;
}

/** How much happened on a day. */
export interface ActivityDay {
  /** `YYYY-MM-DD`. */
  date: string;
  count: number;
}

/** A node of a flow graph: an agent, a tool or a person. */
export interface FlowNode {
  id: string;
  label: string;
  kind?: "agent" | "tool" | "person" | "other";
  status?: StepStatus;
  description?: string;
}

/** An edge of a flow graph, from one node's `id` to another's. */
export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  status?: StepStatus;
}
