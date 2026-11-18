import { defineModelControl } from "../../../../src/web/model-control.js";
import { controlHost, levels, modelActions, models, settings } from "../../shared/model-control.js";

const { host, record } = controlHost();

const page =
  ({ refusing = false }: { refusing?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineModelControl();
    const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
    const control = document.createElement("kind-model-control");
    control.id = "control";
    control.models = models;
    control.levels = levels;
    control.settings = settings;
    control.defaultModel = "opus";
    control.defaultEffort = "medium";
    control.defaultValues = { fast: false, context: "1m" };
    control.actions = modelActions;
    control.canRun = true;
    control.addEventListener("modelchange", (event) => {
      record("model")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    control.addEventListener("effortchange", (event) => {
      record("effort")(event.detail.value, event.detail);
      if (refusing) event.preventDefault();
    });
    control.addEventListener("valueschange", (event) =>
      record(event.detail.id)(event.detail.value[event.detail.id], event.detail),
    );
    control.addEventListener("modelaction", (event) => record("action")(event.detail.value, event.detail));
    wrapper.append(control);
    root.append(wrapper);
    Object.assign(window, { kindHost: host });
  };

export const cases = { all: page(), refusing: page({ refusing: true }) };
