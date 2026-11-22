import {
  CONTEXT_BAR_FIRST_ITEM,
  type ContextBarChipState,
  type ContextBarListState,
  type ContextBarOptions,
  type ContextBarOverflowState,
  contextBarPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import { type Component, defineComponent, h, type VNode } from "vue";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onRemove`, whose presence offers removal, is declared a function prop instead, which `@remove` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => contextBarPrimitive(options), contextBarPrimitive, {
    options: { ...contextBarPrimitive.options, onRemove: "action" },
  }),
  "name",
  { value: contextBarPrimitive.name },
) as typeof contextBarPrimitive;

const parts = createParts(primitive, {
  root: "div",
  list: "ul",
  chip: "li",
  remove: "span",
  "item-remove": "span",
  overflow: "button",
  content: "div",
  viewport: "div",
  title: "h2",
  "overflow-list": "ul",
  item: "li",
});

/** A chip, whose `icon` is an image URL or a node such as an inline `svg`. */
export type ContextBarChipData = Omit<NonNullable<ContextBarOptions["chips"]>[number], "icon"> & {
  icon?: string | VNode;
};

/** A chip's remove control in the bar, for the pointer: hidden from assistive technology, which uses Delete. */
export const ContextBarRemove = parts.Remove;
/** A chip's remove control in the list of the rest, as `ContextBarRemove` is in the bar. */
export const ContextBarItemRemove = parts.ItemRemove;

const chipContent = ({ chip }: ContextBarChipState, remove: VNode) => {
  const icon = chip?.icon as string | VNode | undefined;
  return [
    icon === undefined
      ? null
      : h("span", { "data-context-bar-icon": "" }, [
          typeof icon === "string" ? h("img", { src: icon, alt: "" }) : icon,
        ]),
    h("span", { "data-context-bar-label": "" }, chip?.label),
    remove,
  ];
};

const chipPart = (name: string, part: Component, remove: Component) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(part, attrs, {
          ...slots,
          default:
            slots.default ??
            (({ state }: { state: ContextBarChipState }) =>
              chipContent(state, h(remove, { value: attrs.value }))),
        });
    },
  });

/**
 * One chip in the bar: its icon, its label and a `ContextBarRemove`, unless you pass a slot. A new chip renders only
 * itself: the others keep their props.
 */
export const ContextBarChip = chipPart(
  "ContextBarChip",
  parts.Chip,
  ContextBarRemove,
) as unknown as typeof parts.Chip;

/** One chip in the list of the rest, as `ContextBarChip` is in the bar, with a `ContextBarItemRemove`. */
export const ContextBarItem = chipPart(
  "ContextBarItem",
  parts.Item,
  ContextBarItemRemove,
) as unknown as typeof parts.Item;

const listPart = (name: string, part: Component, row: Component) =>
  defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(part, attrs, {
          ...slots,
          default:
            slots.default ??
            (({ state }: { state: ContextBarListState }) =>
              state.rows.map((entry) => h(row, { key: entry.item.id, value: entry.item.id }))),
        });
    },
  });

/** The row of chips, one Tab stop with arrow keys between them. Without a slot, a `ContextBarChip` per row. */
export const ContextBarList = listPart(
  "ContextBarList",
  parts.List,
  ContextBarChip,
) as unknown as typeof parts.List;

/** The chips that don't fit, one Tab stop with arrow keys between them. Without a slot, a `ContextBarItem` per row. */
export const ContextBarOverflowList = listPart(
  "ContextBarOverflowList",
  parts.OverflowList,
  ContextBarItem,
) as unknown as typeof parts.OverflowList;

/** The "+N" button, present while some chips don't fit, which opens the list of them. */
export const ContextBarOverflow = defineComponent({
  name: "ContextBarOverflow",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Overflow, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: ContextBarOverflowState }) => `+${state.count}`),
      });
  },
}) as unknown as typeof parts.Overflow;

/** Names the list of the chips that don't fit: the `label`. The styles keep it for assistive technology only. */
export const ContextBarTitle = defineComponent({
  name: "ContextBarTitle",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(parts.Title, attrs, {
        ...slots,
        default: slots.default ?? (({ state }: { state: { label: string } }) => state.label),
      });
  },
}) as unknown as typeof parts.Title;

/** The popover of the chips that don't fit, unless you pass a slot. Focus moves to the first. */
export const ContextBarContent = defineComponent({
  name: "ContextBarContent",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        parts.Content,
        { initialFocus: CONTEXT_BAR_FIRST_ITEM, sideOffset: 6, align: "end", ...attrs },
        {
          default: slots.default ?? (() => [h(ContextBarTitle), h(ContextBarOverflowList)]),
          // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
          render: (scope: {
            props: Record<string, unknown>;
            state: { presentation: string };
            children: Component;
          }) => {
            const element = slots.render ? slots.render(scope) : h("div", scope.props, [h(scope.children)]);
            return [scope.state.presentation === "sheet" ? h(parts.Viewport, null, () => element) : element];
          },
        },
      );
  },
}) as unknown as typeof parts.Content;

const DEFAULT_PARTS = () => [h(ContextBarList), h(ContextBarOverflow), h(ContextBarContent)];

/**
 * A row of context chips: the ones that don't fit go behind a "+N" button whose popover lists them. With `@remove`,
 * Delete, Backspace or a chip's remove control removes it. A default slot replaces the list, the button and the popover.
 */
export const ContextBar = defineComponent({
  name: "ContextBar",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? DEFAULT_PARTS });
  },
}) as unknown as typeof parts.Root;
