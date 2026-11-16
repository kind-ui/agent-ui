export interface Source {
  id: string;
  title: string;
  url?: string;
  snippet?: string;
  mediaType?: string;
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

/** Token counts for a context window, each optional. */
export interface TokenUsage {
  input?: number;
  output?: number;
  reasoning?: number;
  cached?: number;
}
