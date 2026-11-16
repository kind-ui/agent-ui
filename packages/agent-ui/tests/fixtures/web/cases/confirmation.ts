import type { Approval } from "@kind-ui/agent-ui";
import type { ConfirmationOptions } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineConfirmation, type KindConfirmationElement } from "../../../../src/web/confirmation.js";
import { confirmationHost, request } from "../../shared/confirmation.js";

const { host, approve, deny } = confirmationHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;

const confirmation = (
  id: string,
  label: string,
  approval: Approval,
  { canDeny = true, reason = false } = {},
): KindConfirmationElement => {
  const el = document.createElement("kind-confirmation");
  el.id = id;
  el.label = label;
  el.canApprove = true;
  el.canDeny = canDeny;
  el.reason = reason;
  el.approval = approval;
  el.addEventListener("approve", (event) =>
    event.detail.waitUntil(Promise.resolve(approve(event.detail.value, event.detail))),
  );
  el.addEventListener("deny", (event) =>
    event.detail.waitUntil(Promise.resolve(deny(event.detail.value, event.detail))),
  );
  return el;
};

const confirmations = (motion?: ConfirmationOptions["motion"]) => (root: HTMLElement) => {
  defineConfirmation();
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
  const below = Object.assign(document.createElement("p"), { id: "below", textContent: "Below" });
  const main = confirmation("confirm", "Run search_docs?", request("requested"));
  if (motion) main.motion = motion;
  page.append(
    above,
    main,
    below,
    confirmation("reason", "Delete notes.md?", request("requested"), { reason: true }),
    confirmation("approve-only", "Open the link?", request("requested"), { canDeny: false }),
    confirmation("auto", "Read README.md?", request("auto", 1, { approved: true })),
  );
  root.append(page);
  Object.assign(window, {
    kindHost: host,
    kindApproval: {
      set: (next: Approval) => {
        main.approval = next;
      },
    },
  });
};

export const cases = { all: confirmations(), reduced: confirmations("reduced") };
