import assert from "node:assert/strict";
import { test } from "node:test";
import * as core from "@kind-ui/agent-ui/core";
import { checkServer } from "@ui-sdk/core/testing";

// UI SDK's `checkServer` over every component primitive: creating it and rendering each part reads no browser
// global, clock, randomness or option, so server markup and hydration agree. `checkPattern` and `checkDirection`
// need a DOM, so they run in `tests/browser/wave-5/aria-patterns.spec.ts`.

const noop = () => {};
const step = { status: "running", label: "Search the docs" };
const source = { id: "s1", title: "Docs", url: "https://example.com/docs", snippet: "A page" };
const call = {
  toolCallId: "t1",
  name: "search",
  dynamic: false,
  input: { state: "ready", value: { q: "x" } },
  approval: { approvalId: "a1", generation: 0, state: "requested" },
};
const models = [
  { id: "m1", name: "Model One", group: "A", efforts: ["low", "high"] },
  { id: "m2", name: "Model Two", group: "B" },
];
const levels = [
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
];
const settings = [
  { type: "toggle", id: "web", label: "Web search" },
  { type: "choice", id: "tone", label: "Tone", options: levels },
];
const words = [
  { text: "Hello", start: 0, end: 0.5 },
  { text: "there", start: 0.5, end: 1 },
];

// `keys` lists the parts of each slot that several parts share, by the prop that keys them.
const cases = {
  action: { options: { ...step, quote: "Some text", result: "Done" } },
  addMenu: { options: { label: "Add", items: [{ id: "file", label: "File" }], onAction: noop } },
  approvalMode: {
    options: {
      label: "Approvals",
      modes: [
        { value: "ask", label: "Ask" },
        { value: "auto", label: "Auto", danger: true },
      ],
      value: "ask",
      learnMoreHref: "https://example.com",
    },
  },
  attachments: {
    options: { items: [{ id: "a", name: "notes.txt", size: 12 }], onRemove: noop },
    keys: { item: ["a"] },
  },
  chainOfThought: {
    options: { ...step, steps: [{ id: "a", title: "Read", status: "complete" }], defaultOpenSteps: ["a"] },
    keys: { item: ["a"] },
  },
  checkpoint: { options: { label: "Checkpoint", onRestore: noop } },
  codeBlock: { options: { code: "let a = 1", language: "js" } },
  composer: { options: { value: { text: "Hi", tokens: [], attachments: [] }, onSubmit: noop } },
  confirmation: {
    options: { approval: call.approval, label: "Run search?", onApprove: noop, onDeny: noop, reason: true },
  },
  contextBar: {
    options: {
      label: "Context",
      chips: [
        { id: "a", label: "notes.txt" },
        { id: "b", label: "plan.md" },
      ],
      onRemove: noop,
    },
    keys: { chip: ["a", "b"], item: ["b"] },
  },
  contextMeter: {
    options: { used: 57600, total: 128000, usage: { input: 50000, output: 7600 }, locale: "en" },
  },
  conversation: { options: { messageCount: 2, marks: [1] }, keys: { row: ["0", "1"], mark: ["1"] } },
  dictationButton: { options: { source: async function* () {}, bars: 2 }, keys: { bar: ["0", "1"] } },
  document: {
    options: {
      label: "notes.md",
      content: "# Notes",
      format: "markdown",
      downloads: [{ id: "md", label: "Markdown" }],
      onDownload: noop,
    },
    keys: { download: ["md"] },
  },
  feedback: { options: { rating: "up", onRate: noop, onComment: noop } },
  fileTree: {
    options: {
      entries: [{ path: "src/a.ts", change: "modified", additions: 2, deletions: 1 }],
      expanded: ["src"],
    },
    keys: { item: ["src", "src/a.ts"] },
  },
  generatedImage: {
    options: { alt: "A lighthouse", src: "/a.png", status: "complete", width: 4, height: 3 },
  },
  guardrailNotice: {
    options: { variant: "warning", label: "Blocked", reason: "Policy", detail: "Why", blocking: true },
  },
  inlineCitation: { options: { sources: [source] }, keys: { item: ["s1"] } },
  loader: { options: { label: "Loading" } },
  markdownTable: { options: {} },
  markdownView: { options: { source: "# Title\n\nSome **text**.\n\n| a | b |\n| - | - |\n| 1 | 2 |\n" } },
  message: {
    options: {
      messageRole: "assistant",
      status: "complete",
      text: "Hi",
      branchIndex: 0,
      branchCount: 2,
      onRegenerate: noop,
    },
  },
  modelControl: { options: { label: "Model", models, model: "m1", levels, settings } },
  modelSelector: { options: { models, value: "m1", onValueChange: noop }, keys: { item: ["i:m1"] } },
  notice: { options: { variant: "info", label: "Heads up", onDismiss: noop } },
  picker: {
    options: { items: [{ value: "a", label: "A" }], actions: [{ id: "more", label: "More" }], value: "a" },
    keys: { item: ["i:a"] },
  },
  plan: {
    options: { ...step, items: [{ id: "a", title: "Draft", status: "running" }], onAccept: noop },
    keys: { item: ["a"] },
  },
  question: {
    options: {
      questions: [
        { id: "a", prompt: "Pick one", kind: "single", options: levels },
        { id: "b", prompt: "Why?", kind: "text" },
      ],
      onSubmit: noop,
      onSkip: noop,
    },
    keys: { item: ["a", "b"] },
  },
  queue: {
    options: {
      items: [
        { id: "a", title: "Next", status: "pending" },
        { id: "b", title: "Done", status: "complete" },
      ],
      onRemove: noop,
      onReorder: noop,
    },
    keys: { section: ["pending", "complete"], item: ["a", "b"] },
  },
  reasoningEffort: { options: { levels, value: "low" } },
  reasoning: { options: { ...step, text: "Thinking **hard**" } },
  selection: { options: { label: "Text", actions: [{ id: "ask", label: "Ask" }] }, keys: { item: ["ask"] } },
  settingsMenu: { options: { label: "Settings", settings, values: { web: true, tone: "low" } } },
  sources: { options: { sources: [source], defaultOpen: true }, keys: { item: ["s1"] } },
  stackTrace: {
    options: {
      stack: "TypeError: x is undefined\n    at run (src/a.ts:1:2)\n    at node_modules/lib/b.js:3:4",
      onOpenFrame: noop,
    },
    keys: { frame: ["0", "1"], group: ["1"] },
  },
  status: { options: { status: "running", label: "Working" } },
  stepList: { options: {}, keys: { item: ["a"] } },
  step: { options: step },
  streamingText: { options: { text: "Hello", caret: true }, keys: { chunk: ["0"] } },
  subagent: { options: { ...step, agentName: "Researcher", result: "Found it", onCancel: noop } },
  suggestion: {
    options: { suggestions: [{ id: "a", label: "Summarize" }], onPick: noop },
    keys: { item: ["a"] },
  },
  task: {
    options: { ...step, items: [{ id: "a", title: "Edit", status: "running", files: ["a.ts"] }] },
    keys: { item: ["a"] },
  },
  terminal: {
    options: { ...step, command: "npm test", output: "\u001b[32mok\u001b[0m\nnext" },
    keys: { line: ["0", "1"] },
  },
  testResults: {
    options: {
      suites: [
        {
          id: "s",
          name: "auth",
          tests: [
            { id: "t", name: "rejects", status: "fail", durationMs: 18, error: { message: "expected 401" } },
          ],
        },
      ],
    },
    keys: { item: ["s", "s/t"], failure: ["s/t"], count: ["pass", "fail", "skip"] },
  },
  thinkingIndicator: { options: { label: "Thinking" } },
  tool: { options: { call, onApprove: noop, onDeny: noop } },
  transcript: {
    options: {
      segments: [{ id: "a", speaker: "Ana", start: 0, end: 1, text: "Hello there", words }],
      onSeek: noop,
    },
    keys: { segment: ["a"], word: ["a/0", "a/1"] },
  },
  typingIndicator: { options: { label: "Typing" } },
  uploader: {
    options: {
      items: [{ id: "a", name: "a.png", size: 10, progress: 40, status: "uploading" }],
      onFiles: noop,
      onCancel: noop,
    },
    keys: { item: ["a"] },
  },

  // Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its case right below its own line.

  // wave-6-task-2: Thread List

  threadList: {
    options: {
      threads: [{ id: "a", title: "A", href: "#a", pinned: true, status: "running", unread: true }],
      now: "2026-11-18",
      onSelect: noop,
      onRename: noop,
      onDelete: noop,
    },
    keys: {
      heading: ["heading:pinned"],
      "heading-cell": ["heading:pinned"],
      ...Object.fromEntries(
        ["row", "link-cell", "link", "status", "unread", "time", "editor", "more-cell", "more"].map(
          (slot) => [slot, ["a"]],
        ),
      ),
    },
  },

  // wave-6-task-3: Thread Search

  threadSearch: {
    options: {
      threads: [{ id: "t1", title: "Plan the launch", updatedAt: "2026-11-18T09:00:00Z", status: "running" }],
      now: "2026-11-18",
      shortcut: "mod+k",
      onSelect: noop,
      onNew: noop,
    },
    keys: { item: ["i:t1", "a:new"], status: ["i:t1"] },
  },

  // wave-6-task-4: Sidebar

  sidebar: { options: { label: "Chats" } },

  // wave-6-task-5: Launcher, dropped by the user

  // wave-6-task-6: Day Separator

  daySeparator: { options: { date: "2026-11-18T09:30:00Z" } },

  // wave-6-task-7: Connection Status

  connectionStatus: { options: { state: "offline", onRetry: noop } },

  // wave-6-task-8: Share Dialog

  shareDialog: { options: { link: "https://example.com/s/abc", defaultVisibility: "link", onRevoke: noop } },

  // wave-6-task-9: Message author, time and outcomes

  // wave-6-task-10: Conversation states

  // wave-6-task-11: Conversation Search

  conversationSearch: {
    options: { messages: [{ id: "m1", text: "Hello **there**" }], defaultQuery: "there", defaultOpen: true },
  },

  // Wave 7 markers (AGENTS.md "Wave 7 shared-file markers"): each task adds its case right below its own line.

  // wave-7-task-2: Composer steering and Queue's Send now

  // wave-7-task-3: Message delivery mark and retrying

  // wave-7-task-4: Terminal approval and Confirmation's Always allow

  // wave-7-task-5: Tool retry and retrying

  // wave-7-task-6: Diff

  // wave-7-task-7: Step Group

  // wave-7-task-8: Handoff

  // wave-7-task-10: Trace

  trace: {
    options: {
      spans: [
        {
          id: "run",
          name: "Run",
          kind: "agent",
          start: 0,
          end: 900,
          children: [{ id: "call", name: "search", kind: "tool", start: 120, end: 460 }],
        },
      ],
      defaultExpanded: ["run"],
      defaultValue: "call",
    },
    keys: { name: ["run", "call"], status: ["run", "call"], duration: ["run", "call"], bar: ["run", "call"] },
  },

  // wave-7-task-11: Run Timeline

  runTimeline: {
    options: {
      events: [
        { id: "e1", at: "2026-11-10T14:20:00Z", title: "Started", actor: { id: "ada", name: "Ada" } },
        {
          id: "e2",
          at: "2026-11-10T14:32:00Z",
          title: "Running checks",
          status: "running",
          description: "312 tests",
        },
      ],
      hasMore: true,
      onLoadMore: noop,
    },
    keys: { item: ["e1", "e2"] },
  },

  // wave-7-task-12: Job Progress

  jobProgress: {
    options: { ...step, value: 0.4, stage: "Installing", stageIndex: 2, stageCount: 7, onCancel: noop },
  },

  // wave-7-task-13: Schedule Card

  // wave-7-task-14: Agent Card

  // wave-7-task-15: Usage Meter and Context Meter's breakdown

  // wave-7-task-16: Quota Notice

  // wave-7-task-17: Activity Graph

  // wave-7-task-18: Thread List inbox

  // wave-7-task-19: Flow Graph
};

const fromOf = (props) =>
  Object.values(props)
    .find((spec) => typeof spec === "object" && spec?.from)
    ?.from.split(".")[0];
const keyOf = (props) =>
  ["value", "index"].find((name) => name in props && !(typeof props[name] === "object" && props[name]?.from));

// Markup holding every slot: a slot that takes a prop from another sits inside it, and a keyed slot appears once
// per key in `keys`, or not at all without them.
function markupOf(primitive, keys = {}) {
  const slots = Object.entries(primitive.slots ?? {}).map(([name, definition]) => ({
    name,
    props: definition.props ?? {},
  }));
  const childrenOf = (parent) =>
    slots.filter(({ name, props }) => name !== "root" && (fromOf(props) ?? "root") === parent);
  const render = (slot) => {
    const key = keyOf(slot.props);
    const inner = childrenOf(slot.name).map(render).join("");
    if (!key) return `<${slot.name}>${inner}</${slot.name}>`;
    return (keys[slot.name] ?? [])
      .map((value) => `<${slot.name} ${key}="${value}">${inner}</${slot.name}>`)
      .join("");
  };
  return `<root>${childrenOf("root").map(render).join("")}</root>`;
}

const primitives = Object.keys(core).filter((name) => name.endsWith("Primitive"));

test("every component primitive has a server case", () => {
  assert.deepEqual(
    primitives.map((name) => name.slice(0, -"Primitive".length)).sort(),
    Object.keys(cases).sort(),
  );
});

test("every keyed slot has keys, so the server markup holds it", () => {
  const missing = primitives.flatMap((name) => {
    const { keys = {} } = cases[name.slice(0, -"Primitive".length)] ?? {};
    return Object.entries(core[name].slots ?? {})
      .filter(([slot, definition]) => keyOf(definition.props ?? {}) && !keys[slot]?.length)
      .map(([slot]) => `${name}.${slot}`);
  });
  assert.deepEqual(missing, []);
});

for (const name of primitives) {
  const { options, keys } = cases[name.slice(0, -"Primitive".length)] ?? {};
  test(`${name} renders on a server`, () => {
    const html = checkServer(core[name], options, markupOf(core[name], keys));
    assert.match(html, /^<\w+/);
  });
}
