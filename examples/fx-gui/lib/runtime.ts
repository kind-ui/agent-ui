import type { FxTurnEvent } from "libfx/browser";
import type { WorkspaceTool } from "./workspace";

export type AppTurnEvent = FxTurnEvent | { type: "retry"; attempt: number; error: string };

export type TurnEnd = { stopReason: string; error?: string };

export interface RunningTurn {
  events: AsyncIterable<AppTurnEvent>;
  result: Promise<TurnEnd>;
  steer(text: string): Promise<{ id: string }>;
  cancel(): void;
}

export type ModelChoice = { id: string; effort?: string };

export interface Runtime {
  prompt(text: string, model: ModelChoice): RunningTurn;
  close(): Promise<void>;
}

export const INSTRUCTIONS = `You are fx, a coding agent working in a small project at /workspace inside the user's browser.
Use list_files and read_file to look around, write_file to change files, and bash to run shell commands.
The shell is simulated: coreutils, grep, sed, awk and jq work; node, npm and the network don't.
Keep replies short and use Markdown.`;

/** A push-based async iterable: one producer, one reader. */
function channel<T>() {
  const queue: T[] = [];
  let wake: (() => void) | undefined;
  let closed = false;
  return {
    push(value: T) {
      queue.push(value);
      wake?.();
    },
    close() {
      closed = true;
      wake?.();
    },
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (queue.length) {
          yield queue.shift() as T;
          continue;
        }
        if (closed) return;
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
        wake = undefined;
      }
    },
  };
}

type LiveOptions = {
  apiKey: string;
  tools: WorkspaceTool[];
  /** A local OpenAI-compatible server (development only), used instead of AI Gateway. */
  mockUrl?: string;
};

/** libfx in the browser through WebAssembly, with one durable-in-memory session. */
export async function createLiveRuntime({ apiKey, tools, mockUrl }: LiveOptions): Promise<Runtime> {
  const { createFxAgent } = await import("libfx/browser");
  let current: ReturnType<typeof channel<AppTurnEvent>> | undefined;
  const provider = mockUrl
    ? {
        provider: { name: "mock", baseUrl: mockUrl, modelDefaults: { supportsToolUse: true } },
        credentials: () => ({ apiKey: "mock" }),
        model: "mock-model",
      }
    : { apiKey };
  const agent = createFxAgent({
    ...provider,
    instructions: INSTRUCTIONS,
    tools,
    onEvent(event) {
      if (event.type === "transport.retry") {
        current?.push({ type: "retry", attempt: event.nextAttempt, error: event.error });
      }
    },
  });
  let sessionId: string | undefined;

  return {
    prompt(text, model) {
      const session = agent.session(sessionId, { model: mockUrl ? "mock-model" : model });
      const events = channel<AppTurnEvent>();
      current = events;
      const turn = session.prompt(text);
      turn.accepted.then((accepted) => {
        sessionId = accepted.sessionId;
      });
      void (async () => {
        try {
          for await (const event of turn) events.push(event);
        } finally {
          events.close();
        }
      })();
      return {
        events,
        result: turn.result.then((result) => ({
          stopReason: result.stopReason,
          error: result.error?.message,
        })),
        steer: (input) => session.steer(input).then(({ messageId }) => ({ id: messageId })),
        cancel: () => void session.cancel(),
      };
    },
    close: () => agent.close(),
  };
}

// ---------------------------------------------------------------------------
// Replay: a scripted turn that needs no key. Its tool calls run the same tools, against the same workspace and
// approvals, as a live turn.

type Step =
  | { kind: "reasoning"; text: string }
  | { kind: "text"; text: string }
  | { kind: "tool"; name: string; input: Record<string, unknown> };

const FIRST: Step[] = [
  {
    kind: "reasoning",
    text: "The user wants a `farewell` function next to `greet`. I should read the project before I change it, then add the function, cover it in `test.js`, and check the result with the shell.",
  },
  { kind: "text", text: "I'll look at the project first." },
  { kind: "tool", name: "list_files", input: {} },
  { kind: "tool", name: "read_file", input: { path: "src/greet.js" } },
  {
    kind: "text",
    text: "`greet` lives in `src/greet.js`. I'll add `farewell` beside it, with the same shape.",
  },
  {
    kind: "tool",
    name: "write_file",
    input: {
      path: "src/greet.js",
      content: `export function greet(name) {
  return "Hello, " + name;
}

export function farewell(name) {
  return "Goodbye, " + name;
}
`,
    },
  },
  {
    kind: "tool",
    name: "write_file",
    input: {
      path: "test.js",
      content: `import { farewell, greet } from "./src/greet.js";

console.log(greet("fx"));
console.log(farewell("fx"));
`,
    },
  },
  {
    kind: "tool",
    name: "bash",
    input: { command: "grep -n 'export function' src/greet.js && wc -l src/greet.js test.js" },
  },
  {
    kind: "text",
    text: `Done. \`src/greet.js\` now exports both functions:

\`\`\`js
export function farewell(name) {
  return "Goodbye, " + name;
}
\`\`\`

- **src/greet.js**: added \`farewell\`.
- **test.js**: prints both greetings.

The shell here can't run \`node\`, so I checked the exports with \`grep\` instead.`,
  },
];

const LATER: Step[] = [
  {
    kind: "reasoning",
    text: "This is a replay, so I can't answer new questions. I'll say so and point to key mode.",
  },
  {
    kind: "text",
    text: "This is **replay mode**: a scripted run with no model behind it. Enter an AI Gateway key above to talk to fx for real. The workspace and its files stay as they are.",
  },
];

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });

function chunks(text: string) {
  return text.match(/\S+\s*|\s+/g) ?? [];
}

export function createReplayRuntime(tools: WorkspaceTool[]): Runtime {
  let turns = 0;
  let calls = 0;
  let steers = 0;

  return {
    prompt() {
      const script = turns++ === 0 ? FIRST : LATER;
      const controller = new AbortController();
      const { signal } = controller;
      const events = channel<AppTurnEvent>();
      const pending: { id: string; text: string }[] = [];
      let stopReason = "end_turn";

      const takeSteers = async () => {
        while (pending.length) {
          const steer = pending.shift() as { id: string; text: string };
          events.push({ type: "user_message", id: steer.id, text: steer.text });
          await wait(300, signal);
          for (const piece of chunks(`Noted: "${steer.text}". I'll take that into account as I go on.`)) {
            if (signal.aborted) return;
            events.push({ type: "text_delta", delta: piece });
            await wait(30, signal);
          }
        }
      };

      const result = (async (): Promise<TurnEnd> => {
        try {
          await wait(500, signal);
          for (const step of script) {
            if (signal.aborted) break;
            await takeSteers();
            if (step.kind === "tool") {
              const id = `replay-call-${++calls}`;
              events.push({ type: "tool_start", id, name: step.name, input: step.input as never });
              await wait(250, signal);
              const tool = tools.find((candidate) => candidate.name === step.name);
              let content: string;
              let isError = false;
              try {
                if (!tool) throw new Error(`Unknown tool ${step.name}`);
                const value = await (tool.execute as (input: unknown, context: unknown) => Promise<unknown>)(
                  step.input,
                  {
                    executionId: id,
                    signal,
                    sessionId: "replay",
                  },
                );
                if (
                  value &&
                  typeof value === "object" &&
                  "type" in value &&
                  value.type === "libfx.tool-result"
                ) {
                  const typed = value as unknown as { text: string; isError?: boolean };
                  content = typed.text;
                  isError = Boolean(typed.isError);
                } else content = typeof value === "string" ? value : JSON.stringify(value);
              } catch (error) {
                content = error instanceof Error ? error.message : String(error);
                isError = true;
              }
              if (signal.aborted) break;
              events.push({ type: "tool_end", id, name: step.name, content, isError });
              await wait(300, signal);
              continue;
            }
            const type = step.kind === "text" ? "text_delta" : "reasoning_delta";
            for (const piece of chunks(step.text)) {
              // Text steering cuts the reply short, as libfx does.
              if (signal.aborted || (type === "text_delta" && pending.length)) break;
              events.push({ type, delta: piece });
              await wait(type === "text_delta" ? 35 : 20, signal);
            }
            if (type === "text_delta") events.push({ type: "text_delta", delta: "\n\n" });
            await wait(200, signal);
          }
          await takeSteers();
          if (signal.aborted) stopReason = "cancelled";
          return { stopReason };
        } finally {
          events.close();
        }
      })();

      return {
        events,
        result,
        async steer(text) {
          const id = `replay-steer-${++steers}`;
          pending.push({ id, text });
          return { id };
        },
        cancel: () => controller.abort(),
      };
    },
    close: async () => {},
  };
}
