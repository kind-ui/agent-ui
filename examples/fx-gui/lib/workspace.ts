import type { FileTreeEntry } from "@kind-ui/agent-ui";
import { diffLines } from "diff";
import { Bash } from "just-bash/browser";

export const SEED: Record<string, string> = {
  "/workspace/package.json": `{
  "name": "greeter",
  "version": "0.1.0",
  "type": "module",
  "scripts": { "test": "node test.js" }
}
`,
  "/workspace/README.md": "# greeter\n\nA tiny module that greets people.\n",
  "/workspace/src/greet.js": `export function greet(name) {
  return "Hello, " + name;
}
`,
  "/workspace/test.js": `import { greet } from "./src/greet.js";

console.log(greet("fx"));
`,
};

export const ROOT = "/workspace";

export type ToolDecision = { approved: boolean; reason?: string };
export type AskApproval = (id: string, name: string, input: unknown) => Promise<ToolDecision>;

type Change = FileTreeEntry["change"];

/** An in-browser workspace: just-bash over an in-memory file system, with what the agent changed. */
export function createWorkspace() {
  const bash = new Bash({ files: SEED, cwd: ROOT });
  const original = new Map(Object.entries(SEED));
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };

  const rel = (path: string) => path.replace(`${ROOT}/`, "");
  const abs = (path: string) => (path.startsWith("/") ? path : `${ROOT}/${path.replace(/^\.\//, "")}`);

  async function files() {
    const paths = (bash.fs as unknown as { getAllPaths(): string[] }).getAllPaths();
    const result: string[] = [];
    for (const path of paths) {
      if (!path.startsWith(`${ROOT}/`)) continue;
      const stat = await bash.fs.stat(path).catch(() => null);
      if (stat?.isFile) result.push(path);
    }
    return result.sort();
  }

  function lineDiff(before: string | undefined, after: string) {
    let additions = 0;
    let deletions = 0;
    for (const change of diffLines(before ?? "", after)) {
      if (change.added) additions += change.count ?? 0;
      if (change.removed) deletions += change.count ?? 0;
    }
    return { additions, deletions };
  }

  async function entries(): Promise<FileTreeEntry[]> {
    const list: FileTreeEntry[] = [];
    for (const path of await files()) {
      const text = await bash.fs.readFile(path);
      const before = original.get(path);
      let change: Change;
      if (before === undefined) change = "added";
      else if (before !== text) change = "modified";
      const entry: FileTreeEntry = { path: rel(path) };
      if (change) Object.assign(entry, { change }, lineDiff(before, text));
      list.push(entry);
    }
    return list;
  }

  async function read(path: string) {
    return bash.fs.readFile(abs(path));
  }

  async function run(command: string, signal?: AbortSignal) {
    const result = await bash.exec(command, { cwd: ROOT, signal });
    notify();
    return result;
  }

  async function write(path: string, content: string) {
    const target = abs(path);
    const dir = target.slice(0, target.lastIndexOf("/"));
    await bash.fs.mkdir(dir, { recursive: true });
    await bash.fs.writeFile(target, content);
    notify();
  }

  return {
    entries,
    read,
    run,
    write,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type Workspace = ReturnType<typeof createWorkspace>;

/**
 * The agent's tools. `bash` and `write_file` change the workspace, so each call waits for a person's decision
 * inside `execute()` before it runs; a denial reaches the model as a failed tool result.
 */
export function workspaceTools(workspace: Workspace, ask: AskApproval) {
  const denied = (decision: ToolDecision) => ({
    type: "libfx.tool-result" as const,
    text: `The user denied this call${decision.reason ? `: ${decision.reason}` : "."} Don't retry it as is.`,
    images: [],
    isError: true,
  });

  return [
    {
      name: "list_files",
      description: "List every file in the workspace, with the files you changed marked.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      idempotent: true,
      async execute() {
        return (await workspace.entries()).map((entry) =>
          entry.change ? `${entry.path} (${entry.change})` : entry.path,
        );
      },
    },
    {
      name: "read_file",
      description: "Read a file in the workspace. Paths are relative to /workspace.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
        additionalProperties: false,
      },
      idempotent: true,
      async execute(input: { path: string }) {
        return workspace.read(input.path);
      },
    },
    {
      name: "write_file",
      description: "Create or replace a file in the workspace. Paths are relative to /workspace.",
      inputSchema: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
        additionalProperties: false,
      },
      idempotent: false,
      async execute(input: { path: string; content: string }, context: { executionId: string }) {
        const decision = await ask(context.executionId, "write_file", input);
        if (!decision.approved) return denied(decision);
        await workspace.write(input.path, input.content);
        return `Wrote ${input.content.length} characters to ${input.path}.`;
      },
    },
    {
      name: "bash",
      description:
        "Run a bash command in /workspace (a simulated shell in the browser: coreutils, grep, sed, awk and jq; no node or network). Returns stdout, stderr and the exit code.",
      inputSchema: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
        additionalProperties: false,
      },
      idempotent: false,
      async execute(input: { command: string }, context: { executionId: string; signal: AbortSignal }) {
        const decision = await ask(context.executionId, "bash", input);
        if (!decision.approved) return denied(decision);
        const result = await workspace.run(input.command, context.signal);
        return { exitCode: result.exitCode, stdout: result.stdout, stderr: result.stderr };
      },
    },
  ];
}

export type WorkspaceTool = ReturnType<typeof workspaceTools>[number];
