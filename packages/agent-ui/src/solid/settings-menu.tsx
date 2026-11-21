import {
  type MenuPartState,
  type MenuTriggerState,
  type SettingsMenuContentState,
  type SettingsMenuOptions,
  type SettingsMenuRow,
  settingsMenuPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { MenuItemIndicator, MenuTrigger } from "@ui-sdk/solid/menu";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, Match, omit, Show, Switch } from "solid-js";
import {
  childrenOr,
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
type Icon = string | JSX.Element | (() => JSX.Element);

/**
 * A setting, whose `icon` and options' `icon`s are image URLs, elements such as an inline `svg`, or functions returning
 * one, which draw a new copy wherever the icon shows.
 */
export type SettingsMenuSetting =
  | (Extract<Entry, { type: "toggle" }> & { icon?: Icon })
  | (Omit<Choice, "options"> & { icon?: Icon; options: (Choice["options"][number] & { icon?: Icon })[] });

export type SettingsMenuProps = Omit<ComponentProps<typeof parts.Root>, "children" | "settings"> & {
  settings?: SettingsMenuSetting[];
  children?: JSX.Element;
};

type ToggleRow = Extract<SettingsMenuRow, { type: "toggle" }>;
type ChoiceRow = Extract<SettingsMenuRow, { type: "choice" }>;

/** A choice's options in one radio group, under their group labels, then its actions. */
function Choices(props: { row: ChoiceRow }) {
  const radios = (options: () => ChoiceRow["groups"][number]["options"]) => (
    <For each={options()} keyed={(option) => option.value}>
      {(option) => (
        <KindMenuRadioItem
          value={option().value}
          label={option().label}
          disabled={option().disabled ?? false}
        >
          <KindMenuItemIndicator keepMounted>
            <span data-menu-check="" aria-hidden="true" />
          </KindMenuItemIndicator>
          <KindMenuItemContent icon={option().icon} label={option().label} />
        </KindMenuRadioItem>
      )}
    </For>
  );
  return (
    <>
      <KindMenuRadioGroup name={props.row.id} value={props.row.value ?? null}>
        {/* By position: an inline row's own label can match a host group's. */}
        <For each={props.row.groups} keyed={false}>
          {(group) => (
            // A labelled group sits inside the one radio group, which UI SDK keys by the setting's `id`.
            <Show when={group().label !== undefined} fallback={radios(() => group().options)}>
              <KindMenuGroup>
                <KindMenuGroupLabel>{group().label}</KindMenuGroupLabel>
                {radios(() => group().options)}
              </KindMenuGroup>
            </Show>
          )}
        </For>
      </KindMenuRadioGroup>
      <Show when={props.row.actions.length && !props.row.inline}>
        <KindMenuSeparator />
      </Show>
      <For each={props.row.actions} keyed={(action) => action.value}>
        {(action) => (
          <KindMenuItem
            value={action().value}
            label={action().label}
            data-menu-inset={props.row.inline ? "" : undefined}
          >
            <KindMenuItemContent icon={action().icon} label={action().label} />
          </KindMenuItem>
        )}
      </For>
    </>
  );
}

function Row(props: { row: SettingsMenuRow }) {
  const toggle = () => props.row as ToggleRow;
  const choice = () => props.row as ChoiceRow;
  return (
    <Switch>
      <Match when={props.row.type === "toggle"}>
        <KindMenuCheckboxItem value={toggle().id} label={toggle().label} checked={toggle().checked}>
          <KindMenuItemContent
            icon={toggle().icon}
            label={toggle().label}
            description={toggle().description}
          />
          <MenuItemIndicator keepMounted data-menu-switch="" aria-hidden="true">
            <span data-menu-switch-thumb="" />
          </MenuItemIndicator>
        </KindMenuCheckboxItem>
      </Match>
      <Match when={choice().inline}>
        <Choices row={choice()} />
      </Match>
      <Match when>
        <KindMenuSub>
          <KindMenuSubTrigger>
            <KindMenuItemContent icon={choice().icon} label={choice().label} />
            <span data-settings-menu-value="">
              <For each={choice().options} keyed={(option) => option.value}>
                {(option) => (
                  <span data-current={option().value === choice().value ? "" : undefined}>
                    {option().label}
                  </span>
                )}
              </For>
            </span>
            <span data-menu-chevron="" />
          </KindMenuSubTrigger>
          <KindMenuSubContent>
            <Choices row={choice()} />
          </KindMenuSubContent>
        </KindMenuSub>
      </Match>
    </Switch>
  );
}

export type SettingsMenuRowsProps = { rows: SettingsMenuRow[] };

/**
 * The rows: a switch for each toggle, and for each choice a submenu showing its value, or while `inline` a section of
 * the menu, holding its options under their group labels and any actions after them. A separator follows an inline
 * section. Model Control draws its rows with it too.
 */
export function SettingsMenuRows(props: SettingsMenuRowsProps) {
  return (
    <For each={props.rows} keyed={(row) => row.id}>
      {(row, index) => (
        <>
          <Row row={row()} />
          <Show
            when={row().type === "choice" && (row() as ChoiceRow).inline && index() < props.rows.length - 1}
          >
            <KindMenuSeparator />
          </Show>
        </>
      )}
    </For>
  );
}

/**
 * An icon button named "Settings" that opens a menu of settings: toggles drawn as switches, which keep the menu open,
 * and choices, each a submenu of options showing the current one. Any `children` replace the trigger and the content,
 * inside UI SDK Menu.
 */
export function SettingsMenu(props: SettingsMenuProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(menu: MenuPartState) => (
        <KindMenu {...menuProps(menu)}>{props.children ?? <DefaultParts />}</KindMenu>
      )}
    </parts.Root>
  );
}

export type SettingsMenuTriggerProps = ComponentProps<typeof MenuTrigger>;

/** Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, showing a settings icon unless you pass children. */
export function SettingsMenuTrigger(props: SettingsMenuTriggerProps) {
  return (
    <parts.Trigger>
      {(trigger: MenuTriggerState) => (
        // Hidden from agents, which use the Settings Menu's own actions.
        <MenuTrigger {...menuTriggerProps(trigger)} data-agent-hidden="" {...omit(props, "children")}>
          {props.children ?? <span data-menu-trigger-icon="" aria-hidden="true" />}
        </MenuTrigger>
      )}
    </parts.Trigger>
  );
}

export type SettingsMenuContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** What the menu holds, or a function of its rows: the rows by default. */
  children?: JSX.Element | ((state: SettingsMenuContentState) => JSX.Element);
};

/** The menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. */
export function SettingsMenuContent(props: SettingsMenuContentProps) {
  return (
    <parts.Content>
      {(state: SettingsMenuContentState) => (
        <KindMenuContent align="start" sideOffset={6} {...omit(props, "children")}>
          {childrenOr(props.children, state, () => (
            <SettingsMenuRows rows={state.rows} />
          ))}
        </KindMenuContent>
      )}
    </parts.Content>
  );
}

const DefaultParts = () => (
  <>
    <SettingsMenuTrigger />
    <SettingsMenuContent />
  </>
);
