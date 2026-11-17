import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineApprovalMode } from "../../../../src/web/approval-mode.js";
import { approvalModeHost, initialValue, learnMoreHref, modes } from "../../shared/approval-mode.js";

const { host, change } = approvalModeHost();

const page =
  ({
    motion,
    refusing = false,
    agentConfirm,
  }: {
    motion?: MotionMode;
    refusing?: boolean;
    agentConfirm?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineApprovalMode();
    const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
    const menu = document.createElement("kind-approval-mode");
    menu.id = "approvals";
    menu.modes = modes;
    menu.value = initialValue;
    menu.learnMoreHref = learnMoreHref;
    if (motion) menu.motion = motion;
    if (agentConfirm !== undefined) menu.agentConfirm = agentConfirm;
    menu.addEventListener("modechange", (event) => {
      change(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    wrapper.append(menu);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(),
  reduced: page({ motion: "reduced" }),
  refusing: page({ refusing: true }),
  unconfirmed: page({ agentConfirm: false }),
};
