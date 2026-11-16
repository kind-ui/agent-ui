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

/** Records each dismiss, and rejects it while `reject` is set. */
export function noticeHost() {
  const host = { dismisses: [] as string[], reject: false };
  const dismissed = (id: string) => {
    host.dismisses.push(id);
    return host.reject ? Promise.reject(new Error("kept")) : undefined;
  };
  return { host, dismissed };
}
