import {
  type AddMenuContentState,
  type AddMenuOptions,
  type AddMenuRow,
  type AddMenuSection,
  addMenuPrimitive,
} from "@kind-ui/agent-ui/core";
import { MenuTrigger } from "@ui-sdk/vue/menu";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, Fragment, h, type PropType, type SlotsType, type VNode } from "vue";
import {
  KindMenu,
  KindMenuContent,
  KindMenuGroup,
  KindMenuGroupLabel,
  KindMenuItem,
  KindMenuItemContent,
  KindMenuSeparator,
  KindMenuSub,
  KindMenuSubContent,
  KindMenuSubTrigger,
  menuProps,
  menuTriggerProps,
} from "./internal/menu.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onAction`, whose presence enables the items, is declared a function prop instead, which `@action` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => addMenuPrimitive(options), addMenuPrimitive, {
    options: { ...addMenuPrimitive.options, onAction: "action" },
  }),
  "name",
  { value: addMenuPrimitive.name },
) as typeof addMenuPrimitive;

const parts = createParts(primitive, { root: "div", trigger: "span", content: "div" });

/** An entry, whose `icon` is an image URL or a node such as an inline `svg`. */
export type AddMenuEntry = Omit<NonNullable<AddMenuOptions["items"]>[number], "icon" | "items"> & {
  icon?: string | VNode;
  items?: AddMenuEntry[];
};

function row(row: AddMenuRow): VNode {
  if (!row.sections)
    return h(KindMenuItem, { key: row.id, value: row.id, label: row.label, disabled: row.disabled }, () =>
      h(KindMenuItemContent, { icon: row.icon, label: row.label, description: row.description }),
    );
  const sections = row.sections;
  return h(KindMenuSub, { key: row.id }, () => [
    h(KindMenuSubTrigger, { disabled: row.disabled }, () => [
      h(KindMenuItemContent, { icon: row.icon, label: row.label, description: row.description }),
      h("span", { "data-menu-chevron": "" }),
    ]),
    h(KindMenuSubContent, null, () => h(AddMenuRows, { sections })),
  ]);
}

/** The rows of a level: each group under its label, separated, and a submenu for each entry with `items`. */
export const AddMenuRows = defineComponent({
  name: "AddMenuRows",
  props: { sections: { type: Array as PropType<AddMenuSection[]>, required: true } },
  setup(props) {
    return () =>
      props.sections.map((section, index) => {
        const rows = section.rows.map(row);
        return h(Fragment, { key: section.label ?? "" }, [
          index > 0 ? h(KindMenuSeparator) : null,
          section.label === undefined
            ? rows
            : h(KindMenuGroup, null, () => [h(KindMenuGroupLabel, null, () => section.label), ...rows]),
        ]);
      });
  },
});

const plus = () => h("span", { "data-menu-trigger-icon": "", "aria-hidden": "true" });

/** Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, showing a plus unless you pass a slot. */
export const AddMenuTrigger = defineComponent({
  name: "AddMenuTrigger",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Trigger, null, {
        default: ({ state }: { state: Parameters<typeof menuTriggerProps>[0] }) =>
          // Hidden from agents, which use the Add Menu's own actions.
          h(
            MenuTrigger,
            { ...menuTriggerProps(state), "data-agent-hidden": "", ...attrs },
            { ...slots, default: slots.default ?? plus },
          ),
      });
  },
});

/** The menu: UI SDK's `MenuContent` holding the rows unless you pass a slot, which gets the content's `{ state }`. Attributes go to it. */
export const AddMenuContent = defineComponent({
  name: "AddMenuContent",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: { state: AddMenuContentState } }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Content, null, {
        default: ({ state }: { state: AddMenuContentState }) =>
          h(
            KindMenuContent,
            { align: "start", sideOffset: 6, ...attrs },
            {
              render: slots.render,
              default: () => (slots.default ? slots.default({ state }) : h(AddMenuRows, { sections: state.sections })),
            },
          ),
      });
  },
});

const defaultParts = () => [h(AddMenuTrigger), h(AddMenuContent)];

/**
 * An icon button named "Add" that opens a menu of what can be added: items with an icon and a description, grouped
 * under labels, and submenus. A default slot replaces the trigger and the content, inside UI SDK Menu.
 */
export const AddMenu = defineComponent({
  name: "AddMenu",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: ({ state }: { state: Parameters<typeof menuProps>[0] }) =>
          h(KindMenu, menuProps(state), { default: slots.default ?? defaultParts }),
      });
  },
}) as unknown as typeof parts.Root;
