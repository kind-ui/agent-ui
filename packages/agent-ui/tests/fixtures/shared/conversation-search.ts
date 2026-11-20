import type { ConversationSearchMessage } from "@kind-ui/agent-ui/core";

const lines = [
  "Can we ship the rollout on Thursday?",
  "Yes, once the migration passes on staging.",
  "What about the Résumé page?",
  "It moved behind the new flag last week.",
  "Then the rollout waits for the flag review.",
  "I'll book the review for Wednesday.",
];

export const searchMessages = (count: number): ConversationSearchMessage[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `m${index}`,
    text: lines[index % lines.length] as string,
  }));

export const markdownMessage: ConversationSearchMessage = {
  id: "md",
  text: [
    "A **rollout** plan with a [rollout link](https://example.test/rollout) and `rollout` code.",
    "- first rollout step\n- second step",
    "| Stage | Note |\n| --- | --- |\n| rollout | staged rollout |",
    "![rollout diagram](https://example.test/rollout.png)",
    "```ts\nconst rollout = start();\n```",
  ].join("\n\n"),
};

export type SearchRecord = { queries: [string, string][]; opens: [boolean, string][] };
