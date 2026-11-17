import { type MenuBaseOptions, menuBase } from "@kind-ui/agent-ui/core";
import { definePrimitive } from "@ui-sdk/core";
import { createParts } from "@ui-sdk/web";
import "@ui-sdk/web/menu";

let output: HTMLOutputElement | undefined;
const log = (line: string) => output?.append(`${line}\n`);

const base = menuBase<MenuBaseOptions>({
  kind: "test",
  label: "Edit",
  toData: () => [],
  onAction: (value, { source }) => log(`action ${value} ${source}`),
  onChecked: (value, checked, { source }) => log(`checked ${value} ${checked} ${source}`),
  onValue: (group, value, { source }) => log(`value ${group} ${value} ${source}`),
});

const testMenuPrimitive = definePrimitive({
  name: "kind-test-menu",
  options: base.options,
  state: base.state,
  sync: base.sync,
  controlled: base.controlled,
  api: base.api,
  slots: base.slots,
  agent: base.agent,
});

const defineTestMenu = () => {
  if (customElements.get("kind-test-menu")) return;
  createParts(testMenuPrimitive, {
    root: {
      tag: "kind-test-menu",
      render: (el, instance) => {
        const draw = () => {
          const { controller, presentation, open } = instance.api.partState.menu(instance.get());
          const menu = el.querySelector("ui-menu");
          if (!menu) return;
          if (menu.controller !== controller) menu.controller = controller;
          if (menu.presentation !== presentation) menu.presentation = presentation;
          if (menu.open !== open) menu.open = open;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
  });
};

export const cases = {
  menu: (root: HTMLElement) => {
    defineTestMenu();
    root.innerHTML = `
      <kind-test-menu>
        <ui-menu>
          <ui-menu-trigger><button>Edit</button></ui-menu-trigger>
          <ui-menu-content>
            <ui-menu-item value="rename">Rename</ui-menu-item>
            <ui-menu-checkbox-item value="wrap">Word wrap</ui-menu-checkbox-item>
            <ui-menu-radio-group name="density" default-value="compact">
              <ui-menu-radio-item value="compact">Compact</ui-menu-radio-item>
              <ui-menu-radio-item value="comfortable">Comfortable</ui-menu-radio-item>
            </ui-menu-radio-group>
            <ui-menu-sub>
              <ui-menu-sub-trigger>More</ui-menu-sub-trigger>
              <ui-menu-sub-content><ui-menu-item value="delete">Delete</ui-menu-item></ui-menu-sub-content>
            </ui-menu-sub>
          </ui-menu-content>
        </ui-menu>
        <kind-test-other></kind-test-other>
      </kind-test-menu>
      <output style="white-space: pre"></output>
    `;
    output = root.querySelector("output") ?? undefined;
  },
};
