import type { Answers, QueueItem, SettingsValues } from "@kind-ui/agent-ui";
import { type AttachmentItem, createConversationController, type UploadItem } from "@kind-ui/agent-ui/core";
import type { JSX } from "@solidjs/web";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, For, Match, onSettled, Show, Switch } from "solid-js";
import { Action } from "../../../../src/solid/action.js";
import { AddMenu } from "../../../../src/solid/add-menu.js";
import { ApprovalMode } from "../../../../src/solid/approval-mode.js";
import { Attachments } from "../../../../src/solid/attachments.js";
import { ChainOfThought } from "../../../../src/solid/chain-of-thought.js";
import { Checkpoint } from "../../../../src/solid/checkpoint.js";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerRestored,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "../../../../src/solid/composer.js";
import { Confirmation } from "../../../../src/solid/confirmation.js";
import { ConnectionStatus } from "../../../../src/solid/connection-status.js";
import { ContextBar } from "../../../../src/solid/context-bar.js";
import { ContextMeter } from "../../../../src/solid/context-meter.js";
import {
  Conversation,
  ConversationContent,
  ConversationError,
  ConversationJump,
  ConversationLoading,
  ConversationMarks,
  ConversationRow,
  ConversationSkeleton,
  ConversationViewport,
} from "../../../../src/solid/conversation.js";
import { ConversationSearch } from "../../../../src/solid/conversation-search.js";
import { DaySeparator } from "../../../../src/solid/day-separator.js";
import { Dictation } from "../../../../src/solid/dictation.js";
import { Diff } from "../../../../src/solid/diff.js";
import { Document } from "../../../../src/solid/document.js";
import { Feedback } from "../../../../src/solid/feedback.js";
import { FileTree } from "../../../../src/solid/file-tree.js";
import { GeneratedImage } from "../../../../src/solid/generated-image.js";
import { GuardrailNotice } from "../../../../src/solid/guardrail-notice.js";
import { Handoff } from "../../../../src/solid/handoff.js";
import { InlineCitation } from "../../../../src/solid/inline-citation.js";
import { KindToolbar, KindToolbarButton } from "../../../../src/solid/internal/toolbar.js";
import { Loader } from "../../../../src/solid/loader.js";
import { Markdown } from "../../../../src/solid/markdown.js";
import {
  Message,
  MessageAuthor,
  MessageAvatar,
  MessageBranch,
  MessageBranchLabel,
  MessageBranchNext,
  MessageBranchPrevious,
  MessageContent,
  MessageCopy,
  MessageDelivery,
  MessageEdit,
  MessageEditor,
  MessageHeader,
  MessageOutcome,
  MessageRegenerate,
  MessageRetrying,
  MessageToolbar,
} from "../../../../src/solid/message.js";
import { ModelControl } from "../../../../src/solid/model-control.js";
import { ModelSelector } from "../../../../src/solid/model-selector.js";
import { Notice } from "../../../../src/solid/notice.js";
import { Picker } from "../../../../src/solid/picker.js";
import { Plan } from "../../../../src/solid/plan.js";
import { Question as QuestionForm } from "../../../../src/solid/question.js";
import { Queue } from "../../../../src/solid/queue.js";
import { Reasoning } from "../../../../src/solid/reasoning.js";
import { ReasoningEffort } from "../../../../src/solid/reasoning-effort.js";
import { Selection } from "../../../../src/solid/selection.js";
import { SettingsMenu } from "../../../../src/solid/settings-menu.js";
import { ShareDialog } from "../../../../src/solid/share-dialog.js";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "../../../../src/solid/sidebar.js";
import { Sources } from "../../../../src/solid/sources.js";
import { StackTrace } from "../../../../src/solid/stack-trace.js";
import { Status } from "../../../../src/solid/status.js";
import {
  Step,
  StepContent,
  StepIcon,
  StepList,
  StepListItem,
  StepTitle,
  StepTrigger,
} from "../../../../src/solid/step.js";
import { StepGroup } from "../../../../src/solid/step-group.js";
import { StreamingText } from "../../../../src/solid/streaming-text.js";
import {
  Subagent,
  SubagentContent,
  SubagentIcon,
  SubagentMeta,
  SubagentRoot,
  SubagentTitle,
  SubagentTrigger,
} from "../../../../src/solid/subagent.js";
import { Suggestion } from "../../../../src/solid/suggestion.js";
import { Task } from "../../../../src/solid/task.js";
import { Terminal } from "../../../../src/solid/terminal.js";
import { TestResults } from "../../../../src/solid/test-results.js";
import { ThinkingIndicator } from "../../../../src/solid/thinking-indicator.js";
import { ThreadList } from "../../../../src/solid/thread-list.js";
import { ThreadSearch } from "../../../../src/solid/thread-search.js";
import { Tool } from "../../../../src/solid/tool.js";
import { Transcript } from "../../../../src/solid/transcript.js";
import { TypingIndicator } from "../../../../src/solid/typing-indicator.js";
import { Uploader } from "../../../../src/solid/uploader.js";
import { addItems } from "../../shared/add-menu.js";
import {
  agentDrafts,
  agentHost,
  approvalCall,
  chainSteps,
  draftKey,
  files,
  filler,
  moveItem,
  planItems,
  question,
  queueItems,
  replies,
  selectionActions,
  shellMessages,
  steps,
  taskItems,
  thoughts,
  toolCalls,
} from "../../shared/agent.js";
import { learnMoreHref, modes } from "../../shared/approval-mode.js";
import { commands, mentions } from "../../shared/composer.js";
import { steerQueue } from "../../shared/composer-steer.js";
import { contextChips } from "../../shared/context-bar.js";
import { context } from "../../shared/context-meter.js";
import { dictationHost } from "../../shared/dictation.js";
import { after, before } from "../../shared/diff.js";
import { downloads, readme } from "../../shared/document.js";
import { expose } from "../../shared/expose.js";
import { entries } from "../../shared/file-tree.js";
import { lighthouse, size } from "../../shared/generated-image.js";
import { handoffs } from "../../shared/handoff.js";
import { answer } from "../../shared/markdown.js";
import {
  author,
  delivered,
  outcomeError,
  outcomeText,
  regenerateOptions,
  retrying,
} from "../../shared/message.js";
import {
  levels as controlLevels,
  models as controlModels,
  settings as controlSettings,
} from "../../shared/model-control.js";
import { levels, modelActions, models } from "../../shared/model-selector.js";
import { guardrails, type NoticeData, notices } from "../../shared/notice.js";
import { placeActions, places } from "../../shared/picker.js";
import { deployQuestions } from "../../shared/question.js";
import { initialValues, settings } from "../../shared/settings-menu.js";
import { shareLink } from "../../shared/share-dialog.js";
import { sources } from "../../shared/sources.js";
import { typeErrorStack } from "../../shared/stack-trace.js";
import { agentLabels, agents } from "../../shared/step-group.js";
import { suggestions } from "../../shared/suggestion.js";
import { installRun } from "../../shared/terminal.js";
import { suites } from "../../shared/test-results.js";
import { NOW, threads } from "../../shared/thread-list.js";
import { retryRows } from "../../shared/tool-retry.js";
import { standup } from "../../shared/transcript.js";
import { uploads } from "../../shared/uploader.js";

const drafts = agentDrafts();
const host = agentHost();
const dictation = dictationHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Steps() {
  return (
    <StepList aria-label="Agent steps">
      <For each={steps}>
        {(step) => (
          <Step
            status="complete"
            defaultOpen={step.open}
            onOpenChange={(_open, details) => host.change("step", details)}
          >
            <StepListItem value={step.id} render={StepTrigger}>
              <StepIcon />
              <StepTitle>{step.title}</StepTitle>
            </StepListItem>
            <StepContent>
              <p>{step.body}</p>
            </StepContent>
          </Step>
        )}
      </For>
    </StepList>
  );
}

function Question() {
  const [text, setText] = createSignal(question);
  return (
    <Message aria-label="Question" messageRole="user" text={text()} onEdit={(next: string) => setText(next)}>
      <MessageContent>{text()}</MessageContent>
      <MessageEditor />
      <MessageToolbar>
        <KindToolbar aria-label="Question actions">
          <MessageEdit>
            <KindToolbarButton aria-label="Edit" />
          </MessageEdit>
        </KindToolbar>
      </MessageToolbar>
    </Message>
  );
}

const regenerateButton = (props: Record<string, unknown>) => (
  <KindToolbarButton aria-label="Regenerate" {...props} />
);

function Reply() {
  const [branch, setBranch] = createSignal(0);
  const text = () => replies[branch()] as string;
  return (
    <Message
      aria-label="Reply"
      messageRole="assistant"
      text={text()}
      branchIndex={branch()}
      branchCount={replies.length}
      onBranchChange={(index, details) => {
        if (host.change("message", details)) setBranch(index);
      }}
      onRegenerate={() => host.calls.push("regenerate")}
    >
      <MessageContent>
        <Markdown source={branch() === 0 ? answer : text()} />
      </MessageContent>
      <MessageToolbar>
        <MessageBranch>
          <MessageBranchPrevious />
          <MessageBranchLabel />
          <MessageBranchNext />
        </MessageBranch>
        <KindToolbar aria-label="Reply actions">
          <MessageCopy>
            <KindToolbarButton aria-label="Copy" />
          </MessageCopy>
          <MessageRegenerate>{regenerateButton}</MessageRegenerate>
        </KindToolbar>
      </MessageToolbar>
    </Message>
  );
}

function Chat() {
  return (
    <Conversation aria-label="Chat" messageCount={filler.length + 2} class="h-[24rem]">
      <ConversationViewport>
        <ConversationContent>
          <For each={filler}>
            {(line, index) => (
              <ConversationRow value={`f${index()}`} index={index()}>
                <p>{line}</p>
              </ConversationRow>
            )}
          </For>
          <ConversationRow value="question" index={filler.length}>
            <Question />
          </ConversationRow>
          <ConversationRow value="reply" index={filler.length + 1}>
            <Reply />
          </ConversationRow>
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
  );
}

function Files() {
  const [items, setItems] = createSignal<readonly AttachmentItem[]>(files);
  return (
    <Attachments
      aria-label="Files"
      items={items()}
      onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
    />
  );
}

function Uploads() {
  const [items, setItems] = createSignal<readonly UploadItem[]>(uploads);
  const callbacks = host.uploads((change) => setItems((current) => change(current)));
  return <Uploader aria-label="Uploads" items={items()} {...callbacks} />;
}

function Activity(props: { confirm: boolean }) {
  const [queue, setQueue] = createSignal<readonly QueueItem[]>(queueItems);
  return (
    <div class="flex w-[40rem] flex-col gap-8 p-6">
      <section data-case="status">
        <Status id="status" status="running" label="Deploying" />
      </section>
      <section data-case="reasoning">
        <Reasoning
          id="reasoning"
          status="complete"
          durationSeconds={3}
          text={thoughts}
          onOpenChange={(_open, details) => host.change("reasoning", details)}
        />
      </section>
      <section data-case="tool" class="flex flex-col gap-2">
        <For each={toolCalls}>{(call) => <Tool id={call.toolCallId} call={call} />}</For>
      </section>
      <section data-case="chain-of-thought">
        <ChainOfThought
          id="chain"
          label="Researching retries"
          status="complete"
          steps={chainSteps}
          onOpenStepsChange={(_steps, details) => host.change("chain", details)}
        />
      </section>
      <section data-case="task">
        <Task id="task" label="Patching the client" items={taskItems} />
      </section>
      <section data-case="plan">
        <Plan
          id="plan"
          label="Retry plan"
          status="awaiting-input"
          items={planItems}
          agentConfirm={props.confirm}
          onAccept={() => {
            host.calls.push("accept");
          }}
        />
      </section>
      <section data-case="subagent">
        <Subagent
          id="subagent"
          agentName="Code reviewer"
          status="running"
          agentConfirm={props.confirm}
          onCancel={() => {
            host.calls.push("cancel");
          }}
        />
      </section>
      <section data-case="queue">
        <Queue
          id="queue"
          label="Queue"
          items={queue()}
          onReorder={(id, details) => {
            if (host.change("queue", details)) setQueue((items) => moveItem(items, id, details.index));
          }}
          onRemove={(id) => {
            host.calls.push(`remove:${id}`);
            setQueue((items) => items.filter((item) => item.id !== id));
          }}
        />
      </section>
    </div>
  );
}

function Foundation() {
  return (
    <div class="flex w-[40rem] flex-col gap-8 p-6">
      <section data-case="step">
        <Steps />
      </section>
      <section data-case="conversation">
        <Chat />
      </section>
      <section data-case="composer">
        <Composer
          aria-label="Compose"
          mentions={mentions}
          commands={commands}
          onSubmit={host.submit}
          onStop={host.stop}
          onValueChange={(_value, details) => host.change("composer", details)}
        >
          <ComposerAttachments />
          <ComposerInput aria-label="Prompt">
            <ComposerTriggerMenu />
          </ComposerInput>
          <ComposerAttach />
          <ComposerSubmit />
          <ComposerStop />
        </Composer>
      </section>
      <section data-case="attachments">
        <Files />
      </section>
      <section data-case="uploader">
        <Uploads />
      </section>
      <section data-case="indicators" class="flex flex-col items-start gap-4">
        <Loader />
        <ThinkingIndicator />
        <TypingIndicator />
        <p>
          <StreamingText text="Streaming text fades in" />
        </p>
      </section>
    </div>
  );
}

const rateLimited = notices.find((notice) => notice.id === "warning") as NoticeData;

function HumanInput(props: { confirm: boolean; wave: 3 | 4 | 5 }) {
  const [submitted, setSubmitted] = createSignal<Answers>();
  const [shown, setShown] = createSignal({ notice: true, guardrail: true });
  const remove = (part: "notice" | "guardrail") => () => {
    host.calls.push("dismiss");
    setShown((current) => ({ ...current, [part]: false }));
  };
  return (
    <div class="flex w-[40rem] flex-col gap-8 p-6">
      <section data-case="tool-approval">
        <Tool
          id="delete_file"
          call={approvalCall}
          onApprove={host.decide("approve")}
          onDeny={host.decide("deny")}
        />
      </section>
      <section data-case="confirmation">
        <Confirmation
          id="confirmation"
          label="Run the migration?"
          approval={{ approvalId: "migrate", generation: 1, state: "requested" }}
          onApprove={host.decide("approve")}
          onDeny={host.decide("deny")}
        />
      </section>
      <section data-case="question">
        <QuestionForm
          id="question"
          label="Deploy questions"
          questions={deployQuestions}
          agentConfirm={props.confirm}
          onValueChange={(_value, details) => host.change("question", details)}
          submitted={submitted()}
          onSubmit={(answers, details) =>
            host
              .decide("submit")(answers, details)
              .then(() => {
                setSubmitted(answers);
              })
          }
          onSkip={(answers, details) =>
            host
              .decide("skip")(answers, details)
              .then(() => {
                setSubmitted({});
              })
          }
        />
      </section>
      <section data-case="checkpoint">
        <Checkpoint
          id="checkpoint"
          description="Before editing auth.ts"
          agentConfirm={props.confirm}
          onOpenChange={(_open, details) => host.change("checkpoint", details)}
          onRestore={host.decide("restore")}
        />
      </section>
      <section data-case="model-selector" class="flex items-center gap-2">
        <ModelSelector
          id="model"
          models={models}
          defaultValue="gpt-5"
          onValueChange={(_value, details) => host.change("model", details)}
          {...(props.wave === 5 ? { actions: modelActions, onAction: host.decide("model-action") } : {})}
        />
        <ReasoningEffort
          id="effort"
          levels={levels}
          defaultValue="medium"
          onValueChange={(_value, details) => host.change("effort", details)}
        />
        <ContextMeter
          id="context"
          {...context}
          onOpenChange={(_open, details) => host.change("context", details)}
        />
      </section>
      <section data-case="suggestion">
        <Suggestion id="suggestion" suggestions={suggestions} onPick={host.decide("pick")} />
      </section>
      <section data-case="feedback">
        <Feedback
          id="feedback"
          onRatingChange={(_rating, details) => host.change("feedback", details)}
          onComment={host.decide("comment")}
        />
      </section>
      <section id="notice" data-case="notice">
        <Show when={shown().notice}>
          <Notice variant={rateLimited.variant} label={rateLimited.label} onDismiss={remove("notice")}>
            {rateLimited.text}
          </Notice>
        </Show>
      </section>
      <section id="guardrail" data-case="guardrail-notice">
        <Show when={shown().guardrail}>
          <GuardrailNotice
            {...guardrails.blocking}
            blocking
            onOpenChange={(_open, details) => host.change("guardrail", details)}
            onDismiss={remove("guardrail")}
          />
        </Show>
      </section>
    </div>
  );
}

function Artifacts() {
  return (
    <div class="flex w-[40rem] flex-col gap-8 p-6">
      <section data-case="sources">
        <Sources
          id="sources"
          sources={sources}
          onOpenChange={(_open, details) => host.change("sources", details)}
        />
      </section>
      <section data-case="inline-citation">
        <p>
          Back off when you hit a limit{" "}
          <InlineCitation
            id="citation"
            sources={sources}
            onOpenChange={(_open, details) => host.change("citation", details)}
          />
          .
        </p>
      </section>
      <section data-case="document">
        <Document
          id="document"
          label="README.md"
          content={readme}
          downloads={downloads}
          onOpenChange={(_open, details) => host.change("document", details)}
          onCopy={host.decide("copy")}
          onDownload={host.decide("download")}
        />
      </section>
      <section data-case="generated-image">
        <GeneratedImage
          id="image"
          alt="A lighthouse at dusk"
          src={lighthouse}
          {...size}
          onOpenChange={(_open, details) => host.change("image", details)}
          onDownload={host.decide("download")}
        />
      </section>
      <section data-case="file-tree">
        <FileTree
          id="file-tree"
          entries={entries}
          defaultExpanded={["src"]}
          onValueChange={(_value, details) => host.change("file-tree", details)}
          onExpandedChange={(_expanded, details) => host.change("file-tree", details)}
          onSelect={host.decide("select")}
        />
      </section>
      <section data-case="terminal">
        <Terminal
          id="terminal"
          command="npm install"
          output={installRun}
          exitCode={0}
          durationSeconds={3}
          onOpenChange={(_open, details) => host.change("terminal", details)}
          onCopy={host.decide("copy")}
        />
      </section>
      <section data-case="stack-trace">
        <StackTrace
          id="stack-trace"
          stack={typeErrorStack}
          onOpenChange={(_open, details) => host.change("stack-trace", details)}
          onShowLibraryFramesChange={(_show, details) => host.change("stack-trace", details)}
          onCopy={host.decide("copy")}
          onOpenFrame={host.decide("openFrame")}
        />
      </section>
      <section data-case="test-results">
        <TestResults
          id="test-results"
          suites={suites}
          defaultOpen
          onOpenChange={(_open, details) => host.change("test-results", details)}
          onFilterChange={(_filter, details) => host.change("test-results", details)}
          onExpandedChange={(_expanded, details) => host.change("test-results", details)}
        />
      </section>
      <section data-case="transcript">
        <Transcript
          id="transcript"
          segments={standup}
          onQueryChange={(_query, details) => host.change("transcript", details)}
          onSeek={host.decide("seek")}
        />
      </section>
      <section data-case="selection">
        <Selection
          id="selection"
          actions={selectionActions}
          onAction={host.decide("run")}
          onDismiss={host.decide("dismiss")}
        >
          <p id="selection-text">
            Rate limits reset every hour. Each response carries the remaining count in its headers.
          </p>
        </Selection>
      </section>
      <section data-case="action">
        <Action
          id="action"
          label="Explain"
          status="running"
          quote="Rate limits reset every hour."
          result="The limit resets on the hour."
          onOpenChange={(_open, details) => host.change("action", details)}
        />
      </section>
    </div>
  );
}

function Composing(props: { confirm: boolean }) {
  const [settingValues, setSettingValues] = createSignal<SettingsValues>(initialValues);
  const [mode, setMode] = createSignal("ask");
  const [chips, setChips] = createSignal(contextChips(4));
  onSettled(() => expose({ kindDictation: dictation.host }));
  return (
    <div class="flex w-[40rem] flex-col gap-8 p-6">
      <section id="picker" data-case="picker">
        <Picker
          label="Work in"
          items={places}
          actions={placeActions}
          defaultValue="kind-ui/agent-ui"
          onValueChange={(_value, details) => host.change("picker", details)}
          onAction={host.decide("picker-action")}
        />
      </section>
      <section id="add-menu" data-case="add-menu">
        <AddMenu items={addItems} onAction={host.decide("add")} />
      </section>
      <section id="settings-menu" data-case="settings-menu">
        <SettingsMenu
          settings={settings}
          values={settingValues()}
          onValuesChange={(next, details) => {
            if (host.change("settings", details)) setSettingValues(next);
          }}
        />
      </section>
      <section id="approval-mode" data-case="approval-mode">
        <ApprovalMode
          modes={modes}
          value={mode()}
          learnMoreHref={learnMoreHref}
          agentConfirm={props.confirm}
          onValueChange={(next, details) => {
            if (host.change("approval", details)) setMode(next);
          }}
        />
      </section>
      <section id="model-control" data-case="model-control">
        <ModelControl
          models={controlModels}
          levels={controlLevels}
          settings={controlSettings}
          defaultModel="opus"
          defaultEffort="medium"
          defaultValues={{ fast: false, context: "1m" }}
          onModelChange={(_value, details) => host.change("model-control", details)}
          onEffortChange={(_value, details) => host.change("model-control", details)}
          onValuesChange={(_values, details) => host.change("model-control", details)}
          actions={modelActions}
          onAction={host.decide("model-control-action")}
        />
      </section>
      <section id="context-bar" data-case="context-bar" style={{ width: "360px" }}>
        <ContextBar
          chips={chips()}
          style={{ "--kind-context-chip-max-width": "120px" } as JSX.CSSProperties}
          onRemove={(id, details) => {
            if (host.change("context-bar", details)) setChips((all) => all.filter((chip) => chip.id !== id));
          }}
        />
      </section>
      <section id="dictation" data-case="dictation" style={{ width: "320px" }}>
        <Dictation source={dictation.source} agentConfirm={props.confirm} onText={host.decide("dictate")} />
      </section>
      <section id="answer" data-case="message">
        <Message
          aria-label="Answer"
          messageRole="assistant"
          text={replies[0]}
          regenerateOptions={regenerateOptions}
          onRegenerate={(text, details) => {
            host.decide(`regenerate:${details.optionId ?? ""}`)(text, details);
          }}
        >
          <MessageContent>{replies[0]}</MessageContent>
          <MessageToolbar>
            <KindToolbar aria-label="Answer actions">
              <MessageCopy>
                <KindToolbarButton aria-label="Copy" />
              </MessageCopy>
              <MessageRegenerate>{regenerateButton}</MessageRegenerate>
            </KindToolbar>
          </MessageToolbar>
        </Message>
      </section>
      <section id="draft" data-case="composer">
        <Composer
          aria-label="Draft"
          draftKey={draftKey}
          draftStorage={drafts}
          onSubmit={host.submit}
          onValueChange={(_value, details) => {
            if (details.reason !== "restore") host.change("draft", details);
          }}
        >
          <ComposerInput aria-label="Draft prompt" />
          <ComposerRestored />
          <ComposerSubmit />
        </Composer>
      </section>
    </div>
  );
}

function Shell(props: { confirm: boolean }) {
  const [link, setLink] = createSignal<string | undefined>();
  const controller = createConversationController();
  const [marks, setMarks] = createSignal<readonly number[]>([]);
  const [history, setHistory] = createSignal<"error" | "loading">("error");
  const settle = (action: string, set: string | undefined) => (details: { source: string }) =>
    host
      .decide(action)(details)
      .then(() => {
        setLink(set);
      });
  return (
    <div class="flex w-[40rem] flex-col gap-8 p-6">
      <section id="thread-list" data-case="thread-list" class="flex h-[22rem] flex-col">
        <ThreadList
          threads={threads}
          value="t2"
          now={NOW}
          timeZone="UTC"
          onSelect={(_id, details) => host.change("thread-select", details)}
          onNew={host.decide("thread-new")}
          onRename={host.decide("thread-rename")}
          onPinChange={host.decide("thread-pin")}
          onShare={host.decide("thread-share")}
          onDelete={host.decide("thread-delete")}
        />
      </section>
      <section id="thread-search" data-case="thread-search">
        <ThreadSearch
          threads={threads}
          now={NOW}
          timeZone="UTC"
          onOpenChange={(_open, details) => host.change("thread-search", details)}
          onQueryChange={(_query, details) => host.change("thread-search-query", details)}
          onSelect={(_id, details) => host.change("thread-search-select", details)}
          onNew={host.decide("thread-search-new")}
        />
      </section>
      <section id="sidebar" data-case="sidebar">
        <Sidebar
          label="History"
          class="h-48"
          onOpenChange={(_open, details) => host.change("sidebar", details)}
        >
          <SidebarPanel>
            <p class="p-2">Earlier chats</p>
          </SidebarPanel>
          <SidebarHandle />
          <SidebarInset>
            <SidebarTrigger />
          </SidebarInset>
        </Sidebar>
      </section>
      <section id="share" data-case="share-dialog">
        <ShareDialog
          defaultVisibility="link"
          link={link()}
          agentConfirm={props.confirm}
          onOpenChange={(_open, details) => host.change("share", details)}
          onVisibilityChange={(_value, details) => host.change("share-visibility", details)}
          onCreateLink={settle("share-create", shareLink)}
          onRevoke={settle("share-revoke", undefined)}
          onCopy={host.decide("share-copy")}
        />
      </section>
      <section id="day" data-case="day-separator">
        <DaySeparator date="2026-11-18T09:30:00Z" timeZone="UTC" />
      </section>
      <section id="failed" data-case="message">
        <Message
          aria-label="Failed answer"
          messageRole="assistant"
          status="error"
          error={outcomeError}
          text={outcomeText}
          author={author}
          onRetry={host.decide("message-retry")}
        >
          <MessageAvatar />
          <MessageHeader>
            <MessageAuthor />
          </MessageHeader>
          <MessageContent>{outcomeText}</MessageContent>
          <MessageOutcome />
        </Message>
      </section>
      <section id="earlier" data-case="conversation">
        <Conversation
          aria-label="Earlier chat"
          messageCount={0}
          status={history()}
          onRetry={(details) =>
            host
              .decide("conversation-retry")(details)
              .then(() => {
                setHistory("loading");
              })
          }
          class="h-40"
        >
          <ConversationViewport>
            <ConversationContent>
              <ConversationSkeleton />
              <ConversationLoading />
              <ConversationError />
            </ConversationContent>
          </ConversationViewport>
        </Conversation>
      </section>
      <section id="connection" data-case="connection-status" class="relative h-16">
        <ConnectionStatus state="offline" onRetry={host.decide("connection-retry")} />
      </section>
      <section id="find" data-case="conversation-search" class="relative">
        <ConversationSearch
          messages={shellMessages}
          conversation={controller}
          defaultOpen
          motion="none"
          onMarksChange={(next) => setMarks(next)}
          onQueryChange={(_query, details) => host.change("find-query", details)}
          onOpenChange={(_open, details) => host.change("find", details)}
        />
        <Conversation
          aria-label="Found chat"
          messageCount={shellMessages.length}
          controller={controller}
          marks={marks()}
          motion="none"
          class="h-48"
        >
          <ConversationViewport>
            <ConversationContent>
              <For each={shellMessages}>
                {(message, index) => (
                  <ConversationRow value={message.id} index={index()}>
                    <p>{message.text}</p>
                  </ConversationRow>
                )}
              </For>
            </ConversationContent>
          </ConversationViewport>
          <ConversationMarks />
        </Conversation>
      </section>
    </div>
  );
}

const billing = handoffs.billing as (typeof handoffs)[string];
const requested = (approvalId: string) => ({ approvalId, generation: 1, state: "requested" as const });

function Ops(props: { confirm: boolean }) {
  const [queue, setQueue] = createSignal<readonly QueueItem[]>(steerQueue);
  const failed = retryRows.failed;
  return (
    <div class="flex w-[40rem] flex-col gap-8 p-6">
      <section id="steer" data-case="composer-steer">
        <Composer
          aria-label="Steer"
          running
          onSubmit={host.submit}
          onStop={host.stop}
          onSteer={host.decide("composer-steer")}
        >
          <ComposerInput aria-label="Steer prompt" />
          <ComposerAttach />
          <ComposerSubmit />
          <ComposerSteerMenu />
          <ComposerStop />
        </Composer>
      </section>
      <section id="next" data-case="queue">
        <Queue
          label="Next up"
          items={queue()}
          onSend={(id, details) =>
            host
              .decide("queue-send")(details)
              .then(() => setQueue((items) => items.filter((item) => item.id !== id)))
          }
        />
      </section>
      <section id="queued" data-case="message">
        <Message
          aria-label="Queued message"
          messageRole="user"
          text={delivered.queued}
          delivery="queued"
          onWithdraw={host.decide("message-withdraw")}
        >
          <MessageHeader>
            <MessageDelivery />
          </MessageHeader>
          <MessageContent>{delivered.queued}</MessageContent>
        </Message>
      </section>
      <section id="retrying" data-case="message">
        <Message aria-label="Retrying answer" status="streaming" text={delivered.answer} retry={retrying}>
          <MessageContent>{delivered.answer}</MessageContent>
          <MessageRetrying />
          <MessageOutcome />
        </Message>
      </section>
      <section id="run" data-case="terminal">
        <Terminal
          command="npm test"
          output=""
          approval={requested("run")}
          approvalReason
          onApprove={host.decide("terminal-approve")}
          onDeny={host.decide("terminal-deny")}
          onAlwaysAllow={host.decide("terminal-always")}
        />
      </section>
      <section id="tool-retry" data-case="tool">
        <Tool
          call={failed.call}
          error={failed.error}
          defaultOpen={failed.defaultOpen}
          onRetry={host.decide("tool-retry")}
        />
      </section>
      <section id="diff" data-case="diff">
        <Diff
          file={{ path: "src/values.ts", language: "ts" }}
          before={before}
          after={after}
          agentConfirm={props.confirm}
          onAccept={host.decide("diff-accept")}
          onRevert={host.decide("diff-revert")}
        />
      </section>
      <section id="group" data-case="step-group">
        <StepGroup items={agents} groupLabels={agentLabels} onCancel={host.decide("group-cancel")}>
          <StepList aria-label="Agents">
            <For each={agents}>
              {(row) => (
                <SubagentRoot agentName={row.name} status={row.status} agentConfirm={false}>
                  <StepListItem value={row.id} render={SubagentTrigger}>
                    <SubagentIcon />
                    <SubagentTitle />
                    <SubagentMeta />
                  </StepListItem>
                  <SubagentContent>
                    <p>{row.task}</p>
                  </SubagentContent>
                </SubagentRoot>
              )}
            </For>
          </StepList>
        </StepGroup>
      </section>
      <section id="handoff" data-case="handoff">
        <Handoff
          from={billing.from}
          to={billing.to}
          reason={billing.reason}
          status="pending"
          approval={requested("billing")}
          onApprove={host.decide("handoff-approve")}
          onDeny={host.decide("handoff-deny")}
          onAlwaysAllow={host.decide("handoff-always")}
        />
      </section>
    </div>
  );
}

type Wave = 2 | 3 | 4 | 5 | 6 | "7a";

function Confirmable(props: { wave: Wave }) {
  const [confirm, setConfirm] = createSignal(true);
  host.confirm = (on) => setConfirm(on);
  // The bridge lists 100 components at most, which the Wave 5 page nearly fills, so Wave 6 and Wave 7a each sit
  // beside Wave 1 alone.
  const wave = () => (typeof props.wave === "number" ? props.wave : 0);
  return (
    <Switch>
      <Match when={props.wave === 6}>
        <Shell confirm={confirm()} />
      </Match>
      <Match when={props.wave === "7a"}>
        <Ops confirm={confirm()} />
      </Match>
      <Match when>
        <Activity confirm={confirm()} />
        <Show when={wave() >= 3}>
          <HumanInput confirm={confirm()} wave={wave() === 5 ? 5 : 3} />
        </Show>
        <Show when={wave() >= 4}>
          <Artifacts />
        </Show>
        <Show when={wave() === 5}>
          <Composing confirm={confirm()} />
        </Show>
      </Match>
    </Switch>
  );
}

function Page(props: { wave: Wave }) {
  return (
    <>
      <Foundation />
      <Confirmable wave={props.wave} />
    </>
  );
}

export const cases = {
  all: () => <Foundation />,
  "wave-2": () => <Page wave={2} />,
  "wave-3": () => <Page wave={3} />,
  "wave-4": () => <Page wave={4} />,
  "wave-5": () => <Page wave={5} />,
  "wave-6": () => <Page wave={6} />,
  "wave-7a": () => <Page wave="7a" />,
};
