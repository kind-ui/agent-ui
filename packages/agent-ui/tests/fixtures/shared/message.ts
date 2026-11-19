export const regenerateOptions = [
  { id: "details", label: "Add details" },
  { id: "concise", label: "More concise", description: "A shorter answer" },
  {
    id: "model",
    label: "Try with another model",
    items: [
      { id: "gpt-5", label: "GPT-5" },
      { id: "claude-sonnet", label: "Claude Sonnet" },
    ],
  },
];

export const author = { id: "ada", name: "Ada Lovelace" };
export const timing = { now: "2026-11-18", timeZone: "UTC" };
export const authored = [
  {
    id: "today",
    createdAt: "2026-11-18T09:41:00Z",
    durationSeconds: 72,
    text: "The engine weaves patterns.",
  },
  { id: "continued", createdAt: "2026-11-18T09:42:00Z", continued: true, text: "As a loom weaves flowers." },
  { id: "yesterday", createdAt: "2026-11-17T09:41:00Z", text: "Notes from the day before." },
];
export const outcomeText = "Retry with exponential backoff, and cap the number of attempts.";
export const outcomeError = "The model is overloaded";
