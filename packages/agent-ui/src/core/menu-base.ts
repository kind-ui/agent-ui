import {
  type ChangeDetails,
  type ChangeSource,
  createChange,
  type PrimitiveContext,
  type SlotFactory,
} from "@ui-sdk/core";
import {
  createMenuController,
  type MenuActionDetails,
  type MenuCheckedChangeDetails,
  type MenuController,
  type MenuData,
  type MenuOpenChangeReason,
  type MenuValueChangeDetails,
} from "@ui-sdk/core/menu";
import { actionSource } from "./action-source.js";
import { type ComposedHandler, hearComposed } from "./composed-events.js";
import { memo } from "./memo.js";
import type { MotionMode } from "./motion/index.js";

/** `"sheet"` slides the menu up from the bottom of the screen; `"auto"` does that on small touch screens. */
export type MenuPresentation = "auto" | "popover" | "sheet";

export type MenuBaseOptions = {
  /** Whether the menu is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the menu is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes, with UI SDK Menu's reason. */
  onOpenChange?: (open: boolean, details: ChangeDetails<MenuOpenChangeReason>) => void;
  /**
   * How the menu presents. `"auto"` is a bottom sheet on small touch screens and a popover elsewhere.
   * @default "auto"
   */
  presentation?: MenuPresentation;
  /**
   * Whether the trigger can't open the menu.
   * @default false
   */
  disabled?: boolean;
  /**
   * How the menu opens and closes. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type MenuBaseState = {
  open: boolean;
  /** The menu as UI SDK Menu data, from the component's `toData`. */
  items: MenuData;
  presentation: MenuPresentation;
  disabled: boolean;
  motion: MotionMode;
};

/** What the root hands UI SDK Menu: pass every key to it. On Web Components, write them onto the `ui-menu`. */
export type MenuPartState = {
  /** The primitive's own. */
  controller: MenuController;
  items: MenuData;
  presentation: MenuPresentation;
  open: boolean;
  onOpenChange: (open: boolean, details: ChangeDetails<MenuOpenChangeReason>) => void;
  onAction: (value: string, details: MenuActionDetails) => unknown;
  onCheckedChange: (checked: boolean, details: MenuCheckedChangeDetails) => void;
  onValueChange: (value: string, details: MenuValueChangeDetails) => void;
};

/** What ran a plain item: the click or key press, and who. */
export type MenuRun = { event?: Event | undefined; source: ChangeSource };

/** How a person chose in the menu: the reason, the event, who, and a `cancel` that keeps a checkbox or radio as it was. */
export type MenuChoice = {
  reason: string;
  event?: Event | undefined;
  source: ChangeSource;
  cancel: () => void;
};

export type MenuBaseApi = {
  /** The controller UI SDK Menu is driven through. */
  controller: MenuController;
  /** Opens the menu. Offered only while it's closed and enabled. Returns whether the change was accepted. */
  readonly open: (() => boolean) | undefined;
  /** Closes the menu. Offered only while it's open. Returns whether the change was accepted. */
  readonly close: (() => boolean) | undefined;
  /** The menu's data, or none while disabled. */
  getItems: () => MenuData;
  /** Props for composed UI SDK components, memoized. `menu` is called by the root slot. */
  partState: { menu: (state: MenuBaseState) => MenuPartState };
  /** UI SDK Menu's events on Web Components, heard by the root slot through `hearComposed`. */
  composedEvents: Record<string, ComposedHandler>;
};

type Context<Options> = PrimitiveContext<Options, MenuBaseState, string>;

export type MenuBaseConfig<Options extends MenuBaseOptions> = {
  /** Written as the root's `data-kind`. */
  kind: string;
  /** The menu as UI SDK Menu data, read whenever the options change. */
  toData: (options: Options) => MenuData;
  /** A plain item ran. A returned promise keeps the item pending and the menu open until it settles. */
  onAction?: (value: string, details: MenuRun, context: Context<Options>) => unknown;
  /** A checkbox item, by its value, wants to toggle. */
  onChecked?: (value: string, checked: boolean, choice: MenuChoice, context: Context<Options>) => void;
  /** A radio group, by its `name`, wants to change. `toData` names every radio group, so both layers report the same one. */
  onValue?: (group: string, value: string, choice: MenuChoice, context: Context<Options>) => void;
};

type Reachable = { value: string; label: string; disabled?: boolean | undefined };

/** Every item, checkbox and radio item a person could reach, through groups and enabled submenus. */
export const menuItems = (data: MenuData): Reachable[] =>
  data.flatMap((entry): Reachable[] => {
    if (typeof entry === "string") return [{ value: entry, label: entry }];
    switch (entry.type) {
      case "separator":
        return [];
      case "group":
        return menuItems(entry.items);
      case "submenu":
        return entry.disabled ? [] : menuItems(entry.items);
      case "radio-group":
        return entry.items.map(({ value, label, disabled }) => ({ value, label, disabled }));
      default:
        return [{ value: entry.value, label: entry.label, disabled: entry.disabled }];
    }
  });

type Detail = {
  value: unknown;
  reason: string;
  event?: Event;
  source: ChangeSource;
  waitUntil?: (p: unknown) => void;
};

/**
 * Everything but the name of a menu built on UI SDK Menu (Add Menu, Settings Menu, Approval Mode and Message's
 * regenerate-with menu): options, state, the api, the `root`, `trigger` and `content` slots and the agent actions,
 * each spread into the component's own `definePrimitive`, as `stepBase` is. The menu is UI SDK's, controlled by
 * `open`; choices reach the component through `config`, from React's props or, on Web Components, the menu's events.
 */
export const menuBase = <Options extends MenuBaseOptions>(config: MenuBaseConfig<Options>) => {
  // Menu data is plain, so equal data keeps its array: a new one makes `ui-menu` render every item again.
  let last: { key: string; items: MenuData } | undefined;
  const data = (options: Options) => {
    const items = config.toData(options);
    const key = JSON.stringify(items);
    if (last?.key !== key) last = { key, items };
    return last.items;
  };
  const presentation = (options: Options) => ({
    items: data(options),
    presentation: options.presentation ?? "auto",
    disabled: options.disabled ?? false,
    motion: options.motion ?? "auto",
  });
  return {
    options: {
      open: "boolean",
      defaultOpen: "boolean",
      onOpenChange: "callback",
      presentation: "string",
      disabled: "boolean",
      motion: "string",
    } as const,
    state: (options: Options): MenuBaseState => ({
      ...presentation(options),
      open: options.open ?? options.defaultOpen ?? false,
    }),
    sync: (options: Options): Partial<MenuBaseState> => ({
      ...presentation(options),
      ...(options.open === undefined ? {} : { open: options.open }),
    }),
    controlled: ["open"] as "open"[],
    api: (context: Context<Options>): MenuBaseApi => {
      const { store } = context;
      // `createChange` reads open change reasons from the options type, which a generic `Options` hides.
      const change = createChange(context as PrimitiveContext<MenuBaseOptions, MenuBaseState, string>);
      const controller = createMenuController();
      context.onOptions((options) => {
        if (options.disabled && store.get().open) change("open", false, { reason: "imperative" });
      });

      const onOpenChange = (open: boolean, details: ChangeDetails<MenuOpenChangeReason>) => {
        const { reason, event, source } = details;
        if (open && store.get().disabled) return details.cancel();
        if (!change("open", open, event ? { reason, event, source } : { reason, source })) details.cancel();
      };
      const onAction = (value: string, { event }: MenuActionDetails) =>
        config.onAction?.(value, { event, source: actionSource(event, "item-press") }, context);
      const onCheckedChange = (checked: boolean, details: MenuCheckedChangeDetails) =>
        config.onChecked?.(details.value, checked, details, context);
      const onValueChange = (value: string, details: MenuValueChangeDetails) =>
        config.onValue?.(details.group, value, details, context);

      const menu = memo(
        (items: MenuData, shown: MenuPresentation, open: boolean): MenuPartState => ({
          controller,
          items,
          presentation: shown,
          open,
          onOpenChange,
          onAction,
          onCheckedChange,
          onValueChange,
        }),
      );

      // `@ui-sdk/web` fires each on its own element: the menu's open and actions on `ui-menu`, a checkbox item's
      // toggle on the item and a radio group's change on the group, which carry their value and name.
      const choice = (detail: Detail, event: Event): MenuChoice => ({
        reason: detail.reason,
        event: detail.event,
        source: detail.source,
        cancel: () => event.preventDefault(),
      });
      const composedEvents: Record<string, ComposedHandler> = {
        openchange: (detail, event) => {
          if ((event.target as Element).localName !== "ui-menu") return;
          const { value, ...rest } = detail as Detail;
          const details = { ...rest, cancel: () => event.preventDefault() };
          onOpenChange(value as boolean, details as ChangeDetails<MenuOpenChangeReason>);
        },
        action: (detail, event) => {
          if ((event.target as Element).localName !== "ui-menu") return;
          const { value, event: cause, waitUntil } = detail as Detail;
          const result = onAction(value as string, cause ? { event: cause } : {});
          if (result && typeof (result as PromiseLike<unknown>).then === "function") waitUntil?.(result);
        },
        checkedchange: (detail, event) => {
          const item = event.target as Element;
          if (item.localName !== "ui-menu-checkbox-item") return;
          const value = item.getAttribute("value") ?? "";
          config.onChecked?.(
            value,
            (detail as Detail).value as boolean,
            choice(detail as Detail, event),
            context,
          );
        },
        valuechange: (detail, event) => {
          const group = event.target as Element;
          if (group.localName !== "ui-menu-radio-group") return;
          const name = group.getAttribute("name") ?? "";
          config.onValue?.(
            name,
            (detail as Detail).value as string,
            choice(detail as Detail, event),
            context,
          );
        },
      };

      return {
        controller,
        get open() {
          const { open, disabled } = store.get();
          return open || disabled ? undefined : () => change("open", true, { reason: "imperative" });
        },
        get close() {
          return store.get().open ? () => change("open", false, { reason: "imperative" }) : undefined;
        },
        getItems: () => (store.get().disabled ? [] : store.get().items),
        partState: { menu: (state) => menu(state.items, state.presentation, state.open) },
        composedEvents,
      };
    },
    slots: <State extends MenuBaseState, Api extends MenuBaseApi>(slot: SlotFactory<State, Api>) => ({
      root: slot<object, MenuPartState>({
        state: (state, { api }) => api.partState.menu(state),
        attrs: (state) => ({
          "data-kind": config.kind,
          "data-open": state.open ? "" : undefined,
          "data-disabled": state.disabled ? "" : undefined,
          "data-motion": state.motion,
        }),
        bind: (el, { api }) => hearComposed(el, api.composedEvents),
      }),
      trigger: slot({
        attrs: (state) => ({
          "data-menu-part": "trigger",
          "data-open": state.open ? "" : undefined,
          "data-disabled": state.disabled ? "" : undefined,
        }),
      }),
      content: slot({
        attrs: (state) => ({ "data-menu-part": "content", "data-motion": state.motion }),
      }),
    }),
    agent: {
      actions: ["open", "close"],
      items: (api: MenuBaseApi) => menuItems(api.getItems()),
      closed: true,
    },
  };
};
