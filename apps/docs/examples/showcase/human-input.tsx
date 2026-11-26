"use client";
import type { Answers, Approval, Question as QuestionData, ToolCall } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Checkpoint } from "@/components/ui/checkpoint";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { ContextMeter } from "@/components/ui/context-meter";
import { Feedback } from "@/components/ui/feedback";
import { GuardrailNotice } from "@/components/ui/guardrail-notice";
import { KindToolbar, KindToolbarButton } from "@/components/ui/internal/toolbar";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "@/components/ui/message";
import { ModelSelector } from "@/components/ui/model-selector";
import { Notice } from "@/components/ui/notice";
import { Question } from "@/components/ui/question";
import { ReasoningEffort } from "@/components/ui/reasoning-effort";
import { Suggestion } from "@/components/ui/suggestion";
import { Tool } from "@/components/ui/tool";
import { AnthropicLogo, GoogleMonogram, MicrosoftLogo, OpenAILogo, XAILogo } from "../model-selector/logos";

const ASK = 5;
const APPROVE = ASK + 1;
const ANSWER = APPROVE + 4;

const questions: QuestionData[] = [
  {
    id: "target",
    prompt: "Where should the fix go first?",
    kind: "single",
    required: true,
    options: [
      { value: "staging", label: "Staging", description: "Safe to break." },
      { value: "production", label: "Production", description: "Every user sees it." },
    ],
  },
];

const replies = {
  approved: "The retry fix is live. All 12 tests passed, and the deploy took 41 s.",
  denied: "I didn't deploy. The fix is ready whenever you want to ship it.",
};

const suggestions = [
  { id: "errors", label: "Watch the error rate", reply: "The error rate has held at 0.2% since the deploy." },
  { id: "notes", label: "Draft the release notes", reply: "Here's a draft: retries now wait twice as long." },
  { id: "vendor", label: "Email the logs to the vendor" },
];

const models = [
  {
    id: "claude-opus-5.5",
    name: "Claude Opus 5.5",
    group: "Anthropic",
    description: "Most capable",
    icon: <AnthropicLogo />,
  },
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: <AnthropicLogo /> },
  {
    id: "gpt-6.1-sol",
    name: "GPT-6.1 Sol",
    group: "OpenAI",
    description: "Deep reasoning",
    icon: <OpenAILogo />,
  },
  { id: "gpt-6-astra", name: "GPT-6 Astra", group: "OpenAI", icon: <OpenAILogo /> },
  { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", group: "OpenAI", icon: <OpenAILogo /> },
  {
    id: "gpt-6.1-terra",
    name: "GPT-6.1 Terra",
    group: "OpenAI",
    description: "Fast and affordable",
    icon: <OpenAILogo />,
  },
  {
    id: "mai-code-2",
    name: "MAI Code 2",
    group: "Microsoft",
    description: "Built for code",
    icon: <MicrosoftLogo />,
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    group: "Google",
    description: "Long context",
    icon: <GoogleMonogram />,
  },
  { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", group: "Google", icon: <GoogleMonogram /> },
  { id: "grok-4.7", name: "Grok 4.7", group: "xAI", icon: <XAILogo /> },
];

// Each tool's title while it runs and once it's done.
const titles: Record<string, [string, string]> = {
  run_tests: ["Running the retry tests", "Ran the retry tests"],
  deploy: ["Deploying `fix-retry`", "Deployed `fix-retry`"],
};

const call = (id: string, name: string, input: unknown, output: unknown, done: boolean): ToolCall => ({
  toolCallId: id,
  name,
  title: titles[name]?.[done ? 1 : 0],
  dynamic: false,
  input: { state: "ready", value: input },
  ...(done && { output: { state: "available", value: output } }),
});

const later = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Run() {
  const [tick, setTick] = useState(0);
  const [answers, setAnswers] = useState<Answers>();
  const [approval, setApproval] = useState<Approval>({
    approvalId: "deploy",
    generation: 0,
    state: "requested",
  });
  const [attempts, setAttempts] = useState(0);
  const [restored, setRestored] = useState(false);
  const [noticeShown, setNoticeShown] = useState(true);
  const [commentSent, setCommentSent] = useState(false);
  const [picked, setPicked] = useState<(typeof suggestions)[number]>();
  const [model, setModel] = useState<string | null>("gpt-6.1-sol");
  const [effort, setEffort] = useState<string | null>("medium");

  const approved = approval.decision?.approved ?? false;
  const reply = (approved ? replies.approved : replies.denied).split(" ");
  const done = ANSWER + reply.length;
  const waiting = (tick === ASK && !answers) || (tick === APPROVE && approval.state !== "responded");

  useEffect(() => {
    if (tick >= done || waiting) return;
    const timer = setTimeout(() => setTick(tick + 1), 250);
    return () => clearTimeout(timer);
  }, [tick, done, waiting]);

  const decide = (approve: boolean) => {
    const fails = approve && attempts === 0;
    setAttempts(attempts + 1);
    setApproval((current) => ({ ...current, state: "submitting" }));
    return later(600).then(() =>
      setApproval((current) =>
        fails
          ? { ...current, state: "submit-failed" }
          : { ...current, state: "responded", decision: { approved: approve } },
      ),
    );
  };

  const target = answers?.target === "production" ? "production" : "staging";
  const deploy: ToolCall = {
    ...call(
      "deploy",
      "deploy",
      { branch: "fix-retry", target },
      { url: `https://${target}.example.com` },
      tick > APPROVE + 2 && approved,
    ),
    approval,
    ...(approval.decision?.approved === false && { outcome: "denied" as const }),
  };
  const used = 18_000 + Math.min(tick, done) * 1_800 + (picked ? 2_400 : 0);

  return (
    <div className="flex flex-col gap-4">
      {noticeShown && (
        <Notice label="Deploys need your approval" onDismiss={() => setNoticeShown(false)}>
          The agent asks before it changes anything outside this repository.
        </Notice>
      )}
      <Checkpoint
        description="Before shipping the retry fix"
        restored={restored}
        onRestore={() => later(800).then(() => setRestored(true))}
      />
      <Message aria-label="User message" messageRole="user" text="Ship the retry fix.">
        <MessageContent>Ship the retry fix.</MessageContent>
      </Message>
      <div className="flex flex-col gap-1">
        {tick >= 1 && (
          <Tool
            call={call("tests", "run_tests", { filter: "retry" }, { passed: 12, failed: 0 }, tick >= ASK - 1)}
          />
        )}
        {tick >= ASK && (
          <Question
            label="Deploy target"
            questions={questions}
            submitted={answers}
            onSubmit={(value) => later(400).then(() => setAnswers(value))}
            onSkip={() => setAnswers({})}
          />
        )}
        {tick >= APPROVE && (
          <Tool call={deploy} onApprove={() => decide(true)} onDeny={() => decide(false)} />
        )}
      </div>
      {tick >= ANSWER && (
        <Message
          aria-label="Assistant message"
          messageRole="assistant"
          status={tick >= done ? "complete" : "streaming"}
          text={reply.slice(0, tick - ANSWER).join(" ")}
        >
          <MessageContent>{reply.slice(0, tick - ANSWER).join(" ")}</MessageContent>
          {tick >= done && (
            <MessageToolbar>
              <KindToolbar aria-label="Message actions">
                <MessageCopy>
                  <KindToolbarButton aria-label="Copy" />
                </MessageCopy>
              </KindToolbar>
              <Feedback
                commentSent={commentSent}
                onComment={() => later(600).then(() => setCommentSent(true))}
              />
            </MessageToolbar>
          )}
        </Message>
      )}
      {picked && (
        <Message aria-label="User message" messageRole="user" text={picked.label}>
          <MessageContent>{picked.label}</MessageContent>
        </Message>
      )}
      {picked &&
        (picked.reply ? (
          <Message aria-label="Assistant message" messageRole="assistant" text={picked.reply}>
            <MessageContent>{picked.reply}</MessageContent>
          </Message>
        ) : (
          <GuardrailNotice
            blocking
            label="Request blocked"
            reason="The logs contain customer email addresses."
            detail="Your organization's policy blocks sending personal data outside the company."
            onDismiss={() => setPicked(undefined)}
          />
        ))}
      {tick >= done && !picked && (
        <Suggestion
          suggestions={suggestions}
          onPick={(id) => setPicked(suggestions.find((suggestion) => suggestion.id === id))}
        />
      )}
      <Composer aria-label="Message" onSubmit={() => undefined}>
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <div
          className="flex flex-wrap items-center gap-2 [--kind-model-selector-width:11rem]"
          style={{ gridArea: "attach" }}
        >
          <ModelSelector models={models} value={model} onValueChange={setModel} />
          <ReasoningEffort value={effort} onValueChange={setEffort} />
          <ContextMeter
            used={used}
            total={128_000}
            usage={{ input: used - 4_000, output: 4_000, reasoning: 1_500, cached: 12_000 }}
          />
        </div>
        <ComposerSubmit />
      </Composer>
    </div>
  );
}

export default function HumanInputShowcase() {
  const [run, setRun] = useState(0);
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setRun(run + 1)}
        className="self-end rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm hover:bg-[var(--kind-color-hover)]"
      >
        Replay
      </button>
      <Run key={run} />
    </div>
  );
}
