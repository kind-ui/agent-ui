import type { QueueItem } from "@kind-ui/agent-ui";
import type { AttachmentItem, UploadItem } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { Attachments } from "../../../../src/react/attachments.js";
import { ChainOfThought } from "../../../../src/react/chain-of-thought.js";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "../../../../src/react/composer.js";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/react/conversation.js";
import { KindToolbar, KindToolbarButton } from "../../../../src/react/internal/toolbar.js";
import { Loader } from "../../../../src/react/loader.js";
import { Markdown } from "../../../../src/react/markdown.js";
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
} from "../../../../src/react/message.js";
import { Plan } from "../../../../src/react/plan.js";
import { Queue } from "../../../../src/react/queue.js";
import { Reasoning } from "../../../../src/react/reasoning.js";
import { Status } from "../../../../src/react/status.js";
import {
  Step,
  StepContent,
  StepIcon,
  StepList,
  StepListItem,
  StepTitle,
  StepTrigger,
} from "../../../../src/react/step.js";
import { StreamingText } from "../../../../src/react/streaming-text.js";
import { Subagent } from "../../../../src/react/subagent.js";
import { Task } from "../../../../src/react/task.js";
import { ThinkingIndicator } from "../../../../src/react/thinking-indicator.js";
import { Tool } from "../../../../src/react/tool.js";
import { TypingIndicator } from "../../../../src/react/typing-indicator.js";
import { Uploader } from "../../../../src/react/uploader.js";
import {
  agentHost,
  chainSteps,
  files,
  filler,
  moveItem,
  planItems,
  question,
  queueItems,
  replies,
  steps,
  taskItems,
  thoughts,
  toolCalls,
} from "../../shared/agent.js";
import { commands, mentions } from "../../shared/composer.js";
import { answer } from "../../shared/markdown.js";
import { uploads } from "../../shared/uploader.js";

const host = agentHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

function Steps() {
  return (
    <StepList aria-label="Agent steps">
      {steps.map((step) => (
        <Step
          key={step.id}
          status="complete"
          defaultOpen={step.open}
          onOpenChange={(_open, details) => host.change("step", details)}
        >
          <StepListItem value={step.id} render={<StepTrigger />}>
            <StepIcon />
            <StepTitle>{step.title}</StepTitle>
          </StepListItem>
          <StepContent>
            <p>{step.body}</p>
          </StepContent>
        </Step>
      ))}
    </StepList>
  );
}

function Question() {
  const [text, setText] = useState(question);
  return (
    <Message aria-label="Question" messageRole="user" text={text} onEdit={setText}>
      <MessageContent>{text}</MessageContent>
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

function Reply() {
  const [branch, setBranch] = useState(0);
  const text = replies[branch] as string;
  return (
    <Message
      aria-label="Reply"
      messageRole="assistant"
      text={text}
      branchIndex={branch}
      branchCount={replies.length}
      onBranchChange={(index, details) => {
        if (host.change("message", details)) setBranch(index);
      }}
      onRegenerate={() => host.calls.push("regenerate")}
    >
      <MessageContent>
        <Markdown source={branch === 0 ? answer : text} />
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
          <MessageRegenerate>
            <KindToolbarButton aria-label="Regenerate" />
          </MessageRegenerate>
        </KindToolbar>
      </MessageToolbar>
    </Message>
  );
}

function Chat() {
  return (
    <Conversation aria-label="Chat" messageCount={filler.length + 2} className="h-[24rem]">
      <ConversationViewport>
        <ConversationContent>
          {filler.map((line, index) => (
            <ConversationRow key={line} value={`f${index}`} index={index}>
              <p>{line}</p>
            </ConversationRow>
          ))}
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
  const [items, setItems] = useState<readonly AttachmentItem[]>(files);
  return (
    <Attachments
      aria-label="Files"
      items={items}
      onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
    />
  );
}

function Uploads() {
  const [items, setItems] = useState<UploadItem[]>(uploads);
  const [callbacks] = useState(() => host.uploads(setItems));
  return <Uploader aria-label="Uploads" items={items} {...callbacks} />;
}

function Activity() {
  const [confirm, setConfirm] = useState(true);
  const [queue, setQueue] = useState<readonly QueueItem[]>(queueItems);
  useEffect(() => {
    host.confirm = setConfirm;
  }, []);
  return (
    <div className="flex w-[40rem] flex-col gap-8 p-6">
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
      <section data-case="tool" className="flex flex-col gap-2">
        {toolCalls.map((call) => (
          <Tool key={call.toolCallId} id={call.toolCallId} call={call} />
        ))}
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
          agentConfirm={confirm}
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
          agentConfirm={confirm}
          onCancel={() => {
            host.calls.push("cancel");
          }}
        />
      </section>
      <section data-case="queue">
        <Queue
          id="queue"
          label="Queue"
          items={queue}
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
    <div className="flex w-[40rem] flex-col gap-8 p-6">
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
      <section data-case="indicators" className="flex flex-col items-start gap-4">
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

export const cases = {
  all: () => <Foundation />,
  "wave-2": () => (
    <>
      <Foundation />
      <Activity />
    </>
  ),
};
