import type { ToolCall } from "@kind-ui/agent-ui";

const ESC = "\x1b";

export const testRun = [
  `${ESC}[1m> agent-ui@0.4.0 test${ESC}[0m\n`,
  `${ESC}[2K${ESC}[90mRunning 3 suites${ESC}[0m\n`,
  `${ESC}[32m✓${ESC}[0m step.test.ts ${ESC}[90m(12 tests)${ESC}[0m\n`,
  `${ESC}[32m✓${ESC}[0m ansi.test.ts ${ESC}[90m(9 tests)${ESC}[0m\n`,
  `${ESC}[31m✗${ESC}[0m tree.test.ts ${ESC}[90m(1 failed)${ESC}[0m\n`,
  `  ${ESC}[31mExpected${ESC}[0m ${ESC}[1;33m"src"${ESC}[0m, received ${ESC}[1;36m"lib"${ESC}[0m\n`,
  `building 10%\rbuilding 60%\rbuilding ${ESC}[34m100%${ESC}[0m\n`,
  `${ESC}[1;31mTests: 1 failed${ESC}[0m, ${ESC}[1;32m21 passed${ESC}[0m, 22 total`,
].join("");

export const installRun = `added 214 packages in 3s\n\n${ESC}[32m48${ESC}[0m packages are looking for funding\n  run \`npm fund\` for details`;

export const manyLines = (count: number) =>
  Array.from(
    { length: count },
    (_, i) => `${ESC}[90m${String(i + 1).padStart(4)}${ESC}[0m line of output`,
  ).join("\n");

/** The commands of `?c=terminal&case=approval`, each waiting on its approval. */
export const approvalRuns = {
  run: { command: "npm test", reason: true, always: true },
  plain: { command: "rm -rf build", reason: false, always: false },
} as const;

/** The tool call beside them, with Always allow. */
export const approvalCall: ToolCall = {
  toolCallId: "search",
  name: "search_docs",
  dynamic: false,
  input: { state: "ready", value: { query: "steps" } },
  approval: { approvalId: "t1", generation: 1, state: "requested" },
};
