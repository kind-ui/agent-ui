"use client";

import {
  type PickerOptions,
  type PickerRow,
  type PickerSection,
  pickerPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps, ReactElement, ReactNode } from "react";
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
export function PickerContent({ children = DEFAULT_LIST, ...props }: PickerContentProps) {
  return (
    <parts.Content initialFocus="input" sideOffset={6} align="start" render={inViewport} {...props}>
      {children}
    </parts.Content>
  );
}

// A sheet sits in a full-screen viewport, which renders only while the content presents as one.
const inViewport = (props: ComponentProps<"div">, { presentation }: { presentation: string }) =>
  presentation === "sheet" ? (
    <parts.Viewport>
      <div {...props} />
    </parts.Viewport>
  ) : (
    <div {...props} />
  );

export type PickerListProps = Omit<ComponentProps<typeof parts.Command>, "children">;

/** UI SDK Command: the search field, what shows while nothing matches, and every page of rows. */
export function PickerList(props: PickerListProps) {
  return (
    <parts.Command {...props}>
      {({ props: command, label, placeholder, emptyText, pages }) => (
        <KindCommand {...command}>
          <KindCommandInput aria-label={label} placeholder={placeholder} data-agent-hidden="" />
          <KindCommandEmpty>{emptyText}</KindCommandEmpty>
          <KindCommandList>
            {pages.map(({ page, sections }) => (
              <KindCommandPage key={page ?? ""} value={page}>
                {sections.map((section, index) => (
                  <PickerSectionRows
                    key={section.footer ? "\u0000footer" : (section.label ?? "")}
                    section={section}
                    first={index === 0}
                  />
                ))}
              </KindCommandPage>
            ))}
          </KindCommandList>
        </KindCommand>
      )}
    </parts.Command>
  );
}

function PickerSectionRows({ section, first }: { section: PickerSection; first: boolean }) {
  return (
    <>
      {section.footer && !first ? <KindCommandSeparator /> : null}
      <KindCommandGroup>
        {section.label ? <KindCommandGroupLabel>{section.label}</KindCommandGroupLabel> : null}
        {section.rows.map((row) => (
          <PickerRowItem key={row.option.value} row={row} />
        ))}
      </KindCommandGroup>
    </>
  );
}

function PickerRowItem({ row }: { row: PickerRow }) {
  return (
    <KindCommandItem {...row.option}>
      <PickerItem value={row.option.value} />
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
