import type { EffortLevel, ModelOption, SettingsEntry, Thread, ToolCall } from "@kind-ui/agent-ui";

export const now = "2026-11-18T12:00:00Z";
export const timeZone = "UTC";

export const threads: Thread[] = (
  [
    { id: "release", title: "Release checklist", updatedAt: "2026-11-10T09:00:00Z", pinned: true },
    { id: "export", title: "Nightly export timeouts", updatedAt: "2026-11-18T10:30:00Z" },
    { id: "launch", title: "Draft the launch post", updatedAt: "2026-11-18T08:00:00Z", status: "running" },
    { id: "build", title: "Why the build is slow", updatedAt: "2026-11-17T16:00:00Z", unread: true },
    { id: "logs", title: "Trim noisy server logs", updatedAt: "2026-11-17T11:10:00Z" },
    {
      id: "tests",
      title: "Flaky checkout tests",
      updatedAt: "2026-11-16T09:20:00Z",
      status: "awaiting-input",
    },
    { id: "cache", title: "Cache invalidation for avatars", updatedAt: "2026-11-15T15:45:00Z" },
    { id: "pricing", title: "Compare pricing tiers", updatedAt: "2026-11-14T18:40:00Z" },
    { id: "billing", title: "Billing webhook retries", updatedAt: "2026-11-13T10:05:00Z" },
    { id: "onboarding", title: "Onboarding email copy", updatedAt: "2026-11-12T13:30:00Z" },
    { id: "csv", title: "CSV import fails on large files", updatedAt: "2026-11-06T08:15:00Z" },
    { id: "search", title: "Speed up the search index", updatedAt: "2026-11-03T17:00:00Z" },
    { id: "a11y", title: "Audit the settings page", updatedAt: "2026-10-29T12:00:00Z" },
    { id: "dark", title: "Dark mode contrast issues", updatedAt: "2026-10-21T09:40:00Z" },
    { id: "deps", title: "Upgrade the date library", updatedAt: "2026-10-02T14:20:00Z" },
    { id: "schema", title: "Migrate the user schema", updatedAt: "2026-09-21T14:00:00Z" },
  ] satisfies Thread[]
).map((thread) => ({ ...thread, href: `#${thread.id}` }));

export type Line =
  | { id: string; role: "user" | "assistant"; text: string }
  | { id: string; role: "tool"; call: ToolCall; seconds?: number };

const reply = (id: string, question: string, answer: string): Line[] => [
  { id: `${id}-1`, role: "user", text: question },
  { id: `${id}-2`, role: "assistant", text: answer },
];

export const lines: Record<string, Line[]> = {
  export: [
    { id: "export-1", role: "user", text: "The nightly billing export failed again. Can you take a look?" },
    {
      id: "export-2",
      role: "assistant",
      text: "Since Wednesday, every run has stopped after 30 seconds waiting on the reports service. Its median response time went from 4 to 41 seconds.",
    },
    { id: "export-3", role: "user", text: "Did last night's run go through?" },
    {
      id: "export-4",
      role: "assistant",
      text: "Yes. It retried two pages with backoff and finished in 48 minutes.",
    },
  ],
  tests: [
    {
      id: "tests-1",
      role: "user",
      text: "The checkout tests failed three times on main today. Find out why and rerun them.",
    },
    {
      id: "tests-2",
      role: "tool",
      seconds: 1.4,
      call: {
        toolCallId: "call_search_logs",
        name: "search_logs",
        dynamic: false,
        input: { state: "ready", value: { query: "checkout timeout", since: "24h" } },
        output: { state: "available", value: { matches: 3, first: "payment mock took 5.2 s" } },
      },
    },
    {
      id: "tests-3",
      role: "assistant",
      text: "All three failures wait on the payment mock, which takes over 5 seconds on cold starts. I raised its warm-up and want to rerun the suite.",
    },
    {
      id: "tests-4",
      role: "tool",
      call: {
        toolCallId: "call_run_tests",
        name: "run_tests",
        dynamic: false,
        input: { state: "ready", value: { suite: "checkout", retries: 0 } },
        approval: { approvalId: "approval_run_tests", generation: 0, state: "requested" },
      },
    },
  ],
  release: reply(
    "release",
    "What's left before Thursday's release?",
    "Two items: the changelog and the migration note for the new date library.",
  ),
  launch: reply("launch", "Draft the launch post for the new dashboard.", "Drafting it now."),
  build: reply(
    "build",
    "Why is the build slow?",
    "Type checking takes 70% of it. Splitting the project references would cut it in half.",
  ),
  logs: reply("logs", "Which logs are the noisiest?", "Health checks write 60% of all lines."),
  cache: reply(
    "cache",
    "Avatars don't update after an upload.",
    "The CDN keeps them for a day. Adding the upload time to the URL fixes it.",
  ),
  pricing: reply(
    "pricing",
    "Compare our pricing tiers with last year's.",
    "Team went from $12 to $15 a seat, and Pro now includes SSO.",
  ),
  billing: reply(
    "billing",
    "Do billing webhooks retry?",
    "Up to 5 times, with backoff from 1 minute to 2 hours.",
  ),
  onboarding: reply("onboarding", "Shorten the onboarding email.", "Here's a version in three sentences."),
  csv: reply(
    "csv",
    "Why does CSV import fail on large files?",
    "The upload limit is 10 MB, and the files that fail are larger.",
  ),
  search: reply(
    "search",
    "How can we speed up the search index?",
    "Indexing only changed rows would take it from 20 minutes to 2.",
  ),
  a11y: reply(
    "a11y",
    "Audit the settings page.",
    "Four fields have no label and the save button has low contrast.",
  ),
  dark: reply(
    "dark",
    "Which colors fail contrast in dark mode?",
    "Muted text on raised surfaces is 3.9:1, under the 4.5:1 it needs.",
  ),
  deps: reply("deps", "Can we upgrade the date library?", "Yes. Two call sites need a new import."),
  schema: reply(
    "schema",
    "Plan the user schema migration.",
    "Add the column, backfill in batches, then switch reads.",
  ),
};

export const models: ModelOption[] = [
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic" },
  { id: "claude-opus-5.5", name: "Claude Opus 5.5", group: "Anthropic" },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI" },
  { id: "gpt-6.2-astra", name: "GPT-6.2 Astra", group: "OpenAI" },
];

export const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const modes = [
  { value: "ask", label: "Ask every time", description: "Approve each tool call" },
  { value: "edits", label: "Allow edits", description: "Edit files without asking" },
  { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
];

export const settings: SettingsEntry[] = [
  { type: "toggle", id: "search", label: "Web search" },
  { type: "toggle", id: "memory", label: "Memory" },
];

export const chips = [
  { id: "checkout", label: "tests/checkout.spec.ts", kind: "file" },
  { id: "mock", label: "mocks/payment.ts", kind: "file" },
  { id: "ci", label: "Last CI run", kind: "url" },
];
