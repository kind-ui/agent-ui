"use client";

import type { Approval, EffortLevel, FileTreeEntry, MessageStatus, ModelOption } from "@kind-ui/agent-ui";
import type { ComposerDraft } from "@kind-ui/agent-ui/core";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/composer";
import { Confirmation } from "@/components/ui/confirmation";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyDescription,
  ConversationEmptyTitle,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { FileTree } from "@/components/ui/file-tree";
import { Markdown } from "@/components/ui/markdown";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/message";
import { ModelControl } from "@/components/ui/model-control";
import { Notice } from "@/components/ui/notice";
import { Reasoning } from "@/components/ui/reasoning";
import { Terminal } from "@/components/ui/terminal";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import { Tool } from "@/components/ui/tool";
import {
  type AppTurnEvent,
  createLiveRuntime,
  createReplayRuntime,
  type RunningTurn,
  type Runtime,
} from "@/lib/runtime";
import { createWorkspace, type ToolDecision, type Workspace, workspaceTools } from "@/lib/workspace";

// ---------------------------------------------------------------------------
// Conversation model, built from libfx turn events

type TextItem = { type: "text"; id: string; text: string; done: boolean };
type ReasoningItem = {
  type: "reasoning";
  id: string;
  text: string;
  done: boolean;
  started: number;
  ended?: number;
};
type ToolItem = {
  type: "tool";
  id: string;
  name: string;
  input: unknown;
  done: boolean;
  output?: string;
  isError?: boolean;
  started: number;
  ended?: number;
};
type Item = TextItem | ReasoningItem | ToolItem;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  status: MessageStatus;
  items: Item[];
  steer?: boolean;
  error?: string;
};

type Mode = "replay" | "live";

const EMPTY_DRAFT: ComposerDraft = { text: "", tokens: [], attachments: [] };
const FIRST_PROMPT = "Add a farewell function next to greet, and cover it in test.js.";

const MODELS: ModelOption[] = [
  { id: "spacexai/grok-4.7", name: "Grok 4.7", group: "xAI", description: "fx's default model" },
  { id: "anthropic/claude-haiku-5.5", name: "Claude Haiku 5.5", group: "Anthropic" },
  { id: "anthropic/claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic" },
  { id: "openai/gpt-4.1-nano", name: "GPT-4.1 nano", group: "OpenAI", efforts: ["default"] },
];
const LEVELS: EffortLevel[] = [
  { value: "default", label: "Default" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const readable = (error: string) =>
  error === "HostStreamFailed" ? "Couldn't reach AI Gateway. Check your key and connection." : error;

let ids = 0;
const nextId = (prefix: string) => `${prefix}-${++ids}`;

function language(path: string) {
  const ext = path.split(".").pop() ?? "";
  return { js: "javascript", ts: "typescript", json: "json", md: "markdown", sh: "bash" }[ext] ?? "text";
}

function parseShell(output: string | undefined) {
  if (!output) return undefined;
  try {
    const value = JSON.parse(output) as { exitCode?: number; stdout?: string; stderr?: string };
    return { exitCode: value.exitCode, text: `${value.stdout ?? ""}${value.stderr ?? ""}` };
  } catch {
    return { exitCode: undefined, text: output };
  }
}

function parseJson(value: string | undefined) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------

export function FxApp({ mockUrl }: { mockUrl?: string }) {
  const [mode, setMode] = useState<Mode>("replay");
  const [apiKey, setApiKey] = useState("");
  const [jspi, setJspi] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [approvals, setApprovals] = useState<Record<string, Approval>>({});
  const [draft, setDraft] = useState<ComposerDraft>({ ...EMPTY_DRAFT, text: FIRST_PROMPT });
  const [running, setRunning] = useState(false);
  const [queuedSteers, setQueuedSteers] = useState<string[]>([]);
  const [retry, setRetry] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [models, setModels] = useState<ModelOption[]>(MODELS);
  const [model, setModel] = useState(MODELS[0].id);
  const [effort, setEffort] = useState("default");
  const [entries, setEntries] = useState<FileTreeEntry[]>([]);
  const [selected, setSelected] = useState<string | null>("src/greet.js");
  const [file, setFile] = useState("");
  const [dark, setDark] = useState(false);
  const [session, setSession] = useState(0);

  const workspace = useRef<Workspace | null>(null);
  const runtime = useRef<{ key: string; runtime: Runtime } | null>(null);
  const turn = useRef<RunningTurn | null>(null);
  const resolvers = useRef(new Map<string, (decision: ToolDecision) => void>());

  // libfx/browser and just-bash load only in the browser.
  useEffect(() => {
    void import("libfx/browser").then(({ supportsJspi }) => setJspi(supportsJspi()));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new session starts a new workspace
  useEffect(() => {
    const ws = createWorkspace();
    workspace.current = ws;
    runtime.current = null;
    const refresh = () => void ws.entries().then(setEntries);
    refresh();
    return ws.subscribe(refresh);
  }, [session]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: read the file again whenever the workspace changes
  useEffect(() => {
    const ws = workspace.current;
    if (!ws || !selected) return;
    ws.read(selected).then(setFile, () => setFile(""));
  }, [selected, entries]);

  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const theme = new URLSearchParams(location.search).get("theme");
    setDark(theme ? theme === "dark" : media.matches);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  // Approvals: a write or shell tool's execute() waits here until a person decides.
  const ask = useCallback((id: string) => {
    setApprovals((all) => ({ ...all, [id]: { approvalId: id, generation: 1, state: "requested" } }));
    return new Promise<ToolDecision>((resolve) => resolvers.current.set(id, resolve));
  }, []);

  const decide = useCallback((id: string, decision: ToolDecision) => {
    setApprovals((all) => ({
      ...all,
      [id]: { approvalId: id, generation: 1, state: "responded", decision },
    }));
    resolvers.current.get(id)?.(decision);
    resolvers.current.delete(id);
  }, []);

  async function getRuntime(): Promise<Runtime> {
    const ws = workspace.current ?? createWorkspace();
    workspace.current = ws;
    const key = mode === "replay" ? "replay" : `live:${apiKey}`;
    if (runtime.current?.key === key) return runtime.current.runtime;
    await runtime.current?.runtime.close();
    const tools = workspaceTools(ws, ask);
    const next =
      mode === "replay" ? createReplayRuntime(tools) : await createLiveRuntime({ apiKey, tools, mockUrl });
    runtime.current = { key, runtime: next };
    return next;
  }

  // Live mode lists the models AI Gateway offers for this key.
  useEffect(() => {
    if (mode !== "live" || !apiKey || mockUrl) return;
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const { listModels } = await import("libfx/browser");
        const list = await listModels({ apiKey });
        if (!current || !list.length) return;
        setModels(
          list.slice(0, 60).map((id) => ({ id, name: id.split("/")[1] ?? id, group: id.split("/")[0] })),
        );
      } catch {
        // Keep the built-in list; the first turn reports a bad key.
      }
    }, 600);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [mode, apiKey, mockUrl]);

  const update = (id: string, change: (message: ChatMessage) => ChatMessage) =>
    setMessages((all) => all.map((message) => (message.id === id ? change(message) : message)));

  function apply(assistantId: { current: string }, event: AppTurnEvent) {
    const now = Date.now();
    if (event.type === "retry") {
      setRetry(`Retrying the model request (attempt ${event.attempt}): ${event.error}`);
      return;
    }
    setRetry(null);
    if (event.type === "user_message") {
      // Steering joined the turn: close this reply, show the steer, and continue in a new reply.
      const id = nextId("assistant");
      setQueuedSteers((queued) => queued.slice(1));
      setMessages((all) => [
        ...all.map((message) =>
          message.id === assistantId.current
            ? {
                ...message,
                status: "complete" as const,
                items: message.items.map((item) => ({ ...item, done: true })),
              }
            : message,
        ),
        {
          id: nextId("user"),
          role: "user",
          status: "complete",
          steer: true,
          items: [{ type: "text", id: nextId("text"), text: event.text, done: true }],
        },
        { id, role: "assistant", status: "submitted", items: [] },
      ]);
      assistantId.current = id;
      return;
    }
    update(assistantId.current, (message) => {
      const items = [...message.items];
      const last = items.at(-1);
      if (event.type === "text_delta" || event.type === "reasoning_delta") {
        const kind = event.type === "text_delta" ? "text" : "reasoning";
        if (last?.type === kind && !last.done) {
          items[items.length - 1] = { ...last, text: last.text + event.delta };
        } else {
          if (last && last.type === "reasoning" && !last.done)
            items[items.length - 1] = { ...last, done: true, ended: now };
          else if (last && last.type === "text") items[items.length - 1] = { ...last, done: true };
          items.push(
            kind === "text"
              ? { type: "text", id: nextId("text"), text: event.delta, done: false }
              : { type: "reasoning", id: nextId("reasoning"), text: event.delta, done: false, started: now },
          );
        }
      } else if (event.type === "tool_start") {
        if (last && last.type !== "tool" && !last.done) {
          items[items.length - 1] =
            last.type === "reasoning" ? { ...last, done: true, ended: now } : { ...last, done: true };
        }
        items.push({
          type: "tool",
          id: event.id,
          name: event.name,
          input: event.input ?? event.inputPreview,
          done: false,
          started: now,
        });
      } else if (event.type === "tool_end") {
        const index = items.findIndex((item) => item.type === "tool" && item.id === event.id);
        if (index >= 0) {
          items[index] = {
            ...(items[index] as ToolItem),
            done: true,
            output: event.content,
            isError: event.isError,
            ended: now,
          };
        }
      }
      return { ...message, status: "streaming", items };
    });
  }

  async function send(draftToSend: ComposerDraft) {
    const text = draftToSend.text.trim();
    if (!text) return;
    setFailure(null);
    setDraft(EMPTY_DRAFT);
    const assistantId = { current: nextId("assistant") };
    setMessages((all) => [
      ...all,
      {
        id: nextId("user"),
        role: "user",
        status: "complete",
        items: [{ type: "text", id: nextId("text"), text, done: true }],
      },
      { id: assistantId.current, role: "assistant", status: "submitted", items: [] },
    ]);
    setRunning(true);
    try {
      const rt = await getRuntime();
      const current = rt.prompt(text, { id: model, effort: effort === "default" ? undefined : effort });
      turn.current = current;
      for await (const event of current.events) apply(assistantId, event);
      const end = await current.result;
      const status: MessageStatus =
        end.stopReason === "cancelled"
          ? "aborted"
          : end.stopReason === "error" || end.stopReason === "refused"
            ? "error"
            : "complete";
      update(assistantId.current, (message) => ({
        ...message,
        status,
        error: status === "error" ? readable(end.error ?? "The turn failed.") : undefined,
        items: message.items.map((item) =>
          item.type === "reasoning" && !item.done
            ? { ...item, done: true, ended: Date.now() }
            : { ...item, done: true },
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setFailure(readable(message));
      update(assistantId.current, (entry) => ({ ...entry, status: "error", error: readable(message) }));
    } finally {
      turn.current = null;
      setRunning(false);
      setRetry(null);
      setQueuedSteers([]);
      // A turn that stopped while a call waited for a decision denies it, so the tool returns.
      for (const [id, resolve] of resolvers.current) {
        resolve({ approved: false, reason: "The turn stopped." });
        setApprovals((all) => ({ ...all, [id]: { approvalId: id, generation: 1, state: "auto" } }));
      }
      resolvers.current.clear();
    }
  }

  function stop() {
    turn.current?.cancel();
  }

  // Composer glue: while a turn runs, Send is Stop, so Enter steers the running turn instead.
  function steerOnEnter(event: KeyboardEvent) {
    if (!running || event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    event.stopPropagation();
    const text = draft.text.trim();
    if (!text || !turn.current) return;
    setDraft(EMPTY_DRAFT);
    setQueuedSteers((queued) => [...queued, text]);
    void turn.current.steer(text);
  }

  function reset() {
    stop();
    setMessages([]);
    setApprovals({});
    setDraft({ ...EMPTY_DRAFT, text: FIRST_PROMPT });
    setSession((n) => n + 1);
    setSelected("src/greet.js");
  }

  const unsupported = mode === "live" && jspi === false;
  const needsKey = mode === "live" && !apiKey && !mockUrl;

  const header = (
    <header className="flex flex-wrap items-center gap-3 border-b border-[var(--kind-color-hairline)] px-4 py-2.5">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-[length:var(--kind-text-md)]">fx</span>
        <span className="text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]">
          in your browser
        </span>
      </div>
      <fieldset className="flex items-center gap-1" aria-label="Mode">
        <button
          type="button"
          data-kind-button={mode === "replay" ? "soft" : ""}
          data-kind-size="sm"
          aria-pressed={mode === "replay"}
          onClick={() => setMode("replay")}
          disabled={running}
        >
          Replay
        </button>
        <button
          type="button"
          data-kind-button={mode === "live" ? "soft" : ""}
          data-kind-size="sm"
          aria-pressed={mode === "live"}
          onClick={() => setMode("live")}
          disabled={running}
        >
          AI Gateway key
        </button>
      </fieldset>
      {mode === "live" && !mockUrl ? (
        <label className="flex min-w-0 items-center gap-2 text-[length:var(--kind-text-sm)]">
          <span className="sr-only">AI Gateway API key</span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="AI Gateway API key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value.trim())}
            disabled={running}
            className="h-8 w-64 min-w-0 rounded-[calc(var(--kind-radius)/1.5)] border border-[var(--kind-color-border)] bg-[var(--kind-color-surface)] px-2.5 outline-hidden placeholder:text-[var(--kind-color-muted)]"
          />
        </label>
      ) : null}
      <div className="ms-auto flex items-center gap-1">
        <button type="button" data-kind-button="" data-kind-size="sm" onClick={reset}>
          New session
        </button>
        <button type="button" data-kind-button="" data-kind-size="sm" onClick={() => setDark(!dark)}>
          {dark ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );

  const workspacePanel = (
    <aside
      aria-label="Workspace"
      className="flex min-h-0 flex-col gap-3 border-[var(--kind-color-hairline)] p-3 max-lg:border-t lg:border-s"
    >
      <h2 className="px-1 font-medium text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]">
        /workspace
      </h2>
      <FileTree
        label="Workspace files"
        entries={entries}
        value={selected}
        onValueChange={(value) =>
          value && entries.some((entry) => entry.path === value) && setSelected(value)
        }
        defaultExpanded={["src"]}
      />
      {selected ? (
        <div className="min-h-0 overflow-auto">
          <CodeBlock
            aria-label={selected}
            code={file}
            language={language(selected)}
            lineNumbers
            defaultWrap
          />
        </div>
      ) : null}
    </aside>
  );

  return (
    <div className="grid h-dvh grid-rows-[auto_1fr] bg-[var(--kind-color-canvas)] text-[var(--kind-color-fg)]">
      {header}
      <div className="grid min-h-0 lg:grid-cols-[minmax(0,1fr)_360px] max-lg:grid-rows-[minmax(0,1fr)_auto] max-lg:overflow-auto">
        <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-col gap-3 p-4">
          {unsupported ? (
            <Notice variant="error" label="This browser can't run fx">
              fx runs here through WebAssembly with JavaScript Promise Integration (JSPI). Use Chrome or Edge,
              or Safari 27 or later. Replay mode works in any browser.
            </Notice>
          ) : null}
          {failure ? (
            <Notice variant="error" label="The turn failed" onDismiss={() => setFailure(null)}>
              {failure}
            </Notice>
          ) : null}
          {retry ? (
            <Notice variant="warning" label="Retrying">
              {retry}
            </Notice>
          ) : null}
          <Conversation
            aria-label="Conversation with fx"
            messageCount={messages.length}
            className="min-h-0 flex-1"
          >
            <ConversationViewport>
              <ConversationContent>
                {messages.map((message, index) => (
                  <ConversationRow key={message.id} value={message.id} index={index}>
                    <ChatRow message={message} approvals={approvals} decide={decide} index={index} />
                  </ConversationRow>
                ))}
                <ConversationEmpty>
                  <ConversationEmptyTitle>
                    {mode === "replay" ? "Replay a run of fx" : "Ask fx to change the workspace"}
                  </ConversationEmptyTitle>
                  <ConversationEmptyDescription>
                    {mode === "replay"
                      ? "A scripted turn, no key needed. Its tool calls run for real against the in-browser workspace, and writes wait for your approval."
                      : "libfx runs in this tab through WebAssembly. Your key stays in the browser and goes straight to AI Gateway."}
                  </ConversationEmptyDescription>
                </ConversationEmpty>
              </ConversationContent>
            </ConversationViewport>
            <ConversationJump />
          </Conversation>
          {queuedSteers.length ? (
            <p
              className="px-1 text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]"
              role="status"
            >
              Steering: “{queuedSteers[0]}” joins the turn at its next safe point.
            </p>
          ) : null}
          <Composer
            aria-label="Message fx"
            value={draft}
            onValueChange={setDraft}
            onSubmit={send}
            onStop={stop}
            disabled={unsupported || needsKey}
          >
            <ComposerInput
              aria-label="Prompt"
              placeholder={
                needsKey
                  ? "Enter an AI Gateway key above"
                  : running
                    ? "Steer the running turn, then press Enter"
                    : "Ask fx to change the workspace"
              }
              onKeyDownCapture={steerOnEnter}
            />
            <div className="flex min-w-0 flex-wrap items-center gap-1.5" style={{ gridArea: "attach" }}>
              <ModelControl
                models={models}
                model={model}
                onModelChange={setModel}
                levels={LEVELS}
                effort={effort}
                onEffortChange={setEffort}
                disabled={running || mode === "replay"}
              />
            </div>
            <ComposerSubmit />
            <ComposerStop />
          </Composer>
        </main>
        {workspacePanel}
      </div>
    </div>
  );
}

function ChatRow({
  message,
  approvals,
  decide,
  index,
}: {
  message: ChatMessage;
  approvals: Record<string, Approval>;
  decide: (id: string, decision: ToolDecision) => void;
  index: number;
}) {
  const label =
    message.role === "user"
      ? message.steer
        ? `Steering ${index + 1}`
        : `Your message ${index + 1}`
      : `fx reply ${index + 1}`;
  const waiting =
    message.role === "assistant" && message.status === "submitted" && message.items.length === 0;
  return (
    <Message aria-label={label} messageRole={message.role} status={message.status} error={message.error}>
      <MessageContent className="flex flex-col gap-2.5">
        {message.steer ? (
          <span className="text-[length:var(--kind-text-xs)] text-[var(--kind-color-muted)]">
            Steered the running turn
          </span>
        ) : null}
        {waiting ? <ThinkingIndicator /> : null}
        {message.items.map((item) => (
          <ItemView key={item.id} item={item} approval={approvals[item.id]} decide={decide} />
        ))}
      </MessageContent>
      <MessageOutcome />
    </Message>
  );
}

function ItemView({
  item,
  approval,
  decide,
}: {
  item: Item;
  approval: Approval | undefined;
  decide: (id: string, decision: ToolDecision) => void;
}) {
  const onApprove = useCallback(() => decide(item.id, { approved: true }), [decide, item.id]);
  const onDeny = useCallback(
    ({ reason }: { reason?: string }) => decide(item.id, { approved: false, ...(reason && { reason }) }),
    [decide, item.id],
  );
  if (item.type === "text") return <Markdown source={item.text} streaming={!item.done} />;
  if (item.type === "reasoning") {
    return (
      <Reasoning
        text={item.text}
        status={item.done ? "complete" : "running"}
        durationSeconds={item.ended ? Math.max(1, Math.round((item.ended - item.started) / 1000)) : undefined}
      />
    );
  }
  const denied = approval?.state === "responded" && approval.decision?.approved === false;
  if (item.name === "bash") {
    const command = String((item.input as { command?: string } | undefined)?.command ?? "");
    const shell = parseShell(item.output);
    return (
      <div className="flex flex-col gap-2">
        {approval ? (
          <Confirmation
            label={`Run “${command}”?`}
            approval={approval}
            reason
            approveLabel="Run"
            onApprove={onApprove}
            onDeny={onDeny}
          />
        ) : null}
        {denied || approval?.state === "requested" ? null : (
          <Terminal
            label="bash"
            command={command}
            output={shell?.text ?? ""}
            exitCode={item.done ? (shell?.exitCode ?? (item.isError ? 1 : 0)) : undefined}
            status={
              item.done ? (item.isError || (shell?.exitCode ?? 0) !== 0 ? "error" : "complete") : "running"
            }
          />
        )}
      </div>
    );
  }
  const call = {
    toolCallId: item.id,
    name: item.name,
    dynamic: true,
    input: { state: "ready" as const, value: item.input },
    ...(item.done && !item.isError
      ? { output: { state: "available" as const, value: parseJson(item.output) } }
      : {}),
    ...(denied ? { outcome: "denied" as const } : item.isError ? { outcome: "error" as const } : {}),
    ...(approval ? { approval } : {}),
  };
  return (
    <Tool
      call={call}
      error={item.isError && !denied ? { message: item.output ?? "The tool failed." } : undefined}
      approvalReason
      onApprove={onApprove}
      onDeny={onDeny}
    />
  );
}

export default FxApp;
