<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";
  import { agentDrafts, agentHost } from "../../shared/agent.js";
  import { dictationHost } from "../../shared/dictation.js";
  import { expose } from "../../shared/expose.js";

  export const variants = ["all", "wave-2", "wave-3", "wave-4", "wave-5", "wave-6"];

  const drafts = agentDrafts();
  const host = agentHost();
  const dictation = dictationHost();
  expose({ kindDictation: dictation.host });

  export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script lang="ts">
  import type { Answers, QueueItem, SettingsValues } from "@kind-ui/agent-ui";
  import type { AttachmentItem, UploadItem } from "@kind-ui/agent-ui/core";
  import { Action } from "../../../../src/svelte/action/index.js";
  import Shell from "./agent/Shell.svelte";
  import { AddMenu } from "../../../../src/svelte/add-menu/index.js";
  import { ApprovalMode } from "../../../../src/svelte/approval-mode/index.js";
  import { Attachments } from "../../../../src/svelte/attachments/index.js";
  import { ChainOfThought } from "../../../../src/svelte/chain-of-thought/index.js";
  import { Checkpoint } from "../../../../src/svelte/checkpoint/index.js";
  import {
    Composer,
    ComposerAttach,
    ComposerAttachments,
    ComposerInput,
    ComposerRestored,
    ComposerStop,
    ComposerSubmit,
    ComposerTriggerMenu,
  } from "../../../../src/svelte/composer/index.js";
  import { Confirmation } from "../../../../src/svelte/confirmation/index.js";
  import { ContextBar } from "../../../../src/svelte/context-bar/index.js";
  import { ContextMeter } from "../../../../src/svelte/context-meter/index.js";
  import {
    Conversation,
    ConversationContent,
    ConversationJump,
    ConversationRow,
    ConversationViewport,
  } from "../../../../src/svelte/conversation/index.js";
  import { Dictation } from "../../../../src/svelte/dictation/index.js";
  import { Document } from "../../../../src/svelte/document/index.js";
  import { Feedback } from "../../../../src/svelte/feedback/index.js";
  import { FileTree } from "../../../../src/svelte/file-tree/index.js";
  import { GeneratedImage } from "../../../../src/svelte/generated-image/index.js";
  import { GuardrailNotice } from "../../../../src/svelte/guardrail-notice/index.js";
  import { InlineCitation } from "../../../../src/svelte/inline-citation/index.js";
  import { KindToolbar, KindToolbarButton } from "../../../../src/svelte/internal/toolbar/index.js";
  import { Loader } from "../../../../src/svelte/loader/index.js";
  import { Markdown } from "../../../../src/svelte/markdown/index.js";
  import {
    Message,
    MessageBranch,
    MessageBranchLabel,
    MessageBranchNext,
    MessageBranchPrevious,
    MessageContent,
    MessageCopy,
    MessageEdit,
    MessageEditor,
    MessageRegenerate,
    MessageToolbar,
  } from "../../../../src/svelte/message/index.js";
  import { ModelControl } from "../../../../src/svelte/model-control/index.js";
  import { ModelSelector } from "../../../../src/svelte/model-selector/index.js";
  import { Notice } from "../../../../src/svelte/notice/index.js";
  import { Picker } from "../../../../src/svelte/picker/index.js";
  import { Plan } from "../../../../src/svelte/plan/index.js";
  import { Question } from "../../../../src/svelte/question/index.js";
  import { Queue } from "../../../../src/svelte/queue/index.js";
  import { Reasoning } from "../../../../src/svelte/reasoning/index.js";
  import { ReasoningEffort } from "../../../../src/svelte/reasoning-effort/index.js";
  import { Selection } from "../../../../src/svelte/selection/index.js";
  import { SettingsMenu } from "../../../../src/svelte/settings-menu/index.js";
  import { Sources } from "../../../../src/svelte/sources/index.js";
  import { StackTrace } from "../../../../src/svelte/stack-trace/index.js";
  import { Status } from "../../../../src/svelte/status/index.js";
  import {
    Step,
    StepContent,
    StepIcon,
    StepList,
    StepListItem,
    StepTitle,
    StepTrigger,
  } from "../../../../src/svelte/step/index.js";
  import { StreamingText } from "../../../../src/svelte/streaming-text/index.js";
  import { Subagent } from "../../../../src/svelte/subagent/index.js";
  import { Suggestion } from "../../../../src/svelte/suggestion/index.js";
  import { Task } from "../../../../src/svelte/task/index.js";
  import { Terminal } from "../../../../src/svelte/terminal/index.js";
  import { TestResults } from "../../../../src/svelte/test-results/index.js";
  import { ThinkingIndicator } from "../../../../src/svelte/thinking-indicator/index.js";
  import { Tool } from "../../../../src/svelte/tool/index.js";
  import { Transcript } from "../../../../src/svelte/transcript/index.js";
  import { TypingIndicator } from "../../../../src/svelte/typing-indicator/index.js";
  import { Uploader } from "../../../../src/svelte/uploader/index.js";
  import { addItems } from "../../shared/add-menu.js";
  import {
    approvalCall,
    chainSteps,
    draftKey,
    files,
    filler,
    moveItem,
    planItems,
    queueItems,
    question,
    replies,
    selectionActions,
    steps,
    taskItems,
    thoughts,
    toolCalls,
  } from "../../shared/agent.js";
  import { learnMoreHref, modes } from "../../shared/approval-mode.js";
  import { commands, mentions } from "../../shared/composer.js";
  import { contextChips } from "../../shared/context-bar.js";
  import { context } from "../../shared/context-meter.js";
  import { downloads, readme } from "../../shared/document.js";
  import { entries } from "../../shared/file-tree.js";
  import { lighthouse, size } from "../../shared/generated-image.js";
  import { answer } from "../../shared/markdown.js";
  import { regenerateOptions } from "../../shared/message.js";
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
  import { sources } from "../../shared/sources.js";
  import { typeErrorStack } from "../../shared/stack-trace.js";
  import { suggestions } from "../../shared/suggestion.js";
  import { installRun } from "../../shared/terminal.js";
  import { suites } from "../../shared/test-results.js";
  import { standup } from "../../shared/transcript.js";
  import { uploads } from "../../shared/uploader.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const wave = $derived(variant === "all" ? 1 : Number(variant.slice("wave-".length)));

  let confirm = $state(true);
  $effect(() => {
    host.confirm = (on) => (confirm = on);
  });

  let questionText = $state(question);
  let branch = $state(0);
  let attachments: readonly AttachmentItem[] = $state.raw(files);
  let uploadItems: UploadItem[] = $state.raw(uploads);
  const uploadCallbacks = host.uploads((change) => (uploadItems = change(uploadItems)));

  let queue: readonly QueueItem[] = $state.raw(queueItems);

  let submitted: Answers | undefined = $state.raw();
  let shown = $state({ notice: true, guardrail: true });
  const remove = (part: keyof typeof shown) => () => {
    host.calls.push("dismiss");
    shown[part] = false;
  };
  const rateLimited = notices.find((notice) => notice.id === "warning") as NoticeData;

  let settingValues: SettingsValues = $state.raw(initialValues);
  let mode = $state("ask");
  let chips = $state.raw(contextChips(4));
</script>

{#snippet foundation()}
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="step">
      <StepList aria-label="Agent steps">
        {#each steps as step (step.id)}
          <Step
            status="complete"
            defaultOpen={step.open}
            onOpenChange={(_open, details) => host.change("step", details)}
          >
            <StepListItem value={step.id}>
              {#snippet render({ props }: { props: Record<string, unknown> })}
                <StepTrigger {...props}><StepIcon /><StepTitle>{step.title}</StepTitle></StepTrigger>
              {/snippet}
            </StepListItem
            ><StepContent>
              <p>{step.body}</p>
            </StepContent>
          </Step>
        {/each}
      </StepList>
    </section
    ><section data-case="conversation">
      <Conversation aria-label="Chat" messageCount={filler.length + 2} class="h-[24rem]">
        <ConversationViewport>
          <ConversationContent>
            {#each filler as line, index (line)}
              <ConversationRow value={`f${index}`} {index}>
                <p>{line}</p>
              </ConversationRow>
            {/each}<ConversationRow value="question" index={filler.length}
            >
              <Message
                aria-label="Question"
                messageRole="user"
                text={questionText}
                onEdit={(next: string) => (questionText = next)}
              >
                <MessageContent>{questionText}</MessageContent
                ><MessageEditor
                /><MessageToolbar>
                  <KindToolbar aria-label="Question actions">
                    <MessageEdit>
                      <KindToolbarButton aria-label="Edit" />
                    </MessageEdit>
                  </KindToolbar>
                </MessageToolbar>
              </Message>
            </ConversationRow
            ><ConversationRow value="reply" index={filler.length + 1}>
              {@const text = replies[branch] as string}
              <Message
                aria-label="Reply"
                messageRole="assistant"
                {text}
                branchIndex={branch}
                branchCount={replies.length}
                onBranchChange={(index: number, details) => {
                  if (host.change("message", details)) branch = index;
                }}
                onRegenerate={() => host.calls.push("regenerate")}
              >
                <MessageContent>
                  <Markdown source={branch === 0 ? answer : text} />
                </MessageContent
                ><MessageToolbar>
                  <MessageBranch>
                    <MessageBranchPrevious
                    /><MessageBranchLabel
                    /><MessageBranchNext />
                  </MessageBranch
                  ><KindToolbar aria-label="Reply actions">
                    <MessageCopy>
                      <KindToolbarButton aria-label="Copy" />
                    </MessageCopy
                    ><MessageRegenerate>
                      {#snippet children(props: Record<string, unknown>)}<KindToolbarButton
                          {...props}
                          aria-label="Regenerate"
                        />{/snippet}
                    </MessageRegenerate>
                  </KindToolbar>
                </MessageToolbar>
              </Message>
            </ConversationRow>
          </ConversationContent>
        </ConversationViewport
        ><ConversationJump />
      </Conversation>
    </section
    ><section data-case="composer">
      <Composer
        aria-label="Compose"
        {mentions}
        {commands}
        onSubmit={host.submit}
        onStop={host.stop}
        onValueChange={(_value, details) => host.change("composer", details)}
      >
        <ComposerAttachments
        /><ComposerInput aria-label="Prompt">
          <ComposerTriggerMenu />
        </ComposerInput
        ><ComposerAttach
        /><ComposerSubmit
        /><ComposerStop />
      </Composer>
    </section
    ><section data-case="attachments">
      <Attachments
        aria-label="Files"
        items={attachments}
        onRemove={(id: string) => (attachments = attachments.filter((item) => item.id !== id))}
      />
    </section
    ><section data-case="uploader">
      <Uploader aria-label="Uploads" items={uploadItems} {...uploadCallbacks} />
    </section
    ><section data-case="indicators" class="flex flex-col items-start gap-4">
      <Loader
      /><ThinkingIndicator
      /><TypingIndicator
      /><p>
        <StreamingText text="Streaming text fades in" />
      </p>
    </section>
  </div>
{/snippet}

{#snippet activity()}
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="status">
      <Status id="status" status="running" label="Deploying" />
    </section
    ><section data-case="reasoning">
      <Reasoning
        id="reasoning"
        status="complete"
        durationSeconds={3}
        text={thoughts}
        onOpenChange={(_open, details) => host.change("reasoning", details)}
      />
    </section
    ><section data-case="tool" class="flex flex-col gap-2">
      {#each toolCalls as call (call.toolCallId)}
        <Tool id={call.toolCallId} {call} />
      {/each}
    </section
    ><section data-case="chain-of-thought">
      <ChainOfThought
        id="chain"
        label="Researching retries"
        status="complete"
        steps={chainSteps}
        onOpenStepsChange={(_steps, details) => host.change("chain", details)}
      />
    </section
    ><section data-case="task">
      <Task id="task" label="Patching the client" items={taskItems} />
    </section
    ><section data-case="plan">
      <Plan
        id="plan"
        label="Retry plan"
        status="awaiting-input"
        items={planItems}
        agentConfirm={confirm}
        onAccept={() => {
          host.calls.push("accept");
        }}
      />
    </section
    ><section data-case="subagent">
      <Subagent
        id="subagent"
        agentName="Code reviewer"
        status="running"
        agentConfirm={confirm}
        onCancel={() => {
          host.calls.push("cancel");
        }}
      />
    </section
    ><section data-case="queue">
      <Queue
        id="queue"
        label="Queue"
        items={queue}
        onReorder={(id, details) => {
          if (host.change("queue", details)) queue = moveItem(queue, id, details.index);
        }}
        onRemove={(id) => {
          host.calls.push(`remove:${id}`);
          queue = queue.filter((item) => item.id !== id);
        }}
      />
    </section>
  </div>
{/snippet}

{#snippet humanInput()}
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="tool-approval">
      <Tool id="delete_file" call={approvalCall} onApprove={host.decide("approve")} onDeny={host.decide("deny")} />
    </section
    ><section data-case="confirmation">
      <Confirmation
        id="confirmation"
        label="Run the migration?"
        approval={{ approvalId: "migrate", generation: 1, state: "requested" }}
        onApprove={host.decide("approve")}
        onDeny={host.decide("deny")}
      />
    </section
    ><section data-case="question">
      <Question
        id="question"
        label="Deploy questions"
        questions={deployQuestions}
        agentConfirm={confirm}
        onValueChange={(_value, details) => host.change("question", details)}
        {submitted}
        onSubmit={(answers, details) =>
          host
            .decide("submit")(answers, details)
            .then(() => {
              submitted = answers;
            })}
        onSkip={(answers, details) =>
          host
            .decide("skip")(answers, details)
            .then(() => {
              submitted = {};
            })}
      />
    </section
    ><section data-case="checkpoint">
      <Checkpoint
        id="checkpoint"
        description="Before editing auth.ts"
        agentConfirm={confirm}
        onOpenChange={(_open, details) => host.change("checkpoint", details)}
        onRestore={host.decide("restore")}
      />
    </section
    ><section data-case="model-selector" class="flex items-center gap-2">
      <ModelSelector
        id="model"
        {models}
        defaultValue="gpt-5"
        onValueChange={(_value, details) => host.change("model", details)}
        {...wave === 5 ? { actions: modelActions, onAction: host.decide("model-action") } : {}}
      /><ReasoningEffort
        id="effort"
        {levels}
        defaultValue="medium"
        onValueChange={(_value, details) => host.change("effort", details)}
      /><ContextMeter id="context" {...context} onOpenChange={(_open, details) => host.change("context", details)} />
    </section
    ><section data-case="suggestion">
      <Suggestion id="suggestion" {suggestions} onPick={host.decide("pick")} />
    </section
    ><section data-case="feedback">
      <Feedback
        id="feedback"
        onRatingChange={(_rating, details) => host.change("feedback", details)}
        onComment={host.decide("comment")}
      />
    </section
    ><section id="notice" data-case="notice">
      {#if shown.notice}
        <Notice variant={rateLimited.variant} label={rateLimited.label} onDismiss={remove("notice")}>
          {rateLimited.text}
        </Notice>
      {/if}
    </section
    ><section id="guardrail" data-case="guardrail-notice">
      {#if shown.guardrail}
        <GuardrailNotice
          {...guardrails.blocking}
          blocking
          onOpenChange={(_open, details) => host.change("guardrail", details)}
          onDismiss={remove("guardrail")}
        />
      {/if}
    </section>
  </div>
{/snippet}

{#snippet artifacts()}
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="sources">
      <Sources id="sources" {sources} onOpenChange={(_open, details) => host.change("sources", details)} />
    </section
    ><section data-case="inline-citation">
      <p>
        Back off when you hit a limit <InlineCitation
          id="citation"
          {sources}
          onOpenChange={(_open, details) => host.change("citation", details)}
        />.
      </p>
    </section
    ><section data-case="document">
      <Document
        id="document"
        label="README.md"
        content={readme}
        {downloads}
        onOpenChange={(_open, details) => host.change("document", details)}
        onCopy={host.decide("copy")}
        onDownload={host.decide("download")}
      />
    </section
    ><section data-case="generated-image">
      <GeneratedImage
        id="image"
        alt="A lighthouse at dusk"
        src={lighthouse}
        {...size}
        onOpenChange={(_open, details) => host.change("image", details)}
        onDownload={host.decide("download")}
      />
    </section
    ><section data-case="file-tree">
      <FileTree
        id="file-tree"
        {entries}
        defaultExpanded={["src"]}
        onValueChange={(_value, details) => host.change("file-tree", details)}
        onExpandedChange={(_expanded, details) => host.change("file-tree", details)}
        onSelect={host.decide("select")}
      />
    </section
    ><section data-case="terminal">
      <Terminal
        id="terminal"
        command="npm install"
        output={installRun}
        exitCode={0}
        durationSeconds={3}
        onOpenChange={(_open, details) => host.change("terminal", details)}
        onCopy={host.decide("copy")}
      />
    </section
    ><section data-case="stack-trace">
      <StackTrace
        id="stack-trace"
        stack={typeErrorStack}
        onOpenChange={(_open, details) => host.change("stack-trace", details)}
        onShowLibraryFramesChange={(_show, details) => host.change("stack-trace", details)}
        onCopy={host.decide("copy")}
        onOpenFrame={host.decide("openFrame")}
      />
    </section
    ><section data-case="test-results">
      <TestResults
        id="test-results"
        {suites}
        defaultOpen
        onOpenChange={(_open, details) => host.change("test-results", details)}
        onFilterChange={(_filter, details) => host.change("test-results", details)}
        onExpandedChange={(_expanded, details) => host.change("test-results", details)}
      />
    </section
    ><section data-case="transcript">
      <Transcript
        id="transcript"
        segments={standup}
        onQueryChange={(_query, details) => host.change("transcript", details)}
        onSeek={host.decide("seek")}
      />
    </section
    ><section data-case="selection">
      <Selection id="selection" actions={selectionActions} onAction={host.decide("run")} onDismiss={host.decide("dismiss")}>
        <p id="selection-text">
          Rate limits reset every hour. Each response carries the remaining count in its headers.
        </p>
      </Selection>
    </section
    ><section data-case="action">
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
{/snippet}

{#snippet composing()}
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
    </section
    ><section id="add-menu" data-case="add-menu">
      <AddMenu items={addItems} onAction={host.decide("add")} />
    </section
    ><section id="settings-menu" data-case="settings-menu">
      <SettingsMenu
        {settings}
        values={settingValues}
        onValuesChange={(next, details) => {
          if (host.change("settings", details)) settingValues = next;
        }}
      />
    </section
    ><section id="approval-mode" data-case="approval-mode">
      <ApprovalMode
        {modes}
        value={mode}
        {learnMoreHref}
        agentConfirm={confirm}
        onValueChange={(next, details) => {
          if (host.change("approval", details)) mode = next;
        }}
      />
    </section
    ><section id="model-control" data-case="model-control">
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
    </section
    ><section id="context-bar" data-case="context-bar" style="width: 360px">
      <ContextBar
        {chips}
        style="--kind-context-chip-max-width: 120px"
        onRemove={(id, details) => {
          if (host.change("context-bar", details)) chips = chips.filter((chip) => chip.id !== id);
        }}
      />
    </section
    ><section id="dictation" data-case="dictation" style="width: 320px">
      <Dictation source={dictation.source} agentConfirm={confirm} onText={host.decide("dictate")} />
    </section
    ><section id="answer" data-case="message">
      <Message
        aria-label="Answer"
        messageRole="assistant"
        text={replies[0]}
        {regenerateOptions}
        onRegenerate={(text, details) => {
          host.decide(`regenerate:${details.optionId ?? ""}`)(text, details);
        }}
      >
        <MessageContent>{replies[0]}</MessageContent
        ><MessageToolbar>
          <KindToolbar aria-label="Answer actions">
            <MessageCopy>
              <KindToolbarButton aria-label="Copy" />
            </MessageCopy
            ><MessageRegenerate>
              {#snippet children(props: Record<string, unknown>)}<KindToolbarButton
                  {...props}
                  aria-label="Regenerate"
                />{/snippet}
            </MessageRegenerate>
          </KindToolbar>
        </MessageToolbar>
      </Message>
    </section
    ><section id="draft" data-case="composer">
      <Composer
        aria-label="Draft"
        {draftKey}
        draftStorage={drafts}
        onSubmit={host.submit}
        onValueChange={(_value, details) => {
          if (details.reason !== "restore") host.change("draft", details);
        }}
      >
        <ComposerInput aria-label="Draft prompt"
        /><ComposerRestored
        /><ComposerSubmit />
      </Composer>
    </section>
  </div>
{/snippet}

{@render foundation()}{#if wave === 6}
  <Shell {host} {confirm} />
{:else if wave >= 2}
  {@render activity()}{#if wave >= 3}{@render humanInput()}{/if}{#if wave >= 4}{@render artifacts()}{/if}{#if wave === 5}{@render composing()}{/if}
{/if}
