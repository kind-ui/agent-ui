import type { JSX } from "@solidjs/web";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuItemIcon,
  MenuItemIndicator,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@ui-sdk/solid/menu";
import { createMemo, Show } from "solid-js";
import { iconElement, withKindClass } from "./kind-class.js";

const content =
  "z-50 min-w-50 rounded-[var(--kind-popup-radius)] bg-[var(--kind-color-raised)] p-[var(--kind-popup-padding)] text-[length:var(--kind-text-md)]/5 text-[var(--kind-color-fg)] shadow-[var(--kind-shadow-popover)] outline-hidden data-[presentation=sheet]:w-full data-[presentation=sheet]:max-w-none data-[presentation=sheet]:rounded-b-none data-[presentation=sheet]:pb-[max(0.5rem,env(safe-area-inset-bottom))] data-[presentation=sheet]:[&_:is([data-slot=menu-item],[data-slot=menu-checkbox-item],[data-slot=menu-radio-item],[data-slot=menu-trigger])]:py-2.5";
const item =
  "flex cursor-default select-none items-center gap-2 rounded-[var(--kind-radius-md)] px-2.5 py-1.5 outline-hidden focus-visible:bg-[var(--kind-color-selected)] data-highlighted:bg-[var(--kind-color-selected)] data-disabled:opacity-[var(--kind-disabled-opacity)] has-[[data-menu-description]]:items-start data-destructive:text-[var(--kind-color-danger)] [&_[data-menu-text]]:flex [&_[data-menu-text]]:min-w-0 [&_[data-menu-text]]:flex-col [&_[data-menu-description]]:text-[length:var(--kind-text-xs)]/4 [&_[data-menu-description]]:text-[var(--kind-color-muted)]";

export const KindMenu = Menu;
export const KindMenuTrigger = withKindClass(
  MenuTrigger,
  "inline-flex h-[var(--kind-trigger-height)] items-center justify-center gap-1.5 rounded-[var(--kind-radius-full)] px-3 text-[length:var(--kind-text-md)]/5 font-medium text-[var(--kind-color-fg)] hover:bg-[var(--kind-color-hover)] data-open:bg-[var(--kind-color-selected)] focus-visible:[outline:var(--kind-focus-ring)] focus-visible:[outline-offset:var(--kind-focus-offset)] data-disabled:cursor-not-allowed data-disabled:opacity-[var(--kind-disabled-opacity)] data-pending:cursor-wait",
);
export const KindMenuContent = withKindClass(MenuContent, content);
export const KindMenuItem = withKindClass(MenuItem, item);
export const KindMenuCheckboxItem = withKindClass(MenuCheckboxItem, item);
export const KindMenuRadioGroup = MenuRadioGroup;
export const KindMenuRadioItem = withKindClass(MenuRadioItem, item);
export const KindMenuItemIndicator = withKindClass(
  MenuItemIndicator,
  "inline-flex h-5 w-4 shrink-0 items-center justify-center text-[var(--kind-color-accent)] data-unchecked:invisible",
);
export const KindMenuItemIcon = withKindClass(
  MenuItemIcon,
  "inline-flex h-5 w-4 shrink-0 items-center justify-center text-[var(--kind-color-muted)] [&_svg]:size-4",
);
export const KindMenuSub = MenuSub;
export const KindMenuSubTrigger = withKindClass(
  MenuSubTrigger,
  `${item} data-open:bg-[var(--kind-color-selected)]`,
);
export const KindMenuSubContent = withKindClass(MenuSubContent, content);
export const KindMenuGroup = withKindClass(MenuGroup, "py-0.5");
export const KindMenuGroupLabel = withKindClass(
  MenuGroupLabel,
  "px-2.5 pt-1.5 pb-1 text-[length:var(--kind-text-xs)]/4 font-medium text-[var(--kind-color-muted)]",
);
export const KindMenuSeparator = withKindClass(
  MenuSeparator,
  "mx-2.5 my-1 h-px bg-[var(--kind-color-border)]",
);

export type KindMenuItemContentProps = {
  /** An image URL, an element such as an inline `svg`, or a function returning one. */
  icon?: unknown;
  label: string;
  description?: string | undefined;
};

/** A data row's icon and text, the label over an optional description, as menus built on `menuBase` draw them. */
export function KindMenuItemContent(props: KindMenuItemContentProps) {
  const icon = createMemo(() => props.icon);
  return (
    <>
      <Show when={icon() !== undefined}>
        <KindMenuItemIcon>
          {typeof icon() === "string" ? <img src={icon() as string} alt="" /> : iconElement(icon())}
        </KindMenuItemIcon>
      </Show>
      <span data-menu-text="">
        <span>{props.label}</span>
        <Show when={props.description}>
          <span data-menu-description="">{props.description}</span>
        </Show>
      </span>
    </>
  );
}

// A part's state reaches a function child as a proxy that reads each key on its own, which a spread can't list. These
// name the keys, so each prop keeps following its own key.
const readKeys = <State extends object, Key extends keyof State>(state: State, keys: readonly Key[]) =>
  Object.defineProperties(
    {},
    Object.fromEntries(keys.map((key) => [key, { enumerable: true, get: () => state[key] }])),
  ) as Pick<State, Key>;

const MENU_KEYS = [
  "controller",
  "presentation",
  "open",
  "onOpenChange",
  "onAction",
  "onCheckedChange",
  "onValueChange",
] as const;
const TRIGGER_KEYS = ["aria-label", "disabled", "data-kind-trigger", "data-kind-icon-button"] as const;

/** What a `menuBase` root hands UI SDK Menu: `<KindMenu {...menuProps(menu)}>`. */
export const menuProps = <State extends Record<(typeof MENU_KEYS)[number], unknown>>(menu: State) =>
  readKeys(menu, MENU_KEYS);

/** What a `menuBase` trigger slot hands UI SDK's `MenuTrigger`: `<MenuTrigger {...menuTriggerProps(trigger)}>`. */
export const menuTriggerProps = <State extends Partial<Record<(typeof TRIGGER_KEYS)[number], unknown>>>(
  trigger: State,
) => readKeys(trigger, TRIGGER_KEYS);

/**
 * A part's children, read once: a function of its state, or elements, else `fallback`. Solid builds element children
 * each time their getter is read, so a second read would build them twice.
 */
export function childrenOr<State>(
  children: JSX.Element | ((state: State) => JSX.Element) | undefined,
  state: State,
  fallback: () => JSX.Element,
): JSX.Element {
  return typeof children === "function"
    ? (children as (state: State) => JSX.Element)(state)
    : (children ?? fallback());
}
