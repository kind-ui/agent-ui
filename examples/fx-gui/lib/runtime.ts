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

export const INSTRUCTIONS = `You are fx, a coding agent working in a project at /workspace inside the user's browser.
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

/** How the page reaches a model: a pasted AI Gateway key (straight from the browser), or a signed-in account. */
export type Connection =
  | { kind: "key"; apiKey: string }
  | { kind: "account"; provider: "vercel" | "chatgpt" | "grok" }
  | { kind: "mock"; url: string };

/**
 * Sends a model request through this site's /api/model, which adds the signed-in user's credentials on the server.
 * The credentials libfx holds here are a placeholder the server replaces.
 */
export const proxyFetch = async (url: string, init: RequestInit) => {
  const headers: Record<string, string> = {};
  new Headers(init.headers).forEach((value, name) => {
    headers[name] = value;
  });
  return fetch("/api/model", {
    method: init.method ?? "GET",
    headers: { "x-fx-gui": "1", "x-fx-target": url, "x-fx-headers": JSON.stringify(headers) },
    body: init.body,
    signal: init.signal,
    ...(init.body instanceof ReadableStream ? { duplex: "half" } : {}),
  } as RequestInit);
};

const PLACEHOLDER = { accessToken: "kept-on-the-server", accountId: "kept-on-the-server" };

function agentOptions(connection: Connection) {
  switch (connection.kind) {
    case "key":
      return { apiKey: connection.apiKey };
    case "mock":
      return {
        provider: { name: "mock", baseUrl: connection.url, modelDefaults: { supportsToolUse: true } },
        credentials: () => ({ apiKey: "mock" }),
      };
    case "account":
      return connection.provider === "vercel"
        ? { apiKey: PLACEHOLDER.accessToken, fetch: proxyFetch }
        : {
            provider: connection.provider === "chatgpt" ? ("codex" as const) : ("grok" as const),
            credentials: () => PLACEHOLDER,
            fetch: proxyFetch,
          };
  }
}

/** libfx in the browser through WebAssembly, with one session kept in page memory. */
export async function createRuntime(connection: Connection, tools: WorkspaceTool[]): Promise<Runtime> {
  const { createFxAgent } = await import("libfx/browser");
  let current: ReturnType<typeof channel<AppTurnEvent>> | undefined;
  const agent = createFxAgent({
    ...(agentOptions(connection) as object),
    instructions: INSTRUCTIONS,
    tools,
    onEvent(event: { type: string; nextAttempt?: number; error?: string }) {
      if (event.type === "transport.retry") {
        current?.push({ type: "retry", attempt: event.nextAttempt ?? 0, error: event.error ?? "" });
      }
    },
  } as Parameters<typeof createFxAgent>[0]);
  let sessionId: string | undefined;

  return {
    prompt(text, model) {
      const session = agent.session(sessionId, { model: connection.kind === "mock" ? "mock-model" : model });
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

type ModelEntry = { id: string; name?: string; display_name?: string; slug?: string };

/** The models a connection offers. Ids only where the provider gives no names. */
export async function listConnectionModels(connection: Connection): Promise<{ id: string; name: string }[]> {
  const named = (id: string, name?: string) => ({ id, name: name ?? id.split("/").pop() ?? id });
  if (connection.kind === "mock") return [named("mock-model")];
  if (connection.kind === "key" || connection.provider === "vercel") {
    const { listModels } = await import("libfx/browser");
    const ids = await listModels(
      connection.kind === "key"
        ? { apiKey: connection.apiKey }
        : { apiKey: PLACEHOLDER.accessToken, fetch: proxyFetch },
    );
    return ids.map((id) => named(id));
  }
  const url =
    connection.provider === "chatgpt"
      ? "https://chatgpt.com/backend-api/codex/models?client_version=1.0.0"
      : "https://cli-chat-proxy.grok.com/v1/models";
  const response = await proxyFetch(url, { method: "GET", headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Models request failed (${response.status})`);
  const body = (await response.json()) as { data?: ModelEntry[]; models?: ModelEntry[] };
  return (body.data ?? body.models ?? [])
    .map((entry) => named(entry.slug ?? entry.id, entry.display_name ?? entry.name))
    .filter((entry) => entry.id);
}
