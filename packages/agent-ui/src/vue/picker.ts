import {
  type PickerCommandState,
  type PickerItemState,
  type PickerOptions,
  type PickerRow,
  type PickerSection,
  type PickerTriggerState,
  pickerPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/vue/primitive";
import {
  type Component,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import {
  KindCommand,
  KindCommandEmpty,
  KindCommandGroup,
  KindCommandGroupLabel,
  KindCommandInput,
  KindCommandItem,
  KindCommandItemIcon,
  KindCommandItemText,
  KindCommandList,
  KindCommandPage,
  KindCommandSeparator,
  KindCommandStatus,
} from "./internal/command.js";

// `@ui-sdk/vue`'s `createParts` hands the primitive an emitter for every callback, whether or not anything listens, so
// `onAction`, whose presence offers `run`, is declared a function prop instead, which `@action` binds.
const primitive = Object.defineProperty(
  Object.assign((options: never) => pickerPrimitive(options), pickerPrimitive, {
    options: { ...pickerPrimitive.options, onAction: "action" },
  }),
  "name",
  { value: pickerPrimitive.name },
) as typeof pickerPrimitive;

const parts = createParts(primitive, {
  root: "div",
  trigger: "button",
  content: "div",
  viewport: "div",
  command: "div",
  item: "span",
});

/** An item, whose `icon` is an image URL or a node such as an inline `svg`. */
export type PickerChoice = Omit<NonNullable<PickerOptions["items"]>[number], "icon" | "items"> & {
  icon?: string | VNode;
  items?: PickerChoice[];
};

/** A footer action, whose `icon` is an image URL or a node. */
export type PickerFooterAction = Omit<NonNullable<PickerOptions["actions"]>[number], "icon"> & {
  icon?: string | VNode;
};

type ElementRef = (el: unknown) => void;

const Settled = defineComponent({
  name: "PickerSettled",
  props: { run: { type: Function as PropType<() => void>, required: true } },
  setup(props) {
    onMounted(() => nextTick(props.run));
    return () => null;
  },
});

// The content binds after its rows, as React's effects run children first: a sheet measures the content as it binds,
// and Command shows a group only once its rows have bound and that update has flushed. Bound first, the sheet measured
// an empty list and resized during its opening motion, which `@ui-sdk/core` mishandles (AGENTS.md, Solid conformance).
// A last child's `onMounted` runs once the rows have mounted, and `nextTick` once the update their binds caused has.
function afterChildren() {
  let bind: ElementRef | undefined;
  let el: unknown = null;
  let bound = false;
  const ref: ElementRef = (node) => {
    el = node;
    if (node === null) {
      if (bound) bind?.(null);
      bound = false;
    } else if (bound) bind?.(node);
  };
  const run = () => {
    if (bound || !(el instanceof Element) || !el.isConnected) return;
    bound = true;
    bind?.(el);
  };
  let inner: Component | undefined;
  let children: Component | undefined;
  return <S extends { props: Record<string, unknown>; children: Component }>(scope: S): S => {
    bind = scope.props.ref as ElementRef | undefined;
    if (inner !== scope.children) {
      const given = scope.children;
      inner = given;
      children = () => [h(given), h(Settled, { run })];
    }
    return { ...scope, props: { ...scope.props, ref }, children } as S;
  };
}

const iconOf = (icon: unknown) =>
  typeof icon === "string" ? h("img", { src: icon, alt: "" }) : (icon as VNode | undefined);

/** The parts a picker renders through: Picker's, or those of a component that spreads `pickerBase`. */
export type PickerParts = Pick<typeof parts, "Trigger" | "Content" | "Viewport" | "Command" | "Item">;

/**
 * The trigger, popover, list and rows of a picker, rendered through `parts`, for Model Selector and the other
 * components that spread `pickerBase` to share Picker's markup, each part named `<name><Part>` in Vue's tools.
 * `Default` renders the trigger and the popover. `icon` draws a row's icon (an image URL or a node by default;
 * `null` draws none), and `trailing` what follows its `meta`.
 */
export function pickerParts<P extends PickerParts>(
  parts: P,
  name: string,
  {
    icon = (row: PickerRow) => iconOf(row.icon),
    trailing,
  }: { icon?: (row: PickerRow) => unknown; trailing?: (row: PickerRow) => unknown } = {},
) {
  const Part = parts as unknown as Record<keyof PickerParts, Component>;

  const Trigger = defineComponent({
    name: `${name}Trigger`,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(Part.Trigger, attrs, {
          ...slots,
          default:
            slots.default ??
            (({ state }: { state: PickerTriggerState }) => [
              state.icon !== undefined ? h("span", { "data-picker-icon": "" }, [iconOf(state.icon)]) : null,
              h("span", { "data-picker-text": "" }, state.text),
              h("span", { "data-picker-chevron": "" }),
            ]),
        });
    },
  });

  const List = defineComponent({
    name: `${name}List`,
    inheritAttrs: false,
    /** What sits in the list, from the rows: every page by default. */
    slots: Object as SlotsType<{ default?: { state: PickerCommandState } }>,
    setup(_, { attrs, slots }) {
      return () =>
        h(Part.Command, attrs, {
          ...slots,
          default: ({ state }: { state: PickerCommandState }) =>
            h(KindCommand, state.props, () => [
              h(KindCommandInput, {
                "aria-label": state.label,
                placeholder: state.placeholder,
                "data-agent-hidden": "",
              }),
              state.statusText !== undefined ? h(KindCommandStatus, null, () => state.statusText) : null,
              h(KindCommandEmpty, null, () => state.emptyText),
              h(KindCommandList, null, () => (slots.default ? slots.default({ state }) : defaultRows(state))),
            ]),
        });
    },
  });

  const defaultRows = ({ pages }: PickerCommandState) =>
    pages.map(({ page, sections }) =>
      h(KindCommandPage, { key: page ?? "", value: page }, () =>
        sections.map((section, index) =>
          h(SectionRows, {
            key: section.footer ? "\u0000footer" : (section.label ?? ""),
            section,
            separated: section.footer && index > 0,
          }),
        ),
      ),
    );

  const SectionRows = defineComponent({
    name: `${name}SectionRows`,
    props: {
      section: { type: Object as PropType<PickerSection>, required: true },
      /** Whether a separator comes before it, as before the footer. */
      separated: Boolean,
    },
    /** Renders each row: a `PickerRowItem` by default. */
    slots: Object as SlotsType<{ default?: { row: PickerRow } }>,
    setup(props, { slots }) {
      return () => [
        props.separated ? h(KindCommandSeparator) : null,
        h(KindCommandGroup, null, () => [
          props.section.label ? h(KindCommandGroupLabel, null, () => props.section.label) : null,
          ...props.section.rows.map((row) =>
            // Keyed by its label too: a footer row's label can hold the search.
            h(Fragment, { key: `${row.option.value}\u0000${row.option.label}` }, [
              slots.default ? slots.default({ row }) : h(RowItem, { row }),
            ]),
          ),
        ]),
      ];
    },
  });

  const RowItem = defineComponent({
    name: `${name}RowItem`,
    inheritAttrs: false,
    props: { row: { type: Object as PropType<PickerRow>, required: true } },
    /** The row's content: a `PickerItem` by default. */
    slots: Object as SlotsType<{ default?: Record<string, never> }>,
    setup(props, { attrs, slots }) {
      return () =>
        h(
          KindCommandItem,
          { ...attrs, ...props.row.option },
          { default: slots.default ?? (() => h(Item, { value: props.row.option.value })) },
        );
    },
  });

  const iconOfRow = (row: PickerRow) => {
    const drawn = row.icon === undefined ? null : icon(row);
    return drawn == null ? null : h(KindCommandItemIcon, null, () => drawn);
  };

  const Item = defineComponent({
    name: `${name}Item`,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () =>
        h(Part.Item, attrs, {
          ...slots,
          default:
            slots.default ??
            (({ state: { row, description } }: { state: PickerItemState }) => [
              iconOfRow(row),
              h("span", { "data-picker-item-text": "" }, [
                h(KindCommandItemText, null, () => row.label),
                description.length
                  ? h(
                      "span",
                      { "data-picker-description": "" },
                      description.map((segment) => (segment.match ? h("mark", segment.text) : segment.text)),
                    )
                  : null,
              ]),
              row.meta ? h("span", { "data-picker-meta": "" }, row.meta) : null,
              trailing?.(row),
              h("span", { "data-picker-mark": "" }),
            ]),
        });
    },
  });

  const Content = defineComponent({
    name: `${name}Content`,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const later = afterChildren();
      return () =>
        h(
          Part.Content,
          { initialFocus: "input", sideOffset: 6, align: "start", ...attrs },
          {
            default: slots.default ?? (() => h(List)),
            // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
            render: (given: {
              props: Record<string, unknown>;
              state: { presentation: string };
              children: Component;
            }) => {
              const scope = later(given);
              const element = slots.render ? slots.render(scope) : h("div", scope.props, [h(scope.children)]);
              return [scope.state.presentation === "sheet" ? h(Part.Viewport, null, () => element) : element];
            },
          },
        );
    },
  });

  const Default = () => [h(Trigger), h(Content)];

  return {
    Trigger: Trigger as unknown as P["Trigger"],
    Content: Content as unknown as P["Content"],
    List,
    SectionRows,
    RowItem,
    Item: Item as unknown as P["Item"],
    Default,
  };
}

const picker = pickerParts(parts, "Picker");

/**
 * A button that shows the chosen item and opens a searchable list of them, with groups, two-line rows, pages and
 * footer actions. A default slot replaces the trigger and the list.
 */
export const Picker = defineComponent({
  name: "Picker",
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(parts.Root, attrs, { ...slots, default: slots.default ?? picker.Default });
  },
}) as unknown as typeof parts.Root;

/** Opens the list. Shows the chosen item's icon and label, or the `label` while none is chosen, unless you pass a slot. */
export const PickerTrigger = picker.Trigger;
/** The popover: the search field and the list, unless you pass a slot. Focus moves to the search field. */
export const PickerContent = picker.Content;
/** UI SDK Command: the search field, the empty text, and every page of rows unless you pass a slot. */
export const PickerList = picker.List;
/** A group of rows under its label, or the footer. */
export const PickerSectionRows = picker.SectionRows;
/** A row: UI SDK's `CommandItem` with the row's props, holding its `PickerItem` unless you pass a slot. */
export const PickerRowItem = picker.RowItem;
/** A row's content: its icon, marked label, description, `meta`, and its check or chevron. */
export const PickerItem = picker.Item;
