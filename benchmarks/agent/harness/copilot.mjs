import { spawn } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

// Runs one agent through the GitHub Copilot CLI in a non-interactive session, with only its Bash
// tool, and only `node` allowed in it. Returns what the CLI reports for the run.

/** The CLI to run: `COPILOT_CLI_PATH`, else the one the GitHub Copilot app ships, else `copilot` on the PATH. */
const cli = process.env.COPILOT_CLI_PATH ?? bundledCli() ?? "copilot";

// A clean environment: no editor or session variables leak into the agent's.
function environment(token) {
  const keep = ["HOME", "USER", "LOGNAME", "LANG", "TMPDIR", "SHELL"];
  const env = Object.fromEntries(
    keep.filter((key) => process.env[key]).map((key) => [key, process.env[key]]),
  );
  const bins = [path.dirname(process.execPath), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"];
  return { ...env, PATH: bins.join(":"), TERM: "dumb", AGENT_BENCHMARK_TOKEN: token };
}

/** Sums the usage the CLI logged for each model response. */
function usage(logs) {
  let tokens = 0;
  let responses = 0;
  for (const file of readdirSync(logs)) {
    const text = readFileSync(path.join(logs, file), "utf8");
    for (const match of text.matchAll(/"total_tokens":\s*(\d+)/g)) {
      tokens += Number(match[1]);
      responses++;
    }
  }
  return { tokens, responses };
}

export function copilot({ prompt, model, cwd, token }) {
  const logs = path.join(cwd, ".logs");
  const args = [
    "-p",
    prompt,
    "--model",
    model,
    "--output-format",
    "json",
    "--no-custom-instructions",
    "--disable-builtin-mcps",
    "--disable-mcp-server",
    "computer-use",
    "--available-tools",
    "bash",
    "--allow-tool",
    "shell(node:*)",
    "--no-ask-user",
    "--log-dir",
    logs,
    "--log-level",
    "all",
  ];
  return new Promise((resolve) => {
    const child = spawn(cli, args, { cwd, env: environment(token), stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", () => resolve({ missing: true }));
    child.on("close", (code) => {
      const events = output
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return {};
          }
        });
      const checkpoints = events.filter((event) => event.type === "session.usage_checkpoint");
      const nanoAiu = checkpoints.at(-1)?.data?.totalNanoAiu ?? 0;
      const messages = events.filter((event) => event.type === "assistant.message");
      const { tokens, responses } = usage(logs);
      resolve({
        code,
        tokens,
        responses,
        // GitHub bills Copilot in AI credits of $0.01 each; the CLI reports nano credits.
        cost: (nanoAiu / 1e9) * 0.01,
        message: messages.at(-1)?.data?.content ?? "",
        failed: code !== 0,
      });
    });
  });
}

function bundledCli() {
  const root = path.join(homedir(), "Library/Caches/copilot-sdk/cli");
  try {
    const [latest] = readdirSync(root).sort().reverse();
    return latest ? path.join(root, latest, "copilot") : undefined;
  } catch {
    return undefined;
  }
}
