import {
  type SelectionItemState,
  type SelectionToolbarState,
  selectionPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h } from "vue";
import { KindToolbar, KindToolbarButton } from "./internal/toolbar.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onAction`, whose presence offers the actions, is declared a function prop instead, which `@action` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => selectionPrimitive(options), selectionPrimitive, {
    options: { ...selectionPrimitive.options, onAction: "action" },
  }),
  "name",
  { value: selectionPrimitive.name },
) as typeof selectionPrimitive;

const parts = createParts(primitive, {
  root: "div",
  content: "div",
  toolbar: "div",
  item: "span",
});

type Scope<State> = { state: State };

/** The bare root, for arranging `SelectionContent` and `SelectionToolbar` yourself. */
export const SelectionRoot = parts.Root;

/** Holds the text a person selects. Put `SelectionToolbar` right after it. */
export const SelectionContent = parts.Content;

/** An action, whose `value` is its `id`. Wrap a `KindToolbarButton`, or leave it empty for one with the action's label. */
export const SelectionItem = defineComponent({
  name: "SelectionItem",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Item as Component, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: Scope<SelectionItemState>) =>
            h(KindToolbarButton, { disabled: !state.canRun, title: state.description }, () => state.label)),
      });
  },
}) as unknown as typeof parts.Item;

/** Shown above the selection, with one `SelectionItem` per action unless you fill its slot. */
export const SelectionToolbar = defineComponent({
  name: "SelectionToolbar",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Toolbar, attrs, {
        ...slots,
        default:
          slots.default ??
          (({ state }: Scope<SelectionToolbarState>) =>
            h(KindToolbar, { "aria-label": state.label }, () =>
              state.actions.map((action) => h(SelectionItem, { key: action.id, value: action.id })),
            )),
      });
  },
}) as unknown as typeof parts.Toolbar;

/**
 * Wraps a reply so selecting text in it shows a toolbar of `actions` above the selection. Its default slot is the
 * reply.
 */
export const Selection = defineComponent({
  name: "Selection",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Root, attrs, {
        render: slots.render,
        default: () => [h(SelectionContent, null, () => slots.default?.()), h(SelectionToolbar)],
      });
  },
}) as unknown as typeof parts.Root;
