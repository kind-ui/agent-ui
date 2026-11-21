import {
  type MenuPartState,
  type MenuTriggerState,
  type SettingsMenuContentState,
  type SettingsMenuOptions,
  type SettingsMenuRow,
  settingsMenuPrimitive,
} from "@kind-ui/agent-ui/core";
import { MenuItemIndicator, MenuTrigger } from "@ui-sdk/vue/menu";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, Fragment, h, type PropType, type SlotsType, type VNode } from "vue";
import {
  KindMenu,
  KindMenuCheckboxItem,
  KindMenuContent,
  KindMenuGroup,
  KindMenuGroupLabel,
  KindMenuItem,
  KindMenuItemContent,
  KindMenuItemIndicator,
  KindMenuRadioGroup,
  KindMenuRadioItem,
  KindMenuSeparator,
  KindMenuSub,
  KindMenuSubContent,
  KindMenuSubTrigger,
  menuProps,
  menuTriggerProps,
} from "./internal/menu.js";

const parts = createParts(settingsMenuPrimitive, { root: "div", trigger: "span", content: "div" });

type Entry = NonNullable<SettingsMenuOptions["settings"]>[number];
type Choice = Extract<Entry, { type: "choice" }>;
type Icon = string | VNode;

/** A setting, whose `icon` and options' `icon`s are image URLs or nodes such as an inline `svg`. */
export type SettingsMenuSetting =
  | (Extract<Entry, { type: "toggle" }> & { icon?: Icon })
  | (Omit<Choice, "options"> & { icon?: Icon; options: (Choice["options"][number] & { icon?: Icon })[] });

type ChoiceRow = Extract<SettingsMenuRow, { type: "choice" }>;

/** A choice's options in one radio group, under their group labels, then its actions. */
function choices(row: ChoiceRow) {
  return [
    h(KindMenuRadioGroup, { name: row.id, value: row.value ?? null }, () =>
      row.groups.map((group, index) => {
        const radios = group.options.map((option) =>
          h(
            KindMenuRadioItem,
            {
              key: option.value,
              value: option.value,
              label: option.label,
              disabled: option.disabled ?? false,
            },
            () => [
              h(KindMenuItemIndicator, { keepMounted: true }, () =>
                h("span", { "data-menu-check": "", "aria-hidden": "true" }),
              ),
              h(KindMenuItemContent, { icon: option.icon, label: option.label }),
            ],
          ),
        );
        // A labelled group sits inside the one radio group, which UI SDK keys by the setting's `id`.
        return group.label === undefined
          ? radios
          : // By position: an inline row's own label can match a host group's.
            h(KindMenuGroup, { key: index }, () => [
              h(KindMenuGroupLabel, null, () => group.label),
              ...radios,
            ]);
      }),
    ),
    row.actions.length && !row.inline ? h(KindMenuSeparator) : null,
    ...row.actions.map((action) =>
      h(
        KindMenuItem,
        {
          key: action.value,
          value: action.value,
          label: action.label,
          "data-menu-inset": row.inline ? "" : undefined,
        },
        () => h(KindMenuItemContent, { icon: action.icon, label: action.label }),
      ),
    ),
  ];
}

function rowNodes(row: SettingsMenuRow) {
  if (row.type === "toggle")
    return h(KindMenuCheckboxItem, { value: row.id, label: row.label, checked: row.checked }, () => [
      h(KindMenuItemContent, { icon: row.icon, label: row.label, description: row.description }),
      h(MenuItemIndicator, { keepMounted: true, "data-menu-switch": "", "aria-hidden": "true" }, () =>
        h("span", { "data-menu-switch-thumb": "" }),
      ),
    ]);
  if (row.inline) return choices(row);
  return h(KindMenuSub, null, () => [
    h(KindMenuSubTrigger, null, () => [
      h(KindMenuItemContent, { icon: row.icon, label: row.label }),
      h(
        "span",
        { "data-settings-menu-value": "" },
        row.options.map((option) =>
          h(
            "span",
            { key: option.value, "data-current": option.value === row.value ? "" : undefined },
            option.label,
          ),
        ),
      ),
      h("span", { "data-menu-chevron": "" }),
    ]),
    h(KindMenuSubContent, null, () => choices(row)),
  ]);
}

/**
 * The rows: a switch for each toggle, and for each choice a submenu showing its value, or while `inline` a section of
 * the menu, holding its options under their group labels and any actions after them. A separator follows an inline
 * section. Model Control draws its rows with it too.
 */
export const SettingsMenuRows = defineComponent({
  name: "SettingsMenuRows",
  props: { rows: { type: Array as PropType<SettingsMenuRow[]>, required: true } },
  setup(props) {
    return () =>
      props.rows.map((row, index) =>
        h(Fragment, { key: row.id }, [
          rowNodes(row),
          row.type === "choice" && row.inline && index < props.rows.length - 1 ? h(KindMenuSeparator) : null,
        ]),
      );
  },
});

const icon = () => h("span", { "data-menu-trigger-icon": "", "aria-hidden": "true" });

/** Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, showing a settings icon unless you pass a slot. */
export const SettingsMenuTrigger = defineComponent({
  name: "SettingsMenuTrigger",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Trigger, null, {
        default: ({ state }: { state: MenuTriggerState }) =>
          // Hidden from agents, which use the Settings Menu's own actions.
          h(
            MenuTrigger,
            { ...menuTriggerProps(state), "data-agent-hidden": "", ...attrs },
            {
              ...slots,
              default: slots.default ?? icon,
            },
          ),
      });
  },
});

/** The menu: UI SDK's `MenuContent` holding the rows unless you pass a slot, which gets the content's `{ state }`. Attributes go to it. */
export const SettingsMenuContent = defineComponent({
  name: "SettingsMenuContent",
  inheritAttrs: false,
  slots: Object as SlotsType<{
    default?: { state: SettingsMenuContentState };
    render?: Record<string, unknown>;
  }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Content, null, {
        default: ({ state }: { state: SettingsMenuContentState }) =>
          h(
            KindMenuContent,
            { align: "start", sideOffset: 6, ...attrs },
            {
              render: slots.render,
              default: () =>
                slots.default ? slots.default({ state }) : h(SettingsMenuRows, { rows: state.rows }),
            },
          ),
      });
  },
});

const defaultParts = () => [h(SettingsMenuTrigger), h(SettingsMenuContent)];

/**
 * An icon button named "Settings" that opens a menu of settings: toggles drawn as switches, which keep the menu open,
 * and choices, each a submenu of options showing the current one. A default slot replaces the trigger and the
 * content, inside UI SDK Menu.
 */
export const SettingsMenu = defineComponent({
  name: "SettingsMenu",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        ...slots,
        default: ({ state }: { state: MenuPartState }) =>
          h(KindMenu, menuProps(state), { default: slots.default ?? defaultParts }),
      });
  },
}) as unknown as typeof parts.Root;
