import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineApprovalMode } from "../../../../src/web/approval-mode.js";
import { approvalModeHost, initialValue, learnMoreHref, modes } from "../../shared/approval-mode.js";

const { host, change, learn } = approvalModeHost();

const page =
  ({
    motion,
    refusing = false,
    agentConfirm,
    learning = false,
  }: {
    motion?: MotionMode;
    refusing?: boolean;
    agentConfirm?: boolean;
    learning?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineApprovalMode();
    const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
    const menu = document.createElement("kind-approval-mode");
    menu.modes = modes;
    menu.value = initialValue;
    if (learning) {
      menu.canLearnMore = true;
      menu.addEventListener("learnmore", (event) => learn(event.detail.value, event.detail));
    } else menu.learnMoreHref = learnMoreHref;
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
  learning: page({ learning: true }),
};
