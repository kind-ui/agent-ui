"use client";

import type { Approval, EffortLevel, FileTreeEntry, MessageStatus, ModelOption } from "@kind-ui/agent-ui";
import type { ComposerDraft } from "@kind-ui/agent-ui/core";
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "@/components/ui/composer";
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
  type Connection,
  createRuntime,
  listConnectionModels,
  type RunningTurn,
  type Runtime,
} from "@/lib/runtime";
import { createWorkspace, type ToolDecision, type Workspace, workspaceTools } from "@/lib/workspace";
import { providerName, SignIn } from "./sign-in";

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

const EMPTY_DRAFT: ComposerDraft = { text: "", tokens: [], attachments: [] };

// Starting models per connection, from fx's docs; each is replaced by the provider's own list once it loads.
const DEFAULT_MODELS: Record<string, ModelOption[]> = {
  gateway: [
    { id: "spacexai/grok-4.7", name: "grok-4.7", group: "spacexai" },
    { id: "anthropic/claude-opus-5.5", name: "claude-opus-5.5", group: "anthropic" },
    { id: "anthropic/claude-haiku-5.5", name: "claude-haiku-5.5", group: "anthropic" },
  ],
  chatgpt: [{ id: "gpt-6.1-sol", name: "gpt-6.1-sol" }],
  grok: [{ id: "grok-4.5", name: "grok-4.5" }],
  mock: [{ id: "mock-model", name: "mock-model" }],
};
const modelsFor = (connection: Connection | null) =>
  DEFAULT_MODELS[
    !connection ||
    connection.kind === "key" ||
    (connection.kind === "account" && connection.provider === "vercel")
      ? "gateway"
      : connection.kind === "mock"
        ? "mock"
        : connection.provider
  ];

// The composer's codec text writes a mention as [@label](kind:value); the model gets the path.
const plainText = (text: string) => text.replace(/\[@[^\]]*\]\([a-z]+:([^)]+)\)/g, "$1");
const LEVELS: EffortLevel[] = [
  { value: "default", label: "Default" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const readable = (error: string) =>
  error === "HostStreamFailed" ? "Couldn't reach the model. Check your connection, or sign in again." : error;

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
  const [connection, setConnection] = useState<Connection | null>(null);
  const [checked, setChecked] = useState(false);
  const [vercelAvailable, setVercelAvailable] = useState(false);
  const [jspi, setJspi] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [approvals, setApprovals] = useState<Record<string, Approval>>({});
  const [draft, setDraft] = useState<ComposerDraft>(EMPTY_DRAFT);
  const [running, setRunning] = useState(false);
  const [queuedSteers, setQueuedSteers] = useState<string[]>([]);
  const [retry, setRetry] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [models, setModels] = useState<ModelOption[]>(DEFAULT_MODELS.gateway);
  const [model, setModel] = useState(DEFAULT_MODELS.gateway[0].id);
  const [effort, setEffort] = useState("default");
  const [entries, setEntries] = useState<FileTreeEntry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
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
    if (mockUrl) {
      setConnection({ kind: "mock", url: mockUrl });
      setChecked(true);
      return;
    }
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((body: { provider: "vercel" | "chatgpt" | "grok" | null; vercelAvailable: boolean }) => {
        setVercelAvailable(body.vercelAvailable);
        if (body.provider) setConnection({ kind: "account", provider: body.provider });
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [mockUrl]);

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
    if (!connection) throw new Error("Connect a model first.");
    const ws = workspace.current ?? createWorkspace();
    workspace.current = ws;
    if (runtime.current) return runtime.current.runtime;
    const next = await createRuntime(connection, workspaceTools(ws, ask));
    runtime.current = { key: "current", runtime: next };
    return next;
  }

  // The connection's own model list replaces the starting one.
  useEffect(() => {
    const fallback = modelsFor(connection);
    setModels(fallback);
    setModel(fallback[0].id);
    if (!connection) return;
    let current = true;
    listConnectionModels(connection)
      .then((list) => {
        if (!current || !list.length) return;
        const options = list.slice(0, 80).map(({ id, name }) => ({
          id,
          name,
          ...(id.includes("/") ? { group: id.split("/")[0] } : {}),
        }));
        setModels(options);
        setModel((chosen) => (options.some((option) => option.id === chosen) ? chosen : options[0].id));
      })
      .catch(() => {});
    return () => {
      current = false;
      void runtime.current?.runtime.close();
      runtime.current = null;
    };
  }, [connection]);

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
    let text = plainText(draftToSend.text).trim();
    // Attached files go into the workspace, and the prompt says where.
    const files = draftToSend.attachments.filter((attachment) => !attachment.error);
    if (files.length && workspace.current) {
      const ws = workspace.current;
      await Promise.all(
        files.map(async (attachment) => ws.attach(attachment.name, await attachment.file.text())),
      );
      const list = files.map((attachment) => attachment.name).join(", ");
      text = `${text}\n\n(Added to /workspace: ${list})`.trim();
    }
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
    const text = plainText(draft.text).trim();
    if (!text || !turn.current) return;
    setDraft(EMPTY_DRAFT);
    setQueuedSteers((queued) => [...queued, text]);
    void turn.current.steer(text);
  }

  function reset() {
    stop();
    setMessages([]);
    setApprovals({});
    setDraft(EMPTY_DRAFT);
    setSession((n) => n + 1);
    setSelected(null);
  }

  async function signOut() {
    reset();
    if (connection?.kind === "account")
      await fetch("/api/auth/signout", { method: "POST", headers: { "x-fx-gui": "1" } });
    setConnection(null);
  }

  const mentions = entries.map((entry) => ({
    value: entry.path,
    label: entry.path.split("/").pop() ?? entry.path,
    description: entry.path,
  }));

  if (!checked) return null;
  if (!connection) return <SignIn vercelAvailable={vercelAvailable} jspi={jspi} onConnect={setConnection} />;

  const header = (
    <header className="flex flex-wrap items-center gap-3 border-b border-[var(--kind-color-hairline)] px-4 py-2.5">
      <h1 className="font-semibold text-[length:var(--kind-text-md)]">fx-gui</h1>
      <span className="text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]">
        {providerName(connection)}
      </span>
      <div className="ms-auto flex items-center gap-1">
        <button type="button" data-kind-button="" data-kind-size="sm" onClick={reset} disabled={running}>
          New session
        </button>
        <button type="button" data-kind-button="" data-kind-size="sm" onClick={() => setDark(!dark)}>
          {dark ? "Light" : "Dark"}
        </button>
        <button type="button" data-kind-button="" data-kind-size="sm" onClick={signOut}>
          {connection.kind === "account" ? "Sign out" : "Disconnect"}
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
      />
      {entries.length === 0 ? (
        <p className="px-1 text-[length:var(--kind-text-sm)] text-[var(--kind-color-muted)]">
          Empty. Files fx writes, and files you attach, show up here.
        </p>
      ) : null}
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
                  <ConversationEmptyTitle>What should fx build?</ConversationEmptyTitle>
                  <ConversationEmptyDescription>
                    fx works in /workspace, in this tab. Attach files to start from your own. Writes and shell
                    commands wait for your approval.
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
            mentions={mentions}
            maxSize={1024 * 1024}
            disabled={jspi === false}
          >
            <ComposerAttachments />
            <ComposerInput
              aria-label="Prompt"
              placeholder={
                running ? "Steer the running turn, then press Enter" : "Ask fx. Type @ to mention a file"
              }
              onKeyDownCapture={steerOnEnter}
            >
              <ComposerTriggerMenu />
            </ComposerInput>
            <div className="flex min-w-0 flex-wrap items-center gap-1.5" style={{ gridArea: "attach" }}>
              <ComposerAttach />
              <ModelControl
                models={models}
                model={model}
                onModelChange={setModel}
                levels={LEVELS}
                effort={effort}
                onEffortChange={setEffort}
                disabled={running || connection.kind === "mock"}
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
