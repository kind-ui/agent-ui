import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineModelSelector } from "../../../../src/web/model-selector.js";
import { defineReasoningEffort } from "../../../../src/web/reasoning-effort.js";
import { iconModels, levels, modelActions, models, selectionHost } from "../../shared/model-selector.js";

const { host, record } = selectionHost();

const toolbar =
  ({
    motion,
    refusing = false,
    plain = false,
    pages,
  }: {
    motion?: MotionMode;
    refusing?: boolean;
    plain?: boolean;
    pages?: "groups";
  } = {}) =>
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
    if (pages) model.pages = pages;
    if (motion) model.motion = motion;
    if (!plain) {
      model.actions = modelActions;
      model.canRun = true;
    }
    model.addEventListener("modelchange", (event) => {
      record("model")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    model.addEventListener("modelaction", (event) => {
      record("action")(event.detail.value, event.detail);
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

const logo = (markup: string) => {
  const template = document.createElement("template");
  template.innerHTML = markup;
  return template.content.firstElementChild as Element;
};

const logos = (root: HTMLElement) => {
  defineModelSelector();
  const logoModels = iconModels(logo);
  const page = document.createElement("div");
  page.className = "flex flex-col gap-4 p-6";
  const selector = (id: string, defaultValue: string) => {
    const model = document.createElement("kind-model-selector");
    model.id = id;
    model.models = logoModels;
    model.defaultValue = defaultValue;
    model.addEventListener("modelchange", (event) => record(id)(event.detail.value, event.detail));
    return model;
  };
  const indented = Object.assign(document.createElement("div"), { className: "ps-32" });
  indented.append(selector("second", "mai-code-2"));
  page.append(selector("model", "claude-sonnet-5.5"), indented);
  root.append(page);
  Object.assign(window, { kindHost: host });
};

export const cases = {
  all: toolbar(),
  plain: toolbar({ plain: true }),
  groups: toolbar({ pages: "groups" }),
  reduced: toolbar({ motion: "reduced" }),
  refusing: toolbar({ refusing: true }),
  logos,
};
