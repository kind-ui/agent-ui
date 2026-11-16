// Every registry item (spec §9.2). `scripts/build-registry.mjs` builds them with the shadcn CLI.
// `registryDependencies` use the `@kind-ui` namespace: a bare name means an item of shadcn's own registry.
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../packages/agent-ui/package.json", import.meta.url), "utf8"));
const packageVersion = pkg.version;
const uiSdkVersion = pkg.dependencies["@ui-sdk/core"];

const components = {
  step: { title: "Step", description: "A collapsible agent step with a status icon.", uses: [] },
  status: { title: "Status", description: "A run status badge with a mark and a label.", uses: [] },
  reasoning: {
    title: "Reasoning",
    description: "The model's thinking as a step, with its thoughts streamed as markdown.",
    uses: ["markdown"],
  },
  tool: {
    title: "Tool",
    description: "A tool call as a step, from its streamed input to its output or error.",
    uses: ["markdown", "code-block", "confirmation"],
  },
  "chain-of-thought": {
    title: "Chain of Thought",
    description: "A summary of the steps an agent took, which opens into each step's details.",
    uses: [],
  },
  task: {
    title: "Task",
    description: "The steps an agent takes for a task, as it takes them, with how many are done.",
    uses: [],
  },
  plan: {
    title: "Plan",
    description: "The steps an agent plans to take, with a progress bar and an Accept button.",
    uses: [],
  },
  subagent: {
    title: "Subagent",
    description: "A subagent's run: its own steps, a Stop button and its result.",
    uses: ["markdown"],
  },
  queue: {
    title: "Queue",
    description: "The agent's to-do list, queued and completed, that people can reorder and clear.",
    uses: [],
  },
  confirmation: {
    title: "Confirmation",
    description: "Approve or deny an agent's request, with an optional reason, then the recorded outcome.",
    uses: ["internal-textarea"],
  },
  question: {
    title: "Question",
    description:
      "Single choice, multiple choice and free text questions in one form, then the recorded answers.",
    uses: ["internal-radio", "internal-checkbox", "internal-textarea"],
  },
  checkpoint: {
    title: "Checkpoint",
    description: "A marker in the conversation that restores to that point, after a dialog asks first.",
    uses: ["internal-alert-dialog", "internal-tooltip"],
  },
  "model-selector": {
    title: "Model Selector",
    description: "A searchable list of models grouped by provider, with the matching letters marked.",
    uses: ["internal-combobox"],
  },
  "reasoning-effort": {
    title: "Reasoning Effort",
    description: "How hard the model thinks, as a row of levels with a mark that slides to the chosen one.",
    uses: ["internal-segmented-control"],
  },
  suggestion: {
    title: "Suggestion",
    description:
      "A row of prompts a person can send in one press, which scrolls sideways when they don't fit.",
    uses: ["internal-carousel"],
  },
  "context-meter": {
    title: "Context Meter",
    description:
      "How full the context window is, as a ring and a percentage, with token counts and cost in a popover.",
    uses: [],
  },
  feedback: {
    title: "Feedback",
    description: "Thumbs up and down for a response, with an optional comment written in a popover.",
    uses: ["internal-textarea"],
  },
  conversation: {
    title: "Conversation",
    description: "A message log that follows new content and offers a jump to the latest.",
    uses: [],
  },
  message: {
    title: "Message",
    description: "A chat message with copy, regenerate, edit and branch controls.",
    uses: ["internal-toolbar"],
  },
  markdown: {
    title: "Markdown",
    description: "Streaming markdown that parses only the blocks that changed.",
    uses: ["code-block", "markdown-table"],
  },
  "code-block": {
    title: "Code Block",
    description: "A code block with its language, a wrap toggle and a copy button.",
    uses: ["internal-scroll-area"],
  },
  "markdown-table": {
    title: "Markdown Table",
    description: "A table that scrolls sideways, with a copy button.",
    uses: ["internal-scroll-area"],
  },
  composer: {
    title: "Composer",
    description: "A prompt input with mentions, commands, attachments, submit and stop.",
    uses: ["attachments", "internal-trigger-menu"],
  },
  attachments: { title: "Attachments", description: "A removable list of attached files.", uses: [] },
  uploader: { title: "Uploader", description: "File uploads with progress, cancel and retry.", uses: [] },
  loader: { title: "Loader", description: "A labeled loading indicator.", uses: [] },
  "thinking-indicator": {
    title: "Thinking Indicator",
    description: "Shows that the agent is thinking.",
    uses: [],
  },
  "typing-indicator": { title: "Typing Indicator", description: "Shows that the agent is typing.", uses: [] },
  "streaming-text": {
    title: "Streaming Text",
    description: "Text whose appended chunks fade in, with an optional caret.",
    uses: [],
  },
};

const internals = [
  "alert-dialog",
  "avatar",
  "button",
  "carousel",
  "checkbox",
  "collapsible",
  "combobox",
  "file-input",
  "menu",
  "progress",
  "radio",
  "scroll-area",
  "segmented-control",
  "textarea",
  "toggle",
  "token-input",
  "toolbar",
  "tooltip",
  "trigger-menu",
];

const layers = { react: { suffix: "", extension: ".tsx" }, web: { suffix: "-web", extension: ".ts" } };
const source = (layer, file) => `packages/agent-ui/src/${layer}/${file}${layers[layer].extension}`;
const uiSdk = (layer) => [`@ui-sdk/core@${uiSdkVersion}`, `@ui-sdk/${layer}@${uiSdkVersion}`];

const setup = {
  name: "agent-ui-setup",
  type: "registry:lib",
  title: "Agent UI setup",
  description: "Installs @kind-ui/agent-ui, imports its styles and points coding agents at its docs.",
  files: ["registry/agent-ui-setup/AGENTS.md"],
  registryDependencies: [],
  dependencies: [`@kind-ui/agent-ui@${packageVersion}`, `@ui-sdk/core@${uiSdkVersion}`],
  css: { '@import "@kind-ui/agent-ui/styles.css"': {} },
  docs: `Your stylesheet now imports @kind-ui/agent-ui/styles.css. Tailwind finds the copied components itself; if they live outside the app that builds them, add @source "<path to them>"; to that stylesheet.
Coding agents: read the AGENTS.md beside the components before changing them.`,
};

const items = [setup];
for (const [layer, { suffix }] of Object.entries(layers)) {
  for (const [name, { title, description, uses }] of Object.entries(components)) {
    items.push({
      name: name + suffix,
      type: "registry:ui",
      layer,
      title: layer === "web" ? `${title} (Web Components)` : title,
      description,
      files: [source(layer, name)],
      registryDependencies: [setup.name, ...uses.map((use) => use + suffix)].map((use) => `@kind-ui/${use}`),
      dependencies: [`@kind-ui/agent-ui@${packageVersion}`, ...uiSdk(layer)],
    });
  }
  for (const name of internals) {
    items.push({
      name: `internal-${name}${suffix}`,
      type: "registry:ui",
      layer,
      hidden: true,
      files:
        layer === "react"
          ? [source(layer, `internal/${name}`), "packages/agent-ui/src/react/internal/kind-class.ts"]
          : [source(layer, `internal/${name}`)],
      registryDependencies: [],
      dependencies: uiSdk(layer),
    });
  }
}

export default { packageVersion, uiSdkVersion, items };
