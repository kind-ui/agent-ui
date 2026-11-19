import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineShareDialog } from "../../../../src/web/share-dialog.js";
import { shareDialogHost, shareLink } from "../../shared/share-dialog.js";

const page =
  ({
    linked = false,
    agentConfirm,
    motion,
  }: {
    linked?: boolean;
    agentConfirm?: boolean;
    motion?: MotionMode;
  } = {}) =>
  (root: HTMLElement) => {
    defineShareDialog();
    const { host, call, answer } = shareDialogHost();
    const wrapper = Object.assign(document.createElement("div"), { className: "w-[30rem] p-6" });
    const dialog = document.createElement("kind-share-dialog");
    dialog.id = "share";
    dialog.canCreateLink = true;
    dialog.canRevoke = true;
    if (linked) {
      dialog.defaultVisibility = "link";
      dialog.link = shareLink;
    }
    if (agentConfirm !== undefined) dialog.agentConfirm = agentConfirm;
    if (motion) dialog.motion = motion;
    dialog.addEventListener("visibilitychange", (event) =>
      host.visibilities.push({
        value: event.detail.value,
        reason: event.detail.reason,
        source: event.detail.source,
      }),
    );
    dialog.addEventListener("createlink", (event) => event.detail.waitUntil(call("create", event.detail)));
    dialog.addEventListener("revoke", (event) => event.detail.waitUntil(call("revoke", event.detail)));
    dialog.addEventListener("linkcopy", (event) =>
      host.copies.push({ link: event.detail.value, reason: event.detail.reason }),
    );
    answer((action) => {
      if (action === "create") {
        dialog.link = shareLink;
        return;
      }
      dialog.link = undefined;
      dialog.visibility = "private";
    });
    wrapper.append(dialog);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(),
  linked: page({ linked: true }),
  unconfirmed: page({ agentConfirm: false }),
  reduced: page({ motion: "reduced" }),
};
