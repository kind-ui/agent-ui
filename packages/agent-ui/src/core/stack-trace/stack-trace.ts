import {
  type ChangeDetails,
  createChange,
  definePrimitive,
  dispatch,
  hiddenAttrs,
  openAttrs,
  type PrimitiveContext,
  type SlotDefinition,
} from "@ui-sdk/core";
import type { BaseSlotProps } from "@ui-sdk/core/renderer";
import type { StackFrame, StepStatus } from "../../types/index.js";
import { createCopy } from "../clipboard.js";
import { createListFocus, type ListFocus } from "../list-focus.js";
import { isLibraryFrame, parseStack } from "../stack.js";
import { bindStepPanel, type StepApi, type StepOptions, type StepState, stepBase } from "../step/base.js";

export type StackTraceLibraryChangeReason = "library-press" | "find-in-page" | "imperative";
export type StackTraceOpenFrameReason = "frame-press" | "imperative";
export type StackTraceCopyReason = "copy-press" | "imperative";

export type StackTraceOptions = Omit<StepOptions, "status" | "label" | "defaultOpen"> & {
  /**
   * The error's message, its name first, as in `"TypeError: x is undefined"`. Defaults to the lines of `stack`
   * before its first frame.
   */
  message?: string;
  /** The frames as data, innermost first, from any language. Takes the place of `stack`'s. */
  frames?: StackFrame[];
  /**
   * A JavaScript stack trace's text, as V8, SpiderMonkey or JavaScriptCore write it. A line it can't read stays as a
   * raw frame.
   */
  stack?: string;
  /** The title, which also names it in announcements. Defaults to the message's first line, else "Error". */
  label?: string;
  /** @default "error" */
  status?: StepStatus;
  /**
   * Whether the frames show at first, when `open` isn't passed.
   * @default true
   */
  defaultOpen?: boolean;
  /** Whether library frames show. Passing it controls it: change it in `onShowLibraryFramesChange`. */
  showLibraryFrames?: boolean;
  /**
   * Whether library frames show at first, when `showLibraryFrames` isn't passed.
   * @default false
   */
  defaultShowLibraryFrames?: boolean;
  /** Called when library frames show or fold, with what caused it. */
  onShowLibraryFramesChange?: (show: boolean, details: ChangeDetails<StackTraceLibraryChangeReason>) => void;
  /** Called when someone opens a frame, with its index among the frames as `details.index`. Makes each frame a button. */
  onOpenFrame?: (
    frame: StackFrame,
    details: ChangeDetails<StackTraceOpenFrameReason> & { index: number },
  ) => void;
  /** Called before the message and raw frames are copied. Cancel it to copy something else yourself. */
  onCopy?: (text: string, details: ChangeDetails<StackTraceCopyReason>) => void;
};

/** How a frame shows. */
export type StackTraceFrameEntry = {
  /** The function, else `<anonymous>`; for a frame without a file, its raw line. */
  fn: string;
  /** The file's last two segments with `:line:column`, or empty without a file. */
  location: string;
  /** The whole file with `:line:column`, or empty without a file. */
  path: string;
  /** Whether it's a library frame (`isLibraryFrame`). */
  library: boolean;
};

/** A row of the list: an app frame, or consecutive library frames folded into one. */
export type StackTraceRow =
  /** `index` is the frame's among the frames, counted from 0. */
  | { type: "frame"; index: number }
  /** `indexes` are its frames' among the frames, counted from 0; `start`, the first, is the group's `value`. */
  | { type: "library"; start: number; indexes: number[] };

export type StackTraceState = StepState & {
  /** The `label`, else the message's first line, else "Error". */
  title: string;
  /** The error's name at the start of the title, as in "TypeError", or empty. */
  name: string;
  /** The title after its name. */
  summary: string;
  /** The message and the frames' raw lines, which Copy copies, or empty when there's neither. */
  copyText: string;
  /** The message's lines after its first, or empty. */
  details: string;
  /** The frames, from `frames` or read from `stack`. */
  frames: StackFrame[];
  /** How each frame shows, by index. */
  entries: StackTraceFrameEntry[];
  /** The rows of the list, in order. */
  rows: StackTraceRow[];
  /** Whether library frames show. */
  showLibraryFrames: boolean;
  /** Whether folding library frames still show while they close. */
  libraryExiting: boolean;
  /** Whether `onOpenFrame` is set, which makes each frame a button. */
  canOpen: boolean;
  /** The frame that holds the list's Tab stop. */
  focused: string | null;
  /** True for 2 s after the trace is copied. */
  copied: boolean;
};

type ItemProps = { value: string };
/** A part inside a frame or a library group, which takes the frame's or group's `value`. */
export type StackTraceItemPartProps = { value?: string };

export type StackTraceApi = StepApi &
  ListFocus<StackTraceState, StackTraceItemPartProps> & {
    /**
     * Copies the message and the raw frames, and resolves with whether the clipboard write went through. Only while
     * there's either.
     */
    readonly copy: ((event?: Event) => Promise<boolean>) | undefined;
    /**
     * Shows folded library frames, or folds them. Returns whether the change was accepted. Only while there are
     * library frames.
     */
    readonly toggleLibraryFrames: ((event?: Event) => boolean) | undefined;
    /**
     * Calls `onOpenFrame` with the `index`th frame, counted from 0. Returns false for an index outside the frames.
     * Only while `onOpenFrame` is set.
     */
    readonly openFrame: ((index: number | string, event?: Event) => boolean) | undefined;
    /** The frames, from `frames` or read from `stack`. */
    getFrames: () => StackFrame[];
    /** Whether library frames show; the owner's `showLibraryFrames` when controlled. */
    getShowLibraryFrames: () => boolean;
    /** Shows or folds library frames. Returns whether the change was accepted. */
    setShowLibraryFrames: (show: boolean) => boolean;
    /** Opens and closes a library group's frames with `showLibraryFrames`. For the render layers' slot only. */
    bindLibrary: (el: HTMLElement, key: string, trigger: () => HTMLElement | undefined) => () => void;
  };

type StackTraceSlot<
  Props extends object = BaseSlotProps,
  Public extends object = Record<never, never>,
> = SlotDefinition<StackTraceState, StackTraceApi, Props, Public>;

type ItemPartSlot<Public extends object = Record<never, never>> = StackTraceSlot<
  StackTraceItemPartProps & BaseSlotProps,
  Public
>;

type StackTraceSlots = {
  root: StackTraceSlot;
  trigger: StackTraceSlot;
  icon: StackTraceSlot;
  title: StackTraceSlot<BaseSlotProps, { title: string; name: string; summary: string }>;
  content: StackTraceSlot;
  message: StackTraceSlot<BaseSlotProps, { text: string }>;
  copy: StackTraceSlot;
  list: StackTraceSlot<BaseSlotProps, { rows: StackTraceRow[] }>;
  frame: StackTraceSlot<ItemProps & BaseSlotProps, { canOpen: boolean }>;
  "frame-open": ItemPartSlot;
  "frame-function": ItemPartSlot<{ fn: string }>;
  "frame-location": ItemPartSlot<{ location: string }>;
  group: StackTraceSlot<ItemProps & BaseSlotProps, { indexes: number[] }>;
  library: ItemPartSlot<{ count: number }>;
  "library-frames": ItemPartSlot<{ indexes: number[] }>;
};

// Named explicitly because the inferred type references UI SDK types that no public entry exports (TS2742).
export type StackTracePrimitive = ReturnType<
  typeof definePrimitive<StackTraceOptions, StackTraceState, StackTraceApi, StackTraceSlots>
>;

const NO_FRAMES: StackFrame[] = [];
const NO_INDEXES: number[] = [];
// An identifier before the first colon, as in `TypeError: …` or `AssertionError [ERR_ASSERTION]: …`.
const ERROR_NAME = /^([A-Za-z_$][\w$.]*(?: \[[\w$]+\])?): (.*)$/;

const shortPath = (file: string) =>
  file
    .replace(/[?#].*$/, "")
    .split(/[\\/]+/)
    .filter(Boolean)
    .slice(-2)
    .join("/");

const position = ({ line, column }: StackFrame) =>
  line === undefined ? "" : column === undefined ? `:${line}` : `:${line}:${column}`;

const entryOf = (frame: StackFrame): StackTraceFrameEntry => ({
  fn: frame.fn ?? (frame.file ? "<anonymous>" : frame.raw.trim()),
  location: frame.file ? `${shortPath(frame.file)}${position(frame)}` : "",
  path: frame.file ? `${frame.file}${position(frame)}` : "",
  library: isLibraryFrame(frame),
});

const rowsOf = (entries: StackTraceFrameEntry[]): StackTraceRow[] => {
  const rows: StackTraceRow[] = [];
  entries.forEach((entry, index) => {
    const last = rows.at(-1);
    if (!entry.library) rows.push({ type: "frame", index });
    else if (last?.type === "library") last.indexes.push(index);
    else rows.push({ type: "library", start: index, indexes: [index] });
  });
  return rows;
};

/** Everything read from `message`, `frames`, `stack` and `label`: parsed once per change, in `api`. */
const readError = ({ message, frames, stack, label }: StackTraceOptions) => {
  const stackFrames = stack === undefined ? NO_FRAMES : parseStack(stack);
  let errorMessage = message;
  if (errorMessage === undefined && stack !== undefined) {
    const lines = stack.split(/\r?\n/);
    const first = stackFrames[0] ? lines.indexOf(stackFrames[0].raw) : lines.length;
    errorMessage = lines.slice(0, first).join("\n").trim();
  }
  const [first = "", ...rest] = (errorMessage ?? "").split(/\r?\n/);
  const title = label ?? (first || "Error");
  const [, name = "", summary = title] = ERROR_NAME.exec(title) ?? [];
  const shown = frames ?? stackFrames;
  const entries = shown.map(entryOf);
  return {
    title,
    name,
    summary,
    copyText: [errorMessage, ...shown.map((frame) => frame.raw)].filter(Boolean).join("\n"),
    details: rest.join("\n").trim(),
    frames: shown,
    entries,
    rows: rowsOf(entries),
  };
};

const fromFrame = { value: { kind: "string", from: "frame" } } as const;
const fromGroup = { value: { kind: "string", from: "group" } } as const;

const groupIndexes = (state: StackTraceState, key: string) => {
  const group = state.rows.find((row) => row.type === "library" && String(row.start) === key);
  return group?.type === "library" ? group.indexes : NO_INDEXES;
};

const base = stepBase<StackTraceState, StackTraceApi, StackTraceOptions>({
  kind: "stack-trace",
  status: () => "error",
});

export const stackTracePrimitive: StackTracePrimitive = definePrimitive<
  StackTraceOptions,
  StackTraceState,
  StackTraceApi,
  StackTraceSlots
>({
  name: "kind-stack-trace",
  ...base,
  options: {
    ...base.options,
    message: "string",
    frames: "value",
    stack: "string",
    showLibraryFrames: "boolean",
    defaultShowLibraryFrames: "boolean",
    onShowLibraryFramesChange: "callback",
    onOpenFrame: "callback",
    onCopy: "callback",
  },
  state: (options) => ({
    ...base.state({ ...options, defaultOpen: options.defaultOpen ?? true }),
    ...readError(options),
    showLibraryFrames: options.showLibraryFrames ?? options.defaultShowLibraryFrames ?? false,
    libraryExiting: false,
    canOpen: options.onOpenFrame !== undefined,
    focused: null,
    copied: false,
  }),
  // The error reaches state through `readError` in `api`, which reads it again only when it changes.
  sync: (options) => ({
    ...base.sync(options),
    canOpen: options.onOpenFrame !== undefined,
    ...(options.showLibraryFrames === undefined ? {} : { showLibraryFrames: options.showLibraryFrames }),
  }),
  controlled: [...base.controlled, "showLibraryFrames"],
  api: (context) => {
    const { store } = context;
    const copy = createCopy(context);
    // `createChange` reads change reasons from the options type, which `context` widens.
    const change = createChange(context as PrimitiveContext<StackTraceOptions, StackTraceState, string>);
    let read = context.options();
    context.onOptions((options) => {
      const { message, frames, stack, label } = options;
      if (
        message === read.message &&
        frames === read.frames &&
        stack === read.stack &&
        label === read.label
      ) {
        return;
      }
      read = options;
      store.set(readError(options));
    });

    // Library groups still closing, so their frames show until the last one has closed.
    const panels = new Set<string>();
    const closing = new Set<string>();
    let wasShown = store.get().showLibraryFrames;
    store.subscribe(() => {
      const { showLibraryFrames } = store.get();
      if (showLibraryFrames === wasShown) return;
      wasShown = showLibraryFrames;
      if (showLibraryFrames || panels.size === 0) return;
      for (const key of panels) closing.add(key);
      store.set({ libraryExiting: true });
    });

    const setShown = (show: boolean, reason: StackTraceLibraryChangeReason, event?: Event) =>
      change("showLibraryFrames", show, event ? { reason, event } : { reason });

    return {
      ...base.api(context),
      ...createListFocus<StackTraceState, StackTraceItemPartProps>(context, {
        slot: "frame-open",
        // A folded library frame never holds the Tab stop.
        focusable: ({ key }) => store.get().showLibraryFrames || !store.get().entries[Number(key)]?.library,
      }),
      get copy() {
        if (!store.get().copyText) return undefined;
        return async (event?: Event) => {
          const text = store.get().copyText;
          const details = event
            ? { reason: "copy-press" as const, event }
            : { reason: "imperative" as const };
          if (dispatch(context, "onCopy", text, details)) return false;
          return copy(text);
        };
      },
      get toggleLibraryFrames() {
        if (!store.get().rows.some((row) => row.type === "library")) return undefined;
        return (event?: Event) =>
          setShown(!store.get().showLibraryFrames, event ? "library-press" : "imperative", event);
      },
      get openFrame() {
        if (!store.get().canOpen) return undefined;
        return (index: number | string, event?: Event) => {
          const at = typeof index === "number" ? index : /^\d+$/.test(index) ? Number(index) : Number.NaN;
          const frame = Number.isInteger(at) ? store.get().frames[at] : undefined;
          if (!frame) return false;
          const details = event
            ? { reason: "frame-press" as const, event }
            : { reason: "imperative" as const };
          dispatch(context, "onOpenFrame", frame, { ...details, index: at });
          return true;
        };
      },
      getFrames: () => store.get().frames,
      getShowLibraryFrames: () => store.get().showLibraryFrames,
      setShowLibraryFrames: (show) => setShown(show, "imperative"),
      bindLibrary: (el, key, trigger) => {
        panels.add(key);
        const unbind = bindStepPanel(el, {
          isOpen: () => store.get().showLibraryFrames,
          isExiting: () => closing.has(key),
          motion: () => store.get().motion,
          reveal: (event) => setShown(true, "find-in-page", event),
          trigger,
          subscribe: store.subscribe,
          exited: () => {
            closing.delete(key);
            if (closing.size === 0 && store.get().libraryExiting) store.set({ libraryExiting: false });
          },
        });
        return () => {
          unbind();
          panels.delete(key);
          closing.delete(key);
        };
      },
    };
  },
  slots: (slot) => {
    const { root, trigger, icon, title, content } = base.slots(slot);
    return {
      root,
      trigger,
      icon,
      title: slot<BaseSlotProps, { title: string; name: string; summary: string }>({
        ...title,
        state: ({ title, name, summary }) => ({ title, name, summary }),
      }),
      content,
      message: slot<BaseSlotProps, { text: string }>({
        present: (state) => state.details !== "",
        state: (state) => ({ text: state.details }),
      }),
      copy: slot({
        role: "button",
        focus: "native",
        present: (state) => state.copyText !== "",
        press: ({ api }, event) => void api.copy?.(event),
        attrs: (state) => ({
          type: "button",
          "aria-label": "Copy stack trace",
          "data-copied": state.copied ? "" : undefined,
        }),
      }),
      list: slot<BaseSlotProps, { rows: StackTraceRow[] }>({
        role: "list",
        state: (state) => ({ rows: state.rows }),
      }),
      frame: slot<ItemProps & BaseSlotProps, { canOpen: boolean }>({
        role: "listitem",
        props: { value: "string" },
        state: (state) => ({ canOpen: state.canOpen }),
        attrs: (state, { key }) => ({
          "data-library": state.entries[Number(key)]?.library ? "" : undefined,
        }),
      }),
      "frame-open": slot<StackTraceItemPartProps & BaseSlotProps>({
        role: "button",
        focus: "roving",
        props: fromFrame,
        present: (state) => state.canOpen,
        press: ({ api, key }, event) => api.openFrame?.(key, event),
        attrs: (state, part) => ({
          type: "button",
          title: state.entries[Number(part.key)]?.path || undefined,
          tabindex: part.api.roving.tabIndex(state, part),
        }),
        on: {
          keydown: (event, { el, api }) => {
            if (el) api.roving.keydown(event as KeyboardEvent, el);
          },
        },
        bind: (el, part) => {
          const unbindFocus = part.api.roving.bind(el, part);
          const unbindRecovery = part.api.recovery.bind(el, part);
          return () => {
            unbindFocus();
            unbindRecovery();
          };
        },
      }),
      "frame-function": slot<StackTraceItemPartProps & BaseSlotProps, { fn: string }>({
        props: fromFrame,
        state: (state, { key }) => ({ fn: state.entries[Number(key)]?.fn ?? "" }),
      }),
      "frame-location": slot<StackTraceItemPartProps & BaseSlotProps, { location: string }>({
        props: fromFrame,
        state: (state, { key }) => ({ location: state.entries[Number(key)]?.location ?? "" }),
        // The whole path as a tooltip, unless the frame's button has it.
        attrs: (state, { key }) => ({
          title: state.canOpen ? undefined : state.entries[Number(key)]?.path || undefined,
        }),
      }),
      group: slot<ItemProps & BaseSlotProps, { indexes: number[] }>({
        role: "listitem",
        props: { value: "string" },
        state: (state, { key }) => ({ indexes: groupIndexes(state, key) }),
        attrs: (state) => openAttrs(state.showLibraryFrames),
      }),
      library: slot<StackTraceItemPartProps & BaseSlotProps, { count: number }>({
        role: "button",
        focus: "native",
        props: fromGroup,
        press: ({ api }, event) => api.toggleLibraryFrames?.(event),
        state: (state, { key }) => ({ count: groupIndexes(state, key).length }),
        attrs: (state, { id, key }) => ({
          type: "button",
          "aria-expanded": String(state.showLibraryFrames),
          "aria-controls": `${id}-library-${key}`,
          "data-motion": state.motion,
          ...openAttrs(state.showLibraryFrames),
        }),
      }),
      "library-frames": slot<StackTraceItemPartProps & BaseSlotProps, { indexes: number[] }>({
        role: "list",
        props: fromGroup,
        state: (state, { key }) => ({ indexes: groupIndexes(state, key) }),
        attrs: (state, { id, key }) => ({
          id: `${id}-library-${key}`,
          "data-motion": state.motion,
          ...openAttrs(state.showLibraryFrames),
          ...hiddenAttrs(state.showLibraryFrames || state.libraryExiting, true),
        }),
        bind: (el, { api, id, key }) =>
          api.bindLibrary(
            el,
            key,
            () =>
              (el.getRootNode() as Document | ShadowRoot).querySelector<HTMLElement>(
                `[aria-controls="${id}-library-${key}"]`,
              ) ?? undefined,
          ),
      }),
    };
  },
  agent: {
    actions: ["expand", "collapse", "copy", "toggleLibraryFrames", "openFrame"],
    items: (api: StackTraceApi) =>
      api.getFrames().map((frame, index) => {
        const { fn, location } = entryOf(frame);
        return { value: String(index), label: location ? `${fn} ${location}` : fn };
      }),
    closed: true,
  },
});
