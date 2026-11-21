import {
  type PickerCommandState,
  type PickerItemState,
  type PickerOptions,
  type PickerRow,
  type PickerSection,
  type PickerTriggerState,
  pickerPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, merge, omit, onFlush, onSettled, Show } from "solid-js";
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
import { iconElement } from "./internal/kind-class.js";

const callRef = (ref: unknown, el: HTMLElement): void => {
  if (Array.isArray(ref)) for (const each of ref) callRef(each, el);
  else if (typeof ref === "function") ref(el);
};

function Settled(props: { run: () => void }) {
  onSettled(props.run);
  return null;
}

// The content binds after its rows, as React's effects run children first: a sheet measures the content as it binds,
// and Command shows a group only once its rows have bound and that update has flushed. Bound first, the sheet measured
// an empty list and resized during its opening motion, which `@ui-sdk/core` mishandles (AGENTS.md, Solid conformance).
const afterChildren = (content: Record<string, unknown>) => {
  let el: HTMLElement | undefined;
  return merge(content, {
    ref: (node: HTMLElement) => {
      el = node;
    },
    get children() {
      return [
        content.children,
        <Settled run={() => onFlush(() => el?.isConnected && callRef(content.ref, el))} />,
      ];
    },
  });
};

const parts = createParts(pickerPrimitive, {
  root: "div",
  trigger: "button",
  content: "div",
  viewport: "div",
  command: "div",
  item: "span",
});

/**
 * An item, whose `icon` is an image URL, an element such as an inline `svg`, or a function returning one, which draws a
 * new copy wherever the icon shows: the chosen item's shows in the trigger and in its row.
 */
export type PickerChoice = Omit<NonNullable<PickerOptions["items"]>[number], "icon" | "items"> & {
  icon?: string | JSX.Element | (() => JSX.Element);
  items?: PickerChoice[];
};

/** A footer action, whose `icon` is an image URL, an element, or a function returning one. */
export type PickerFooterAction = Omit<NonNullable<PickerOptions["actions"]>[number], "icon"> & {
  icon?: string | JSX.Element | (() => JSX.Element);
};

const iconOf = (icon: unknown) => (typeof icon === "string" ? <img src={icon} alt="" /> : iconElement(icon));

export type PickerProps = Omit<ComponentProps<typeof parts.Root>, "children" | "items" | "actions"> & {
  items?: PickerChoice[];
  actions?: PickerFooterAction[];
  children?: JSX.Element;
};

export type PickerTriggerProps = ComponentProps<typeof parts.Trigger>;
export type PickerContentProps = ComponentProps<typeof parts.Content>;
export type PickerListProps = Omit<ComponentProps<typeof parts.Command>, "children"> & {
  /** What sits in the list, from the rows: every page by default. */
  children?: (state: PickerCommandState) => JSX.Element;
};
export type PickerSectionRowsProps = {
  section: PickerSection;
  /** Whether a separator comes before it, as before the footer. */
  separated?: boolean;
  /** Renders each row: a `PickerRowItem` by default. */
  children?: (row: PickerRow) => JSX.Element;
};
export type PickerRowItemProps = Omit<ComponentProps<typeof KindCommandItem>, keyof PickerRow["option"]> & {
  row: PickerRow;
  /** The row's content: a `PickerItem` by default. */
  children?: JSX.Element;
};
export type PickerItemProps = ComponentProps<typeof parts.Item>;

/** The parts a picker renders through: Picker's, or those of a component that spreads `pickerBase`. */
export type PickerParts = Pick<typeof parts, "Trigger" | "Content" | "Viewport" | "Command" | "Item">;

type Render = (props: Record<string, unknown>, state: { presentation?: string }) => JSX.Element;

/**
 * The trigger, popover, list and rows of a picker, rendered through `parts`, for Model Selector and the other
 * components that spread `pickerBase` to share Picker's markup. `Default` is the trigger and the popover. `icon` draws a
 * row's icon (an image URL or an element by default; `null` draws none), and `trailing` what follows its `meta`.
 */
export function pickerParts(
  parts: PickerParts,
  draw: { icon?: (row: PickerRow) => JSX.Element; trailing?: (row: PickerRow) => JSX.Element } = {},
) {
  const icon = draw.icon ?? ((row: PickerRow) => iconOf(row.icon));

  const triggerContent = (state: PickerTriggerState) => (
    <>
      <Show when={state.icon !== undefined}>
        <span data-picker-icon="">{iconOf(state.icon)}</span>
      </Show>
      <span data-picker-text="">{state.text}</span>
      <span data-picker-chevron="" />
    </>
  );

  function Trigger(props: PickerTriggerProps) {
    return <parts.Trigger {...omit(props, "children")}>{props.children ?? triggerContent}</parts.Trigger>;
  }

  function Content(props: PickerContentProps) {
    const render = (content: Record<string, unknown>, state: { presentation?: string }) => {
      const element = () => {
        const own = props.render as Render | undefined;
        const bound = afterChildren(content);
        return own ? own(bound, state) : <div {...bound} />;
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
        initialFocus="input"
        sideOffset={6}
        align="start"
        {...omit(props, "children", "render")}
        render={render as PickerContentProps["render"]}
      >
        {props.children ?? <List />}
      </parts.Content>
    );
  }

  function List(props: PickerListProps) {
    return (
      <parts.Command {...omit(props, "children")}>
        {(state: PickerCommandState) => (
          <KindCommand {...state.props}>
            <KindCommandInput aria-label={state.label} placeholder={state.placeholder} data-agent-hidden="" />
            <Show when={state.statusText !== undefined}>
              <KindCommandStatus>{state.statusText}</KindCommandStatus>
            </Show>
            <KindCommandEmpty>{state.emptyText}</KindCommandEmpty>
            <KindCommandList>{(props.children ?? defaultRows)(state)}</KindCommandList>
          </KindCommand>
        )}
      </parts.Command>
    );
  }

  const defaultRows = (state: PickerCommandState) => (
    <For each={state.pages} keyed={(page) => page.page ?? ""}>
      {(page) => (
        <KindCommandPage value={page().page}>
          <For
            each={page().sections}
            keyed={(section) => (section.footer ? "\u0000footer" : (section.label ?? ""))}
          >
            {(section, index) => (
              <SectionRows section={section()} separated={section().footer && index() > 0} />
            )}
          </For>
        </KindCommandPage>
      )}
    </For>
  );

  function SectionRows(props: PickerSectionRowsProps) {
    return (
      <>
        <Show when={props.separated}>
          <KindCommandSeparator />
        </Show>
        <KindCommandGroup>
          <Show when={props.section.label}>
            <KindCommandGroupLabel>{props.section.label}</KindCommandGroupLabel>
          </Show>
          {/* Keyed by its label too: Command filters a row by the label it mounted with, and a footer row's label can
              hold the search. */}
          <For each={props.section.rows} keyed={(row) => `${row.option.value}\u0000${row.option.label}`}>
            {(row) => (props.children ? props.children(row()) : <RowItem row={row()} />)}
          </For>
        </KindCommandGroup>
      </>
    );
  }

  function RowItem(props: PickerRowItemProps) {
    return (
      <KindCommandItem {...omit(props, "row", "children")} {...props.row.option}>
        {props.children ?? <Item value={props.row.option.value} />}
      </KindCommandItem>
    );
  }

  const itemContent = (state: PickerItemState) => (
    <>
      {iconOfRow(state.row)}
      <span data-picker-item-text="">
        <KindCommandItemText>{state.row.label}</KindCommandItemText>
        <Show when={state.description.length}>
          <span data-picker-description="">
            <For each={state.description} keyed={false}>
              {(segment) => (
                <Show when={segment().match} fallback={segment().text}>
                  <mark>{segment().text}</mark>
                </Show>
              )}
            </For>
          </span>
        </Show>
      </span>
      <Show when={state.row.meta}>
        <span data-picker-meta="">{state.row.meta}</span>
      </Show>
      {draw.trailing?.(state.row)}
      <span data-picker-mark="" />
    </>
  );

  function Item(props: PickerItemProps) {
    return <parts.Item {...omit(props, "children")}>{props.children ?? itemContent}</parts.Item>;
  }

  const iconOfRow = (row: PickerRow) => {
    const drawn = row.icon === undefined ? null : icon(row);
    return drawn == null ? null : <KindCommandItemIcon>{drawn}</KindCommandItemIcon>;
  };

  const Default = () => (
    <>
      <Trigger />
      <Content />
    </>
  );

  return { Trigger, Content, List, SectionRows, RowItem, Item, Default };
}

const picker = pickerParts(parts);

/**
 * A button that shows the chosen item and opens a searchable list of them, with groups, two-line rows, pages and
 * footer actions. Any `children` replace the trigger and the list.
 */
export function Picker(props: PickerProps) {
  return <parts.Root {...omit(props, "children")}>{props.children ?? <picker.Default />}</parts.Root>;
}

/** Opens the list. Shows the chosen item's icon and label, or the `label` while none is chosen, unless you pass children. */
export const PickerTrigger = picker.Trigger;
/** The popover: the search field and the list, unless you pass children. Focus moves to the search field. */
export const PickerContent = picker.Content;
/** UI SDK Command: the search field, the empty text, and every page of rows unless you pass children. */
export const PickerList = picker.List;
/** A group of rows under its label, or the footer. */
export const PickerSectionRows = picker.SectionRows;
/** A row: UI SDK's `CommandItem` with the row's props, holding its `PickerItem` unless you pass children. */
export const PickerRowItem = picker.RowItem;
/** A row's content: its icon, marked label, description, `meta`, and its check or chevron. */
export const PickerItem = picker.Item;
