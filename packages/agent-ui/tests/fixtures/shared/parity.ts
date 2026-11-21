export type ParityStep = { press: string } | { key: string; focus?: string } | { hover: string };

// `needs` names the other components a page renders (registry names). A layer whose manifest doesn't list one
// yet skips the page, since a track may port a component before the batch the page also draws from.
export type ParityPage = {
  c: string;
  case: string;
  interaction?: readonly ParityStep[];
  needs?: readonly string[];
};

/** The components a page needs that a layer's manifest doesn't list yet. */
export const missingNeeds = (page: ParityPage, components: readonly string[]) =>
  (page.needs ?? []).filter((name) => !components.includes(name));

const press = (selector: string): readonly ParityStep[] => [{ press: selector }];
const openMenu = press('[aria-haspopup="menu"]');

const checkpoint: ParityPage = {
  c: "checkpoint",
  case: "all",
  interaction: press('[aria-haspopup="dialog"]'),
};
const confirmation: ParityPage = {
  c: "confirmation",
  case: "all",
  interaction: press('[data-slot="kind-confirmation-deny"]'),
};
const fileTree: ParityPage = {
  c: "file-tree",
  case: "all",
  interaction: press('[role="treeitem"][aria-expanded="false"]'),
};
const indicators = { c: "indicators", case: "all" };
const modelSelector: ParityPage = {
  c: "model-selector",
  case: "all",
  interaction: press('[data-slot="kind-model-selector-trigger"]'),
};
const question: ParityPage = {
  c: "question",
  case: "all",
  interaction: press('[role="radio"][aria-checked="false"]'),
};
const sidebar: ParityPage = {
  c: "sidebar",
  case: "all",
  interaction: press('[data-slot="kind-sidebar-trigger"]'),
};
const suggestion: ParityPage = { c: "suggestion", case: "all" };
// An internal wrapper checked on a component's page needs that component.
const on = (page: ParityPage, ...needs: string[]): readonly ParityPage[] => [
  { ...page, needs: [...(page.needs ?? []), ...needs] },
];
const internal = (variant: string, interaction?: readonly ParityStep[]): readonly ParityPage[] => [
  interaction ? { c: "internal", case: variant, interaction } : { c: "internal", case: variant },
];

export const parityPages: Record<string, readonly ParityPage[]> = {
  action: [
    { c: "action", case: "all", interaction: press('[data-slot="kind-action-trigger"]') },
    { c: "action", case: "owned" },
  ],
  "add-menu": [
    { c: "add-menu", case: "all", interaction: openMenu },
    { c: "add-menu", case: "inert" },
  ],
  "approval-mode": [
    { c: "approval-mode", case: "all", interaction: openMenu },
    { c: "approval-mode", case: "learning", interaction: openMenu },
  ],
  attachments: [{ c: "composer", case: "attachments" }],
  "chain-of-thought": [
    {
      c: "chain-of-thought",
      case: "all",
      interaction: press('[data-slot="kind-chain-of-thought-item-trigger"]'),
    },
  ],
  checkpoint: [checkpoint],
  "code-block": [
    { c: "markdown", case: "highlight", interaction: press('[data-slot="kind-code-block-wrap"]') },
    { c: "markdown", case: "code-stream" },
  ],
  composer: [
    { c: "composer", case: "shell" },
    { c: "composer", case: "full" },
    {
      c: "full-composer",
      case: "all",
      interaction: openMenu,
      needs: ["add-menu", "approval-mode", "context-bar", "dictation", "model-control", "settings-menu"],
    },
  ],
  confirmation: [confirmation],
  "connection-status": [
    { c: "connection-status", case: "offline", needs: ["conversation"] },
    { c: "connection-status", case: "online", needs: ["conversation"] },
  ],
  "context-bar": [
    { c: "context-bar", case: "all", interaction: press('[data-slot="kind-context-bar-overflow"]') },
    { c: "context-bar", case: "written" },
  ],
  "context-meter": [
    { c: "context-meter", case: "all", interaction: press('[data-slot="kind-context-meter-trigger"]') },
    { c: "context-meter", case: "high" },
    { c: "context-meter", case: "german" },
  ],
  conversation: [
    { c: "conversation", case: "chat" },
    { c: "conversation", case: "empty" },
    { c: "conversation", case: "welcome" },
    { c: "conversation", case: "loading" },
    { c: "conversation", case: "error" },
  ],
  "conversation-search": [
    {
      c: "conversation-search",
      case: "preset",
      interaction: press('[data-slot="kind-conversation-search-next"]'),
      needs: ["conversation", "markdown"],
    },
    { c: "conversation-search", case: "basic", needs: ["conversation", "markdown"] },
    { c: "conversation-search", case: "markdown", needs: ["conversation", "markdown"] },
  ],
  "day-separator": [{ c: "day-separator", case: "all" }],
  dictation: [
    { c: "dictation", case: "default" },
    { c: "dictation", case: "no-source" },
    { c: "dictation", case: "composer", needs: ["composer"] },
  ],
  document: [
    { c: "document", case: "all", interaction: press('[data-slot="kind-document-expand"]') },
    { c: "document", case: "refused" },
  ],
  feedback: [
    { c: "feedback", case: "all", interaction: press('[aria-pressed="false"]') },
    { c: "feedback", case: "controlled" },
  ],
  "file-tree": [fileTree, { c: "file-tree", case: "static" }],
  "generated-image": [
    { c: "generated-image", case: "all", interaction: press('[data-slot="kind-generated-image-trigger"]') },
  ],
  "guardrail-notice": [
    {
      c: "guardrail-notice",
      case: "all",
      interaction: press('[data-slot="kind-guardrail-notice-detail-trigger"]'),
    },
  ],
  "inline-citation": [
    { c: "inline-citation", case: "all", interaction: press('[data-slot="kind-inline-citation-trigger"]') },
  ],
  "internal-alert-dialog": on(checkpoint, "checkpoint"),
  "internal-avatar": internal("avatar"),
  "internal-button": internal("button"),
  "internal-carousel": on(suggestion, "suggestion"),
  "internal-checkbox": on(question, "question"),
  "internal-collapsible": internal("collapsible", press("[aria-expanded]")),
  "internal-command": internal("command"),
  "internal-drawer": on(sidebar, "sidebar"),
  "internal-file-input": internal("file-input"),
  "internal-menu": [...internal("menu", openMenu), ...internal("menu-data", openMenu)],
  "internal-progress": internal("progress"),
  "internal-radio": on(question, "question"),
  "internal-resizable": on(sidebar, "sidebar"),
  "internal-scroll-area": internal("scroll-area"),
  "internal-segmented-control": on(modelSelector, "model-selector", "reasoning-effort"),
  "internal-slider": internal("slider"),
  "internal-switch": internal("switch", press('[role="switch"]')),
  "internal-textarea": on(confirmation, "confirmation"),
  "internal-toggle": internal("toggle", press("[aria-pressed]")),
  "internal-token-input": internal("token-input"),
  "internal-toolbar": [...internal("toolbar"), ...internal("toolbar-menu", openMenu)],
  "internal-tooltip": on(checkpoint, "checkpoint"),
  "internal-tree": on(fileTree, "file-tree"),
  "internal-trigger-menu": internal("trigger-menu"),
  loader: [indicators],
  markdown: [
    { c: "markdown", case: "answer" },
    { c: "markdown", case: "unsafe" },
    { c: "markdown", case: "stream" },
  ],
  "markdown-table": [{ c: "markdown", case: "table" }],
  message: [
    { c: "message", case: "all", interaction: press('[data-slot="kind-message-branch-next"]') },
    { c: "message", case: "no-callbacks" },
    { c: "message", case: "chat" },
    { c: "message", case: "options", interaction: openMenu },
    { c: "message", case: "author" },
    { c: "message", case: "outcomes" },
    { c: "message", case: "custom-rows" },
  ],
  "model-control": [{ c: "model-control", case: "all", interaction: openMenu }],
  "model-selector": [
    modelSelector,
    { c: "model-selector", case: "groups", interaction: press('[data-slot="kind-model-selector-trigger"]') },
    { c: "model-selector", case: "logos" },
    { c: "model-selector", case: "composer", needs: ["composer"] },
  ],
  notice: [
    { c: "notice", case: "all" },
    { c: "notice", case: "fallback" },
  ],
  picker: [
    { c: "picker", case: "all", interaction: press('[data-slot="kind-picker-trigger"]') },
    { c: "picker", case: "plain" },
  ],
  plan: [{ c: "plan", case: "all", interaction: press('[data-slot="kind-plan-trigger"]') }],
  question: [question],
  queue: [
    {
      c: "queue",
      case: "all",
      interaction: press('[data-slot="kind-queue-section-trigger"][aria-expanded="false"]'),
    },
    { c: "queue", case: "readonly" },
  ],
  reasoning: [{ c: "reasoning", case: "all", interaction: press('[data-slot="kind-reasoning-trigger"]') }],
  "reasoning-effort": [
    { c: "model-selector", case: "all", interaction: press('[role="radio"][aria-checked="false"]') },
  ],
  selection: [
    { c: "selection", case: "all" },
    { c: "selection", case: "static" },
  ],
  "settings-menu": [{ c: "settings-menu", case: "all", interaction: openMenu }],
  "share-dialog": [
    { c: "share-dialog", case: "all", interaction: press('[data-slot="kind-share-dialog-trigger"]') },
    { c: "share-dialog", case: "linked", interaction: press('[data-slot="kind-share-dialog-trigger"]') },
  ],
  sidebar: [sidebar, { c: "sidebar", case: "end", needs: ["composer"] }, { c: "sidebar", case: "saved" }],
  sources: [{ c: "sources", case: "all", interaction: press('[data-slot="kind-sources-trigger"]') }],
  "stack-trace": [
    { c: "stack-trace", case: "all", interaction: press('[data-slot="kind-stack-trace-library"]') },
    { c: "stack-trace", case: "owned" },
  ],
  status: [{ c: "status", case: "all" }],
  step: [{ c: "step", case: "list", interaction: press('[data-slot="kind-step-trigger"]') }],
  "streaming-text": [indicators],
  subagent: [{ c: "subagent", case: "all", interaction: press('[data-slot="kind-subagent-trigger"]') }],
  suggestion: [
    suggestion,
    { c: "suggestion", case: "custom" },
    { c: "suggestion", case: "wrap" },
    { c: "suggestion", case: "form" },
  ],
  task: [{ c: "task", case: "all", interaction: press('[data-slot="kind-task-trigger"]') }],
  terminal: [
    { c: "terminal", case: "all", interaction: press('[data-slot="kind-terminal-trigger"]') },
    { c: "terminal", case: "owned" },
    { c: "terminal", case: "stream-10" },
  ],
  "test-results": [
    { c: "test-results", case: "all", interaction: press('[data-slot="kind-test-results-count"]') },
    { c: "test-results", case: "refused" },
  ],
  "thinking-indicator": [indicators],
  "thread-list": [
    { c: "thread-list", case: "all", interaction: press('[data-slot="kind-thread-list-more"]') },
    { c: "thread-list", case: "ten" },
  ],
  "thread-search": [
    { c: "thread-search", case: "all", interaction: press('[data-slot="kind-thread-search-trigger"]') },
    { c: "thread-search", case: "owned" },
  ],
  tool: [
    { c: "tool", case: "all", interaction: press('[data-slot="kind-tool-trigger"]') },
    { c: "tool", case: "many-10" },
  ],
  transcript: [
    { c: "transcript", case: "all" },
    { c: "transcript", case: "plain" },
  ],
  "typing-indicator": [indicators],
  uploader: [{ c: "uploader", case: "mixed" }],
};
