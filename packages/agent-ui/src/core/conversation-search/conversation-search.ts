import {
  animateIn,
  announce,
  type ChangeDetails,
  createChange,
  createFocusRecovery,
  type FocusRecovery,
  isComposing,
  type PrimitiveContext,
  type SlotDefinition,
} from "@ui-sdk/core";
import { createInputController, type InputController } from "@ui-sdk/core/input";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import { registerShortcut } from "@ui-sdk/core/shortcuts";
import type { ConversationController } from "../conversation/index.js";
import { definePrimitive } from "../define-primitive.js";
import { createMarkdownEngine, type MarkdownEngine } from "../markdown/index.js";
import { memo } from "../memo.js";
import type { MotionMode } from "../motion/index.js";
import { clearMatches, paintMatches } from "./highlights.js";
import { type ConversationSearchMatch, rangesOf, searchText } from "./text.js";

/** A message the search reads: its `text` is Markdown, searched as the text it renders. */
export type ConversationSearchMessage = { id: string; text: string };

/** `"input-change"`: typing. `"escape-key"`: Escape cleared it. `"imperative"`: an `api` call, like an agent's. */
export type ConversationSearchQueryChangeReason = "input-change" | "escape-key" | "imperative";

/** `"shortcut"`: the `shortcut` opened it. `"escape-key"` and `"close-press"` closed it. `"imperative"`: an `api` call. */
export type ConversationSearchOpenChangeReason = "shortcut" | "escape-key" | "close-press" | "imperative";

export type ConversationSearchOptions = {
  /**
   * The conversation's messages, in its order, so a match's index is its message's index in the Conversation.
   * @default []
   */
  messages?: ConversationSearchMessage[];
  /** The Conversation's controller, from `createConversationController()`, to scroll to a match and paint it. */
  conversation?: ConversationController;
  /** The search. Passing it controls it: change it in `onQueryChange`. */
  query?: string;
  /**
   * The search at first, when `query` isn't passed.
   * @default ""
   */
  defaultQuery?: string;
  /** Called when the search changes, with why. */
  onQueryChange?: (query: string, details: ChangeDetails<ConversationSearchQueryChangeReason>) => void;
  /** Whether the bar shows. Passing it controls it: change it in `onOpenChange`. */
  open?: boolean;
  /**
   * Whether the bar shows at first, when `open` isn't passed.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called when the bar opens or closes, with why. Opening moves focus to the field; closing moves it back. */
  onOpenChange?: (open: boolean, details: ChangeDetails<ConversationSearchOpenChangeReason>) => void;
  /**
   * Names the search.
   * @default "Search in conversation"
   */
  label?: string;
  /**
   * Keys that open the bar, like `"mod+f"`, through UI SDK's shortcuts. None by default: `"mod+f"` replaces the
   * browser's find, which can't reach messages a virtualized conversation hasn't rendered.
   */
  shortcut?: string;
  /** Called with the indexes of the messages that hold a match whenever they change: pass them to Conversation's `marks`. */
  onMarksChange?: (indexes: readonly number[]) => void;
  /**
   * `"auto"` follows `prefers-reduced-motion`.
   * @default "auto"
   */
  motion?: MotionMode;
};

export type ConversationSearchState = {
  /** The `label`, else "Search in conversation". */
  label: string;
  /** Whether the bar shows. */
  open: boolean;
  /** The search. */
  query: string;
  /** Every match while the bar is open, in the conversation's order. */
  matches: readonly ConversationSearchMatch[];
  /** The index in `matches` of the current match, or -1. */
  current: number;
  /** The indexes of the messages that hold a match, in order. */
  marks: readonly number[];
  /** Whether the search has run. It first runs as the bar binds, since folding text reads the user's language. */
  counted: boolean;
  /** The `motion` option. */
  motion: MotionMode;
};

/** What the input part hands UI SDK Input: pass every key to it. */
export type ConversationSearchInputState = {
  /** The primitive's own, which it reads and writes the search through. */
  controller: InputController;
  /** The search when the Input mounted. */
  defaultValue: string;
  /** Names the field: the `label`. */
  label: string;
  /** The count's id, for the field's `aria-describedby`. */
  describedBy: string;
};

export type ConversationSearchApi = {
  /** Opens the bar and searches for `text`, as typing does. Returns whether it was accepted. */
  search: (text: string) => boolean;
  /** Moves to the next match, after the last back to the first. Only while there are matches. */
  readonly next: (() => void) | undefined;
  /** Moves to the previous match, before the first back to the last. Only while there are matches. */
  readonly previous: (() => void) | undefined;
  /** Closes the bar, keeping the search. Only while it's open. */
  readonly close: (() => void) | undefined;
  /** The search. */
  getQuery: () => string;
  /** Changes the search without opening the bar. Returns whether it was accepted. */
  setQuery: (text: string) => boolean;
  /** Whether the bar shows. */
  isOpen: () => boolean;
  /** Opens or closes the bar. Returns whether it was accepted. */
  setOpen: (open: boolean) => boolean;
  /** "3 of 12", "0 of 0" without a match, or empty without a search. */
  countText: (state: ConversationSearchState) => string;
  /** Hands the Input its props. Called by the input part. */
  inputState: () => ConversationSearchInputState;
  /** Reports what a person typed. Called as the Input's `input` bubbles to the input part. */
  read: (event: Event) => void;
  /** Writes the search into the Input and focuses it after the bar opened. Called by the input part. */
  syncInput: () => void;
  /** Moves between matches on Enter, Shift+Enter, F3 and Shift+F3, and clears or closes on Escape. */
  keydown: (event: KeyboardEvent) => void;
  /** Closes the bar for Close. */
  closePress: (event?: Event) => void;
  /** Moves focus back where it was when the bar closes. */
  recovery: FocusRecovery;
  /** Registers the `shortcut`. Called by the root part. */
  bindRoot: (el: HTMLElement) => () => void;
};

type ConversationSearchSlot<Public extends object = Record<never, never>> = SlotDefinition<
  ConversationSearchState,
  ConversationSearchApi,
  BaseSlotProps,
  Public
>;

type ConversationSearchSlots = {
  root: ConversationSearchSlot;
  input: ConversationSearchSlot<ConversationSearchInputState>;
  count: ConversationSearchSlot<{ text: string }>;
  previous: ConversationSearchSlot;
  next: ConversationSearchSlot;
  close: ConversationSearchSlot;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type ConversationSearchPrimitive = ReturnType<
  typeof definePrimitive<
    ConversationSearchOptions,
    ConversationSearchState,
    ConversationSearchApi,
    {
      root: ConversationSearchSlot;
      input: ConversationSearchSlot<ConversationSearchInputState>;
      count: ConversationSearchSlot<{ text: string }>;
      previous: ConversationSearchSlot;
      next: ConversationSearchSlot;
      close: ConversationSearchSlot;
    }
  >
>;

const NO_MESSAGES: ConversationSearchMessage[] = [];
const NO_MATCHES: readonly ConversationSearchMatch[] = [];
const NO_MARKS: readonly number[] = [];
/** How long typing pauses before the count is announced, in milliseconds. */
const ANNOUNCE_DELAY = 600;

const presentation = (options: ConversationSearchOptions) => ({
  label: options.label ?? "Search in conversation",
  motion: options.motion ?? "auto",
});

const countText = ({
  query,
  matches,
  current,
  counted,
}: Pick<ConversationSearchState, "query" | "matches" | "current" | "counted">) =>
  !counted || !query.trim() ? "" : `${current + 1} of ${matches.length}`;

const sameNumbers = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * The current match after a change: the same one while the search stands, else the first in the message the reader
 * was on, else the first in the newest message that has one.
 */
function pickCurrent(
  matches: readonly ConversationSearchMatch[],
  previous: ConversationSearchMatch | undefined,
  queryChanged: boolean,
) {
  const last = matches.at(-1);
  if (!last) return -1;
  if (previous) {
    if (!queryChanged) {
      const same = matches.findIndex(
        (match) => match.index === previous.index && match.start === previous.start,
      );
      if (same !== -1) return same;
    }
    const inMessage = matches.findIndex((match) => match.index === previous.index);
    if (inMessage !== -1) return inMessage;
  }
  return matches.findIndex((match) => match.index === last.index);
}

const withoutMatches = (state: ConversationSearchState) => state.matches.length === 0;

export const conversationSearchPrimitive: ConversationSearchPrimitive = definePrimitive<
  ConversationSearchOptions,
  ConversationSearchState,
  ConversationSearchApi,
  ConversationSearchSlots
>({
  name: "kind-conversation-search",
  options: {
    messages: "value",
    conversation: "value",
    query: "string",
    defaultQuery: "string",
    onQueryChange: "callback",
    open: "boolean",
    defaultOpen: "boolean",
    onOpenChange: "callback",
    label: "string",
    shortcut: "string",
    onMarksChange: "callback",
    motion: "string",
  },
  state: (options) => ({
    ...presentation(options),
    open: options.open ?? options.defaultOpen ?? false,
    query: options.query ?? options.defaultQuery ?? "",
    matches: NO_MATCHES,
    current: -1,
    marks: NO_MARKS,
    counted: false,
  }),
  sync: (options) => ({
    ...presentation(options),
    ...(options.query === undefined ? {} : { query: options.query }),
    ...(options.open === undefined ? {} : { open: options.open }),
  }),
  controlled: ["query", "open"],
  api: (context) => {
    const { store } = context;
    // `createChange` reads change reasons from the options type, which `context` widens.
    const change = createChange(
      context as PrimitiveContext<ConversationSearchOptions, ConversationSearchState, string>,
    );
    const controller = createInputController();
    const paintedBy = {};
    let messages = context.options().messages ?? NO_MESSAGES;
    let conversation = context.options().conversation;
    let unobserve: (() => void) | undefined;
    let opener: Element | null = null;
    let focusField = false;
    let mounted = false;
    let destroyed = false;
    let announceTimer: ReturnType<typeof setTimeout> | undefined;
    let painting = false;
    let retry = 0;
    let unregisterShortcut: (() => void) | undefined;

    // Each message's text and matches, by id, so a streamed message is read and searched again alone. A message
    // whose text changed keeps an engine, which parses only the blocks that changed.
    type Read = {
      markdown: string;
      text: string;
      engine?: MarkdownEngine;
      query?: string;
      ranges?: readonly { start: number; end: number }[];
    };
    let reads = new Map<string, Read>();
    const textOf = (message: ConversationSearchMessage) => {
      const read = reads.get(message.id);
      if (read?.markdown === message.text) return read;
      const engine = read ? (read.engine ?? createMarkdownEngine()) : undefined;
      const next: Read = {
        markdown: message.text,
        text: searchText(message.text, engine),
        ...(engine && { engine }),
      };
      reads.set(message.id, next);
      return next;
    };

    const search = () => {
      const { open, query } = store.get();
      if (!open || !query.trim()) return NO_MATCHES;
      const matches: ConversationSearchMatch[] = [];
      const kept = new Map<string, Read>();
      messages.forEach((message, index) => {
        const read = textOf(message);
        if (read.query !== query) {
          read.query = query;
          read.ranges = rangesOf(read.text, query);
        }
        kept.set(message.id, read);
        for (const range of read.ranges ?? []) matches.push({ index, ...range });
      });
      // Messages the host removed are forgotten.
      reads = kept;
      return matches;
    };

    const stopObserving = () => {
      unobserve?.();
      unobserve = undefined;
    };

    const paint = () => {
      painting = false;
      // A server has nothing to paint, and no frames to wait for.
      if (destroyed || typeof document === "undefined") return;
      const { matches, current } = store.get();
      if (matches.length === 0 || !conversation) {
        stopObserving();
        clearMatches(paintedBy);
        return;
      }
      // The controller does nothing until its Conversation attaches, so this tries again on each paint.
      if (!unobserve) {
        const off = conversation.observe(schedulePaint);
        if (typeof off === "function") unobserve = off;
        // Its Conversation hasn't attached yet, as when both mount together: try again next frame.
        else if (!retry)
          retry = requestAnimationFrame(() => {
            retry = 0;
            schedulePaint();
          });
      }
      const rows = new Map<number, { start: number; end: number; current: boolean }[]>();
      matches.forEach((match, at) => {
        let list = rows.get(match.index);
        if (!list) {
          if (!conversation?.rowElement(match.index)) return;
          list = [];
          rows.set(match.index, list);
        }
        list.push({ start: match.start, end: match.end, current: at === current });
      });
      paintMatches(
        paintedBy,
        [...rows].flatMap(([index, list]) => {
          const row = conversation?.rowElement(index);
          const message = messages[index];
          return row && message ? [{ row, text: textOf(message).text, matches: list }] : [];
        }),
      );
    };
    function schedulePaint() {
      if (painting) return;
      painting = true;
      queueMicrotask(paint);
    }

    // Reported a microtask later, once per burst of changes, so a web host that set `query` as a property, which
    // fires no events, still hears the marks it moved.
    let reported = store.get().marks;
    let reporting = false;
    const reportMarks = () => {
      if (reporting) return;
      reporting = true;
      queueMicrotask(() => {
        reporting = false;
        const { marks } = store.get();
        if (destroyed || typeof document === "undefined" || sameNumbers(marks, reported)) return;
        reported = marks;
        context.options().onMarksChange?.(marks);
      });
    };

    const scrollToCurrent = () => {
      const { matches, current } = store.get();
      const match = matches[current];
      if (match) conversation?.scrollToIndex(match.index);
    };

    const refresh = (queryChanged: boolean, scroll = queryChanged) => {
      const state = store.get();
      const matches = search();
      const current = pickCurrent(matches, state.matches[state.current], queryChanged);
      const marks = [...new Set(matches.map((match) => match.index))];
      const moved = matches[current]?.index !== state.matches[state.current]?.index;
      store.set({ matches, current, counted: true, ...(sameNumbers(marks, state.marks) ? {} : { marks }) });
      if (!sameNumbers(marks, state.marks)) reportMarks();
      if (scroll && moved) scrollToCurrent();
      schedulePaint();
    };

    const move = (by: 1 | -1) => {
      const { matches, current } = store.get();
      if (matches.length === 0) return;
      store.set({ current: (current + by + matches.length) % matches.length });
      scrollToCurrent();
      schedulePaint();
    };
    const next = () => move(1);
    const previous = () => move(-1);

    const syncInput = () => {
      const { query } = store.get();
      // The controller reads `undefined` until the Input attaches it.
      const shown = controller.getValue() as string | undefined;
      if (shown === undefined) return;
      if (shown !== query) controller.setValue(query);
      if (!focusField) return;
      controller.focus();
      // A web bar shows once its attributes land, so the next try focuses it.
      if (context.element("root")?.contains(document.activeElement)) focusField = false;
    };

    // A change the owner cancels is written back, and so is one a controlling owner didn't take by the next frame: the
    // Input holds its own value.
    let resync = 0;
    const writeBackUntaken = (taken: boolean) => {
      if (!taken) syncInput();
      else if (context.options().query !== undefined) {
        cancelAnimationFrame(resync);
        resync = requestAnimationFrame(() => {
          resync = 0;
          if (!destroyed) syncInput();
        });
      }
    };

    const setOpen = (open: boolean, reason: ConversationSearchOpenChangeReason, event?: Event) =>
      open === store.get().open || change("open", open, event ? { reason, event } : { reason });

    let seen = { open: store.get().open, query: store.get().query };
    store.subscribe(() => {
      const { open, query } = store.get();
      if (open === seen.open && query === seen.query) return;
      const opened = open && !seen.open;
      if (!open) focusField = false;
      const queryChanged = query !== seen.query;
      seen = { open, query };
      if (opened && mounted) {
        const active = document.activeElement;
        opener = active && !context.element("root")?.contains(active) ? active : null;
        focusField = true;
        // The field shows once the bar renders; the input part tries again as it binds.
        queueMicrotask(syncInput);
        setTimeout(syncInput);
      }
      refresh(queryChanged || opened);
      if (queryChanged && open) {
        clearTimeout(announceTimer);
        announceTimer = setTimeout(() => {
          const text = countText(store.get());
          if (!text || destroyed || !store.get().open) return;
          announce(store.get().matches.length > 0 ? text : "No results", { priority: "polite" });
        }, ANNOUNCE_DELAY);
      }
    });
    store.subscribe(syncInput);

    const ensureShortcut = () => {
      if (!mounted || unregisterShortcut || !context.options().shortcut) return;
      // Keys are read on each press, so a new `shortcut` needs no new registration.
      unregisterShortcut = registerShortcut(
        () => context.options().shortcut,
        () => {
          if (store.get().open) {
            focusField = true;
            syncInput();
          } else setOpen(true, "shortcut");
        },
        { allowInInput: true, description: store.get().label },
      );
    };

    context.onOptions((options) => {
      const nextMessages = options.messages ?? NO_MESSAGES;
      if (options.conversation !== conversation) {
        stopObserving();
        clearMatches(paintedBy);
        conversation = options.conversation;
        schedulePaint();
      }
      if (nextMessages !== messages) {
        messages = nextMessages;
        refresh(false);
      }
      ensureShortcut();
    });

    context.onDestroy(() => {
      destroyed = true;
      if (retry) cancelAnimationFrame(retry);
      if (resync) cancelAnimationFrame(resync);
      // A bar that leaves takes its marks with it.
      if (reported.length > 0) context.options().onMarksChange?.(NO_MARKS);
      clearTimeout(announceTimer);
      stopObserving();
      clearMatches(paintedBy);
      unregisterShortcut?.();
    });

    const recovery = createFocusRecovery({
      fallback: () => (opener?.isConnected ? (opener as HTMLElement) : undefined),
    });

    // React mounts the Input each time the bar opens, so it starts from the search as it stands then.
    const inputState = memo(
      (label: string, _open: boolean): ConversationSearchInputState => ({
        controller,
        defaultValue: store.get().query,
        label,
        describedBy: `${context.id}-count`,
      }),
    );

    return {
      search: (text) => {
        if (!store.get().open && !setOpen(true, "imperative")) return false;
        return text === store.get().query || change("query", text, { reason: "imperative" });
      },
      get next() {
        return store.get().matches.length > 0 ? next : undefined;
      },
      get previous() {
        return store.get().matches.length > 0 ? previous : undefined;
      },
      get close() {
        return store.get().open ? () => void setOpen(false, "imperative") : undefined;
      },
      getQuery: () => store.get().query,
      setQuery: (text) => text === store.get().query || change("query", text, { reason: "imperative" }),
      isOpen: () => store.get().open,
      setOpen: (open) => setOpen(open, "imperative"),
      countText,
      inputState: () => inputState(store.get().label, store.get().open),
      read: (event) => {
        const value = (controller.getValue() as string | undefined) ?? "";
        if (value === store.get().query) return;
        writeBackUntaken(change("query", value, { reason: "input-change", event }));
      },
      syncInput,
      keydown: (event) => {
        if (event.key === "Escape" && !isComposing(event)) {
          event.preventDefault();
          if (store.get().query) {
            writeBackUntaken(change("query", "", { reason: "escape-key", event }));
          } else setOpen(false, "escape-key", event);
          return;
        }
        const inField = event.key === "Enter" && (event.target as Element).matches("input");
        if ((inField && !isComposing(event)) || event.key === "F3") {
          event.preventDefault();
          if (event.shiftKey) previous();
          else next();
        }
      },
      closePress: (event) => void setOpen(false, "close-press", event),
      recovery,
      bindRoot: (el) => {
        mounted = true;
        // A bar that mounts open with a search counts and marks it, without scrolling the conversation.
        if (!store.get().counted) refresh(true, false);
        ensureShortcut();
        // Opening plays the shared popup's entrance from UI SDK's `data-starting-style`.
        let shown = store.get().open;
        let stop = () => {};
        const unsubscribe = store.subscribe(() => {
          const { open } = store.get();
          if (open && !shown) {
            stop();
            stop = animateIn(el);
          }
          shown = open;
        });
        return () => {
          unsubscribe();
          stop();
          mounted = false;
          unregisterShortcut?.();
          unregisterShortcut = undefined;
        };
      },
    };
  },
  slots: (slot) => ({
    root: slot({
      role: "search",
      attrs: (state) => ({
        "aria-label": state.label,
        hidden: state.open ? undefined : "",
        "data-kind-popup": "",
        "data-motion": state.motion,
      }),
      on: { keydown: (event, { api }) => api.keydown(event as KeyboardEvent) },
      bind: (el, { api }) => api.bindRoot(el),
    }),
    input: slot<BaseSlotProps, ConversationSearchInputState>({
      present: (state) => state.open,
      state: (_state, { api }) => api.inputState(),
      // UI SDK skips the `input` events of an input method's composition, so the search runs once it commits.
      on: {
        input: (event, { api }) => api.read(event),
        compositionend: (event, { api }) => api.read(event),
      },
      bind: (el, part) => {
        // Bound before the field takes focus, so recovery knows it holds it.
        const unbind = part.api.recovery.bind(el, part);
        part.api.syncInput();
        return unbind;
      },
    }),
    count: slot<BaseSlotProps, { text: string }>({
      state: (state) => ({ text: countText(state) }),
      attrs: (state, part) => ({
        id: `${part.id}-count`,
        "data-empty": state.query.trim() ? undefined : "",
        "data-none": state.counted && state.query.trim() && withoutMatches(state) ? "" : undefined,
      }),
    }),
    previous: slot({
      role: "button",
      focus: "native",
      present: (state) => state.open,
      press: ({ api }) => api.previous?.(),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Previous match",
        "data-kind-icon-button": "",
        "aria-disabled": withoutMatches(state) ? "true" : undefined,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    next: slot({
      role: "button",
      focus: "native",
      present: (state) => state.open,
      press: ({ api }) => api.next?.(),
      attrs: (state) => ({
        type: "button",
        "aria-label": "Next match",
        "data-kind-icon-button": "",
        "aria-disabled": withoutMatches(state) ? "true" : undefined,
      }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
    close: slot({
      role: "button",
      focus: "native",
      present: (state) => state.open,
      press: ({ api }, event) => api.closePress(event),
      attrs: () => ({ type: "button", "aria-label": "Close search", "data-kind-icon-button": "" }),
      bind: (el, part) => part.api.recovery.bind(el, part),
    }),
  }),
  agent: { actions: ["search", "next", "previous", "close"] },
});
