import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineAddMenu } from "../../../../src/web/add-menu.js";
import { addItems, addMenuHost } from "../../shared/add-menu.js";

const { host, action, open } = addMenuHost();

const page =
  ({
    motion,
    refusing = false,
    presentation,
  }: {
    motion?: MotionMode;
    refusing?: boolean;
    presentation?: "sheet";
  } = {}) =>
  (root: HTMLElement) => {
    defineAddMenu();
    const wrapper = Object.assign(document.createElement("div"), { className: "flex flex-col gap-4 p-6" });
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const row = Object.assign(document.createElement("div"), { className: "flex items-center gap-2" });
    const menu = document.createElement("kind-add-menu");
    menu.id = "add";
    menu.items = addItems;
    menu.canRun = true;
    if (motion) menu.motion = motion;
    if (presentation) menu.presentation = presentation;
    menu.addEventListener("addaction", (event) => {
      action(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    menu.addEventListener("openchange", (event) => open(event.detail.value, event.detail));
    const beside = Object.assign(document.createElement("span"), { id: "beside", textContent: "Beside" });
    row.append(menu, beside);
    wrapper.append(above, row);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(),
  reduced: page({ motion: "reduced" }),
  refusing: page({ refusing: true }),
  sheet: page({ presentation: "sheet" }),
};
