export const task = `Task: in the chat app,
- open the chat "Flaky checkout tests"
- switch the model to GPT-6.1 Sol and set the effort to High
- set the approval mode to Ask every time
- approve the pending run_tests tool call in that chat
- pin the chat "Compare pricing tiers"
Leave everything else as it is, and don't send a message.`;

export const system =
  "You operate a web app for the user through one command, run with the Bash tool. Do what the user's message asks and follow its rules exactly.";

const browserTools = (port) => `Tools (browser tools):
- snapshot: the page's accessibility tree, with a ref like [ref=e10] on each element.
- click <ref>: clicks that element. Returns the new snapshot.
- type <ref> <text>: fills a text field with the text, replacing what's there. Quote text with spaces. Returns the new snapshot.
- press <key>: presses a key on whatever has focus, like Enter, Escape, ArrowDown, Home, End or Tab. Returns the new snapshot.
- done: finish.

Example: node tool.mjs ${port} click e10`;

const pageTools = (port, tools) => `Tools (the page's own tools). Each takes its input as one JSON argument:
${tools.map((tool) => `- ${tool.name}: ${tool.description} Input: ${JSON.stringify(tool.inputSchema)}`).join("\n")}
- done: finish.

Example: node tool.mjs ${port} query '{"text":"Jane"}'`;

export function prompt({ port, tools }) {
  return `${system}

You are an agent operating a web app that is already open in a browser. Your job is a normal user task in that app.

${task}

Rules:
- Your only way to see or act on the app is this command, run with Bash in the current folder: node tool.mjs ${port} <tool> [args...]
- Do not read, search, list or change any files, do not run any other command, and do not look at source code. Only that one command, one tool per Bash call.
- Check that everything really has the right value before you finish.
- When the task is done, or you give up, run the tool \`done\` exactly once.
- Your final message: succeeded or not, the number of tool calls you made, and anything that went wrong or was hard. Keep it under 120 words.

${tools ? pageTools(port, tools) : browserTools(port)}`;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Every change the task asked for, and nothing else. `initial` is the screen's first state. */
export function isCorrect(state, initial) {
  if (!state || !initial) return false;
  const pinned = state.threads
    .filter((thread) => thread.pinned)
    .map((thread) => thread.id)
    .sort();
  const titles = (threads) => threads.map((thread) => `${thread.id}:${thread.title}`);
  return (
    state.current === "tests" &&
    state.model === "gpt-6.1-sol" &&
    state.effort === "high" &&
    state.mode === "ask" &&
    same(state.decisions, { call_run_tests: true }) &&
    same(pinned, ["pricing", "release"]) &&
    same(titles(state.threads), titles(initial.threads)) &&
    same(state.values, initial.values) &&
    same(state.chips, initial.chips) &&
    state.sent.length === 0
  );
}
