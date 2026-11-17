"use client";

import {
  type SettingsMenuContentState,
  type SettingsMenuOptions,
  type SettingsMenuRow,
  settingsMenuPrimitive,
} from "@kind-ui/agent-ui/core";
import { MenuItemIndicator, MenuTrigger } from "@ui-sdk/react/menu";
import { createParts } from "@ui-sdk/react/primitive";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import {
  KindMenu,
  KindMenuCheckboxItem,
  KindMenuContent,
  KindMenuItemContent,
  KindMenuItemIndicator,
  KindMenuRadioGroup,
  KindMenuRadioItem,
  KindMenuSub,
  KindMenuSubContent,
  KindMenuSubTrigger,
} from "./internal/menu.js";

const parts = createParts(settingsMenuPrimitive, { root: "div", trigger: "span", content: "div" });

/** A setting, whose `icon` is an image URL or an element such as an inline `svg`. */
export type SettingsMenuSetting = NonNullable<SettingsMenuOptions["settings"]>[number] & {
  icon?: string | ReactElement;
};

export type SettingsMenuProps = Omit<ComponentProps<typeof parts.Root>, "children" | "settings"> & {
  settings?: SettingsMenuSetting[];
  children?: ReactNode;
};

function Row({ row }: { row: SettingsMenuRow }) {
  if (row.type === "toggle")
    return (
      <KindMenuCheckboxItem value={row.id} label={row.label} checked={row.checked}>
        <KindMenuItemContent icon={row.icon} label={row.label} description={row.description} />
        <MenuItemIndicator keepMounted data-menu-switch="" aria-hidden="true">
          <span data-menu-switch-thumb="" />
        </MenuItemIndicator>
      </KindMenuCheckboxItem>
    );
  return (
    <KindMenuSub>
      <KindMenuSubTrigger>
        <KindMenuItemContent icon={row.icon} label={row.label} />
        <span data-settings-menu-value="">
          {row.options.map((option) => (
            <span key={option.value} data-current={option.value === row.value ? "" : undefined}>
              {option.label}
            </span>
          ))}
        </span>
        <span data-menu-chevron="" />
      </KindMenuSubTrigger>
      <KindMenuSubContent>
        <KindMenuRadioGroup name={row.id} value={row.value ?? null}>
          {row.options.map((option) => (
            <KindMenuRadioItem key={option.value} value={option.value} label={option.label}>
              <KindMenuItemIndicator keepMounted>
                <span data-menu-check="" aria-hidden="true" />
              </KindMenuItemIndicator>
              {option.label}
            </KindMenuRadioItem>
          ))}
        </KindMenuRadioGroup>
      </KindMenuSubContent>
    </KindMenuSub>
  );
}

export type SettingsMenuRowsProps = { rows: SettingsMenuRow[] };

/** The rows: a switch for each toggle, and a submenu of options for each choice, showing its value. */
export function SettingsMenuRows({ rows }: SettingsMenuRowsProps) {
  return rows.map((row) => <Row key={row.id} row={row} />);
}

/**
 * An icon button named "Settings" that opens a menu of settings: toggles drawn as switches, which keep the menu open,
 * and choices, each a submenu of options showing the current one. Any `children` replace the trigger and the content,
 * inside UI SDK Menu.
 */
export function SettingsMenu({ children = DEFAULT_PARTS, ...props }: SettingsMenuProps) {
  return <parts.Root {...props}>{(menu) => <KindMenu {...menu}>{children}</KindMenu>}</parts.Root>;
}

export type SettingsMenuTriggerProps = ComponentProps<typeof MenuTrigger>;

/** Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, showing a settings icon unless you pass children. */
export function SettingsMenuTrigger({ children = ICON, ...props }: SettingsMenuTriggerProps) {
  return (
    <parts.Trigger>
      {(trigger) => (
        // Hidden from agents, which use the Settings Menu's own actions.
        <MenuTrigger {...trigger} data-agent-hidden="" {...props}>
          {children}
        </MenuTrigger>
      )}
    </parts.Trigger>
  );
}

export type SettingsMenuContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** What the menu holds, or a function of its rows: the rows by default. */
  children?: ReactNode | ((state: SettingsMenuContentState) => ReactNode);
};

/** The menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. */
export function SettingsMenuContent({ children = DEFAULT_ROWS, ...props }: SettingsMenuContentProps) {
  return (
    <parts.Content>
      {(state) => (
        <KindMenuContent align="start" sideOffset={6} {...props}>
          {typeof children === "function" ? children(state) : children}
        </KindMenuContent>
      )}
    </parts.Content>
  );
}

const DEFAULT_ROWS = ({ rows }: SettingsMenuContentState) => <SettingsMenuRows rows={rows} />;

// Shared, so an update doesn't render the default parts' wrappers again.
const ICON = <span data-menu-trigger-icon="" aria-hidden="true" />;
const DEFAULT_PARTS = (
  <>
    <SettingsMenuTrigger />
    <SettingsMenuContent />
  </>
);
