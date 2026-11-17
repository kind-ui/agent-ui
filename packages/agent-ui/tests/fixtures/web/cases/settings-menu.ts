import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineSettingsMenu } from "../../../../src/web/settings-menu.js";
import { initialValues, settings, settingsMenuHost } from "../../shared/settings-menu.js";

const { host, change } = settingsMenuHost();

const page =
  ({ motion, refusing = false }: { motion?: MotionMode; refusing?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineSettingsMenu();
    const wrapper = Object.assign(document.createElement("div"), { className: "p-6" });
    const menu = document.createElement("kind-settings-menu");
    menu.id = "settings";
    menu.settings = settings;
    menu.values = initialValues;
    if (motion) menu.motion = motion;
    menu.addEventListener("valueschange", (event) => {
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
};
