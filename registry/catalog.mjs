// Every registry item (spec §9.2). `scripts/build-registry.mjs` builds them with the shadcn CLI.
// `registryDependencies` use the `@kind-ui` namespace: a bare name means an item of shadcn's own registry.
// `group` and `when` aren't registry fields: `scripts/build-skill.mjs` writes them into the agent-ui skill's catalog.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { manifests } from "./layers/index.mjs";

const pkg = JSON.parse(readFileSync(new URL("../packages/agent-ui/package.json", import.meta.url), "utf8"));
const packageVersion = pkg.version;
const uiSdkVersion = pkg.dependencies["@ui-sdk/core"];

export const components = {
  step: {
    group: "steps",
    when: "you show work of your own that isn't a tool call, as a collapsible step with a status.",
    title: "Step",
    description: "A collapsible agent step with a status icon.",
    uses: [],
  },
  status: {
    group: "indicators",
    when: "you show where a run stands as a mark and a word.",
    title: "Status",
    description: "A run status badge with a mark and a label.",
    uses: [],
  },
  reasoning: {
    group: "steps",
    when: 'the model streams its thinking; it collapses to "Thought for N s" when done.',
    title: "Reasoning",
    description: "The model's thinking as a step, with its thoughts streamed as markdown.",
    uses: ["markdown"],
  },
  tool: {
    group: "steps",
    when: "the model calls a tool: its input, output, error and, when asked, approval.",
    title: "Tool",
    description: "A tool call as a step, from its streamed input to its output or error.",
    uses: ["markdown", "code-block", "confirmation"],
  },
  "chain-of-thought": {
    group: "steps",
    when: "many steps fold under one summary that opens into each step.",
    title: "Chain of Thought",
    description: "A summary of the steps an agent took, which opens into each step's details.",
    uses: [],
  },
  "step-group": {
    group: "steps",
    when: "a turn's tool calls, commands or agents fold under one line that names the work and its status.",
    title: "Step Group",
    description: "One line that names a turn's work, with its status in words, over the host's own steps.",
    uses: [],
  },
  task: {
    group: "steps",
    when: "an agent works through a list of steps and you count how many are done.",
    title: "Task",
    description: "The steps an agent takes for a task, as it takes them, with how many are done.",
    uses: [],
  },
  plan: {
    group: "steps",
    when: "the agent proposes steps a person can Accept, with a progress bar.",
    title: "Plan",
    description: "The steps an agent plans to take, with a progress bar and an Accept button.",
    uses: [],
  },
  subagent: {
    group: "steps",
    when: "a subagent runs its own steps, can be stopped, and returns a result.",
    title: "Subagent",
    description: "A subagent's run: its own steps, a Stop button and its result.",
    uses: ["markdown"],
  },
  queue: {
    group: "steps",
    when: "prompts wait their turn, and a person can reorder or clear them.",
    title: "Queue",
    description: "The agent's to-do list, queued and completed, that people can reorder and clear.",
    uses: [],
  },
  confirmation: {
    group: "steps",
    when: "an action that isn't a tool call needs a person to approve or deny it.",
    title: "Confirmation",
    description: "Approve or deny an agent's request, with an optional reason, then the recorded outcome.",
    uses: ["internal-textarea"],
  },
  question: {
    group: "steps",
    when: "the agent asks a person to choose an option or write an answer before it goes on.",
    title: "Question",
    description:
      "Single choice, multiple choice and free text questions in one form, then the recorded answers.",
    uses: ["internal-radio", "internal-checkbox", "internal-textarea"],
  },
  checkpoint: {
    group: "steps",
    when: "a person can restore the code, the conversation or both to an earlier point, after a dialog says what's lost.",
    title: "Checkpoint",
    description:
      "A marker in the conversation that restores to that point, after a dialog asks what to restore and says what's lost.",
    uses: ["internal-alert-dialog", "internal-radio", "internal-tooltip"],
  },
  "model-selector": {
    group: "composer",
    when: "a person picks the model from a searchable list grouped by provider.",
    title: "Model Selector",
    description:
      "A button that opens a searchable list of models grouped by provider, with their logos and footer actions.",
    uses: ["picker"],
  },
  "reasoning-effort": {
    group: "composer",
    when: "a person picks how hard the model thinks, from a few levels.",
    title: "Reasoning Effort",
    description: "How hard the model thinks, as a row of levels with a mark that slides to the chosen one.",
    uses: ["internal-segmented-control"],
  },
  suggestion: {
    group: "chat",
    when: "you offer prompts a person can send in one press, like starters or follow-ups.",
    title: "Suggestion",
    description:
      "A row of prompts a person can send in one press, which scrolls sideways when they don't fit.",
    uses: ["internal-carousel"],
  },
  "context-meter": {
    group: "composer",
    when: "you show how full the context window is, with token counts and cost.",
    title: "Context Meter",
    description:
      "How full the context window is, as a ring and a percentage, with token counts and cost in a popover.",
    uses: [],
  },
  feedback: {
    group: "chat",
    when: "a person rates a reply with thumbs up or down and can add a comment.",
    title: "Feedback",
    description: "Thumbs up and down for a response, with an optional comment written in a popover.",
    uses: ["internal-textarea"],
  },
  notice: {
    group: "indicators",
    when: "you show a calm info, success, warning or error callout, optionally dismissible.",
    title: "Notice",
    description:
      "A calm callout for info, success, a warning or an error, with optional actions and Dismiss.",
    uses: [],
  },
  "guardrail-notice": {
    group: "indicators",
    when: "a guardrail blocked or filtered content and you say why.",
    title: "Guardrail Notice",
    description:
      "Says a guardrail blocked or filtered content, with the policy reason and an expandable detail.",
    uses: [],
  },
  sources: {
    group: "chat",
    when: "a reply used sources and you show them as a count that opens a list of links.",
    title: "Sources",
    description: "The sources a response used, as a compact count that opens a list of links.",
    uses: [],
  },
  "inline-citation": {
    group: "chat",
    when: "a sentence cites sources and you mark the spot with a card that shows them.",
    title: "Inline Citation",
    description:
      "A marker in running text whose card shows the sources it points to, paging through several.",
    uses: [],
  },
  document: {
    group: "output",
    when: "the agent hands back a document with copy, download and a preview.",
    title: "Document",
    description:
      "A document card with its title, kind and size, copy and download, and a preview that expands.",
    uses: ["markdown", "code-block", "internal-toolbar", "internal-scroll-area"],
  },
  "generated-image": {
    group: "output",
    when: "the agent makes an image, from progress to a full-size view.",
    title: "Generated Image",
    description:
      "An image the agent is making, from progress and a blurred preview to the image, which opens full size.",
    uses: [],
  },
  diff: {
    group: "output",
    when: "a person reviews what an agent changed and keeps or undoes it, by file or by change.",
    title: "Diff",
    description:
      "One file's changes or a run's, with Keep and Undo for each file and change, and Keep all and Undo all.",
    uses: [],
  },
  "file-tree": {
    group: "output",
    when: "you show the files a change touched, with lines added and removed.",
    title: "File Tree",
    description: "Changed files as a folder tree, each with its change and the lines it added and removed.",
    uses: ["internal-tree"],
  },
  terminal: {
    group: "output",
    when: "you show a command's output in ANSI colors as it streams, with its exit code, or ask to run it first.",
    title: "Terminal",
    description:
      "A command and its output in ANSI colors, following the end as it streams, with its approval, exit code and duration.",
    uses: ["confirmation"],
  },
  "stack-trace": {
    group: "output",
    when: "you show an error's frames, with library frames folded and frames that open files.",
    title: "Stack Trace",
    description:
      "An error's name, message and frames, with library frames folded and each frame able to open its file.",
    uses: [],
  },
  "test-results": {
    group: "output",
    when: "you show a test run's counts over a tree of suites and failures.",
    title: "Test Results",
    description:
      "A test run's pass, fail and skip counts over a filterable tree of suites, each failure open to its stack trace.",
    uses: ["stack-trace", "internal-tree"],
  },
  transcript: {
    group: "output",
    when: "you show timed, speaker-labelled speech with search and seeking.",
    title: "Transcript",
    description:
      "Speaker-labelled, timed segments with search, marking the segment and word playing and seeking on a press.",
    uses: [],
  },
  selection: {
    group: "output",
    when: "a person selects text in a reply and picks an action for it.",
    title: "Selection",
    description: "A small toolbar of actions that floats above text a person selects in a reply.",
    uses: ["internal-toolbar"],
  },
  action: {
    group: "output",
    when: "you show an action run on selected text, quoting the text above its result.",
    title: "Action",
    description: "An action run on selected text as a step, quoting the text above its streamed result.",
    uses: ["markdown"],
  },
  picker: {
    group: "composer",
    when: "a person chooses from a long, searchable list that doesn't fit a menu.",
    title: "Picker",
    description:
      "A button that opens a searchable list of choices, with groups, two-line rows, pages and footer actions.",
    uses: ["internal-command"],
  },
  "add-menu": {
    group: "composer",
    when: "a plus button adds files, folders, tools or anything else to the prompt.",
    title: "Add Menu",
    description:
      "A plus button that opens a menu of what can be added, with icons, descriptions, groups and submenus.",
    uses: ["internal-menu"],
  },
  "settings-menu": {
    group: "composer",
    when: "a few on and off toggles and choices sit behind one composer button.",
    title: "Settings Menu",
    description:
      "An icon button that opens a menu of settings: toggles drawn as switches, and choices in submenus showing their value.",
    uses: ["internal-menu"],
  },
  "approval-mode": {
    group: "composer",
    when: "a person chooses how much the agent may do without asking.",
    title: "Approval Mode",
    description:
      "A button showing how much the agent may do without asking, opening a menu of modes with a risky one marked.",
    uses: ["internal-menu"],
  },
  "model-control": {
    group: "composer",
    when: "one composer button sets the model, its effort and other settings together.",
    title: "Model Control",
    description:
      "A button showing the model and its effort, opening a settings menu with Model and Effort submenus.",
    uses: ["settings-menu", "internal-menu"],
  },
  "context-bar": {
    group: "composer",
    when: "you show what's attached to the prompt as removable chips.",
    title: "Context Bar",
    description:
      "A row of removable context chips, the ones that don't fit behind a +N button that lists them.",
    uses: [],
  },
  dictation: {
    group: "composer",
    when: "a person speaks the prompt through a speech source you provide.",
    title: "Dictation",
    description:
      "A mic button that turns speech into text through a source the host chooses, with a live waveform.",
    uses: [],
  },
  conversation: {
    group: "chat",
    when: "you show a scrolling list of messages that follows new content as it streams.",
    title: "Conversation",
    description: "A message log that follows new content and offers a jump to the latest.",
    uses: [],
  },
  message: {
    group: "chat",
    when: "you render one turn, with its role, status, author, time, delivery or retrying, and copy, regenerate, edit or retry.",
    title: "Message",
    description: "A chat message with copy, regenerate, edit and branch controls.",
    uses: ["internal-toolbar", "internal-menu"],
  },
  markdown: {
    group: "chat",
    when: "you render model text, streamed or finished; it repairs half-written blocks as they arrive.",
    title: "Markdown",
    description: "Streaming markdown that parses only the blocks that changed.",
    uses: ["code-block", "markdown-table"],
  },
  "code-block": {
    group: "chat",
    when: "you show code outside Markdown, or need its copy, wrap or a highlight function.",
    title: "Code Block",
    description: "A code block with its language, a wrap toggle and a copy button.",
    uses: ["internal-scroll-area"],
  },
  "markdown-table": {
    group: "chat",
    when: "you show a table outside Markdown that has to scroll sideways and copy.",
    title: "Markdown Table",
    description: "A table that scrolls sideways, with a copy button.",
    uses: ["internal-scroll-area"],
  },
  composer: {
    group: "chat",
    when: "a person writes the prompt: send and stop, mentions, commands, attachments and saved drafts.",
    title: "Composer",
    description: "A prompt input with mentions, commands, attachments, submit and stop.",
    uses: ["attachments", "internal-trigger-menu"],
  },
  attachments: {
    group: "chat",
    when: "you list attached files on their own, outside the Composer, which already shows them.",
    title: "Attachments",
    description: "A removable list of attached files.",
    uses: [],
  },
  uploader: {
    group: "chat",
    when: "files upload with progress, and a person can cancel or retry each one.",
    title: "Uploader",
    description: "File uploads with progress, cancel and retry.",
    uses: [],
  },
  loader: {
    group: "indicators",
    when: "something loads and you need one labeled loading indicator.",
    title: "Loader",
    description: "A labeled loading indicator.",
    uses: [],
  },
  "thinking-indicator": {
    group: "indicators",
    when: "the agent is thinking and nothing has streamed yet.",
    title: "Thinking Indicator",
    description: "Shows that the agent is thinking.",
    uses: [],
  },
  "typing-indicator": {
    group: "indicators",
    when: "the agent is about to reply and you show it typing.",
    title: "Typing Indicator",
    description: "Shows that the agent is typing.",
    uses: [],
  },
  "streaming-text": {
    group: "indicators",
    when: "you stream plain text, not Markdown, and want chunks to fade in.",
    title: "Streaming Text",
    description: "Text whose appended chunks fade in, with an optional caret.",
    uses: [],
  },
  // Wave 6 markers (AGENTS.md "Wave 6 shared-file markers"): each task adds its item right below its own line.

  // wave-6-task-2: Thread List

  "thread-list": {
    group: "shell",
    when: "you list past chats, grouped by date, with rename, pin, share and delete.",
    title: "Thread List",
    description: "Threads grouped by date, with one menu to rename, pin, share and delete.",
    uses: ["internal-menu", "internal-alert-dialog"],
  },

  // wave-6-task-3: Thread Search

  "thread-search": {
    group: "shell",
    when: "a person searches past chats in a dialog, or starts a new one.",
    title: "Thread Search",
    description: "A Search chats dialog over the threads, grouped by date, with New chat and a shortcut.",
    uses: ["picker", "internal-command"],
  },

  // wave-6-task-4: Sidebar

  sidebar: {
    group: "shell",
    when: "the chat list sits in a resizable panel beside the chat that becomes a drawer on phones.",
    title: "Sidebar",
    description:
      "A panel beside the page that a person resizes and collapses, turning into a drawer on a narrow screen.",
    uses: ["internal-resizable", "internal-drawer"],
  },

  // wave-6-task-5: Launcher, dropped by the user

  // wave-6-task-6: Day Separator

  "day-separator": {
    group: "shell",
    when: "messages span days and you put a Today or Yesterday heading between them.",
    title: "Day Separator",
    description: "A heading between days that reads Today or Yesterday.",
    uses: [],
  },

  // wave-6-task-7: Connection Status

  "connection-status": {
    group: "indicators",
    when: "the connection dropped and the chat counts down to a retry.",
    title: "Connection Status",
    description: "A pill over a conversation that says the connection dropped, counts down and retries.",
    uses: [],
  },

  // wave-6-task-8: Share Dialog

  "share-dialog": {
    group: "shell",
    when: "a person chooses who can open a chat and copies its link.",
    title: "Share Dialog",
    description:
      "A Share button whose dialog chooses who can open the chat and shows the link the host makes, with Copy link.",
    uses: ["internal-segmented-control"],
  },

  // wave-6-task-9: Message author, time and outcomes

  // wave-6-task-10: Conversation states

  // wave-6-task-11: Conversation Search

  "conversation-search": {
    group: "shell",
    when: "a person finds text in a long conversation, with marks on the scrollbar.",
    title: "Conversation Search",
    description:
      "A find bar over a conversation's messages that counts matches, moves between them and marks them on the scrollbar.",
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
  "command",
  "file-input",
  "menu",
  "progress",
  "radio",
  "scroll-area",
  "segmented-control",
  "slider",
  "switch",
  "textarea",
  "toggle",
  "token-input",
  "toolbar",
  "tooltip",
  "tree",
  "trigger-menu",

  // wave-6-task-4: Sidebar's internal items

  "drawer",
  "resizable",
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

const internalInfo = (name, suffix) => ({
  title: `Internal ${name.replace(/(^|-)(\w)/g, (_, dash, letter) => (dash && " ") + letter.toUpperCase())}${suffix}`,
  description: "Internal primitive used by Agent UI components; add a component instead.",
  categories: ["internal"],
});

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
      ...internalInfo(name, layer === "web" ? " (Web Components)" : ""),
      files:
        layer === "react"
          ? [source(layer, `internal/${name}`), "packages/agent-ui/src/react/internal/kind-class.ts"]
          : [source(layer, `internal/${name}`)],
      registryDependencies: [],
      dependencies: uiSdk(layer),
    });
  }
}

const frameworks = {
  vue: { title: "Vue", file: (name) => [`${name}.ts`] },
  svelte: { title: "Svelte", folder: true },
  solid: { title: "Solid", file: (name) => [`${name}.tsx`] },
};

/**
 * The items of the layers built from `registry/layers/<layer>.mjs` (framework layers plan D7, D10): one per
 * component and internal its manifest lists. `list(dir)` names the files of a Svelte folder.
 */
export function layerItems(layerManifests, list) {
  const result = [];
  for (const [layer, { components: names, internals: wrappers }] of Object.entries(layerManifests)) {
    const { title: framework, file, folder } = frameworks[layer];
    const dir = `packages/agent-ui/src/${layer}/`;
    const unknown = (kind, name) => new Error(`registry/layers/${layer}.mjs: unknown ${kind} ${name}`);
    const files = (name) =>
      (folder ? list(`${dir}${name}`).map((each) => `${name}/${each}`) : file(name)).map(
        (each) => dir + each,
      );
    for (const name of names) {
      if (!Object.hasOwn(components, name)) throw unknown("component", name);
      const { title, description, uses } = components[name];
      result.push({
        name: `${name}-${layer}`,
        type: "registry:ui",
        layer,
        title: `${title} (${framework})`,
        description,
        files: files(name),
        registryDependencies: [setup.name, ...uses.map((use) => `${use}-${layer}`)].map(
          (use) => `@kind-ui/${use}`,
        ),
        dependencies: [`@kind-ui/agent-ui@${packageVersion}`, ...uiSdk(layer)],
      });
    }
    for (const name of wrappers) {
      if (!internals.includes(name)) throw unknown("internal", name);
      result.push({
        name: `internal-${name}-${layer}`,
        type: "registry:ui",
        layer,
        hidden: true,
        ...internalInfo(name, ` (${framework})`),
        files: [...files(`internal/${name}`), `${dir}internal/kind-class.ts`],
        registryDependencies: [],
        dependencies: uiSdk(layer),
      });
    }
  }
  return result;
}

// A missing folder lists nothing, so `validateCatalog` reports the item as it does a missing Vue or Solid file.
const listFiles = (dir) => {
  const url = new URL(`../${dir}`, import.meta.url);
  if (!existsSync(url)) return [];
  return readdirSync(url, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();
};
items.push(...layerItems(manifests, listFiles));

export default { packageVersion, uiSdkVersion, items };
