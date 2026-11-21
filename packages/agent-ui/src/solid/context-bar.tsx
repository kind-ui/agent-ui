import {
  CONTEXT_BAR_FIRST_ITEM,
  type ContextBarChipState,
  type ContextBarListState,
  type ContextBarOptions,
  contextBarPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show, untrack } from "solid-js";

const parts = createParts(contextBarPrimitive, {
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

/**
 * A chip, whose `icon` is an image URL, an element such as an inline `svg`, or a function that returns one. A chip that
 * doesn't fit shows in the bar and in the list of the rest at once, so an element is cloned for each; a function is
 * called for each.
 */
export type ContextBarChipData = Omit<NonNullable<ContextBarOptions["chips"]>[number], "icon"> & {
  icon?: string | JSX.Element | (() => JSX.Element);
};

export type ContextBarProps = Omit<ComponentProps<typeof parts.Root>, "chips"> & {
  chips?: readonly ContextBarChipData[];
};
export type ContextBarListProps = ComponentProps<typeof parts.List>;
export type ContextBarChipProps = ComponentProps<typeof parts.Chip>;
export type ContextBarOverflowProps = ComponentProps<typeof parts.Overflow>;
export type ContextBarContentProps = ComponentProps<typeof parts.Content>;
export type ContextBarTitleProps = ComponentProps<typeof parts.Title>;
export type ContextBarOverflowListProps = ComponentProps<typeof parts.OverflowList>;
export type ContextBarItemProps = ComponentProps<typeof parts.Item>;
export type ContextBarRemoveProps = ComponentProps<typeof parts.Remove>;
export type ContextBarItemRemoveProps = ComponentProps<typeof parts.ItemRemove>;

/** A chip's remove control in the bar, for the pointer: hidden from assistive technology, which uses Delete. */
export const ContextBarRemove = parts.Remove;
/** A chip's remove control in the list of the rest, as `ContextBarRemove` is in the bar. */
export const ContextBarItemRemove = parts.ItemRemove;

const drawIcon = (icon: unknown): JSX.Element => {
  if (typeof icon === "string") return <img src={icon} alt="" />;
  if (typeof icon === "function") return untrack(icon as () => JSX.Element);
  if (typeof Node !== "undefined" && icon instanceof Node) return icon.cloneNode(true) as JSX.Element;
  return icon as JSX.Element;
};

const chipContent = (state: ContextBarChipState, remove: () => JSX.Element) => (
  <>
    <Show when={state.chip?.icon !== undefined}>
      <span data-context-bar-icon="">{drawIcon(state.chip?.icon)}</span>
    </Show>
    <span data-context-bar-label="">{state.chip?.label}</span>
    {remove()}
  </>
);

/** One chip in the bar: its icon, its label and a `ContextBarRemove`, unless you pass children. */
export function ContextBarChip(props: ContextBarChipProps) {
  return (
    <parts.Chip {...omit(props, "children")}>
      {props.children ??
        ((state: ContextBarChipState) => chipContent(state, () => <ContextBarRemove value={props.value} />))}
    </parts.Chip>
  );
}

// Keyed by id, so adding a chip renders only that one.
const chips = (state: ContextBarListState) => (
  <For each={state.rows} keyed={(row) => row.item.id}>
    {(row) => <ContextBarChip value={row().item.id} />}
  </For>
);

/** The row of chips, one Tab stop with arrow keys between them. Without children, a `ContextBarChip` per row. */
export function ContextBarList(props: ContextBarListProps) {
  return <parts.List {...omit(props, "children")}>{props.children ?? chips}</parts.List>;
}

/** The "+N" button, present while some chips don't fit, which opens the list of them. */
export function ContextBarOverflow(props: ContextBarOverflowProps) {
  return (
    <parts.Overflow {...omit(props, "children")}>
      {props.children ?? ((state: { count: number }) => `+${state.count}`)}
    </parts.Overflow>
  );
}

/** Names the list of the chips that don't fit: the `label`. The styles keep it for assistive technology only. */
export function ContextBarTitle(props: ContextBarTitleProps) {
  return (
    <parts.Title {...omit(props, "children")}>
      {props.children ?? ((state: { label: string }) => state.label)}
    </parts.Title>
  );
}

/** One chip in the list of the rest, as `ContextBarChip` is in the bar, with a `ContextBarItemRemove`. */
export function ContextBarItem(props: ContextBarItemProps) {
  return (
    <parts.Item {...omit(props, "children")}>
      {props.children ??
        ((state: ContextBarChipState) =>
          chipContent(state, () => <ContextBarItemRemove value={props.value} />))}
    </parts.Item>
  );
}

const items = (state: ContextBarListState) => (
  <For each={state.rows} keyed={(row) => row.item.id}>
    {(row) => <ContextBarItem value={row().item.id} />}
  </For>
);

/** The chips that don't fit, one Tab stop with arrow keys between them. Without children, a `ContextBarItem` per row. */
export function ContextBarOverflowList(props: ContextBarOverflowListProps) {
  return <parts.OverflowList {...omit(props, "children")}>{props.children ?? items}</parts.OverflowList>;
}

type Render = (props: Record<string, unknown>, state: { presentation?: string }) => JSX.Element;

/** The popover of the chips that don't fit, unless you pass children. Focus moves to the first. */
export function ContextBarContent(props: ContextBarContentProps) {
  const render = (content: Record<string, unknown>, state: { presentation?: string }) => {
    const element = () => {
      const own = props.render as Render | undefined;
      return own ? own(content, state) : <div {...content} />;
    };
    // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
    return (
      <Show when={state.presentation === "sheet"} fallback={element()}>
        <parts.Viewport>{element()}</parts.Viewport>
      </Show>
    );
  };
  return (
    <parts.Content
      initialFocus={CONTEXT_BAR_FIRST_ITEM}
      sideOffset={6}
      align="end"
      {...omit(props, "children", "render")}
      render={render as ContextBarContentProps["render"]}
    >
      {props.children ?? (
        <>
          <ContextBarTitle />
          <ContextBarOverflowList />
        </>
      )}
    </parts.Content>
  );
}

/**
 * A row of context chips: the ones that don't fit go behind a "+N" button whose popover lists them. With `onRemove`,
 * Delete, Backspace or a chip's remove control removes it. Any `children` replace the list, the button and the popover.
 */
export function ContextBar(props: ContextBarProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {props.children ?? (
        <>
          <ContextBarList />
          <ContextBarOverflow />
          <ContextBarContent />
        </>
      )}
    </parts.Root>
  );
}
