import type { MotionMode } from "@kind-ui/agent-ui/core";
import { definePicker } from "../../../../src/web/picker.js";
import { pickerHost, placeActions, places } from "../../shared/picker.js";

const { host, record } = pickerHost();

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
    definePicker();
    const wrapper = Object.assign(document.createElement("div"), { className: "flex flex-col gap-4 p-6" });
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const row = Object.assign(document.createElement("div"), { className: "flex items-center gap-2" });
    const picker = document.createElement("kind-picker");
    picker.id = "picker";
    picker.label = "Work in";
    picker.items = places;
    picker.actions = placeActions;
    picker.canRun = true;
    picker.defaultValue = "kind-ui/agent-ui";
    if (motion) picker.motion = motion;
    if (presentation) picker.presentation = presentation;
    picker.addEventListener("pickerchange", (event) => {
      record("value")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    picker.addEventListener("pickeraction", (event) => {
      record("action")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    const beside = Object.assign(document.createElement("span"), { id: "beside", textContent: "Beside" });
    row.append(picker, beside);
    wrapper.append(above, row);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

/** A picker whose items have no icons and nothing chosen. */
const plain = (root: HTMLElement) => {
  definePicker();
  const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
  const picker = document.createElement("kind-picker");
  picker.id = "picker";
  picker.label = "Branch";
  picker.items = [
    { value: "main", label: "main" },
    { value: "dev", label: "dev" },
  ];
  wrapper.append(picker);
  root.append(wrapper);
};

export const cases = {
  plain,
  all: page(),
  reduced: page({ motion: "reduced" }),
  refusing: page({ refusing: true }),
  sheet: page({ presentation: "sheet" }),
};
