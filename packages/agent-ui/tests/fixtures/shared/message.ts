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
