import {
  type ChangeDetails,
  createChange,
  createPopup,
  dispatch,
  type PopupContentProps,
  type PopupContentState,
  type PopupState,
  type PopupTriggerProps,
  type PopupTriggerState,
  type PrimitiveContext,
  popupContent,
  popupState,
  popupTrigger,
  popupViewport,
  type SlotDefinition,
  type SlotFactory,
} from "@ui-sdk/core";
import {
  type CommandActionDetails,
  type CommandController,
  type CommandPagesChangeReason,
  type CommandQueryChangeReason,
  createCommandController,
} from "@ui-sdk/core/command";
import { type PopoverOpenChangeReason, popoverPreset } from "@ui-sdk/core/popover";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { fuzzyScore, type MatchSegment, matchRanges, matchSegments } from "@ui-sdk/core/text-match";
import type { PickerAction, PickerItem } from "../../types/index.js";
import { type ComposedHandler, hearComposed } from "../composed-events.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { withAutoPresentation } from "../presentation.js";
import { keyKind, keyValue, type PickerPage, type PickerRow, pickerLeaves, pickerPages } from "./pages.js";

/** `"item-press"`: a person chose a row. `"imperative"`: an `api` call, like an agent's `setValue` or `run`. */
export type PickerValueChangeReason = "item-press" | "imperative";

/** Why the list opened or closed: UI SDK Popover's reasons, and `"item-press"` when a choice closed it. */
export type PickerOpenChangeReason = PopoverOpenChangeReason | "item-press";

/** `"sheet"` slides the list up from the bottom of the screen; `"auto"` does that on small touch screens. */
export type PickerPresentation = "auto" | "popover" | "sheet";

export type PickerBaseOptions = {
  /**
   * Footer rows after the items, like "More models", in one group the arrow keys reach. Shown on the first page. Each
   * `id` differs from every item's `value`, since agents name both alike.
   * @default []
   */
  actions?: PickerAction<unknown>[];
  /**
   * Names the trigger, with the chosen item's label after it, and the search field.
   * @default "Choose"
   */
  label?: string;
  /**
   * Shown in the empty search field.
   * @default "Search"
   */
  placeholder?: string;
  /**
   * Shown while nothing matches the search.
   * @default "No matches"
   */
  emptyText?: string;
  /**
   * Names the row that goes back from a page.
   * @default "Back"
   */
  backLabel?: string;
  /** The chosen item's `value`. Passing it controls it: change it in `onValueChange`. */
  value?: string | null;
  /**
   * The chosen item's `value` at first, when `value` isn't passed.
   * @default null
   */
  defaultValue?: string | null;
  /** Called when a person or `setValue` chooses an item, with why. */
  onValueChange?: (value: string, details: ChangeDetails<PickerValueChangeReason>) => void;
  /** Called when a person or `run` runs one of the `actions`, by its `id`. Cancel it to keep the list open. */
  onAction?: (id: string, details: ChangeDetails<PickerValueChangeReason>) => void;
  /** Whether the list is open. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the list is open at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the list opens or closes, with what caused it. */
  onOpenChange?: (open: boolean, details: ChangeDetails<PickerOpenChangeReason>) => void;
  /**
   * How the list presents. `"auto"` is a bottom sheet on small touch screens and a popover elsewhere.
   * @default "auto"
   */
  presentation?: PickerPresentation;
  /**
   * Whether the trigger can't open the list.
   * @default false
   */
  disabled?: boolean;
  /**
   * How the list opens and closes. `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type PickerBaseState = PopupState & {
  /** The items, from the component's `toItems`. */
  items: PickerItem<unknown>[];
  /** The `actions`. */
  actions: PickerAction<unknown>[];
  /** The chosen item's `value`. */
  value: string | null;
  /** The `label`, else the component's. */
  label: string;
  /** The `placeholder`, else the component's (Picker: "Search"). */
  placeholder: string;
  /** The `emptyText`, else the component's (Picker: "No matches"). */
  emptyText: string;
  /** The `backLabel`, else "Back". */
  backLabel: string;
  /** Whether `onAction` is set. */
  canRun: boolean;
  /** The `disabled` option. */
  disabled: boolean;
  /** The `motion` option. */
  motion: MotionMode;
  /** What the search field holds on the current page. */
  query: string;
  /** The open pages, by the `value` of the item that opened each, from the first. Empty on the first page. */
  pages: string[];
};

/** What the trigger shows: the chosen item's label and icon, or the `label` while none is chosen. */
export type PickerTriggerState = PopupTriggerState & { text: string; icon: unknown; chosen: boolean };

/** What the `command` part hands UI SDK Command: pass `props` to it, and render `pages` inside it. */
export type PickerCommandState = {
  props: {
    /** The primitive's own, which it resets the search and pages through when the list opens. */
    controller: CommandController;
    /** Typing keeps the rows with its letters in order. */
    filter: "fuzzy";
    /** The best match is highlighted as a person types, so Enter chooses it. */
    autoHighlight: true;
    /** Chooses an item, runs an action or goes back, by the row's key. */
    onAction: (value: string, details: CommandActionDetails) => void;
    /** Follows the search, for the description's marks. */
    onQueryChange: (query: string, details: ChangeDetails<CommandQueryChangeReason>) => void;
    /** Follows the open pages. */
    onPagesChange: (pages: string[], details: ChangeDetails<CommandPagesChangeReason>) => void;
  };
  /** Names the search field. */
  label: string;
  /** The search field's placeholder. */
  placeholder: string;
  /** What shows while nothing matches. */
  emptyText: string;
  /** Every page of rows: render each in a `CommandPage` with its `page` as the value. */
  pages: PickerPage[];
};

/** What a row's `item` part shows. */
export type PickerItemState = {
  row: PickerRow;
  /** The description, split into what the search matched and what it didn't, while the label didn't match. */
  description: MatchSegment[];
  /** Whether it's the chosen item. */
  chosen: boolean;
  /** Whether the picker marks the chosen item. */
  check: boolean;
};

type Popup = ReturnType<typeof createPopup<PickerBaseOptions, PickerBaseState, typeof popoverPreset>>;

export type PickerBaseApi = Omit<Popup, "open" | "close"> & {
  /** Opens the list. Offered only while it's closed and enabled. Returns whether the change was accepted. */
  readonly open: (() => boolean) | undefined;
  /** Closes the list. Offered only while it's open. Returns whether the change was accepted. */
  readonly close: (() => boolean) | undefined;
  /** The chosen item's `value`. */
  getValue: () => string | null;
  /**
   * Chooses an item by its `value`, on any page, leaving the list as it is. Returns `false` for an unknown or disabled
   * one, or a refused change. Offered only while the picker is enabled.
   */
  readonly setValue: ((value: string) => boolean) | undefined;
  /** Runs one of the `actions` by its `id`, leaving the list as it is. Offered only while `onAction` is set and the picker is enabled. */
  readonly run: ((id: string) => boolean) | undefined;
  /** Every item that can be chosen and every action, for agents. */
  getChoices: () => { value: string; label: string; disabled?: boolean }[];
  /** Hands the trigger its text and icon. Called by the trigger slot. */
  triggerState: (state: PickerBaseState) => { text: string; icon: unknown; chosen: boolean };
  /** The trigger's and root's name: the `label`, and the chosen item's after it. */
  name: (state: PickerBaseState) => string;
  /** Hands UI SDK Command its props and the rows. Called by the command slot. */
  commandState: (state: PickerBaseState) => PickerCommandState;
  /** Hands a row's `item` part what it shows, by its row key. */
  itemState: (state: PickerBaseState, key: string) => PickerItemState | undefined;
  /** UI SDK Command's events on Web Components, heard by the command slot through `hearComposed`. */
  composedEvents: Record<string, ComposedHandler>;
};

type Slot<
  State extends PickerBaseState,
  Api extends PickerBaseApi,
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<State, Api, Props, Public>;

export type PickerBaseSlots<State extends PickerBaseState, Api extends PickerBaseApi> = {
  root: Slot<State, Api>;
  trigger: Slot<State, Api, PopupTriggerProps & BaseSlotProps, PickerTriggerState>;
  content: Slot<State, Api, PopupContentProps & BaseSlotProps, PopupContentState>;
  viewport: Slot<State, Api>;
  command: Slot<State, Api, BaseSlotProps, PickerCommandState>;
  item: Slot<State, Api, BaseSlotProps & { value?: string }, PickerItemState>;
};

export type PickerBaseConfig<Options extends PickerBaseOptions> = {
  /** Written as the root's `data-kind`. */
  kind: string;
  /** The rows to choose from, read whenever the options change. */
  toItems: (options: Options) => PickerItem<unknown>[];
  /** The `label` when the options have none. */
  label: string;
  /**
   * The `placeholder` when the options have none.
   * @default "Search"
   */
  placeholder?: string;
  /**
   * The `emptyText` when the options have none.
   * @default "No matches"
   */
  emptyText?: string;
  /**
   * Whether the chosen item shows a check.
   * @default true
   */
  check?: boolean;
};

const noActions: PickerAction<unknown>[] = [];

/**
 * Everything but the name of a picker: a button whose popover holds UI SDK Command, for Picker, Model Selector, Model
 * Control and Prompt Library to spread into their own `definePrimitive`, as Step-based components spread `stepBase`.
 * Command searches, marks matches and opens pages; the picker adds the chosen item, two-line rows, trailing text and
 * the footer actions.
 */
export const pickerBase = <Options extends PickerBaseOptions>(config: PickerBaseConfig<Options>) => {
  const check = config.check ?? true;
  const presentation = (options: Options) => ({
    items: config.toItems(options),
    actions: options.actions ?? noActions,
    label: options.label ?? config.label,
    placeholder: options.placeholder ?? config.placeholder ?? "Search",
    emptyText: options.emptyText ?? config.emptyText ?? "No matches",
    backLabel: options.backLabel ?? "Back",
    canRun: typeof options.onAction === "function",
    disabled: options.disabled ?? false,
    motion: options.motion ?? "auto",
  });
  const leafOf = (state: PickerBaseState, value: string | null) =>
    value === null ? undefined : pickerLeaves(state.items).find((item) => item.value === value);

  return {
    options: {
      actions: "value",
      label: "string",
      placeholder: "string",
      emptyText: "string",
      backLabel: "string",
      value: "value",
      defaultValue: "value",
      onValueChange: "callback",
      onAction: "callback",
      open: "boolean",
      defaultOpen: "boolean",
      onOpenChange: "callback",
      presentation: "string",
      disabled: "boolean",
      motion: "string",
    } as const,
    state: (options: Options): PickerBaseState => ({
      ...popupState(options),
      ...presentation(options),
      value: options.value ?? options.defaultValue ?? null,
      query: "",
      pages: [],
    }),
    sync: (options: Options): Partial<PickerBaseState> => ({
      ...presentation(options),
      ...(options.open === undefined ? {} : { open: options.open }),
      ...(options.value === undefined ? {} : { value: options.value }),
    }),
    controlled: ["open", "value"] as ("open" | "value")[],
    api: (context: PrimitiveContext<Options, PickerBaseState, string>): PickerBaseApi => {
      const { store } = context;
      // `createChange` reads reasons from the options type, which a generic `Options` hides.
      const typed = context as unknown as PrimitiveContext<PickerBaseOptions, PickerBaseState, string>;
      const popup = createPopup<PickerBaseOptions, PickerBaseState, typeof popoverPreset>(
        { ...typed, options: () => withAutoPresentation(typed.options()) },
        { preset: popoverPreset },
      );
      const change = createChange(typed);
      const controller = createCommandController();

      // A list opens on its first page with an empty search. React mounts a new Command each time; a web one stays.
      let wasOpen = store.get().open;
      store.subscribe(() => {
        const { open } = store.get();
        if (open && !wasOpen) {
          // The controller reads `undefined` until a Command attaches it.
          if (controller.getPages()?.length) controller.setPages([]);
          if (controller.getQuery()) controller.setQuery("");
          store.set({ query: "", pages: [] });
        }
        wasOpen = open;
      });

      const close = (event: Event | undefined) =>
        popup.setOpen(false, event ? { reason: "item-press", event } : { reason: "item-press" });

      const setValue = (value: string, event?: Event) => {
        const state = store.get();
        const item = leafOf(state, value);
        if (!item || item.disabled || state.disabled) return false;
        if (value === state.value) return true;
        return change("value", value, event ? { reason: "item-press", event } : { reason: "imperative" });
      };

      const run = (id: string, event?: Event) => {
        const state = store.get();
        if (!state.canRun || state.disabled || !state.actions.some((action) => action.id === id))
          return false;
        const canceled = dispatch(
          context,
          "onAction",
          id,
          event ? { reason: "item-press", event } : { reason: "imperative" },
        );
        if (!canceled && event) close(event);
        return !canceled;
      };

      const onAction = (key: string, { event }: CommandActionDetails) => {
        const kind = keyKind(key);
        const value = keyValue(key);
        if (kind === "back") controller.pop();
        else if (kind === "action") run(value, event);
        // A row with `items` opens its page, which Command does.
        // A choice the owner refuses keeps the list open, as a canceled action does.
        else if (setValue(value, event)) close(event);
      };
      const onQueryChange = (query: string) => store.set({ query });
      const onPagesChange = (pages: string[]) => store.set({ pages: pages.map(keyValue) });

      const pages = memo(
        (
          items: PickerItem<unknown>[],
          actions: PickerAction<unknown>[],
          value: string | null,
          backLabel: string,
        ) => pickerPages(items, actions, { chosen: value, check, backLabel }),
      );
      const rows = memo((all: PickerPage[]) => {
        const byKey = new Map<string, PickerRow>();
        for (const page of all)
          for (const section of page.sections)
            for (const row of section.rows) byKey.set(row.option.value, row);
        return byKey;
      });
      const pagesOf = (state: PickerBaseState) =>
        pages(state.items, state.actions, state.value, state.backLabel);

      const commandState = memo(
        (all: PickerPage[], label: string, placeholder: string, emptyText: string): PickerCommandState => ({
          props: { controller, filter: "fuzzy", autoHighlight: true, onAction, onQueryChange, onPagesChange },
          label,
          placeholder,
          emptyText,
          pages: all,
        }),
      );

      // Rows are rebuilt when the items or the choice change, so a row's state is kept while its marks stay the same.
      const items = new WeakMap<PickerRow, { marks: string; state: PickerItemState }>();
      const itemState = (row: PickerRow, query: string, value: string | null): PickerItemState => {
        const description =
          row.description && query && !fuzzyScore(row.label, query)
            ? matchSegments(row.description, matchRanges(row.description, query, "fuzzy"))
            : row.description
              ? [{ text: row.description, match: false }]
              : [];
        const marks = JSON.stringify(description);
        const last = items.get(row);
        if (last?.marks === marks) return last.state;
        const state = {
          row,
          description,
          chosen: check && row.kind === "item" && row.value === value,
          check,
        };
        items.set(row, { marks, state });
        return state;
      };

      const triggerState = memo((item: PickerItem<unknown> | undefined, label: string) => ({
        text: item?.label ?? label,
        icon: item?.icon,
        chosen: item !== undefined,
      }));

      // Command fires each on `ui-command`, which carries the new value in `detail.value`.
      const composedEvents: Record<string, ComposedHandler> = {
        action: (detail, event) => {
          if ((event.target as Element).localName !== "ui-command") return;
          const { value, event: cause } = detail as { value: string; event?: Event };
          onAction(value, cause ? { event: cause } : {});
        },
        querychange: (detail, event) => {
          if ((event.target as Element).localName === "ui-command")
            onQueryChange((detail as { value: string }).value);
        },
        pageschange: (detail, event) => {
          if ((event.target as Element).localName === "ui-command")
            onPagesChange((detail as { value: string[] }).value);
        },
      };

      return {
        ...popup,
        get open() {
          const { open, disabled } = store.get();
          return open || disabled ? undefined : () => popup.setOpen(true);
        },
        get close() {
          return store.get().open ? () => popup.setOpen(false) : undefined;
        },
        getValue: () => store.get().value,
        get setValue() {
          return store.get().disabled ? undefined : (value: string) => setValue(value);
        },
        get run() {
          const { canRun, disabled } = store.get();
          return canRun && !disabled ? (id: string) => run(id) : undefined;
        },
        getChoices: () => {
          const state = store.get();
          return [
            ...pickerLeaves(state.items).map(({ value, label, disabled }) => ({ value, label, disabled })),
            ...(state.canRun ? state.actions.map(({ id, label }) => ({ value: id, label })) : []),
          ];
        },
        triggerState: (state) => triggerState(leafOf(state, state.value), state.label),
        name: (state) => {
          const item = leafOf(state, state.value);
          return item ? `${state.label}, ${item.label}` : state.label;
        },
        commandState: (state) =>
          commandState(pagesOf(state), state.label, state.placeholder, state.emptyText),
        itemState: (state, key) => {
          const row = rows(pagesOf(state)).get(key);
          return row && itemState(row, state.query, state.value);
        },
        composedEvents,
      };
    },
    slots: <State extends PickerBaseState, Api extends PickerBaseApi>(
      slot: SlotFactory<State, Api>,
    ): PickerBaseSlots<State, Api> => {
      const trigger = popupTrigger(slot);
      const content = popupContent(slot);
      return {
        root: slot({
          role: "group",
          attrs: (state, { api }) => ({
            "aria-label": api.name(state),
            "data-kind": config.kind,
            "data-picker-part": "root",
            "data-open": state.open ? "" : undefined,
            "data-disabled": state.disabled ? "" : undefined,
            "data-motion": state.motion,
          }),
        }),
        trigger: slot<PopupTriggerProps & BaseSlotProps, PickerTriggerState>({
          ...trigger,
          state: (state, part) => ({
            ...(trigger.state?.(state, part) as PopupTriggerState),
            ...part.api.triggerState(state),
          }),
          attrs: (state, part) => ({
            ...trigger.attrs?.(state, part),
            type: "button",
            "aria-label": part.api.name(state),
            "data-picker-part": "trigger",
          }),
        }),
        content: slot<PopupContentProps & BaseSlotProps, PopupContentState>({
          ...content,
          attrs: (state, part) => ({
            ...content.attrs?.(state, part),
            "data-picker-part": "content",
            "data-motion": state.motion,
          }),
        }),
        // The full-screen element the content sits in while it presents as a sheet: render it around the content then.
        viewport: popupViewport(slot),
        command: slot<BaseSlotProps, PickerCommandState>({
          state: (state, { api }) => api.commandState(state),
          attrs: () => ({ "data-picker-part": "command" }),
          bind: (el, { api }) => hearComposed(el, api.composedEvents),
        }),
        item: slot<BaseSlotProps & { value?: string }, PickerItemState>({
          props: { value: "string" },
          state: (state, { api, props }) => api.itemState(state, props.value ?? "") as PickerItemState,
          attrs: (state, { api, props }) => {
            const item = api.itemState(state, props.value ?? "");
            return {
              "data-picker-part": "item",
              "data-row": item?.row.kind,
              "data-chosen": item?.chosen ? "" : undefined,
              "data-opens": item?.row.opens ? "" : undefined,
            };
          },
        }),
      };
    },
    agent: {
      actions: ["open", "close", "setValue", "run"],
      items: (api: PickerBaseApi) => api.getChoices(),
      closed: true,
    },
  };
};
