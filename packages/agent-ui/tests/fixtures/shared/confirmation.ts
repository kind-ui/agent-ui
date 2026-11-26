import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationCallback, ConfirmationDecision } from "@kind-ui/agent-ui/core";

export const request = (
  state: Approval["state"],
  generation = 1,
  decision?: Approval["decision"],
): Approval => ({
  approvalId: "a1",
  generation,
  state,
  ...(decision && { decision }),
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
