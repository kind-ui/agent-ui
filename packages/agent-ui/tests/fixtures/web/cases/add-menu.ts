import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineAddMenu } from "../../../../src/web/add-menu.js";
import { addItems, addMenuHost } from "../../shared/add-menu.js";

const { host, action } = addMenuHost();

const page =
  ({
    motion,
    refusing = false,
    inert = false,
  }: {
    motion?: MotionMode;
    refusing?: boolean;
    inert?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineAddMenu();
    const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
    const menu = document.createElement("kind-add-menu");
    menu.id = "add";
    menu.items = addItems;
    menu.canRun = !inert;
    if (motion) menu.motion = motion;
    menu.addEventListener("addaction", (event) => {
      action(event.detail.value, event.detail);
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
  inert: page({ inert: true }),
};
