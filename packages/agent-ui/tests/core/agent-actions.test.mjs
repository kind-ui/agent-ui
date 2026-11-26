import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

// UI SDK's development build warns when `agent.actions` names a method a primitive's api doesn't have. Create every
// primitive under the `development` condition, which turns that check on, and fail on any such warning.
const script = `
import * as core from "@kind-ui/agent-ui/core";
const warnings = [];
console.warn = (message) => warnings.push(String(message));
for (const [name, primitive] of Object.entries(core)) {
  if (name.endsWith("Primitive")) primitive({ id: name }).destroy();
}
process.stdout.write(JSON.stringify(warnings.filter((message) => message.includes("agent.actions"))));
`;

test("every primitive's agent actions are methods of its api", () => {
  const output = execFileSync(
    process.execPath,
    ["--conditions=development", "--input-type=module", "-e", script],
    {
      cwd: new URL("../..", import.meta.url),
      encoding: "utf8",
    },
  );
  assert.deepEqual(JSON.parse(output), []);
});
