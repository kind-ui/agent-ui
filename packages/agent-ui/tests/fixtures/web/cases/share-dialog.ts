import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineShareDialog } from "../../../../src/web/share-dialog.js";
import { shareDialogHost, shareLink } from "../../shared/share-dialog.js";

const page =
  ({
    linked = false,
    agentConfirm,
    motion,
    refusing = false,
    written = false,
  }: {
    linked?: boolean;
    agentConfirm?: boolean;
    motion?: MotionMode;
    refusing?: boolean;
    written?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineShareDialog();
    const { host, call, answer } = shareDialogHost();
    const wrapper = Object.assign(document.createElement("div"), { className: "max-w-[30rem] p-6" });
    const dialog = document.createElement("kind-share-dialog");
    dialog.id = "share";
    if (written)
      dialog.innerHTML = `<kind-share-dialog-trigger><button aria-label="Share"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="8" /></svg></button></kind-share-dialog-trigger>`;
    dialog.canCreateLink = true;
    dialog.canRevoke = true;
    if (linked) {
      dialog.defaultVisibility = "link";
      dialog.link = shareLink;
    }
    if (agentConfirm !== undefined) dialog.agentConfirm = agentConfirm;
    if (motion) dialog.motion = motion;
    dialog.addEventListener("sharevisibilitychange", (event) => {
      host.visibilities.push({
        value: event.detail.value,
        reason: event.detail.reason,
        source: event.detail.source,
      });
      if (refusing) event.preventDefault();
    });
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
  refusing: page({ refusing: true }),
  written: page({ written: true }),
};
