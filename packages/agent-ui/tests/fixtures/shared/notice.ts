import type { NoticeVariant } from "@kind-ui/agent-ui/core";

export type NoticeData = {
  id: string;
  variant: NoticeVariant;
  label: string;
  text: string;
  dismissible?: boolean;
  action?: string;
};

export const notices: NoticeData[] = [
  {
    id: "info",
    variant: "info",
    label: "Indexing your files",
    text: "Answers may miss files added in the last minute.",
  },
  {
    id: "success",
    variant: "success",
    label: "Connected to GitHub",
    text: "The assistant can read your repositories now.",
  },
  {
    id: "warning",
    variant: "warning",
    label: "Rate limited",
    text: "Responses are slower for the next few minutes.",
    dismissible: true,
  },
  {
    id: "error",
    variant: "error",
    label: "Couldn't reach the model",
    text: "Check your connection and try again.",
    dismissible: true,
    action: "Retry",
  },
];

export const added: NoticeData = {
  id: "added",
  variant: "success",
  label: "Saved",
  text: "Your changes are saved.",
  dismissible: true,
};

const MINUTE = 60_000;
// Whole minutes from now, so the words don't change while a test runs.
const minutes = (count: number) => new Date((Math.floor(Date.now() / MINUTE) + count) * MINUTE).toISOString();

/** The limit recipe: near it, at it, under an hour from its reset, and paying past it. */
export type QuotaNotice = {
  id: string;
  variant: NoticeVariant;
  label: string;
  text?: string;
  resetsAt?: string;
  actions: string[];
  dismissible: boolean;
};

export const quotaNotices = (): QuotaNotice[] => [
  {
    id: "near",
    variant: "warning",
    label: "12 requests left",
    resetsAt: minutes(9 * 24 * 60),
    actions: ["Upgrade"],
    dismissible: true,
  },
  {
    id: "at",
    variant: "error",
    label: "You've reached your weekly limit",
    text: "New runs pause until then.",
    resetsAt: minutes(4 * 24 * 60),
    actions: ["Continue at reset", "Switch to Claude Haiku 5.5", "Use credits"],
    dismissible: false,
  },
  {
    id: "soon",
    variant: "error",
    label: "You've reached your 5-hour limit",
    resetsAt: minutes(42),
    actions: ["Use credits"],
    dismissible: false,
  },
  {
    id: "paying",
    variant: "info",
    label: "Now using credits",
    text: "$3.20 this month. Your weekly limit resets Tuesday.",
    actions: ["Manage"],
    dismissible: true,
  },
];

export const guardrails = {
  blocking: {
    label: "Model output withheld",
    reason: "The response included personal data.",
    detail: "Your organization's policy blocks responses that contain email addresses or phone numbers.",
  },
  filtered: {
    label: "Some results hidden",
    reason: "Two search results matched a content filter.",
    detail: "Filtered results come from sites your organization has blocked.",
  },
};

/** Records each dismiss, rejecting it while `reject` is set, and each refused opening. */
export function noticeHost() {
  const host = { dismisses: [] as string[], openings: [] as string[], reject: false };
  const dismissed = (id: string) => {
    host.dismisses.push(id);
    return host.reject ? Promise.reject(new Error("kept")) : undefined;
  };
  return { host, dismissed };
}
