// node benchmarks/agent/harness/bench.mjs --runs 3
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { openScreen } from "./browser.mjs";
import { copilot } from "./copilot.mjs";
import { isCorrect, prompt } from "./task.mjs";
import { prepare, serve, versions } from "./versions.mjs";

const rows = [
  { id: "before-browser", version: "before", tools: "browser" },
  { id: "before-agent", version: "before", tools: "agent" },
  { id: "before-webmcp", version: "before", tools: "webmcp" },
  { id: "after-browser", version: "after", tools: "browser" },
  { id: "after-agent", version: "after", tools: "agent" },
  { id: "after-webmcp", version: "after", tools: "webmcp" },
];

const { values: flags } = parseArgs({
  options: {
    rows: { type: "string", default: rows.map((row) => row.id).join(",") },
    model: { type: "string", default: "claude-sonnet-5.5" },
    runs: { type: "string", default: "1" },
    port: { type: "string", default: process.env.KIND_FIXTURE_PORT_BASE ?? "5800" },
    out: { type: "string" },
  },
});
const arms = flags.rows.split(",").map((id) => {
  const row = rows.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`Rows: ${rows.map((candidate) => candidate.id).join(", ")}.`);
  return row;
});
const base = Number(flags.port);
const out = flags.out ?? mkdtempSync(path.join(tmpdir(), "agent-benchmark-"));
const token = randomUUID();
const tool = path.join(import.meta.dirname, "tool.mjs");

const apps = {};
const names = [...new Set(arms.map((arm) => arm.version))];
for (const [index, name] of names.entries()) {
  console.log(`Preparing ${name} (${versions[name].ref})…`);
  apps[name] = await serve(prepare(name), base + index);
}
const stop = () => {
  for (const app of Object.values(apps)) app.stop();
};
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stop();
    process.exit(1);
  });
}

// Each agent gets the task, one command it may run, and an empty folder holding only that command.
async function operate(arm, round) {
  const port = base + 10 + arms.indexOf(arm);
  const dir = path.join(out, `${round}`, arm.id);
  const screen = await openScreen({ app: apps[arm.version].url, tools: arm.tools, port, token, dir });
  const cwd = mkdtempSync(path.join(tmpdir(), "agent-benchmark-cwd-"));
  copyFileSync(tool, path.join(cwd, "tool.mjs"));
  const started = Date.now();
  const result = await copilot({
    prompt: prompt({ port, tools: screen.tools }),
    model: flags.model,
    cwd,
    token,
  });
  const measured = {
    id: arm.id,
    version: arm.version,
    tools: arm.tools,
    calls: screen.stats.calls,
    chars: screen.stats.chars,
    seconds: (Date.now() - started) / 1000,
    tokens: result.tokens ?? 0,
    cost: result.cost ?? 0,
    correct: screen.stats.done && isCorrect(screen.stats.state, screen.initial),
    failed: Boolean(result.failed || result.missing),
    message: result.message ?? "",
    state: screen.stats.state,
  };
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "result.json"), JSON.stringify(measured, null, 2));
  await screen.close();
  return measured;
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function table(lines) {
  const columns = [
    ["Version", (row) => row.version],
    ["Tools", (row) => row.tools],
    ["Tool calls", (row) => row.calls],
    ["Text read", (row) => `${(row.chars / 1000).toFixed(1)}k`],
    ["Time", (row) => `${row.seconds.toFixed(0)} s`],
    ["Tokens", (row) => `${(row.tokens / 1000).toFixed(1)}k`],
    ["Cost", (row) => `$${row.cost.toFixed(3)}`],
    ["Correct", (row) => (typeof row.correct === "string" ? row.correct : row.correct ? "yes" : "no")],
  ];
  const cells = [
    columns.map(([title]) => title),
    ...lines.map((row) => columns.map(([, show]) => String(show(row)))),
  ];
  const widths = columns.map((_, index) => Math.max(...cells.map((line) => line[index].length)));
  return cells.map((line) => line.map((cell, index) => cell.padEnd(widths[index])).join("  ")).join("\n");
}

const rounds = [];
for (let round = 1; round <= Number(flags.runs); round++) {
  const results = await Promise.all(arms.map((arm) => operate(arm, round)));
  rounds.push(results);
  console.log(`\nRun ${round}, ${flags.model}\n`);
  console.log(table(results));
}

const medians = arms.map((arm, index) => {
  const runs = rounds.map((results) => results[index]);
  const of = (key) => median(runs.map((row) => row[key]));
  return {
    id: arm.id,
    version: arm.version,
    tools: arm.tools,
    calls: of("calls"),
    chars: of("chars"),
    seconds: of("seconds"),
    tokens: of("tokens"),
    cost: of("cost"),
    correct: `${runs.filter((row) => row.correct).length}/${runs.length}`,
  };
});
const spend = rounds.flat().reduce((sum, row) => sum + row.cost, 0);
if (rounds.length > 1) {
  console.log(`\nMedian of ${rounds.length} runs\n`);
  console.log(table(medians));
}
console.log(`\nTotal cost: $${spend.toFixed(3)}`);
writeFileSync(
  path.join(out, "results.json"),
  JSON.stringify(
    { date: new Date().toISOString(), model: flags.model, versions, rounds, medians, spend },
    null,
    2,
  ),
);
console.log(`Results and every tool call: ${out}`);
stop();
process.exit(0);
