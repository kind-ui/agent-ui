import type { StackFrame } from "@kind-ui/agent-ui";

const frame = (fn: string, file: string, line: number, column: number): StackFrame => ({
  raw: `    at ${fn} (${file}:${line}:${column})`,
  fn,
  file,
  line,
  column,
});

export const typeErrorFrames: StackFrame[] = [
  frame("readConfig", "/app/src/config/read.ts", 12, 9),
  frame("loadPlugins", "/app/node_modules/plugin-host/dist/index.js", 88, 14),
  frame("PluginHost.start", "/app/node_modules/plugin-host/dist/host.js", 31, 5),
  frame("startServer", "/app/src/server.ts", 41, 3),
  frame("main", "/app/src/index.ts", 7, 1),
  frame("Module._compile", "node:internal/modules/cjs/loader", 1256, 14),
  frame("process.processTicksAndRejections", "node:internal/process/task_queues", 95, 5),
];

export const typeErrorStack = ["TypeError: x is undefined", ...typeErrorFrames.map((f) => f.raw)].join("\n");

export const assertionStack = [
  "AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:",
  "",
  "3 !== 4",
  "",
  "    at Context.<anonymous> (/app/test/sum.test.ts:8:12)",
  "    at async Promise.all (index 0)",
].join("\n");
