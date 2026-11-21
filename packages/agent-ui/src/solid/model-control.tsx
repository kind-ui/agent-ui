import {
  type MenuPartState,
  type ModelControlOptions,
  type ModelControlTriggerState,
  modelControlPrimitive,
  type SettingsMenuContentState,
} from "@kind-ui/agent-ui/core";
import type { ComponentProps, JSX } from "@solidjs/web";
import { MenuTrigger } from "@ui-sdk/solid/menu";
import { createParts } from "@ui-sdk/solid/primitive";
import { createMemo, For, omit, Show } from "solid-js";
import { KindMenu, KindMenuContent, KindMenuItemIcon, menuProps, menuTriggerProps } from "./internal/menu.js";
import { SettingsMenuRows, type SettingsMenuSetting } from "./settings-menu.js";

const parts = createParts(modelControlPrimitive, { root: "div", trigger: "span", content: "div" });

// A function draws a new copy wherever the icon shows, as the trigger and the menu both do.
type Icon = string | JSX.Element | (() => JSX.Element);

/** A model, whose `icon` is an image URL, an element such as an inline `svg`, or a function returning one. */
export type ModelControlModel = Omit<NonNullable<ModelControlOptions["models"]>[number], "icon"> & {
  icon?: Icon;
};

export type ModelControlProps = Omit<
  ComponentProps<typeof parts.Root>,
  "children" | "models" | "actions" | "settings"
> & {
  models?: ModelControlModel[];
  /** Items after the models, like "More models". */
  actions?: (Omit<NonNullable<ModelControlOptions["actions"]>[number], "icon"> & { icon?: Icon })[];
  /** More rows after Model and Effort: choices, then toggles. */
  settings?: SettingsMenuSetting[];
  children?: JSX.Element;
};

/**
 * One button for the model and its effort, reading "GPT-5 · High", that opens one menu: the models, grouped with
 * their icons, then the effort levels the model supports, then your own choices and toggles. Any `children` replace
 * the trigger and the content, inside UI SDK Menu.
 */
export function ModelControl(props: ModelControlProps) {
  return (
    <parts.Root {...omit(props, "children")}>
      {(menu: MenuPartState) => (
        <KindMenu {...menuProps(menu)}>{props.children ?? <DefaultParts />}</KindMenu>
      )}
    </parts.Root>
  );
}

function TriggerContent(props: { state: ModelControlTriggerState }) {
  const icon = createMemo(() => props.state.model.icon);
  return (
    <>
      <Show when={icon() !== undefined}>
        <KindMenuItemIcon>
          {typeof icon() === "string" ? <img src={icon() as string} alt="" /> : (icon() as JSX.Element)}
        </KindMenuItemIcon>
      </Show>
      <span data-model-control-model="">{props.state.model.label}</span>
      <Show when={props.state.effort}>
        {(effort) => (
          <>
            {/* Spaces around the "·", so the accessible name reads "GPT-5 · High"; the trigger's gap spaces it on screen. */}{" "}
            <span data-model-control-separator="">·</span>{" "}
            {/* Every level's label shares one cell and only the chosen one shows, so the trigger keeps its width. */}
            <span data-model-control-effort="">
              <For each={effort().options} keyed={(option) => option.value}>
                {(option) => (
                  <span data-current={option().value === effort().value ? "" : undefined}>
                    {option().label}
                  </span>
                )}
              </For>
            </span>
          </>
        )}
      </Show>
      <span data-menu-chevron="" />
    </>
  );
}

export type ModelControlTriggerProps = Omit<ComponentProps<typeof MenuTrigger>, "children"> & {
  /** What the button shows: the model's icon and name, then its effort, by default. */
  children?: JSX.Element | ((state: ModelControlTriggerState) => JSX.Element);
};

/** Opens the menu: UI SDK's `MenuTrigger`, named by the `label`, the model and the effort. */
export function ModelControlTrigger(props: ModelControlTriggerProps) {
  return (
    <parts.Trigger>
      {(state: ModelControlTriggerState) => (
        // Hidden from agents, which use the Model Control's own actions.
        <MenuTrigger {...menuTriggerProps(state)} data-agent-hidden="" {...omit(props, "children")}>
          {typeof props.children === "function"
            ? props.children(state)
            : (props.children ?? <TriggerContent state={state} />)}
        </MenuTrigger>
      )}
    </parts.Trigger>
  );
}

export type ModelControlContentProps = Omit<ComponentProps<typeof KindMenuContent>, "children"> & {
  /** What the menu holds, or a function of its rows: the rows by default. */
  children?: JSX.Element | ((state: SettingsMenuContentState) => JSX.Element);
};

/** The menu: UI SDK's `MenuContent` holding the rows unless you pass children. Props go to it. */
export function ModelControlContent(props: ModelControlContentProps) {
  return (
    <parts.Content>
      {(state: SettingsMenuContentState) => (
        <KindMenuContent align="start" sideOffset={6} {...omit(props, "children")}>
          {typeof props.children === "function"
            ? props.children(state)
            : (props.children ?? <SettingsMenuRows rows={state.rows} />)}
        </KindMenuContent>
      )}
    </parts.Content>
  );
}

const DefaultParts = () => (
  <>
    <ModelControlTrigger />
    <ModelControlContent />
  </>
);
