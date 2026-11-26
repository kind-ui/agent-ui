import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationCallback, ConfirmationDecision, ConfirmationOptions } from "@kind-ui/agent-ui/core";

export const request = (
  state: Approval["state"],
  generation = 1,
  decision?: Approval["decision"],
  more?: Pick<Approval, "expiresAt">,
): Approval => ({
  approvalId: "a1",
  generation,
  state,
  ...(decision && { decision }),
  ...more,
});

export type Decision = {
  choice: "approve" | "deny" | "always";
  decision: ConfirmationDecision;
  source: string;
  resolve(): void;
  reject(): void;
};

export function confirmationHost() {
  const decisions: Decision[] = [];
  const host = { decisions, permit: false };
  const answer =
    (choice: Decision["choice"]): ConfirmationCallback =>
    (decision, details) =>
      new Promise<void>((resolve, reject) =>
        decisions.push({ choice, decision, source: details.source, resolve, reject }),
      );
  return { host, approve: answer("approve"), deny: answer("deny"), always: answer("always") };
}

type Shown = Omit<ConfirmationOptions, "onApprove" | "onDeny" | "onAlwaysAllow" | "focusFallback">;

/** The Wave 7 confirmations every layer renders after the 0.8 ones, each with Deny, Approve and Always allow. */
export const moreConfirmations = (): { id: string; options: Shown }[] => {
  const always = {
    alwaysTarget: "search_docs",
    alwaysScope: "in this project",
  };
  const minutes = (count: number) => new Date(Date.now() + count * 60_000).toISOString();
  return [
    {
      id: "always",
      options: {
        label: "Allow `search_docs`?",
        approval: { ...request("requested"), approvalId: "always" },
        ...always,
        alwaysDetail: "Covers `search_docs` in this project. You can change it in Settings.",
      },
    },
    {
      id: "deadline",
      options: {
        label: "Refund $48.00 to order 1042?",
        approval: {
          ...request("requested", 1, undefined, { expiresAt: minutes(4.5) }),
          approvalId: "deadline",
        },
      },
    },
    {
      id: "late",
      options: {
        label: "Refund $12.00 to order 1043?",
        approval: { ...request("requested", 1, undefined, { expiresAt: minutes(-1) }), approvalId: "late" },
      },
    },
    {
      id: "danger",
      options: {
        label: "Edit `.github/workflows/release.yml`?",
        approval: { ...request("requested"), approvalId: "danger" },
        ...always,
        risk: "danger",
        riskText: "Changes how releases publish.",
      },
    },
    {
      id: "always-allowed",
      options: {
        label: "Allow `search_docs`?",
        approval: request("responded", 1, { approved: true, always: true, scope: "in this project" }),
        ...always,
      },
    },
    {
      id: "denied",
      options: {
        label: "Allow `web_search`?",
        approval: request("responded", 1, { approved: false, reason: "use the cached results instead" }),
      },
    },
    { id: "expired", options: { label: "Run `git push --force`?", approval: request("expired") } },
    { id: "cancelled", options: { label: "Run `npm publish`?", approval: request("cancelled") } },
  ];
};
