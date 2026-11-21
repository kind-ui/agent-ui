import {
  type ModelControlOptions,
  type ModelControlTriggerState,
  modelControlPrimitive,
  type SettingsMenuContentState,
} from "@kind-ui/agent-ui/core";
import { MenuTrigger } from "@ui-sdk/vue/menu";
import { createParts } from "@ui-sdk/vue/primitive";
import { defineComponent, h, type SlotsType, type VNode } from "vue";
import { KindMenu, KindMenuContent, KindMenuItemIcon, menuProps, menuTriggerProps } from "./internal/menu.js";
import { SettingsMenuRows } from "./settings-menu.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onAction`, whose presence offers the `actions` and `run`, is declared a function prop instead, which `@action` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => modelControlPrimitive(options), modelControlPrimitive, {
    options: { ...modelControlPrimitive.options, onAction: "action" },
  }),
  "name",
  { value: modelControlPrimitive.name },
) as typeof modelControlPrimitive;

const parts = createParts(primitive, { root: "div", trigger: "span", content: "div" });

type Icon = string | VNode;

/** A model, whose `icon` is an image URL or a node such as an inline `svg`. */
export type ModelControlModel = Omit<NonNullable<ModelControlOptions["models"]>[number], "icon"> & {
  icon?: Icon;
};

/** An item after the models, like "More models", whose `icon` is an image URL or a node. */
export type ModelControlAction = Omit<NonNullable<ModelControlOptions["actions"]>[number], "icon"> & {
  icon?: Icon;
};

const triggerContent = ({ model, effort }: Pick<ModelControlTriggerState, "model" | "effort">) => [
  model.icon !== undefined
    ? h(KindMenuItemIcon, null, () =>
        typeof model.icon === "string" ? h("img", { src: model.icon, alt: "" }) : (model.icon as VNode),
      )
    : null,
  h("span", { "data-model-control-model": "" }, model.label),
  ...(effort
    ? [
        // Spaces around the "·", so the accessible name reads "GPT-5 · High"; the trigger's gap spaces it on screen.
        " ",
        h("span", { "data-model-control-separator": "" }, "·"),
        " ",
        // Every level's label shares one cell and only the chosen one shows, so the trigger keeps its width.
        h(
          "span",
          { "data-model-control-effort": "" },
          effort.options.map((option) =>
            h(
              "span",
              { key: option.value, "data-current": option.value === effort.value ? "" : undefined },
              option.label,
            ),
          ),
        ),
      ]
    : []),
  h("span", { "data-menu-chevron": "" }),
];

/**
 * Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, the model and the effort. A default slot, which gets
 * its `{ state }` (the model, the effort and the trigger's props), replaces what it shows.
 */
export const ModelControlTrigger = defineComponent({
  name: "ModelControlTrigger",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: { state: ModelControlTriggerState } }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Trigger, null, {
        default: ({ state }: { state: ModelControlTriggerState }) => {
          const trigger = menuTriggerProps(state);
          const shown: ModelControlTriggerState = { ...trigger, model: state.model, effort: state.effort };
          // Hidden from agents, which use the Model Control's own actions.
          return h(
            MenuTrigger,
            { ...trigger, "data-agent-hidden": "", ...attrs },
            {
              render: slots.render,
              default: () => (slots.default ? slots.default({ state: shown }) : triggerContent(shown)),
            },
          );
        },
      });
  },
});

/** The menu: UI SDK's `MenuContent` holding the rows unless you pass a slot, which gets the content's `{ state }`. Attributes go to it. */
export const ModelControlContent = defineComponent({
  name: "ModelControlContent",
  inheritAttrs: false,
  slots: Object as SlotsType<{ default?: { state: SettingsMenuContentState } }>,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Content, null, {
        default: ({ state }: { state: SettingsMenuContentState }) =>
          h(
            KindMenuContent,
            { align: "start", sideOffset: 6, ...attrs },
            {
              render: slots.render,
              default: () => (slots.default ? slots.default({ state }) : h(SettingsMenuRows, { rows: state.rows })),
            },
          ),
      });
  },
});

const defaultParts = () => [h(ModelControlTrigger), h(ModelControlContent)];

/**
 * One button for the model and its effort, reading "GPT-5 · High", that opens one menu: the models, grouped with
 * their icons, then the effort levels the model supports, then your own choices and toggles. A default slot replaces
 * the trigger and the content, inside UI SDK Menu.
 */
export const ModelControl = defineComponent({
  name: "ModelControl",
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
