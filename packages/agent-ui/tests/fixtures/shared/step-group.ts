import type { StepGroupItem, StepStatus, ToolCall } from "@kind-ui/agent-ui";
import type { StepGroupKinds, StepGroupOptions } from "@kind-ui/agent-ui/core";

export const kinds: StepGroupKinds = {
  read: { live: "Reading", done: "Read", one: "file", many: "files" },
  edit: { live: "Editing", done: "Edited", one: "file", many: "files" },
  run: { live: "Running", done: "Ran", one: "command", many: "commands" },
  search: { live: "Searching", done: "Searched", one: "search", many: "searches" },
  agent: { live: "Running", done: "Ran", one: "agent", many: "agents" },
};

/** One row: a Tool, or a Subagent for `kind: "agent"`. */
export type StepGroupRow = StepGroupItem & {
  /** The row's title, a Tool's `heading` or a Subagent's name. */
  title: string;
  /** A Tool's name. */
  name?: string;
};

export type StepGroupFrame = {
  id: string;
  rows: StepGroupRow[];
  options?: Pick<StepGroupOptions, "status" | "durationSeconds" | "autoOpen" | "label">;
};

const read = (id: string, path: string, status: StepStatus = "complete"): StepGroupRow => ({
  id,
  status,
  kind: "read",
  target: path.split("/").at(-1) ?? path,
  title: `Read \`${path}\``,
  name: "read_file",
});
const edit = (id: string, path: string): StepGroupRow => ({
  id,
  status: "complete",
  kind: "edit",
  target: path,
  title: `Edited \`${path}\``,
  name: "edit_file",
});
const run = (id: string, command: string, status: StepStatus): StepGroupRow => ({
  id,
  status,
  kind: "run",
  target: command,
  title: `${status === "pending" ? "Run" : status === "running" ? "Running" : "Ran"} \`${command}\``,
  name: "run_command",
});
const agent = (id: string, title: string, status: StepStatus): StepGroupRow => ({
  id,
  status,
  kind: "agent",
  title,
});

const working = [
  read("sign-in", "src/lib/auth/sign-in.ts"),
  read("session", "src/lib/auth/session.ts"),
  edit("edit", "sign-in.ts"),
  run("test", "npm test", "running"),
  run("lint", "npm run lint", "pending"),
];

/** The mockup's frames, in order. */
export const frames: StepGroupFrame[] = [
  // `autoOpen`, not `defaultOpen: false`, which a web element reads as a missing attribute.
  { id: "running-closed", rows: working, options: { autoOpen: "never" } },
  { id: "running-open", rows: working },
  {
    id: "waiting",
    rows: [
      read("package", "package.json"),
      read("build", "scripts/build.ts"),
      { ...run("rm", "rm -rf dist", "awaiting-input"), title: "Clean `dist`" },
    ],
  },
  {
    id: "done",
    rows: [
      read("sign-in", "src/lib/auth/sign-in.ts"),
      read("session", "src/lib/auth/session.ts"),
      run("test", "npm test", "complete"),
    ],
    options: { durationSeconds: 41 },
  },
  {
    id: "done-many",
    rows: [
      ...["a", "b", "c", "d", "e", "f"].map((name) => read(`read-${name}`, `src/${name}.ts`)),
      edit("edit-a", "a.ts"),
      edit("edit-b", "b.ts"),
      run("test", "npm test", "complete"),
      { id: "search", status: "complete", kind: "search", title: "Searched the docs", name: "search_docs" },
      run("lint", "npm run lint", "complete"),
    ],
    options: { durationSeconds: 72 },
  },
  {
    id: "failed",
    rows: [
      read("sign-in", "src/sign-in.ts"),
      read("session", "src/session.ts"),
      run("test", "npm test", "error"),
    ],
    options: { durationSeconds: 41 },
  },
  {
    id: "stopped",
    rows: [
      read("a", "src/a.ts"),
      read("b", "src/b.ts"),
      read("c", "src/c.ts"),
      edit("edit", "sign-in.ts"),
      run("test", "npm test", "cancelled"),
    ],
    options: { durationSeconds: 41 },
  },
  {
    id: "turn-failed",
    rows: [
      read("a", "docs/a.md"),
      read("b", "docs/b.md"),
      { id: "search", status: "complete", kind: "search", title: "Searched the docs", name: "search_docs" },
    ],
    options: { status: "error", durationSeconds: 12, label: "Searched the docs" },
  },
  {
    id: "agents",
    rows: [
      agent("reviewer", "Code reviewer", "complete"),
      agent("writer", "Test writer", "running"),
      agent("docs", "Docs updater", "pending"),
    ],
  },
  {
    id: "agents-done",
    rows: [
      agent("reviewer", "Code reviewer", "complete"),
      agent("writer", "Test writer", "error"),
      agent("docs", "Docs updater", "complete"),
    ],
    options: { durationSeconds: 124 },
  },
  { id: "flat", rows: [read("a", "src/a.ts"), run("test", "npm test", "running")] },
];

/** A Tool's call for a row: running without output, complete with it, failed with an error outcome. */
export const callOf = (row: StepGroupRow): ToolCall => ({
  toolCallId: row.id,
  name: row.name ?? "tool",
  dynamic: false,
  input: { state: "ready", value: row.target ? { target: row.target } : {} },
  ...(row.status === "complete" ? { output: { state: "available", value: "Done" } } : {}),
  ...(row.status === "error" ? { outcome: "error" } : {}),
  ...(row.status === "cancelled" ? { outcome: "cancelled" } : {}),
  ...(row.status === "awaiting-input"
    ? { approval: { approvalId: `${row.id}-approval`, generation: 1, state: "requested" } }
    : {}),
});

/** The live group the specs drive: three agents, whose statuses `set` changes. */
export const live: StepGroupRow[] = [
  agent("reviewer", "Code reviewer", "running"),
  agent("writer", "Test writer", "running"),
  agent("docs", "Docs updater", "pending"),
];

export type StepGroupHandle = {
  /** Sets one live row's status. */
  set(id: string, status: StepStatus): void;
  /** Sets every live row's status at once. */
  setAll(statuses: Record<string, StepStatus>): void;
  /** Each `onOpenChange` of the live group: whether it opened, and why. */
  changes: { open: boolean; reason: string }[];
};

/** A Tool whose title is a function of its status and input, and one with no title at all. */
export const titled = {
  heading: ({ status, input }: { status: StepStatus; input: unknown }) =>
    `${status === "complete" ? "Read" : "Reading"} \`${(input as { path: string }).path}\``,
  running: {
    toolCallId: "titled",
    name: "read_file",
    dynamic: false,
    input: { state: "ready", value: { path: "sign-in.ts" } },
  } satisfies ToolCall,
  bare: {
    toolCallId: "bare",
    name: "search_code",
    dynamic: false,
    input: { state: "ready", value: { query: "session" } },
    output: { state: "available", value: "3 matches" },
  } satisfies ToolCall,
};
