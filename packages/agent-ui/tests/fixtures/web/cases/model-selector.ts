import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineComposer } from "../../../../src/web/composer.js";
import { defineModelSelector } from "../../../../src/web/model-selector.js";
import { defineReasoningEffort } from "../../../../src/web/reasoning-effort.js";
import { controls } from "../../shared/full-composer.js";
import {
  costModels,
  iconModels,
  levels,
  modelActions,
  models,
  selectionHost,
} from "../../shared/model-selector.js";

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

const inComposer = (root: HTMLElement) => {
  defineComposer();
  defineModelSelector();
  defineReasoningEffort();
  root.innerHTML = `
    <div class="p-4">
      <kind-composer>
        <form aria-label="Message">
          <ui-file-input>
            <ui-file-input-dropzone>
              <kind-composer-input>
                <ui-token-input>
                  <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything"></ui-token-input-editor>
                </ui-token-input>
              </kind-composer-input>
              <div data-controls></div>
              <kind-composer-submit><button></button></kind-composer-submit>
            </ui-file-input-dropzone>
          </ui-file-input>
        </form>
      </kind-composer>
    </div>`;
  const model = document.createElement("kind-model-selector");
  model.id = "model";
  model.models = iconModels(logo);
  model.defaultValue = "claude-sonnet-5.5";
  const effort = document.createElement("kind-reasoning-effort");
  effort.id = "effort";
  effort.levels = levels;
  effort.defaultValue = "medium";
  const row = root.querySelector("[data-controls]") as HTMLElement;
  Object.assign(row.style, controls);
  row.append(model, effort);
};

const cost = (root: HTMLElement) => {
  defineModelSelector();
  const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
  const selector = document.createElement("kind-model-selector");
  selector.id = "model";
  selector.models = costModels;
  selector.defaultValue = "claude-sonnet-5.5";
  wrapper.append(selector);
  root.append(wrapper);
};

export const cases = {
  cost,
  all: toolbar(),
  plain: toolbar({ plain: true }),
  groups: toolbar({ pages: "groups" }),
  reduced: toolbar({ motion: "reduced" }),
  refusing: toolbar({ refusing: true }),
  logos,
  composer: inComposer,
};
