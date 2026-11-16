import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineModelSelector } from "../../../../src/web/model-selector.js";
import { defineReasoningEffort } from "../../../../src/web/reasoning-effort.js";
import { levels, models, selectionHost } from "../../shared/model-selector.js";

const { host, record } = selectionHost();

const toolbar =
  (motion?: MotionMode, refusing = false) =>
  (root: HTMLElement) => {
    defineModelSelector();
    defineReasoningEffort();
    const page = document.createElement("div");
    page.className = "flex flex-col gap-4 p-6";
    const above = Object.assign(document.createElement("p"), { id: "above", textContent: "Above" });
    const row = Object.assign(document.createElement("div"), {
      id: "toolbar",
      className: "flex items-center gap-2",
    });
    const model = document.createElement("kind-model-selector");
    model.id = "model";
    model.models = models;
    model.defaultValue = "gpt-5";
    if (motion) model.motion = motion;
    model.addEventListener("modelchange", (event) => {
      record("model")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    const effort = document.createElement("kind-reasoning-effort");
    effort.id = "effort";
    effort.levels = levels;
    effort.defaultValue = "medium";
    if (motion) effort.motion = motion;
    effort.addEventListener("effortchange", (event) => {
      record("effort")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    const beside = Object.assign(document.createElement("span"), { id: "beside", textContent: "Beside" });
    row.append(model, effort, beside);
    page.append(above, row);
    root.append(page);
    Object.assign(window, { kindHost: host });
  };

export const cases = { all: toolbar(), reduced: toolbar("reduced"), refusing: toolbar(undefined, true) };
