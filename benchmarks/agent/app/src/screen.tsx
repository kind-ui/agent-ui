import type { SettingsValues, Thread, ToolCall } from "@kind-ui/agent-ui";
import { ApprovalMode } from "@ui/approval-mode";
import { Composer, ComposerInput, ComposerSubmit } from "@ui/composer";
import { ContextBar } from "@ui/context-bar";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@ui/conversation";
import { Message, MessageContent } from "@ui/message";
import { ModelControl } from "@ui/model-control";
import { Sidebar, SidebarHandle, SidebarInset, SidebarPanel, SidebarTrigger } from "@ui/sidebar";
import { ThreadList } from "@ui/thread-list";
import { Tool } from "@ui/tool";
import { useEffect, useState } from "react";
import {
  chips as initialChips,
  threads as initialThreads,
  type Line,
  levels,
  lines,
  models,
  modes,
  now,
  settings,
  timeZone,
} from "./data";

/** What the grader reads when the agent says it's done. */
export type ScreenState = {
  current: string;
  threads: Thread[];
  model: string | null;
  effort: string;
  mode: string;
  values: SettingsValues;
  chips: string[];
  decisions: Record<string, boolean>;
  sent: string[];
};

const answered = (call: ToolCall, decisions: Record<string, boolean>): ToolCall => {
  const approved = decisions[call.toolCallId];
  if (approved === undefined || !call.approval) return call;
  return { ...call, approval: { ...call.approval, state: "responded", decision: { approved } } };
};

function Row({
  line,
  decisions,
  decide,
}: {
  line: Line;
  decisions: Record<string, boolean>;
  decide: (id: string, approved: boolean) => void;
}) {
  if (line.role === "tool") {
    return (
      <Tool
        call={answered(line.call, decisions)}
        durationSeconds={line.seconds}
        onApprove={() => decide(line.call.toolCallId, true)}
        onDeny={() => decide(line.call.toolCallId, false)}
      />
    );
  }
  return (
    <Message
      aria-label={line.role === "user" ? "Your message" : "Assistant message"}
      messageRole={line.role}
      text={line.text}
    >
      <MessageContent>{line.text}</MessageContent>
    </Message>
  );
}

export function Screen({ onState }: { onState: (state: ScreenState) => void }) {
  const [threads, setThreads] = useState(initialThreads);
  const [current, setCurrent] = useState("export");
  const [model, setModel] = useState<string | null>("claude-sonnet-5.5");
  const [effort, setEffort] = useState("medium");
  const [mode, setMode] = useState("edits");
  const [values, setValues] = useState<SettingsValues>({ search: true, memory: false });
  const [chips, setChips] = useState(initialChips);
  const [decisions, setDecisions] = useState<Record<string, boolean>>({});
  const [sent, setSent] = useState<string[]>([]);

  useEffect(() => {
    onState({
      current,
      threads,
      model,
      effort,
      mode,
      values,
      chips: chips.map((chip) => chip.id),
      decisions,
      sent,
    });
  }, [onState, current, threads, model, effort, mode, values, chips, decisions, sent]);

  const update = (id: string, change: Partial<Thread>) =>
    setThreads((items) => items.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const open = (id: string) => {
    setCurrent(id);
    update(id, { unread: false });
  };
  const decide = (id: string, approved: boolean) => setDecisions((all) => ({ ...all, [id]: approved }));
  const thread = threads.find((item) => item.id === current);
  const rows = lines[current] ?? [];

  return (
    <Sidebar label="Chats" defaultSize="260px" minSize="200px" className="h-dvh w-full overflow-hidden">
      <SidebarPanel>
        <div className="flex h-12 shrink-0 items-center px-4">
          <h2 className="m-0 text-sm font-medium">Chats</h2>
        </div>
        <div className="min-h-0 flex-1 px-2 pb-2">
          <ThreadList
            threads={threads}
            value={current}
            now={now}
            timeZone={timeZone}
            onSelect={(id, details) => {
              details.cancel();
              open(id);
            }}
            onRename={(id, { title }) => update(id, { title })}
            onPinChange={(id, { pinned }) => update(id, { pinned })}
            onDelete={(id) => setThreads((items) => items.filter((item) => item.id !== id))}
          />
        </div>
      </SidebarPanel>
      <SidebarHandle />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--kind-color-border)] px-3">
          <SidebarTrigger />
          <h1 className="m-0 min-w-0 flex-1 truncate text-sm font-medium">{thread?.title}</h1>
        </header>
        <Conversation
          key={current}
          aria-label="Conversation"
          messageCount={rows.length}
          className="min-h-0 flex-1"
        >
          <ConversationViewport>
            <ConversationContent className="mx-auto flex w-full max-w-[var(--kind-chat-max-width)] flex-col gap-4 p-4">
              {rows.map((line, index) => (
                <ConversationRow key={line.id} value={line.id} index={index}>
                  <Row line={line} decisions={decisions} decide={decide} />
                </ConversationRow>
              ))}
            </ConversationContent>
          </ConversationViewport>
          <ConversationJump />
        </Conversation>
        <div className="mx-auto w-full max-w-[var(--kind-chat-max-width)] p-3">
          <Composer aria-label="Message" onSubmit={(draft) => setSent((all) => [...all, draft.text])}>
            <ContextBar
              chips={chips}
              onRemove={(id) => setChips((all) => all.filter((chip) => chip.id !== id))}
            />
            <ComposerInput aria-label="Prompt" placeholder="Ask anything…" />
            <div className="flex min-w-0 flex-wrap items-center gap-1.5" style={{ gridArea: "attach" }}>
              <ModelControl
                models={models}
                model={model}
                onModelChange={setModel}
                levels={levels}
                effort={effort}
                onEffortChange={setEffort}
                settings={settings}
                values={values}
                onValuesChange={setValues}
              />
              <ApprovalMode modes={modes} value={mode} onValueChange={setMode} />
            </div>
            <ComposerSubmit />
          </Composer>
        </div>
      </SidebarInset>
    </Sidebar>
  );
}
