// AI SDK `UIMessage` fixtures, shaped after the pinned `ai` version. One tool part per spec §4.3 state.
export const input = { query: "weather in Paris" };

export function tool(overrides = {}) {
  return { type: "tool-search", toolCallId: "call-1", state: "input-available", input, ...overrides };
}

export const toolStates = {
  "input-streaming": tool({ state: "input-streaming", input: { query: "wea" } }),
  "input-available": tool({ state: "input-available" }),
  "approval-requested": tool({ state: "approval-requested", approval: { id: "appr-1" } }),
  "approval-responded": tool({
    state: "approval-responded",
    approval: { id: "appr-1", approved: true, reason: "looks safe" },
  }),
  "output-available": tool({ state: "output-available", output: { temp: 18 } }),
  "output-error": tool({ state: "output-error", errorText: "rate limited" }),
  "output-denied": tool({
    state: "output-denied",
    approval: { id: "appr-1", approved: false, reason: "no network" },
  }),
};

export const conversation = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "Weather in Paris?" }] },
  {
    id: "a1",
    role: "assistant",
    metadata: { model: "fixture" },
    parts: [
      { type: "step-start" },
      { type: "reasoning", text: "Look it up.", state: "done" },
      toolStates["output-available"],
      { type: "text", text: "It is 18°C.", state: "streaming" },
    ],
  },
];
