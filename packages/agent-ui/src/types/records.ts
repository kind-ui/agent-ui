export interface Source {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
  mediaType?: string;
  /** An icon for the source, like its site's favicon. */
  favicon?: string;
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

/** A saved prompt to insert into the composer. */
export interface PromptTemplate {
  id: string;
  title: string;
  body: string;
  description?: string;
  group?: string;
}

/** A way to regenerate a message, like "More concise". One with `items` opens a submenu of them. */
export interface RegenerateOption<Icon = unknown> {
  id: string;
  label: string;
  description?: string;
  icon?: Icon;
  items?: RegenerateOption<Icon>[];
}
