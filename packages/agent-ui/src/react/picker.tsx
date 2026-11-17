"use client";

import {
  type PickerCommandState,
  type PickerOptions,
  type PickerRow,
  type PickerSection,
  pickerPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, renderElement } from "@ui-sdk/react/primitive";
import { type ComponentProps, Fragment, type ReactElement, type ReactNode } from "react";
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
} from "./internal/command.js";

const parts = createParts(pickerPrimitive, {
  root: "div",
  trigger: "button",
  content: "div",
  viewport: "div",
  command: "div",
  item: "span",
});

/** An item, whose `icon` is an image URL or an element such as an inline `svg`. */
export type PickerChoice = Omit<NonNullable<PickerOptions["items"]>[number], "icon" | "items"> & {
  icon?: string | ReactElement;
  items?: PickerChoice[];
};

/** A footer action, whose `icon` is an image URL or an element. */
export type PickerFooterAction = Omit<NonNullable<PickerOptions["actions"]>[number], "icon"> & {
  icon?: string | ReactElement;
};

const iconOf = (icon: unknown) =>
  typeof icon === "string" ? <img src={icon} alt="" /> : (icon as ReactElement | undefined);

export type PickerProps = Omit<ComponentProps<typeof parts.Root>, "children" | "items" | "actions"> & {
  items?: PickerChoice[];
  actions?: PickerFooterAction[];
  children?: ReactNode;
};

/**
 * A button that shows the chosen item and opens a searchable list of them, with groups, two-line rows, pages and
 * footer actions. Any `children` replace the trigger and the list.
 */
export function Picker({ children = DEFAULT_PARTS, ...props }: PickerProps) {
  return <parts.Root {...props}>{children}</parts.Root>;
}

export type PickerTriggerProps = ComponentProps<typeof parts.Trigger>;

/** Opens the list. Shows the chosen item's icon and label, or the `label` while none is chosen, unless you pass children. */
export function PickerTrigger({
  children = ({ text, icon }) => (
    <>
      {icon !== undefined ? <span data-picker-icon="">{iconOf(icon)}</span> : null}
      <span data-picker-text="">{text}</span>
      <span data-picker-chevron="" />
    </>
  ),
  ...props
}: PickerTriggerProps) {
  return <parts.Trigger {...props}>{children}</parts.Trigger>;
}

export type PickerContentProps = ComponentProps<typeof parts.Content>;

/** The popover: the search field and the list, unless you pass children. Focus moves to the search field. */
export function PickerContent({ children = DEFAULT_LIST, render, ...props }: PickerContentProps) {
  return (
    <parts.Content
      initialFocus="input"
      sideOffset={6}
      align="start"
      {...props}
      // A sheet sits in a full-screen viewport, which renders only while the content presents as one.
      render={(content, state) => {
        const element = renderElement("div", content, render, state);
        return state.presentation === "sheet" ? <parts.Viewport>{element}</parts.Viewport> : element;
      }}
    >
      {children}
    </parts.Content>
  );
}

export type PickerListProps = Omit<ComponentProps<typeof parts.Command>, "children"> & {
  /** What sits in the list, from the rows: every page by default. */
  children?: (state: PickerCommandState) => ReactNode;
};

/**
 * UI SDK Command: the search field, what shows while nothing matches, and the list, holding every page of rows unless
 * you pass children, a function of the rows.
 */
export function PickerList({ children = DEFAULT_ROWS, ...props }: PickerListProps) {
  return (
    <parts.Command {...props}>
      {(state) => (
        <KindCommand {...state.props}>
          <KindCommandInput aria-label={state.label} placeholder={state.placeholder} data-agent-hidden="" />
          <KindCommandEmpty>{state.emptyText}</KindCommandEmpty>
          <KindCommandList>{children(state)}</KindCommandList>
        </KindCommand>
      )}
    </parts.Command>
  );
}

const DEFAULT_ROWS = ({ pages }: PickerCommandState) =>
  pages.map(({ page, sections }) => (
    <KindCommandPage key={page ?? ""} value={page}>
      {sections.map((section, index) => (
        <PickerSectionRows
          key={section.footer ? "\u0000footer" : (section.label ?? "")}
          section={section}
          separated={section.footer && index > 0}
        />
      ))}
    </KindCommandPage>
  ));

export type PickerSectionRowsProps = {
  section: PickerSection;
  /** Whether a separator comes before it, as before the footer. */
  separated?: boolean;
  /** Renders each row: a `PickerRowItem` by default. */
  children?: (row: PickerRow) => ReactNode;
};

/** A group of rows under its label, or the footer. */
export function PickerSectionRows({
  section,
  separated = false,
  children = (row) => <PickerRowItem row={row} />,
}: PickerSectionRowsProps) {
  return (
    <>
      {separated ? <KindCommandSeparator /> : null}
      <KindCommandGroup>
        {section.label ? <KindCommandGroupLabel>{section.label}</KindCommandGroupLabel> : null}
        {section.rows.map((row) => (
          <Fragment key={row.option.value}>{children(row)}</Fragment>
        ))}
      </KindCommandGroup>
    </>
  );
}

export type PickerRowItemProps = Omit<ComponentProps<typeof KindCommandItem>, keyof PickerRow["option"]> & {
  row: PickerRow;
  /** The row's content: a `PickerItem` by default. */
  children?: ReactNode;
};

/** A row: UI SDK's `CommandItem` with the row's props, holding its `PickerItem` unless you pass children. */
export function PickerRowItem({ row, children, ...props }: PickerRowItemProps) {
  return (
    <KindCommandItem {...props} {...row.option}>
      {children ?? <PickerItem value={row.option.value} />}
    </KindCommandItem>
  );
}

export type PickerItemProps = ComponentProps<typeof parts.Item>;

/**
 * A row's content: its icon, its label with what the search matched marked, its description, its trailing `meta`,
 * and a check on the chosen item or a chevron on a row that opens a page, unless you pass children.
 */
export function PickerItem({
  children = ({ row, description }) => (
    <>
      {row.icon !== undefined ? <KindCommandItemIcon>{iconOf(row.icon)}</KindCommandItemIcon> : null}
      <span data-picker-item-text="">
        <KindCommandItemText>{row.label}</KindCommandItemText>
        {description.length ? (
          <span data-picker-description="">
            {description.map((segment, index) =>
              segment.match ? <mark key={index}>{segment.text}</mark> : segment.text,
            )}
          </span>
        ) : null}
      </span>
      {row.meta ? <span data-picker-meta="">{row.meta}</span> : null}
      <span data-picker-mark="" />
    </>
  ),
  ...props
}: PickerItemProps) {
  return <parts.Item {...props}>{children}</parts.Item>;
}

// Shared, so an update doesn't render the default parts' wrappers again.
const DEFAULT_LIST = <PickerList />;

const DEFAULT_PARTS = (
  <>
    <PickerTrigger />
    <PickerContent />
  </>
);
