import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineEffortSlider } from "../../../../src/web/effort-slider.js";
import { effortHost, levels } from "../../shared/effort-slider.js";

const { host, record } = effortHost();

const page =
  ({ motion, refusing = false }: { motion?: MotionMode; refusing?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineEffortSlider();
    const wrapper = Object.assign(document.createElement("div"), { className: "flex flex-col gap-4 p-6" });
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const row = Object.assign(document.createElement("div"), { className: "flex items-center gap-2" });
    const slider = document.createElement("kind-effort-slider");
    slider.id = "effort";
    slider.levels = levels;
    if (refusing) slider.value = "medium";
    else slider.defaultValue = "medium";
    slider.modelLabel = "GPT-5";
    slider.canPressModel = true;
    if (motion) slider.motion = motion;
    slider.addEventListener("effortchange", (event) => {
      record("value")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    slider.addEventListener("modelpress", (event) => {
      record("model")(event.detail.value, event.detail);
    });
    const beside = Object.assign(document.createElement("span"), { id: "beside", textContent: "Beside" });
    row.append(slider, beside);
    wrapper.append(above, row);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(),
  reduced: page({ motion: "reduced" }),
  refusing: page({ refusing: true }),
};
