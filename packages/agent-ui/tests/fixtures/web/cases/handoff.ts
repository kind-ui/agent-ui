import type { HandoffOptions } from "@kind-ui/agent-ui/core";
import { defineHandoff } from "../../../../src/web/handoff.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { handoffs } from "../../shared/handoff.js";

const all = (root: HTMLElement) => {
  defineHandoff();
  const { host, approve, deny, always } = confirmationHost();
  const list = document.createElement("div");
  list.className = "flex w-[34rem] flex-col gap-3 p-6";
  for (const [id, { approve: decides, ...row }] of Object.entries(handoffs)) {
    const handoff = document.createElement("kind-handoff");
    handoff.id = id;
    if (decides) {
      Object.assign(handoff, { canApprove: true, canDeny: true, canAlwaysAllow: true });
      handoff.addEventListener("approve", (event) =>
        event.detail.waitUntil(Promise.resolve(approve(event.detail.value, event.detail))),
      );
      handoff.addEventListener("deny", (event) =>
        event.detail.waitUntil(Promise.resolve(deny(event.detail.value, event.detail))),
      );
      handoff.addEventListener("alwaysallow", (event) =>
        event.detail.waitUntil(Promise.resolve(always(event.detail.value, event.detail))),
      );
    }
    list.append(handoff);
    Object.assign(handoff, row);
  }
  root.append(list);
  Object.assign(window, {
    kindHost: host,
    kindHandoff: {
      set: (id: string, next: Partial<HandoffOptions>) =>
        Object.assign(root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-handoff"], next),
    },
  });
};

export const cases = { all };
