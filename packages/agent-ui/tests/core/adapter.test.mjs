import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fromChatStatus,
  fromUIMessagePart,
  fromUIMessages,
  toApprovalResponse,
} from "@kind-ui/agent-ui/adapters/ai-sdk";
import { conversation, input, tool, toolStates } from "./fixtures/ui-messages.mjs";

const ctx = { messageId: "a1", index: 2 };
const step = (part) => fromUIMessagePart(part, ctx).step;

test("every spec §4.3 tool state maps to its neutral result", () => {
  const expected = {
    "input-streaming": { status: "running", input: "streaming" },
    "input-available": { status: "running", input: "ready" },
    "approval-requested": { status: "awaiting-input", input: "ready", approval: "requested" },
    "approval-responded": { status: "running", input: "ready", approval: "responded" },
    "output-available": { status: "complete", input: "ready", output: "available" },
    "output-error": { status: "error", input: "ready", outcome: "error" },
    "output-denied": { status: "cancelled", input: "ready", outcome: "denied", approval: "responded" },
  };
  for (const [state, want] of Object.entries(expected)) {
    const s = step(toolStates[state]);
    assert.equal(s.kind, "tool", state);
    assert.equal(s.status, want.status, state);
    assert.equal(s.call.input.state, want.input, state);
    assert.equal(s.call.output?.state, want.output, state);
    assert.equal(s.call.outcome, want.outcome, state);
    assert.equal(s.call.approval?.state, want.approval, state);
  }
});

test("tool parts key by toolCallId and take the tool name as title", () => {
  const part = fromUIMessagePart(toolStates["input-available"], ctx);
  assert.equal(part.id, "call-1");
  assert.equal(part.step.id, "call-1");
  assert.equal(part.step.title, "search");
  assert.deepEqual(part.step.call, {
    toolCallId: "call-1",
    name: "search",
    dynamic: false,
    input: { state: "ready", value: input },
  });
});

test("output-available with null output keeps output present", () => {
  for (const value of [null, undefined, 0, false, ""]) {
    const s = step(tool({ state: "output-available", output: value }));
    assert.deepEqual(s.call.output, { state: "available", value });
    assert.equal("output" in s.call, true);
    assert.equal(s.status, "complete");
  }
});

test("preliminary output maps to preliminary", () => {
  const s = step(tool({ state: "output-available", output: { partial: true }, preliminary: true }));
  assert.equal(s.call.output.state, "preliminary");
});

test("output-denied is cancelled with denied outcome", () => {
  const s = step(toolStates["output-denied"]);
  assert.equal(s.status, "cancelled");
  assert.equal(s.call.outcome, "denied");
  assert.deepEqual(s.call.approval.decision, { approved: false, reason: "no network" });
});

test("output-error preserves input", () => {
  const s = step(toolStates["output-error"]);
  assert.deepEqual(s.call.input.value, input);
  assert.deepEqual(s.error, { message: "rate limited" });
  assert.equal(s.call.output, undefined);
});

test("approval-responded keeps decision and running status", () => {
  const s = step(toolStates["approval-responded"]);
  assert.equal(s.status, "running");
  assert.deepEqual(s.call.approval, {
    approvalId: "appr-1",
    generation: 0,
    state: "responded",
    decision: { approved: true, reason: "looks safe" },
  });
});

test("approval-requested has no decision; automatic approvals map to auto", () => {
  assert.deepEqual(step(toolStates["approval-requested"]).call.approval, {
    approvalId: "appr-1",
    generation: 0,
    state: "requested",
  });
  const auto = step(
    tool({ state: "approval-responded", approval: { id: "a", approved: true, isAutomatic: true } }),
  );
  assert.equal(auto.call.approval.state, "auto");
});

test("dynamic tools map with dynamic set", () => {
  const dyn = { ...toolStates["input-available"], type: "dynamic-tool", toolName: "lookup" };
  assert.equal(step(dyn).call.dynamic, true);
  assert.equal(step(dyn).title, "lookup");
  assert.equal(step({ ...dyn, dynamic: false }).call.dynamic, false);
});

test("unknown part type becomes data and never throws", () => {
  const custom = { type: "x-custom", value: 1 };
  assert.deepEqual(fromUIMessagePart(custom, ctx), {
    type: "data",
    id: "a1:2",
    name: "x-custom",
    data: custom,
  });
  assert.deepEqual(fromUIMessagePart({ type: "data-weather", id: "w", data: { temp: 18 } }, ctx), {
    type: "data",
    id: "a1:2",
    name: "weather",
    data: { temp: 18 },
  });
  const futureState = tool({ state: "output-paused" });
  assert.equal(fromUIMessagePart(futureState, ctx).type, "data");
  assert.equal(fromUIMessagePart(null, ctx).type, "data");
});

test("text, reasoning, file, and sources map with positional ids", () => {
  assert.deepEqual(fromUIMessagePart({ type: "text", text: "hi" }, ctx), {
    type: "text",
    id: "a1:2",
    text: "hi",
    state: "done",
  });
  assert.equal(
    fromUIMessagePart({ type: "reasoning", text: "r", state: "streaming" }, ctx).state,
    "streaming",
  );
  assert.deepEqual(
    fromUIMessagePart({ type: "file", mediaType: "image/png", url: "u", filename: "a.png" }, ctx),
    {
      type: "file",
      id: "a1:2",
      name: "a.png",
      mediaType: "image/png",
      url: "u",
    },
  );
  assert.deepEqual(
    fromUIMessagePart({ type: "source-url", sourceId: "s1", url: "https://x.test" }, ctx).source,
    {
      id: "s1",
      title: "https://x.test",
      url: "https://x.test",
    },
  );
  const doc = { type: "source-document", sourceId: "s2", mediaType: "application/pdf", title: "Doc" };
  assert.deepEqual(fromUIMessagePart(doc, ctx).source, {
    id: "s2",
    title: "Doc",
    mediaType: "application/pdf",
  });
  assert.equal(fromUIMessagePart({ type: "step-start" }, ctx), null);
});

test("fromChatStatus maps every chat status", () => {
  assert.equal(fromChatStatus("submitted"), "submitted");
  assert.equal(fromChatStatus("streaming"), "streaming");
  assert.equal(fromChatStatus("ready"), "complete");
  assert.equal(fromChatStatus("error"), "error");
});

test("fromUIMessages applies chat status to the last message only and drops step-start", () => {
  const [user, assistant] = fromUIMessages(conversation, "streaming");
  assert.equal(user.status, "complete");
  assert.equal(assistant.status, "streaming");
  assert.deepEqual(assistant.metadata, { model: "fixture" });
  assert.deepEqual(
    assistant.parts.map((p) => p.id),
    ["a1:1", "call-1", "a1:3"],
  );
  assert.equal(fromUIMessages(conversation).at(-1).status, "complete");
  const submitted = fromUIMessages([...conversation, { id: "u2", role: "user", parts: [] }], "submitted");
  assert.deepEqual(
    submitted.map((m) => m.status),
    ["complete", "complete", "submitted"],
  );
});

test("chat stop does not cancel pending tools", () => {
  const messages = [{ id: "a1", role: "assistant", parts: [toolStates["input-available"]] }];
  const [message] = fromUIMessages(messages, "ready");
  assert.equal(message.status, "complete");
  assert.equal(message.parts[0].step.status, "running");
  assert.equal(message.parts[0].step.call.outcome, undefined);
});

test("toApprovalResponse uses approvalId", () => {
  const approval = { approvalId: "appr-9", generation: 3, state: "requested" };
  assert.deepEqual(toApprovalResponse(approval, { approved: true }), { id: "appr-9", approved: true });
  assert.deepEqual(toApprovalResponse(approval, { approved: false, reason: "no" }), {
    id: "appr-9",
    approved: false,
    reason: "no",
  });
});

test("fromUIMessages gives the chat's error to the last message", () => {
  const messages = fromUIMessages(conversation, { status: "error", error: new Error("Rate limited") });
  assert.equal(messages.at(-1).status, "error");
  assert.deepEqual(messages.at(-1).error, { message: "Rate limited" });
  assert.equal(messages[0].error, undefined);
  assert.equal(fromUIMessages(conversation, { status: "ready" }).at(-1).error, undefined);
});
