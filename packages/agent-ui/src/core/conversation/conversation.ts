import {
  type ActionDetails,
  announce,
  createController,
  createFocusRecovery,
  createStickToBottom,
  createVirtualizer,
  css,
  type FocusRecovery,
  type SlotDefinition,
  type StickToBottom,
  selects,
  type VirtualItem,
  type Virtualizer,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { actionSource } from "../action-source.js";
import { definePrimitive } from "../define-primitive.js";
import { enter, exit, type MotionMode, resolveMotion } from "../motion/index.js";
import { createPendingAction } from "../pending.js";
import { nextFollowState } from "./follow.js";

export type ConversationController = {
  /** Scrolls to the newest message and follows new content again. */
  scrollToEnd: () => void;
  /** Call right before adding older messages above: the next `messageCount` increase keeps the reader's place and isn't counted as new. */
  prepend: () => void;
  /** Whether new content scrolls into view. */
  isFollowing: () => boolean;
  /** The rows to render now, with `virtualize`. */
  getRows: () => readonly VirtualItem[];
  /**
   * Scrolls the message at `index` to the middle of the view and stops following. Virtualized, through
   * `createVirtualizer`, which renders it first; else the row's `scrollIntoView`. Smooth only at full motion.
   */
  scrollToIndex: (index: number) => void;
  /** The rendered row of the message at `index`, or `undefined` while it isn't rendered. */
  rowElement: (index: number) => HTMLElement | undefined;
  /** Calls `listener` after the rendered rows or anything in them changes, until the returned function runs. */
  observe: (listener: () => void) => () => void;
};

/** A handle for the `controller` option, to scroll and read a conversation from outside it. */
export const createConversationController = (): ConversationController =>
  createController<ConversationController>();

/** What the conversation shows in its rows' place: its messages, a skeleton while loading, or an error. */
export type ConversationStatus = "ready" | "loading" | "error";

const STATUSES: readonly ConversationStatus[] = ["ready", "loading", "error"];

/** What `onRetry` gets: `"retry-press"` for Retry, `"imperative"` for the api and agents, and who caused it. */
export type ConversationRetryDetails = ActionDetails & { reason: "retry-press" | "imperative" };

export type ConversationOptions = {
  /**
   * How many messages the conversation holds. Drives the new-message count, the empty part and virtualization.
   * @default 0
   */
  messageCount?: number;
  /**
   * Renders only the rows in view, with `createVirtualizer`. Read once, when the conversation mounts.
   * @default false
   */
  virtualize?: boolean;
  /**
   * A row's height before it is measured, in pixels, with `virtualize`.
   * @default 120
   */
  estimateRowHeight?: number;
  /**
   * A stable key for the message at an index, so measured heights follow messages when the list changes, with `virtualize`.
   * @default String(index)
   */
  rowKey?: (index: number) => string;
  /** Called with the rows to render whenever they change, with `virtualize`. */
  onRowsChange?: (rows: readonly VirtualItem[]) => void;
  /** A handle from `createConversationController()`, to scroll and read the conversation from outside it. */
  controller?: ConversationController;
  /**
   * `"loading"` shows the skeleton and `"error"` the error, in the rows' place; the empty part shows only while `"ready"`.
   * Set `messageCount` before `status` turns `"ready"`, so the loaded messages don't play the new-message entrance.
   * @default "ready"
   */
  status?: ConversationStatus;
  /**
   * The error's words, while `status` is `"error"`.
   * @default "Couldn't load this conversation"
   */
  error?: string;
  /**
   * Called when Retry is pressed. Shows Retry while `status` is `"error"`. Return a promise to keep Retry pending
   * until it settles; a rejection gives Retry back. A `status` change while it's pending drops the lock and ignores
   * the late result.
   */
  onRetry?: (details: ConversationRetryDetails) => unknown;
  /**
   * Indexes of messages to mark beside the scrollbar, like a search's matches. Marks closer than 4px merge into one.
   * @default []
   */
  marks?: readonly number[];
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ConversationState = {
  /** The `messageCount` option. */
  messageCount: number;
  /** The `virtualize` option the conversation mounted with. */
  virtualize: boolean;
  /** The `motion` option. */
  motion: MotionMode;
  /** The `status` option. */
  status: ConversationStatus;
  /** The `error` option, or its default, while `status` is `"error"`; `undefined` otherwise, since agents read a set `error` as a failed action. */
  error: string | undefined;
  /** Whether `onRetry` is set. */
  canRetry: boolean;
  /** Whether a promise `onRetry` returned is still pending. Agents wait on it. */
  pending: boolean;
  /** Whether the error appeared after the conversation mounted, so it's an alert rather than a status. */
  errorAlert: boolean;
  /** Whether new content scrolls into view. Set by `createStickToBottom`; listed in `controlled` for the agent snapshot only. */
  following: boolean;
  /** Messages added while not following. In the agent snapshot too. */
  newCount: number;
  /** Whether the jump control is still animating out after following resumed. */
  jumpExiting: boolean;
  /** The rows to render, with `virtualize`; empty otherwise. */
  rows: readonly VirtualItem[];
  /** The height of every row together, in pixels, with `virtualize`. */
  size: number;
  /** The `marks` option. Not synced, so a new mark renders only the marks. */
  marks: readonly number[];
  /** Where each mark sits, as its 4px step down the track: one per step that holds a marked message. */
  markSteps: readonly number[];
  /** The height of the marks' track, in pixels. */
  trackHeight: number;
};

export type ConversationApi = ConversationController & {
  /** Follows the viewport's end, for its slot. */
  stick: StickToBottom;
  /** Picks the rows in view with `virtualize`, for the viewport and row slots. */
  virtual: Virtualizer;
  /** Moves focus to the viewport when a focused row or the jump control leaves. */
  recovery: FocusRecovery;
  /** Plays the mount-only entrance on a row that wasn't rendered before, and keeps it for `rowElement`. */
  bindRow: (el: HTMLElement, index: number) => () => void;
  /** Watches the content for `observe`. Called by the content part. */
  bindContent: (el: HTMLElement) => () => void;
  /** Measures the marks' track and places the marks. Called by the marks part. */
  bindMarks: (el: HTMLElement) => () => void;
  /** Calls `onRetry`. Offered while `status` is `"error"`, `onRetry` is set and no retry is pending. */
  readonly retry: ((event?: Event) => void) | undefined;
};

type RowProps = { value: string; index: number };
type MarkProps = { value: string };

type ConversationSlot<Props extends object, Public extends object = Record<never, never>> = SlotDefinition<
  ConversationState,
  ConversationApi,
  Props,
  Public
>;

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ConversationPrimitive = ReturnType<
  typeof definePrimitive<
    ConversationOptions,
    ConversationState,
    ConversationApi,
    {
      root: ConversationSlot<BaseSlotProps>;
      viewport: ConversationSlot<BaseSlotProps>;
      content: ConversationSlot<BaseSlotProps, { rows: readonly VirtualItem[] }>;
      row: ConversationSlot<RowProps & BaseSlotProps>;
      jump: ConversationSlot<BaseSlotProps>;
      empty: ConversationSlot<BaseSlotProps>;
      "empty-title": ConversationSlot<BaseSlotProps>;
      "empty-description": ConversationSlot<BaseSlotProps>;
      skeleton: ConversationSlot<BaseSlotProps>;
      loading: ConversationSlot<BaseSlotProps>;
      error: ConversationSlot<BaseSlotProps>;
      "error-icon": ConversationSlot<BaseSlotProps>;
      "error-text": ConversationSlot<BaseSlotProps, { error: string }>;
      retry: ConversationSlot<BaseSlotProps, { retrying: boolean }>;
      marks: ConversationSlot<BaseSlotProps, { marks: readonly number[] }>;
      mark: ConversationSlot<MarkProps & BaseSlotProps>;
    }
  >
>;

const newMessages = (count: number) => `${count} new message${count === 1 ? "" : "s"}`;

const statusOf = (options: ConversationOptions): ConversationStatus =>
  options.status && STATUSES.includes(options.status) ? options.status : "ready";

const presentation = (options: ConversationOptions) => ({
  messageCount: options.messageCount ?? 0,
  motion: options.motion ?? "auto",
  status: statusOf(options),
  error: statusOf(options) === "error" ? (options.error ?? "Couldn't load this conversation") : undefined,
  canRetry: options.onRetry !== undefined,
});

const isEmpty = (state: ConversationState) => state.status === "ready" && state.messageCount === 0;

const prefersReduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Marks closer than this, in pixels, merge into one. */
const MARK_STEP = 4;
const NO_MARKS: readonly number[] = [];

const sameNumbers = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/** The 4px steps down a track of `height` that the marks at `positions` (0 to 1) fall on, each once, in order. */
const markSteps = (positions: readonly number[], height: number) => {
  const last = Math.max(Math.floor(height / MARK_STEP) - 1, 0);
  const steps = new Set(positions.map((at) => Math.min(Math.floor((at * height) / MARK_STEP), last)));
  return [...steps].sort((a, b) => a - b);
};

// The marks don't reach the rows, the viewport or the other parts, so a search renders only the marks.
const outsideMarks = <Props extends object>() =>
  selects<ConversationState, ConversationApi, Props>({ marks: [], markSteps: [], trackHeight: [] });

const outsideRows = <Props extends object>() =>
  selects<ConversationState, ConversationApi, Props>({
    marks: [],
    rows: [],
    size: [],
    following: [],
    newCount: [],
    jumpExiting: [],
    pending: [],
  });

export const conversationPrimitive: ConversationPrimitive = definePrimitive({
  name: "kind-conversation",
  options: {
    messageCount: "number",
    virtualize: "boolean",
    estimateRowHeight: "number",
    rowKey: "value",
    onRowsChange: "callback",
    controller: "value",
    motion: "string",
    status: "string",
    error: "string",
    onRetry: "action",
    marks: "value",
  },
  state: (options: ConversationOptions): ConversationState => ({
    ...presentation(options),
    virtualize: options.virtualize ?? false,
    following: true,
    newCount: 0,
    jumpExiting: false,
    pending: false,
    errorAlert: false,
    rows: [],
    size: 0,
    marks: options.marks ?? NO_MARKS,
    markSteps: NO_MARKS,
    trackHeight: 0,
  }),
  sync: presentation,
  controlled: ["following", "newCount"],
  api: (context): ConversationApi => {
    const { store } = context;
    let follow = { following: true, newCount: 0, count: store.get().messageCount };
    // Rows up to this index have entered already, so a row that remounts (virtualized, or re-rendered) stays still.
    let newestEntered = follow.count - 1;
    let prepending = false;
    let status = store.get().status;

    const apply = (next: typeof follow) => {
      const wasFollowing = follow.following;
      const announced = !next.following && next.newCount > follow.newCount;
      follow = next;
      store.set({
        following: next.following,
        newCount: next.newCount,
        ...(next.following && !wasFollowing && context.element("jump") ? { jumpExiting: true } : {}),
      });
      if (announced) announce(newMessages(next.newCount), { priority: "polite" });
    };

    const stick = createStickToBottom({
      onChange: ({ following }) => {
        if (following !== follow.following) apply(nextFollowState(follow, { type: "following", following }));
      },
    });

    const virtual = createVirtualizer({
      count: () => context.options().messageCount ?? 0,
      estimate: () => context.options().estimateRowHeight ?? 120,
      key: (index) => context.options().rowKey?.(index) ?? String(index),
    });
    virtual.subscribe(() => {
      const rows = virtual.items();
      store.set({ rows, size: virtual.size() });
      context.options().onRowsChange?.(rows);
    });

    const pendingRetry = createPendingAction(context, { state: "pending" });

    const rowElements = new Map<number, HTMLElement>();
    const listeners = new Set<() => void>();
    let content: HTMLElement | undefined;
    let observer: MutationObserver | undefined;
    let resize: ResizeObserver | undefined;
    const notify = () => {
      for (const listener of [...listeners]) listener();
    };
    // Watches the content only while something listens.
    const watch = () => {
      observer?.disconnect();
      observer = undefined;
      if (!content || listeners.size === 0) return;
      observer = new MutationObserver(notify);
      observer.observe(content, { childList: true, subtree: true, characterData: true });
    };

    const placeMarks = () => {
      const { marks, trackHeight, virtualize, messageCount } = store.get();
      let positions: number[] = [];
      if (trackHeight > 0 && marks.length > 0) {
        // `createVirtualizer` has no offset for a row it hasn't rendered, so a virtualized mark sits at its index.
        if (virtualize) positions = marks.map((index) => index / Math.max(messageCount, 1));
        else {
          const box = content?.getBoundingClientRect();
          positions = marks.flatMap((index) => {
            const row = rowElements.get(index);
            return row && box && box.height > 0
              ? [(row.getBoundingClientRect().top - box.top) / box.height]
              : [];
          });
        }
      }
      const steps = positions.length > 0 ? markSteps(positions, trackHeight) : NO_MARKS;
      if (!sameNumbers(steps, store.get().markSteps)) store.set({ markSteps: steps });
    };
    let placed = { marks: store.get().marks, trackHeight: 0, messageCount: store.get().messageCount };
    store.subscribe(() => {
      const { marks, trackHeight, messageCount } = store.get();
      if (
        marks === placed.marks &&
        trackHeight === placed.trackHeight &&
        messageCount === placed.messageCount
      )
        return;
      placed = { marks, trackHeight, messageCount };
      placeMarks();
    });

    context.onOptions((options) => {
      const marks = options.marks ?? NO_MARKS;
      if (!sameNumbers(marks, store.get().marks)) store.set({ marks });
      const count = options.messageCount ?? 0;
      const next = statusOf(options);
      const loaded = next === "ready" && status !== "ready";
      if (next !== status) {
        status = next;
        pendingRetry.release();
        if (next === "error") store.set({ errorAlert: true });
      }
      if (count !== follow.count) {
        if (prepending) {
          prepending = false;
          newestEntered += count - follow.count;
          follow = nextFollowState(follow, { type: "prepend", count });
        } else {
          newestEntered = Math.min(newestEntered, count - 1);
          apply(nextFollowState(follow, { type: "count", count }));
        }
        if (store.get().virtualize) virtual.refresh();
      }
      // Messages that arrive while loading, or with the load, are history: they don't play the entrance.
      if (next !== "ready" || loaded) newestEntered = Math.max(newestEntered, count - 1);
    });

    const recovery = createFocusRecovery({ fallback: () => context.element("viewport") });

    const retry = (event?: Event) => {
      const { onRetry } = context.options();
      if (!onRetry) return;
      const reason = event ? "retry-press" : "imperative";
      pendingRetry.run(() => onRetry({ reason, source: actionSource(event, reason) }));
    };

    return {
      scrollToEnd: () => {
        const instant = resolveMotion(store.get().motion, prefersReduced()) !== "full";
        stick.scrollToBottom({ behavior: instant ? "instant" : "smooth" });
      },
      prepend: () => {
        prepending = true;
        stick.prepend();
      },
      isFollowing: () => store.get().following,
      getRows: () => store.get().rows,
      scrollToIndex: (index) => {
        const behavior =
          resolveMotion(store.get().motion, prefersReduced()) === "full" ? "smooth" : "instant";
        stick.release();
        if (store.get().virtualize) virtual.scrollToIndex(index, { align: "center", behavior });
        else rowElements.get(index)?.scrollIntoView({ block: "center", behavior });
      },
      rowElement: (index) => rowElements.get(index),
      observe: (listener) => {
        listeners.add(listener);
        if (!observer) watch();
        return () => {
          listeners.delete(listener);
          if (listeners.size === 0) watch();
        };
      },
      stick,
      virtual,
      recovery,
      bindRow: (el, index) => {
        rowElements.set(index, el);
        // A row can bind after its element went in, which the content's observer saw before it.
        notify();
        // A React row binds before its root takes the options that added it, so a load is known a microtask later.
        queueMicrotask(() => {
          if (index <= newestEntered) return;
          newestEntered = index;
          void enter(el, "fade-up", { motion: store.get().motion });
        });
        return () => {
          if (rowElements.get(index) === el) rowElements.delete(index);
          notify();
        };
      },
      bindContent: (el) => {
        content = el;
        watch();
        if (resize && !store.get().virtualize) resize.observe(el);
        return () => {
          content = undefined;
          watch();
        };
      },
      bindMarks: (el) => {
        const measure = () => {
          store.set({ trackHeight: el.clientHeight });
          if (!store.get().virtualize) placeMarks();
        };
        const observer = new ResizeObserver(measure);
        resize = observer;
        observer.observe(el);
        // Unvirtualized marks sit at their rows, which move as the content grows.
        if (!store.get().virtualize && content) observer.observe(content);
        return () => {
          observer.disconnect();
          if (resize === observer) resize = undefined;
          store.set({ trackHeight: 0 });
        };
      },
      get retry() {
        const { canRetry, pending, status } = store.get();
        return canRetry && status === "error" && !pending ? retry : undefined;
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "log",
      selects: outsideMarks(),
      attrs: (state) => ({
        "aria-live": "polite",
        "data-following": state.following ? "" : undefined,
        "data-virtualize": state.virtualize ? "" : undefined,
        "data-status": state.status === "ready" ? undefined : state.status,
      }),
    }),
    viewport: slot({
      selects: outsideMarks(),
      // A tab stop, so the keyboard can scroll it in every browser, as UI SDK Scroll Area's viewport is.
      focus: "tab-stop",
      attrs: (state) => ({ tabindex: "0", "data-following": state.following ? "" : undefined }),
      bind: (el, { api, store }) => {
        const disconnectStick = api.stick.connect(el);
        if (!store.get().virtualize) return disconnectStick;
        const disconnectVirtual = api.virtual.connect(el);
        return () => {
          disconnectVirtual();
          disconnectStick();
        };
      },
    }),
    content: slot<BaseSlotProps, { rows: readonly VirtualItem[] }>({
      selects: outsideMarks(),
      state: (state) => ({ rows: state.rows }),
      attrs: (state) => ({
        "data-virtualize": state.virtualize ? "" : undefined,
        "data-status": state.status === "ready" ? undefined : state.status,
        "data-empty": isEmpty(state) ? "" : undefined,
        style: css({ "--kind-conversation-size": state.virtualize ? `${state.size}px` : undefined }),
      }),
      bind: (el, { api }) => api.bindContent(el),
    }),
    row: slot<RowProps>({
      props: { value: "string", index: "number" },
      selects: outsideMarks(),
      attrs: (state, { props }) => {
        const start = state.virtualize
          ? state.rows.find((row) => row.index === props.index)?.start
          : undefined;
        return {
          "data-virtualize": state.virtualize ? "" : undefined,
          // The last message shows its actions without a hover.
          "data-last": props.index === state.messageCount - 1 ? "" : undefined,
          style: css({ "--kind-conversation-row-start": start === undefined ? undefined : `${start}px` }),
        };
      },
      bind: (el, part) => {
        const { api, props, store } = part;
        const unbindRow = api.bindRow(el, props.index);
        const unmeasure = store.get().virtualize ? api.virtual.measure(props.index, el) : undefined;
        const unbindRecovery = api.recovery.bind(el, part);
        return () => {
          unbindRow();
          unmeasure?.();
          unbindRecovery();
        };
      },
    }),
    jump: slot({
      selects: outsideMarks(),
      role: "button",
      focus: "native",
      press: ({ api }) => api.scrollToEnd(),
      present: (state) => !state.following || state.jumpExiting,
      attrs: (state) => ({
        type: "button",
        "aria-label":
          state.newCount > 0 ? `Jump to latest, ${newMessages(state.newCount)}` : "Jump to latest",
        // `announce` reads the count once; the log would read the button's text again.
        "aria-live": "off",
        "data-kind-button": "secondary",
      }),
      bind: (el, part) => {
        const { store } = part;
        const motion = () => ({ motion: store.get().motion });
        let leaving = false;
        const render = () => {
          const { following, newCount } = store.get();
          const text = newCount > 0 ? newMessages(newCount) : "Jump to latest";
          if (el.textContent !== text) el.textContent = text;
          if (following === leaving) return;
          leaving = following;
          if (!leaving) {
            void enter(el, "fade-up", motion());
            return;
          }
          exit(el, "fade-up", motion()).then(
            () => store.set({ jumpExiting: false }),
            () => {},
          );
        };
        void enter(el, "fade-up", motion());
        render();
        const unsubscribe = store.subscribe(render);
        const unbindRecovery = part.api.recovery.bind(el, part);
        return () => {
          unsubscribe();
          unbindRecovery();
        };
      },
    }),
    empty: slot({ present: isEmpty }),
    "empty-title": slot({}),
    "empty-description": slot({}),
    skeleton: slot({
      present: (state) => state.status === "loading",
      attrs: (state) => ({ "aria-hidden": "true", "data-motion": state.motion }),
    }),
    loading: slot({
      role: "status",
      present: (state) => state.status === "loading",
    }),
    error: slot({
      // An error the page loaded with is a status; one that appears later is an alert.
      role: (state) => (state.errorAlert ? "alert" : "status"),
      roles: ["alert", "status"],
      present: (state) => state.status === "error",
    }),
    "error-icon": slot({
      attrs: (state) => ({
        "aria-hidden": "true",
        "data-status-mark": "",
        "data-status": "error",
        "data-motion": state.motion,
      }),
    }),
    "error-text": slot<BaseSlotProps, { error: string }>({
      state: (state) => ({ error: state.error ?? "" }),
    }),
    retry: slot<BaseSlotProps, { retrying: boolean }>({
      role: "button",
      focus: "native",
      press: ({ api }, event) => api.retry?.(event),
      present: (state) => state.status === "error" && state.canRetry,
      state: (state) => ({ retrying: state.pending }),
      attrs: (state) => ({
        type: "button",
        "aria-disabled": state.pending ? "true" : undefined,
        "data-pending": state.pending ? "" : undefined,
        "data-kind-button": "secondary",
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    marks: slot<BaseSlotProps, { marks: readonly number[] }>({
      selects: outsideRows(),
      state: (state) => ({ marks: state.markSteps }),
      attrs: () => ({ "aria-hidden": "true" }),
      bind: (el, { api }) => api.bindMarks(el),
    }),
    mark: slot<MarkProps>({
      props: { value: "string" },
      selects: selects<ConversationState, ConversationApi, MarkProps>({
        marks: [],
        markSteps: [],
        rows: [],
        size: [],
        following: [],
        newCount: [],
        jumpExiting: [],
        pending: [],
      }),
      attrs: (state, { props }) => ({
        style: css({
          "--kind-conversation-mark":
            state.trackHeight > 0 ? String((Number(props.value) * MARK_STEP) / state.trackHeight) : undefined,
        }),
      }),
    }),
  }),
  agent: { actions: ["scrollToEnd", "retry"] },
});
