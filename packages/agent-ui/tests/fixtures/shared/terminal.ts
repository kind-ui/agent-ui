import type { Approval } from "@kind-ui/agent-ui";
import type { TerminalOptions } from "@kind-ui/agent-ui/core";

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

const ranTests = [
  `${ESC}[1m> agent-ui@0.9.0 test${ESC}[0m\n`,
  `${ESC}[32m✓${ESC}[0m sign-in.test.ts ${ESC}[90m(12 tests)${ESC}[0m\n`,
  `${ESC}[32m✓${ESC}[0m session.test.ts ${ESC}[90m(9 tests)${ESC}[0m`,
].join("");

const failedTests = [
  `${ESC}[32m✓${ESC}[0m sign-in.test.ts ${ESC}[90m(12 tests)${ESC}[0m\n`,
  `${ESC}[31m✗${ESC}[0m session.test.ts ${ESC}[90m(1 failed)${ESC}[0m\n`,
  `${ESC}[1;31mTests: 1 failed${ESC}[0m, 21 passed, 22 total`,
].join("");

const approval = (
  approvalId: string,
  state: Approval["state"],
  decision?: Approval["decision"],
): Approval => ({ approvalId, generation: 1, state, ...(decision && { decision }) });

type Shown = Omit<TerminalOptions, "onApprove" | "onDeny" | "onAlwaysAllow" | "onCopy">;

const test = "npm test -- --run src/lib/auth";
const always = {
  alwaysTarget: "npm test",
  alwaysScope: "in this project",
  alwaysDetail: "Covers commands starting with `npm test`, in this project.",
};

/**
 * The terminals of `?c=terminal&case=approval`, one per state of Wave 7 spec §8. Every layer passes `onApprove` and
 * `onDeny`, and `onAlwaysAllow` too, which a danger command leaves out.
 */
export const approvalTerminals = (): { id: string; options: Shown }[] => [
  { id: "waiting", options: { command: test, approval: approval("waiting", "requested"), ...always } },
  {
    id: "danger",
    options: {
      command: "rm -rf ../shared/cache",
      approval: approval("danger", "requested"),
      ...always,
      risk: "danger",
      riskText: "Deletes files outside the project.",
    },
  },
  {
    id: "running",
    options: {
      command: test,
      approval: approval("running", "responded", { approved: true }),
      output: ranTests,
      durationSeconds: 4,
    },
  },
  {
    id: "always",
    options: {
      command: test,
      approval: approval("always", "responded", { approved: true, always: true }),
      ...always,
      output: ranTests,
      exitCode: 0,
      durationSeconds: 6,
      defaultOpen: true,
    },
  },
  {
    id: "failed",
    options: {
      command: test,
      approval: approval("failed", "responded", { approved: true }),
      output: failedTests,
      exitCode: 1,
      durationSeconds: 6,
      defaultOpen: true,
    },
  },
  {
    id: "denied",
    options: {
      command: "rm -rf ../shared/cache",
      approval: approval("denied", "responded", { approved: false, reason: "not outside the project" }),
    },
  },
  { id: "expired", options: { command: "git push --force", approval: approval("expired", "expired") } },
];
