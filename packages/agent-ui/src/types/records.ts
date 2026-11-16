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

export interface ModelOption {
  id: string;
  name: string;
  group?: string;
  description?: string;
  disabled?: boolean;
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
