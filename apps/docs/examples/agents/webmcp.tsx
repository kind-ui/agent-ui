"use client";
import { createMCPClient, Experimental_WebMCPTransport as WebMCPTransport } from "@ai-sdk/mcp";
import type { ApprovalModeOption, EffortLevel, ModelOption, ToolCall } from "@kind-ui/agent-ui";
import {
  type AgentAction,
  type AgentComponent,
  type AgentStep,
  createAgent,
  registerTools,
} from "@ui-sdk/react/agent";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { ApprovalMode } from "@/components/ui/approval-mode";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/composer";
import { KindButton } from "@/components/ui/internal/button";
import { ModelControl } from "@/components/ui/model-control";
import { Tool } from "@/components/ui/tool";
import { AnthropicLogo, OpenAILogo } from "../model-selector/logos";
import { pageModelContext } from "./model-context";
import { scriptedTurn } from "./scripted-model";

const models: ModelOption<ReactElement>[] = [
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: <OpenAILogo /> },
  { id: "gpt-6.1-terra", name: "GPT-6.1 Terra", group: "OpenAI", icon: <OpenAILogo /> },
];

const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "xhigh", label: "Extra High" },
];

const modes: ApprovalModeOption[] = [
  { value: "ask", label: "Ask every time", description: "Approve each tool call" },
  { value: "edits", label: "Allow edits", description: "Edit files without asking" },
  { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
];

const request = { approvalId: "approval_1", generation: 0 };

const requested: ToolCall = {
  toolCallId: "call_1",
  name: "delete_branch",
  dynamic: false,
  input: { state: "ready", value: { branch: "old-retry" } },
  approval: { ...request, state: "requested" },
};

const instruction = "Switch to Opus, high effort, and approve the tool";

type Line =
  | { kind: "you" | "reply"; text: string }
  | { kind: "call"; tool: string; text: string }
  | { kind: "result"; text: string; failed?: boolean };

type Question = { step: AgentAction; answer: (allowed: boolean) => void };

// One bridge for the page, created in the browser the first time the demo mounts.
let bridge: ReturnType<typeof createAgent> | undefined;

// Reads a step as `model-control.setModel("claude-opus-5.5")`, naming the component the last snapshot gave its ref.
function describe(step: AgentStep, kinds: Map<string, string>) {
  const kind = kinds.get(step.ref)?.replace(/^kind-/, "") ?? step.ref;
  return `${kind}.${step.action}(${(step.args ?? []).map((arg) => JSON.stringify(arg)).join(", ")})`;
}

function summary(tool: string, value: unknown) {
  if (tool === "snapshot" && Array.isArray(value)) return `${value.length} components`;
  const result = value as { ok?: boolean; error?: { message: string } };
  return result.ok ? "ok" : (result.error?.message ?? "failed");
}

export default function WebMCPDemo() {
  const [model, setModel] = useState<string | null>("claude-sonnet-5.5");
  const [effort, setEffort] = useState("medium");
  const [mode, setMode] = useState("ask");
  const [call, setCall] = useState(requested);
  const [lines, setLines] = useState<(Line & { id: number })[]>([]);
  const [status, setStatus] = useState("Connecting…");
  const [question, setQuestion] = useState<Question | null>(null);
  const [round, setRound] = useState(0);
  const client = useRef<Awaited<ReturnType<typeof createMCPClient>> | null>(null);
  const turn = useRef(new AbortController());
  const kinds = useRef(new Map<string, string>());

  const lineId = useRef(0);
  const log = (line: Line) => setLines((current) => [...current, { ...line, id: lineId.current++ }]);

  useEffect(() => {
    const page = pageModelContext();
    if (!page) {
      setStatus("This browser's agent has the tools, but it can't list them for this demo.");
      return;
    }
    bridge ??= createAgent();
    // A step marked `data-agent-confirm` waits for the person's answer below; every other step runs.
    const unregister = registerTools(bridge, {
      allow: (step, { signal }) =>
        !step.confirm ||
        new Promise<boolean>((resolve) => {
          const answer = (allowed: boolean) => {
            setQuestion(null);
            resolve(allowed);
          };
          signal.addEventListener("abort", () => answer(false), { once: true });
          setQuestion({ step, answer });
        }),
    });
    let closed = false;
    createMCPClient({ transport: new WebMCPTransport({ modelContext: page.context }) }).then(
      async (connected) => {
        if (closed) return connected.close();
        client.current = connected;
        const listed = await connected.listTools();
        setStatus(listed.tools.map((tool) => tool.name).join(", "));
      },
    );
    return () => {
      closed = true;
      client.current?.close();
      client.current = null;
      unregister();
      page.uninstall();
    };
  }, []);

  async function callTool(name: "snapshot" | "act", input: object) {
    const connected = client.current;
    if (!connected) throw new Error("The WebMCP client isn't connected.");
    const steps = (input as { steps?: AgentStep[] }).steps;
    log({
      kind: "call",
      tool: name,
      text: steps ? steps.map((step) => describe(step, kinds.current)).join("\n") : "{}",
    });
    const result = await connected.callTool({
      name,
      arguments: input as Record<string, unknown>,
      options: { signal: turn.current.signal },
    });
    const value = result.structuredContent;
    if (name === "snapshot" && Array.isArray(value)) {
      kinds.current = new Map(value.map((entry: AgentComponent) => [entry.ref, entry.component]));
    }
    log({ kind: "result", text: summary(name, value), failed: result.isError === true });
    return value;
  }

  async function send(text: string) {
    turn.current = new AbortController();
    log({ kind: "you", text });
    try {
      log({ kind: "reply", text: await scriptedTurn(text, { models, levels, modes }, callTool) });
    } catch (error) {
      log({ kind: "reply", text: turn.current.signal.aborted ? "Stopped." : String(error) });
    }
  }

  function reset() {
    turn.current.abort();
    setModel("claude-sonnet-5.5");
    setEffort("medium");
    setMode("ask");
    setCall(requested);
    setLines([]);
    setRound((current) => current + 1);
  }

  const decide = (approved: boolean) =>
    setCall((current) => ({
      ...current,
      approval: { ...request, state: "responded", decision: { approved } },
      ...(approved
        ? { output: { state: "available", value: { deleted: "old-retry" } } }
        : { outcome: "denied" }),
    }));

  return (
    <div className="flex flex-col gap-3">
      <Tool call={call} onApprove={() => decide(true)} onDeny={() => decide(false)} />
      <Composer
        key={round}
        aria-label="Message"
        defaultValue={{ text: instruction, tokens: [], attachments: [] }}
        // The person sends from here themselves, so the agent may change the controls inside without asking.
        agentConfirm={false}
        onSubmit={(draft) => send(draft.text)}
        onStop={() => turn.current.abort()}
      >
        <ComposerInput aria-label="Prompt" placeholder="Tell the agent what to change" />
        <div className="flex min-w-0 flex-wrap items-center gap-1.5" style={{ gridArea: "attach" }}>
          <ModelControl
            models={models}
            model={model}
            onModelChange={setModel}
            levels={levels}
            effort={effort}
            onEffortChange={setEffort}
          />
          <ApprovalMode modes={modes} value={mode} onValueChange={setMode} />
        </div>
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
      <section
        aria-label="WebMCP calls"
        data-agent-hidden
        className="flex flex-col gap-2 rounded-[calc(var(--kind-radius)*1.5)] border border-[var(--kind-color-border)] p-3 text-[length:var(--kind-text-sm)]/5"
      >
        <header className="flex min-h-7 items-center justify-between gap-2">
          <span className="font-medium">
            WebMCP
            <span className="ml-2 font-normal text-[var(--kind-color-muted)]">{status}</span>
          </span>
          <KindButton onClick={reset}>Reset</KindButton>
        </header>
        {lines.length === 0 ? (
          <p className="text-[var(--kind-color-muted)]">Press Send, and the calls show here as they run.</p>
        ) : (
          <ol role="log" className="flex flex-col gap-1.5">
            {lines.map((line) => (
              <li
                key={line.id}
                data-line={line.kind}
                className="transition-opacity duration-[var(--kind-duration-base)] starting:opacity-0 motion-reduce:transition-none"
              >
                {line.kind === "call" ? (
                  <div className="flex items-baseline gap-2 font-mono text-[length:var(--kind-text-xs)]/4">
                    <span className="shrink-0 rounded-[var(--kind-radius-full)] bg-[var(--kind-color-hover)] px-1.5">
                      {line.tool}
                    </span>
                    <span className="min-w-0 whitespace-pre-wrap break-words">{line.text}</span>
                  </div>
                ) : line.kind === "result" ? (
                  <p
                    className={`pl-2 font-mono text-[length:var(--kind-text-xs)]/4 ${line.failed ? "text-[var(--kind-color-danger)]" : "text-[var(--kind-color-muted)]"}`}
                  >
                    → {line.text}
                  </p>
                ) : (
                  <p className={line.kind === "you" ? "text-[var(--kind-color-muted)]" : undefined}>
                    {line.kind === "you" ? "You: " : "Agent: "}
                    {line.text}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        {question && (
          <fieldset
            aria-label="The agent asks"
            className="flex flex-wrap items-center gap-2 rounded-[var(--kind-radius)] bg-[var(--kind-color-hover)] p-2"
          >
            <p className="min-w-0 flex-1">
              The agent wants to {question.step.action}: {question.step.label ?? question.step.ref}{" "}
              <span className="text-[var(--kind-color-muted)]">{question.step.confirm}</span>
            </p>
            <KindButton onClick={() => question.answer(false)}>Don't allow</KindButton>
            <KindButton onClick={() => question.answer(true)}>Allow</KindButton>
          </fieldset>
        )}
      </section>
    </div>
  );
}
