import {
  animateIn,
  animateOut,
  bindLayer,
  type ChangeDetails,
  createFocusRecovery,
  definePrimitive,
  dispatch,
  type LayerDismissReason,
  position,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { SelectionActionItem } from "../../types/index.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";

/** `"item-press"`: a person pressed an action. `"imperative"`: an `api` call, like an agent's `run`. */
export type SelectionActionReason = "item-press" | "imperative";

/** Why the toolbar was dismissed: Escape, a press outside the root, or a `dismiss` call. */
export type SelectionDismissReason = Exclude<LayerDismissReason, "window-blur"> | "imperative";

/** What `onAction` gets: the chosen action's `id` and the text selected when it was chosen. */
export type SelectionActionRun = { actionId: string; text: string };

export type SelectionOptions = {
  /**
   * What the toolbar offers, in order.
   * @default []
   */
  actions?: SelectionActionItem[];
  /**
   * Names the selection's root and its toolbar.
   * @default "Selection actions"
   */
  label?: string;
  /**
   * Called when a person or `run` chooses an action, then the toolbar hides. Without it the actions can't be chosen.
   * Cancel it to keep the toolbar.
   */
  onAction?: (run: SelectionActionRun, details: ChangeDetails<SelectionActionReason>) => void;
  /**
   * Called with the selected text when Escape, a press outside or `dismiss` hides the toolbar. The selection stays.
   * Cancel it to keep the toolbar.
   */
  onDismiss?: (text: string, details: ChangeDetails<SelectionDismissReason>) => void;
  /**
   * How the toolbar comes and goes: at full motion it rises in and sinks out; reduced motion only fades.
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type SelectionState = {
  /** The `actions`. */
  actions: SelectionActionItem[];
  /** The `actions` by `id`. */
  actionsById: Record<string, SelectionActionItem>;
  /** The `label`, else "Selection actions". */
  label: string;
  /** Whether `onAction` is set. */
  canRun: boolean;
  /** The `motion` option. */
  motion: MotionMode;
  /** Whether the toolbar shows. */
  open: boolean;
  /** The text selected inside the content while the toolbar shows. */
  text: string;
  /** Whether the toolbar is still leaving after it closed. */
  exiting: boolean;
};

type ItemProps = { value: string };

export type SelectionApi = {
  /** The `actions`. */
  getActions: () => SelectionActionItem[];
  /**
   * Chooses an action by its `id` for the selected text, as a press would. Returns `false` for an unknown one or
   * when the host cancels. Offered only while the toolbar shows and `onAction` is set.
   */
  readonly run: ((actionId: string) => boolean) | undefined;
  /** Hides the toolbar and keeps the selection. Offered only while the toolbar shows. Returns whether it hid. */
  readonly dismiss: (() => boolean) | undefined;
  /** Reads the page's selection after a press or a key. Called by the root slot. */
  read: (event: Event) => void;
  /** Chooses an action a person pressed. Called by the item slot. */
  press: (actionId: string, event: Event) => void;
  /** Places, layers and animates the toolbar while it's present. Called by the toolbar slot. */
  bindToolbar: (el: HTMLElement, part: { key: string; props: BaseSlotProps }) => () => void;
};

/** What the toolbar hands its render function. */
export type SelectionToolbarState = {
  /** The `label`, which names the Toolbar. */
  label: string;
  /** The `actions` to draw, one item each. */
  actions: SelectionActionItem[];
};

/** What an item hands its render function. */
export type SelectionItemState = {
  /** The action's `label`, the button's text. */
  label: string;
  /** The action's `description`, the button's tooltip when set. */
  description: string | undefined;
  /** Whether `onAction` is set. Without it the button is disabled. */
  canRun: boolean;
};

type Slot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<SelectionState, SelectionApi, Props, Public>;

type SelectionSlots = {
  root: Slot;
  content: Slot;
  toolbar: Slot<BaseSlotProps, SelectionToolbarState>;
  item: Slot<ItemProps & BaseSlotProps, SelectionItemState>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type SelectionPrimitive = ReturnType<
  typeof definePrimitive<SelectionOptions, SelectionState, SelectionApi, SelectionSlots>
>;

const NO_ACTIONS: SelectionActionItem[] = [];

const byId = memo((actions: SelectionActionItem[]) =>
  Object.fromEntries(actions.map((action) => [action.id, action])),
);
const actionOf = (state: SelectionState, id: string) =>
  Object.hasOwn(state.actionsById, id) ? state.actionsById[id] : undefined;

const presentation = ({ actions = NO_ACTIONS, label, onAction, motion }: SelectionOptions) => ({
  actions,
  actionsById: byId(actions),
  label: label ?? "Selection actions",
  canRun: onAction !== undefined,
  motion: motion ?? "auto",
});

/** The page's selection when it's one range lying wholly inside `content` and holds more than whitespace. */
const selectionIn = (content: Element): { range: Range; text: string } | undefined => {
  const selection = content.ownerDocument.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount !== 1) return undefined;
  const range = selection.getRangeAt(0);
  const text = selection.toString();
  if (!text.trim() || !content.contains(range.startContainer) || !content.contains(range.endContainer)) {
    return undefined;
  }
  // A copy, which keeps following its text as the page scrolls or the selection moves on.
  return { range: range.cloneRange(), text };
};

const sameRange = (a: Range, b: Range) =>
  a.compareBoundaryPoints(Range.START_TO_START, b) === 0 &&
  a.compareBoundaryPoints(Range.END_TO_END, b) === 0;

export const selectionPrimitive: SelectionPrimitive = definePrimitive<
  SelectionOptions,
  SelectionState,
  SelectionApi,
  SelectionSlots
>({
  name: "kind-selection",
  options: {
    actions: "value",
    label: "string",
    onAction: "callback",
    onDismiss: "callback",
    motion: "string",
  },
  state: (options) => ({ ...presentation(options), open: false, text: "", exiting: false }),
  sync: presentation,
  controlled: ["open", "text"],
  api: (context) => {
    const { store } = context;
    // The selection the toolbar is placed against.
    let range: Range | undefined;
    // The selection the toolbar closed on while it stayed selected (Escape, a press outside, an action), so the key
    // or press that closed it doesn't open it again.
    let settled: Range | undefined;

    const close = () => {
      settled = range;
      store.set({ open: false, exiting: context.element("toolbar") !== null });
    };

    const dismiss = (reason: SelectionDismissReason, event?: Event) => {
      if (!store.get().open) return false;
      if (dispatch(context, "onDismiss", store.get().text, event ? { reason, event } : { reason }))
        return false;
      close();
      return true;
    };

    const run = (actionId: string, event?: Event) => {
      const state = store.get();
      if (!state.open || !state.canRun || !actionOf(state, actionId)) return false;
      const cancelled = dispatch(
        context,
        "onAction",
        { actionId, text: state.text },
        event ? { reason: "item-press", event } : { reason: "imperative" },
      );
      if (cancelled) return false;
      close();
      return true;
    };

    const recovery = createFocusRecovery({ fallback: () => context.element("content") });

    return {
      getActions: () => store.get().actions,
      get run() {
        const { open, canRun } = store.get();
        return open && canRun ? (actionId: string) => run(actionId) : undefined;
      },
      get dismiss() {
        return store.get().open ? () => dismiss("imperative") : undefined;
      },
      read: (event) => {
        const content = context.element("content");
        if (
          !content ||
          (event.target instanceof Node && context.element("toolbar")?.contains(event.target))
        ) {
          return;
        }
        const selected = selectionIn(content);
        if (!selected) {
          settled = undefined;
          if (store.get().open) close();
          return;
        }
        if (settled && sameRange(settled, selected.range)) return;
        settled = undefined;
        range = selected.range;
        if (store.get().actions.length > 0) store.set({ open: true, text: selected.text, exiting: false });
      },
      press: (actionId, event) => void run(actionId, event),
      bindToolbar: (el, part) => {
        const unbindLayer = bindLayer(el, {
          topLayer: true,
          // A press inside the root reads the selection instead: a new one moves the toolbar, none hides it.
          contains: (target) => !!context.element("root")?.contains(target),
          onDismiss: (reason, event) => {
            if (reason !== "window-blur") dismiss(reason, event);
          },
        });
        const placement = position(() => range, el, { side: "top", sideOffset: 8, collisionPadding: 8 });
        // Unbound as it starts leaving, while it still holds focus, so focus moves to the content before the exit
        // makes it inert.
        let unbindRecovery = recovery.bind(el, part);
        let leaving = false;
        let stop = animateIn(el);
        const follow = () => {
          const { open } = store.get();
          if (open !== leaving) return;
          leaving = !open;
          stop();
          if (!leaving) {
            unbindRecovery = recovery.bind(el, part);
            stop = animateIn(el);
            return;
          }
          unbindRecovery();
          unbindRecovery = () => {};
          stop = animateOut(el, () => store.set({ exiting: false }));
        };
        // It may bind closed and still leaving, as when a web element is put back.
        follow();
        const unsubscribe = store.subscribe(follow);
        return () => {
          unsubscribe();
          stop();
          unbindRecovery();
          placement();
          unbindLayer();
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "group",
      attrs: (state) => ({ "aria-label": state.label, "data-motion": state.motion }),
      on: {
        pointerup: (event, { api }) => api.read(event),
        keyup: (event, { api }) => api.read(event),
      },
    }),
    // A tab stop, so a keyboard selection starts inside the root and Tab moves from it to the toolbar.
    content: slot({
      focus: "tab-stop",
      attrs: () => ({ tabindex: "0" }),
    }),
    toolbar: slot<BaseSlotProps, SelectionToolbarState>({
      present: (state) => state.open || state.exiting,
      state: (state) => ({ label: state.label, actions: state.actions }),
      attrs: (state) => ({ "data-motion": state.motion }),
      // A press keeps the selection and focus where they are.
      on: { mousedown: (event) => event.preventDefault() },
      bind: (el, part) => part.api.bindToolbar(el, part),
    }),
    // Wraps a Toolbar button and hears its click bubble up, as Message's actions do.
    item: slot<ItemProps & BaseSlotProps, SelectionItemState>({
      props: { value: "string" },
      state: (state, { key }) => ({
        label: actionOf(state, key)?.label ?? "",
        description: actionOf(state, key)?.description,
        canRun: state.canRun,
      }),
      on: { click: (event, { api, key }) => api.press(key, event) },
    }),
  }),
  agent: {
    actions: ["run", "dismiss"],
    items: (api: SelectionApi) =>
      api.getActions().map((action) => ({ value: action.id, label: action.label })),
    closed: true,
  },
});
