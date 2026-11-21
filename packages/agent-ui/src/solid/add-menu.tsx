import {
  type AddMenuContentState,
  type AddMenuOptions,
  type AddMenuRow,
  type AddMenuSection,
  addMenuPrimitive,
  type MenuPartState,
  type MenuTriggerState,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { MenuTrigger } from "@ui-sdk/solid/menu";
import { createParts } from "@ui-sdk/solid/primitive";
import { For, omit, Show } from "solid-js";
import {
  KindMenu,
  KindMenuContent,
  KindMenuGroup,
  KindMenuGroupLabel,
  KindMenuItem,
  KindMenuItemContent,
  KindMenuSeparator,
  KindMenuSub,
  KindMenuSubContent,
  KindMenuSubTrigger,
  menuProps,
  menuTriggerProps,
} from "./internal/menu.js";

const parts = createParts(addMenuPrimitive, { root: "div", trigger: "span", content: "div" });

/** An entry, whose `icon` is an image URL or an element such as an inline `svg`. */
export type AddMenuEntry = Omit<NonNullable<AddMenuOptions["items"]>[number], "icon" | "items"> & {
  icon?: string | JSX.Element | (() => JSX.Element);
  items?: AddMenuEntry[];
};

export type AddMenuProps = Omit<ComponentProps<typeof parts.Root>, "children" | "items"> & {
  items?: AddMenuEntry[];
  children?: JSX.Element;
};

function Row(props: { row: AddMenuRow }) {
  return (
    <Show
      when={props.row.sections}
      fallback={
        <KindMenuItem value={props.row.id} label={props.row.label} disabled={props.row.disabled}>
          <KindMenuItemContent
            icon={props.row.icon}
            label={props.row.label}
            description={props.row.description}
          />
        </KindMenuItem>
      }
    >
      {(sections) => (
        <KindMenuSub>
          <KindMenuSubTrigger disabled={props.row.disabled}>
            <KindMenuItemContent
              icon={props.row.icon}
              label={props.row.label}
              description={props.row.description}
            />
            <span data-menu-chevron="" />
          </KindMenuSubTrigger>
          <KindMenuSubContent>
            <AddMenuRows sections={sections()} />
          </KindMenuSubContent>
        </KindMenuSub>
      )}
    </Show>
  );
}

export type AddMenuRowsProps = { sections: AddMenuSection[] };

/** The rows of a level: each group under its label, separated, and a submenu for each entry with `items`. */
export function AddMenuRows(props: AddMenuRowsProps) {
  return (
    <For each={props.sections} keyed={(section) => section.label ?? ""}>
      {(section, index) => {
        const rows = () => (
          <For each={section().rows} keyed={(row) => row.id}>
            {(row) => <Row row={row()} />}
          </For>
        );
        return (
          <>
            <Show when={index() > 0}>
              <KindMenuSeparator />
            </Show>
            <Show when={section().label !== undefined} fallback={rows()}>
              <KindMenuGroup>
                <KindMenuGroupLabel>{section().label}</KindMenuGroupLabel>
                {rows()}
              </KindMenuGroup>
            </Show>
          </>
        );
      }}
    </For>
  );
}

/**
 * An icon button named "Add" that opens a menu of what can be added: items with an icon and a description, grouped
 * under labels, and submenus. Any `children` replace the trigger and the content, inside UI SDK Menu.
 */
export function AddMenu(props: AddMenuProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(menu: MenuPartState) => (
        <KindMenu {...menuProps(menu)}>{props.children ?? <DefaultParts />}</KindMenu>
      )}
    </parts.Root>
  );
}

export type AddMenuTriggerProps = ComponentProps<typeof MenuTrigger>;

/** Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, showing a plus unless you pass children. */
export function AddMenuTrigger(props: AddMenuTriggerProps) {
  return (
    <parts.Trigger>
      {(trigger: MenuTriggerState) => (
        // Hidden from agents, which use the Add Menu's own actions.
        <MenuTrigger {...menuTriggerProps(trigger)} data-agent-hidden="" {...omit(props, "children")}>
          {props.children ?? <span data-menu-trigger-icon="" aria-hidden="true" />}
        </MenuTrigger>
      )}
    </parts.Trigger>
  );
}

export type AddMenuContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** What the menu holds, or a function of its rows: the rows by default. */
  children?: JSX.Element | ((state: AddMenuContentState) => JSX.Element);
};

/** The menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. */
export function AddMenuContent(props: AddMenuContentProps) {
  return (
    <parts.Content>
      {(state: AddMenuContentState) => (
        <KindMenuContent align="start" sideOffset={6} {...omit(props, "children")}>
          {typeof props.children === "function"
            ? props.children(state)
            : (props.children ?? <AddMenuRows sections={state.sections} />)}
        </KindMenuContent>
      )}
    </parts.Content>
  );
}

const DefaultParts = () => (
  <>
    <AddMenuTrigger />
    <AddMenuContent />
  </>
);
