import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineEffortSlider } from "../../../../src/web/effort-slider.js";
import { effortHost, levels } from "../../shared/effort-slider.js";

const { host, record } = effortHost();

const page =
  ({
    motion,
    refusing = false,
    written = false,
  }: {
    motion?: MotionMode;
    refusing?: boolean;
    written?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineEffortSlider();
    const wrapper = Object.assign(document.createElement("div"), { className: "flex flex-col gap-4 p-6" });
    const setLow = Object.assign(document.createElement("button"), {
      id: "set-low",
      type: "button",
      textContent: "Set Low",
    });
    const row = Object.assign(document.createElement("div"), { className: "flex items-center gap-2" });
    const slider = document.createElement("kind-effort-slider");
    slider.id = "effort";
    slider.levels = levels;
    slider.defaultValue = "medium";
    slider.modelLabel = "GPT-5";
    slider.canPressModel = true;
    if (motion) slider.motion = motion;
    if (written)
      slider.innerHTML =
        "<kind-effort-slider-trigger><button></button></kind-effort-slider-trigger><kind-effort-slider-content hidden><kind-effort-slider-slider><kind-internal-slider><ui-slider><ui-slider-control><ui-slider-track><ui-slider-indicator></ui-slider-indicator><ui-slider-thumb></ui-slider-thumb></ui-slider-track></ui-slider-control></ui-slider></kind-internal-slider></kind-effort-slider-slider><kind-effort-slider-stops></kind-effort-slider-stops></kind-effort-slider-content>";
    setLow.addEventListener("click", () => {
      slider.value = "low";
    });
    slider.addEventListener("effortchange", (event) => {
      record("value")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    slider.addEventListener("modelpress", (event) => {
      record("model")(event.detail.value, event.detail);
    });
    const beside = Object.assign(document.createElement("span"), { id: "beside", textContent: "Beside" });
    row.append(slider, beside);
    wrapper.append(setLow, row);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(),
  reduced: page({ motion: "reduced" }),
  refusing: page({ refusing: true }),
  controlled: page(),
  written: page({ written: true }),
};
