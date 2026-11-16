import type { AttachmentItem, UploadItem } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useState } from "react";
import { Attachments } from "../../../../src/react/attachments.js";
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
import { ThinkingIndicator } from "../../../../src/react/thinking-indicator.js";
import { TypingIndicator } from "../../../../src/react/typing-indicator.js";
import { Uploader } from "../../../../src/react/uploader.js";
import { agentHost, files, filler, question, replies, steps } from "../../shared/agent.js";
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

export const cases = {
  all: () => (
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
  ),
};
